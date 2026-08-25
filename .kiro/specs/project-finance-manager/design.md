# 案件収支管理アプリ - 設計

## アーキテクチャ

```
Next.js（フロントエンド + API Routes）
        ↓
SQLite（better-sqlite3）
```

1プロジェクトで完結。`npm run dev` 1コマンドで起動。

---

## 技術スタック

| 層 | 技術 |
|----|------|
| フレームワーク | Next.js 14（App Router） |
| 言語 | TypeScript |
| UIコンポーネント | Tailwind CSS + shadcn/ui |
| データベース | SQLite（better-sqlite3） |
| ORM | Prisma |
| パッケージ管理 | npm |

---

## データベース設計

### テーブル一覧

#### Project（案件）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| projectCode | String UNIQUE | 工番 |
| name | String | 案件名 |
| projectType | Enum | LUMP_SUM / QUASI_MANDATE / SES |
| clientId | Int FK | クライアントID |
| dueDate | DateTime? | 期日 |
| status | Enum | IN_PROGRESS / COMPLETED / CANCELLED |
| createdAt | DateTime | 登録日時 |
| updatedAt | DateTime | 更新日時 |

#### ProjectMember（案件担当者）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| projectId | Int FK | 案件ID |
| memberId | Int FK | 担当者マスタID |

#### Revenue（売上明細）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| projectId | Int FK | 案件ID |
| revenueType | Enum | LUMP_SUM / QUASI_MANDATE / SES |
| memberId | Int? FK | 担当者ID（準委任・SESのみ） |
| baseAmount | Float | 基準金額 / 請求金額 |
| workingHours | Float? | 稼働時間（準委任・SES） |
| lowerHours | Float? | 下限時間（準委任・SES） |
| upperHours | Float? | 上限時間（準委任・SES） |
| calcBaseHours | Float? | 計算基準時間（準委任・SES） |
| unitPrice | Float? | 単価（計算値） |
| adjustment | Float? | 調整額（計算値） |
| totalRevenue | Float | 売上合計（計算値） |
| invoiceDate | DateTime? | 請求予定日（一括請負） |
| paymentStatus | Enum? | UNINVOICED / INVOICED / PAID（一括請負） |

#### Payment（支払い明細）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| projectId | Int FK | 案件ID |
| memberId | Int? FK | 担当者マスタID |
| partnerId | Int? FK | 協力会社マスタID |
| employeeType | Enum | PROPER / PARTNER |
| category | String | 外注費 / 交通費 / 材料費 |
| workingHours | Float | 稼働時間 |
| hourlyRate | Float? | 時間単価（プロパーのみ） |
| baseAmount | Float? | 基準金額（協力会社のみ） |
| baseCost | Float | 原価（計算値） |
| indirectCost | Float | 間接費（計算値） |
| salesCost | Float | 基準販売費（計算値） |
| adjustment | Float | 調整額（計算値） |
| totalPayment | Float | 支払い合計（計算値） |
| fiscalYear | Int | 適用年度 |

#### FiscalSetting（年度設定）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| fiscalYear | Int UNIQUE | 年度 |
| indirectRate | Float | 間接費係数 |
| salesRate | Float | 基準販売費係数 |

#### Member（担当者マスタ）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| name | String | 担当者名 |
| employeeType | Enum | PROPER / PARTNER |
| hourlyRate | Float? | 時間単価（プロパーのみ） |

#### Partner（協力会社マスタ）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| name | String | 会社名 |
| baseAmount | Float | 月額固定契約金額 |

#### Client（クライアントマスタ）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| name | String UNIQUE | クライアント名 |

---

## 計算ロジック

### 売上計算

#### 準委任契約
```typescript
const unitPrice = baseAmount / calcBaseHours;
let adjustment = 0;
if (workingHours > upperHours) {
  adjustment = (workingHours - upperHours) * unitPrice;
}
const totalRevenue = baseAmount + adjustment;
// 下限未達でも減額なし
```

#### SES
```typescript
const unitPrice = baseAmount / calcBaseHours;
let adjustment = 0;
if (workingHours < lowerHours) {
  adjustment = -(lowerHours - workingHours) * unitPrice;
} else if (workingHours > upperHours) {
  adjustment = (workingHours - upperHours) * unitPrice;
}
const totalRevenue = baseAmount + adjustment;
```

#### 一括請負
```typescript
const totalRevenue = invoices.reduce((sum, inv) => sum + inv.baseAmount, 0);
```

### 支払い計算

#### プロパー
```typescript
const baseCost = workingHours * hourlyRate;
const indirectCost = baseCost * indirectRate;
const salesCost = (baseCost + indirectCost) * salesRate;
const totalPayment = baseCost + indirectCost + salesCost;
```

#### 協力会社
```typescript
let adjustment = 0;
if (workingHours < 140) {
  adjustment = -(140 - workingHours) * (baseAmount / 140);
} else if (workingHours > 180) {
  adjustment = (workingHours - 180) * (baseAmount / 180);
}
const salesCost = baseAmount * salesRate;
const totalPayment = baseAmount + adjustment + salesCost;
```

---

## API設計（Next.js API Routes）

### 案件
| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/projects | 案件一覧（フィルタ：status, clientId, projectType） |
| POST | /api/projects | 案件登録 |
| GET | /api/projects/[id] | 案件詳細（売上・支払い・粗利含む） |
| PUT | /api/projects/[id] | 案件更新 |
| DELETE | /api/projects/[id] | 案件削除 |

### 売上
| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/projects/[id]/revenues | 売上一覧 |
| POST | /api/projects/[id]/revenues | 売上登録（自動計算） |
| PUT | /api/revenues/[id] | 売上更新 |
| DELETE | /api/revenues/[id] | 売上削除 |

### 支払い
| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/projects/[id]/payments | 支払い一覧 |
| POST | /api/projects/[id]/payments | 支払い登録（自動計算） |
| PUT | /api/payments/[id] | 支払い更新 |
| DELETE | /api/payments/[id] | 支払い削除 |

### マスタ管理
| メソッド | パス | 説明 |
|----------|------|------|
| GET/POST | /api/members | 担当者一覧・登録 |
| PUT/DELETE | /api/members/[id] | 担当者更新・削除 |
| GET/POST | /api/partners | 協力会社一覧・登録 |
| PUT/DELETE | /api/partners/[id] | 協力会社更新・削除 |
| GET/POST | /api/clients | クライアント一覧・登録 |
| PUT/DELETE | /api/clients/[id] | クライアント更新・削除 |
| GET/POST | /api/fiscal-settings | 年度設定一覧・登録 |
| PUT | /api/fiscal-settings/[year] | 年度設定更新 |

### 集計
| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/reports/summary | 集計（fiscalYear, periodType: monthly/first_half/second_half/annual, month） |

---

## 画面構成（App Router）

```
/                        → 案件一覧
/projects/new            → 案件登録
/projects/[id]           → 案件詳細
/projects/[id]/edit      → 案件編集
/projects/[id]/revenues/new   → 売上登録
/projects/[id]/payments/new   → 支払い登録
/reports                 → 集計・レポート
/master                  → マスタ管理（タブ切り替え）
```

---

## フォルダ構成

```
project-finance-manager/
├── prisma/
│   └── schema.prisma        # DBスキーマ
├── src/
│   ├── app/
│   │   ├── api/             # API Routes
│   │   ├── projects/        # 案件画面
│   │   ├── reports/         # 集計画面
│   │   └── master/          # マスタ管理画面
│   ├── components/          # 共通コンポーネント
│   ├── lib/
│   │   ├── prisma.ts        # Prismaクライアント
│   │   └── calculations.ts  # 計算ロジック
│   └── types/               # 型定義
├── package.json
└── README.md
```
