# 案件収支管理アプリ - 設計

## Overview

本システムは、案件ごとの収支（売上・支払い・粗利）を管理するWebアプリケーションです。

**主な機能**:
- 案件管理（工番・案件名・案件種別・クライアント・期日・ステータス）
- 売上管理（一括請負・準委任契約・SESの3種別に対応した自動計算）
- 支払い管理（プロパー・協力会社の2種別に対応した自動計算）
- 粗利計算（売上 - 支払い）
- マスタ管理（担当者・協力会社・クライアント・年度設定）
- 集計レポート（月次・半期・年次）

**技術的特徴**:
- 1プロジェクトで完結（Next.js + SQLite）
- `npm run dev` 1コマンドで起動可能
- TypeScript + Prisma ORM によるタイプセーフな開発
- shadcn/ui による洗練されたUI

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

## Components and Interfaces

### フロントエンドコンポーネント

#### ページコンポーネント
- **ProjectListPage**: 案件一覧表示（フィルタ・検索機能）
- **ProjectDetailPage**: 案件詳細表示（売上・支払い・粗利の表示）
- **ProjectFormPage**: 案件登録・編集フォーム
- **RevenueFormPage**: 売上登録・編集フォーム
- **PaymentFormPage**: 支払い登録・編集フォーム
- **ReportPage**: 集計レポート表示
- **MasterManagementPage**: マスタ管理（タブ切り替え）

#### 共通コンポーネント
- **DataTable**: データテーブル表示（ソート・ページング）
- **FormInput**: フォーム入力コンポーネント（バリデーション付き）
- **StatusBadge**: ステータス表示バッジ
- **DatePicker**: 日付選択コンポーネント
- **SelectBox**: セレクトボックス（マスタデータ連動）

### API インターフェース

#### 案件API
```typescript
interface ProjectCreateInput {
  projectCode: string;  // 12桁の数字
  name: string;
  projectType: "LUMP_SUM" | "QUASI_MANDATE" | "SES";
  clientId: number;
  dueDate?: Date;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

interface ProjectResponse {
  id: number;
  projectCode: string;
  name: string;
  projectType: string;
  client: ClientResponse;
  dueDate?: Date;
  status: string;
  totalRevenue: number;
  totalPayment: number;
  grossProfit: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 売上API
```typescript
interface RevenueCreateInput {
  projectId: number;
  revenueType: "LUMP_SUM" | "QUASI_MANDATE" | "SES";
  memberId?: number;
  baseAmount: number;
  workingHours?: number;
  lowerHours?: number;
  upperHours?: number;
  calcBaseHours?: number;
  invoiceDate?: Date;
}

interface RevenueResponse {
  id: number;
  projectId: number;
  revenueType: string;
  member?: MemberResponse;
  baseAmount: number;
  workingHours?: number;
  unitPrice?: number;
  adjustment?: number;
  totalRevenue: number;
  editable: boolean;  // 案件ステータスに基づく編集可否
}
```

#### 支払いAPI
```typescript
interface PaymentCreateInput {
  projectId: number;
  memberId?: number;
  partnerId?: number;
  employeeType: "PROPER" | "PARTNER";
  category: string;  // 外注費 / 交通費 / 材料費 / 間接費 / 基準販売費
  workingHours?: number;  // 交通費以外の場合に必須
  hourlyRate?: number;
  baseAmount?: number;
  amount?: number;  // 交通費の場合に使用
  date?: Date;  // 交通費の場合に使用
  fiscalYear: number;
}

interface PaymentResponse {
  id: number;
  projectId: number;
  member?: MemberResponse;
  partner?: PartnerResponse;
  employeeType: string;
  category: string;
  workingHours?: number;
  amount?: number;
  date?: Date;
  baseCost: number;
  indirectCost: number;
  salesCost: number;
  adjustment: number;
  totalPayment: number;
  editable: boolean;  // 案件ステータスに基づく編集可否
}
```

### ライブラリインターフェース

#### Prisma Client
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 使用例
await prisma.project.create({ data: projectData });
await prisma.revenue.findMany({ where: { projectId } });
```

#### 計算ロジックライブラリ
```typescript
// src/lib/calculations.ts
export function calculateQuasiMandateRevenue(input: QuasiMandateInput): number;
export function calculateSESRevenue(input: SESInput): number;
export function calculateProperPayment(input: ProperPaymentInput): number;
export function calculatePartnerPayment(input: PartnerPaymentInput): number;
```

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

#### ProjectHistory（案件変更履歴）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | Int PK | 自動採番 |
| projectId | Int FK | 案件ID |
| action | String | 操作内容（登録 / 更新 / 削除） |
| changedFields | JSON? | 変更されたフィールド名のリスト |
| oldValues | JSON? | 変更前の値 |
| newValues | JSON? | 変更後の値 |
| operatedBy | String? | 操作者 |
| operatedAt | DateTime | 操作日時 |

---

### Prismaスキーマでの実装ポイント

#### Projectモデルの定義例
```prisma
model Project {
  id          Int      @id @default(autoincrement())
  projectCode String   @unique @db.VarChar(12)  // 12桁固定
  name        String
  projectType ProjectType @default(SES)  // デフォルト：SES
  clientId    Int  // NOT NULL（必須）
  client      Client   @relation(fields: [clientId], references: [id])
  dueDate     DateTime?
  status      ProjectStatus @default(NOT_STARTED)  // デフォルト：未着手
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // リレーション
  projectMembers ProjectMember[]
  revenues       Revenue[]
  payments       Payment[]
}

enum ProjectType {
  LUMP_SUM        // 一括請負
  QUASI_MANDATE   // 準委任契約
  SES             // SES
}

enum ProjectStatus {
  NOT_STARTED     // 未着手
  IN_PROGRESS     // 進捗中
  COMPLETED       // 完了
}
```

---

## バリデーションロジック

### 案件登録・更新時のバリデーション

#### 必須項目チェック
```typescript
// 必須フィールド
- projectCode: 必須
- name: 必須
- clientId: 必須（クライアントマスタに存在するIDであること）
```

#### 工番（projectCode）のバリデーション
```typescript
// 工番は12桁の数字のみ
const validateProjectCode = (code: string): boolean => {
  return /^\d{12}$/.test(code);
};

// エラーメッセージ例：
// "工番は12桁の数字で入力してください"
```

#### 案件種別（projectType）のデフォルト値
```typescript
// デフォルト値：SES
if (!projectType) {
  projectType = "SES";
}

// 許可される値：LUMP_SUM / QUASI_MANDATE / SES
```

#### ステータス（status）のデフォルト値と制約
```typescript
// デフォルト値：NOT_STARTED（未着手）
if (!status) {
  status = "NOT_STARTED";
}

// 許可される値：NOT_STARTED（未着手） / IN_PROGRESS（進捗中） / COMPLETED（完了）
```

#### ユニーク制約
```typescript
// projectCode は全案件で一意であること
// 重複時のエラーメッセージ例：
// "この工番は既に登録されています"
```

#### 売上・支払い明細の編集制限
```typescript
// 案件ステータスに基づく編集制限
const canEditRevenue = (projectStatus: ProjectStatus): boolean => {
  return projectStatus === "IN_PROGRESS";
};

const canEditPayment = (projectStatus: ProjectStatus): boolean => {
  return projectStatus === "IN_PROGRESS";
};

// エラーメッセージ例：
// "案件が「進捗中」の場合のみ編集できます"
```

#### 支払い明細の入力項目バリデーション（費目別）
```typescript
// 交通費の場合の入力項目
interface TransportationPaymentInput {
  memberId: number;  // 必須
  amount: number;    // 必須
  date: Date;        // 必須
  category: "交通費"; // 固定値
}

// その他の費目の場合の入力項目
interface StandardPaymentInput {
  memberId?: number;
  partnerId?: number;
  employeeType: "PROPER" | "PARTNER";
  category: "外注費" | "材料費";  // 交通費以外
  workingHours: number;  // 必須
  hourlyRate?: number;
  baseAmount?: number;
}

// バリデーション関数
const validatePaymentInput = (input: PaymentCreateInput): boolean => {
  if (input.category === "交通費") {
    return !!(input.memberId && input.amount && input.date);
  } else {
    return !!(input.workingHours);
  }
};
```

#### 担当者選択の制限
```typescript
// 売上・支払い登録時の担当者選択制限
const getAvailableMembers = async (projectId: number): Promise<Member[]> => {
  // 案件に紐づく担当者のみを取得
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectMembers: {
        include: {
          member: true
        }
      }
    }
  });
  
  return project.projectMembers.map(pm => pm.member);
};

// エラーメッセージ例：
// "この担当者は案件に登録されていません"
```

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

#### 案件一覧の検索・フィルタパラメータ

```typescript
// GET /api/projects のクエリパラメータ
interface ProjectListQueryParams {
  // 検索パラメータ（部分一致）
  projectCode?: string;      // 工番で検索
  name?: string;             // 案件名で検索
  clientId?: number;         // クライアントIDで検索
  partnerId?: number;        // 協力会社IDで検索（支払い明細経由）
  memberId?: number;         // 担当者IDで検索（案件担当者または売上・支払い明細経由）
  
  // フィルタパラメータ（完全一致）
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  projectType?: "LUMP_SUM" | "QUASI_MANDATE" | "SES";
  
  // ソート・ページング
  sortBy?: "projectCode" | "name" | "dueDate" | "status";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// 検索ロジック
// - projectCode, name: 部分一致（LIKE検索）
// - clientId: 完全一致
// - partnerId: 支払い明細に紐づく協力会社で検索
// - memberId: 案件担当者、売上明細、支払い明細のいずれかに紐づく担当者で検索
// - 複数条件を組み合わせた場合はAND検索
```

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

## Error Handling

### エラー分類と対応方針

#### バリデーションエラー（400 Bad Request）
**発生条件**:
- 工番が10桁の数字でない
- 必須項目（projectCode, name, clientId）が未入力
- 数値項目に不正な値が入力された

**対応**:
```typescript
// APIレスポンス例
{
  "error": "Validation Error",
  "details": [
    { "field": "projectCode", "message": "工番は10桁の数字で入力してください" },
    { "field": "clientId", "message": "クライアントは必須です" }
  ]
}
```
- フロントエンドで各フィールドの下にエラーメッセージを表示
- 送信ボタンを無効化しない（エラーを確認できるようにする）

#### データ不整合エラー（409 Conflict）
**発生条件**:
- 工番が既に登録されている
- 存在しないクライアントIDが指定された
- 外部キー制約違反

**対応**:
```typescript
{
  "error": "Conflict",
  "message": "この工番は既に登録されています"
}
```
- トーストメッセージでユーザーに通知
- フォームは保持し、修正後に再送信可能にする

#### 権限エラー（403 Forbidden）
**発生条件**:
- 削除・更新権限がない（将来の拡張）

**対応**:
- 操作不可であることを明示
- 該当ボタンを非表示またはグレーアウト

#### データ未存在エラー（404 Not Found）
**発生条件**:
- 指定されたIDのデータが存在しない

**対応**:
```typescript
{
  "error": "Not Found",
  "message": "指定された案件が見つかりません"
}
```
- 一覧ページへリダイレクト
- トーストメッセージで通知

#### サーバーエラー（500 Internal Server Error）
**発生条件**:
- データベース接続エラー
- 予期しない計算エラー
- 外部サービス障害

**対応**:
```typescript
{
  "error": "Internal Server Error",
  "message": "サーバーエラーが発生しました。しばらくしてから再度お試しください"
}
```
- エラーログに詳細を記録（スタックトレース、入力値）
- ユーザーには汎用メッセージを表示
- 入力内容は保持

### フロントエンドエラーハンドリング

```typescript
// API呼び出し共通処理
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(response.status, errorData);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      // APIエラーは適切に処理
      handleApiError(error);
    } else {
      // ネットワークエラーなど
      showToast("通信エラーが発生しました", "error");
    }
    throw error;
  }
}
```

### バックエンドエラーハンドリング

```typescript
// API Route 共通エラーハンドリング
export async function handleApiError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prismaエラー
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Conflict", message: "この工番は既に登録されています" },
        { status: 409 }
      );
    }
  }
  
  // その他のエラー
  console.error("API Error:", error);
  return NextResponse.json(
    { error: "Internal Server Error", message: "サーバーエラーが発生しました" },
    { status: 500 }
  );
}
```

---

## Testing Strategy

### テスト方針

本システムは、CRUD操作とビジネスロジック（計算処理）を中心としたWebアプリケーションです。プロパティベーステスト（PBT）ではなく、**ユニットテスト** と **統合テスト** を組み合わせて品質を担保します。

### テスト対象

#### 1. ユニットテスト（計算ロジック）
**対象**: `src/lib/calculations.ts`

**テストケース例**:

##### 準委任契約の売上計算
```typescript
describe('calculateQuasiMandateRevenue', () => {
  test('上限超過時に調整額が加算される', () => {
    const input = {
      baseAmount: 500000,
      workingHours: 200,
      lowerHours: 140,
      upperHours: 180,
      calcBaseHours: 160
    };
    const result = calculateQuasiMandateRevenue(input);
    // 単価 = 500000 / 160 = 3125
    // 調整額 = (200 - 180) * 3125 = 62500
    // 合計 = 500000 + 62500 = 562500
    expect(result.totalRevenue).toBe(562500);
    expect(result.adjustment).toBe(62500);
  });

  test('下限未達でも減額されない', () => {
    const input = {
      baseAmount: 500000,
      workingHours: 120,
      lowerHours: 140,
      upperHours: 180,
      calcBaseHours: 160
    };
    const result = calculateQuasiMandateRevenue(input);
    expect(result.totalRevenue).toBe(500000);
    expect(result.adjustment).toBe(0);
  });
});
```

##### SESの売上計算
```typescript
describe('calculateSESRevenue', () => {
  test('上限超過時に調整額が加算される', () => {
    const input = {
      baseAmount: 500000,
      workingHours: 200,
      lowerHours: 140,
      upperHours: 180,
      calcBaseHours: 160
    };
    const result = calculateSESRevenue(input);
    expect(result.totalRevenue).toBe(562500);
    expect(result.adjustment).toBe(62500);
  });

  test('下限未達時に調整額が減算される', () => {
    const input = {
      baseAmount: 500000,
      workingHours: 120,
      lowerHours: 140,
      upperHours: 180,
      calcBaseHours: 160
    };
    const result = calculateSESRevenue(input);
    // 調整額 = -(140 - 120) * 3125 = -62500
    expect(result.totalRevenue).toBe(437500);
    expect(result.adjustment).toBe(-62500);
  });
});
```

##### プロパー支払い計算
```typescript
describe('calculateProperPayment', () => {
  test('間接費と販売費が正しく計算される', () => {
    const input = {
      workingHours: 160,
      hourlyRate: 3000,
      indirectRate: 0.20,
      salesRate: 0.15
    };
    const result = calculateProperPayment(input);
    // 原価 = 160 * 3000 = 480000
    // 間接費 = 480000 * 0.20 = 96000
    // 販売費 = (480000 + 96000) * 0.15 = 86400
    // 合計 = 480000 + 96000 + 86400 = 662400
    expect(result.baseCost).toBe(480000);
    expect(result.indirectCost).toBe(96000);
    expect(result.salesCost).toBe(86400);
    expect(result.totalPayment).toBe(662400);
  });
});
```

#### 2. 統合テスト（API Routes）
**対象**: `src/app/api/**/*.ts`

**テストケース例**:

##### 案件登録API
```typescript
describe('POST /api/projects', () => {
  test('正常に案件を登録できる', async () => {
    const projectData = {
      projectCode: '123456789012',
      name: 'テスト案件',
      projectType: 'SES',
      clientId: 1
    };
    const response = await POST(new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    }));
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.projectCode).toBe('123456789012');
    expect(data.status).toBe('NOT_STARTED');
  });

  test('工番が12桁でない場合はエラー', async () => {
    const projectData = {
      projectCode: '123',
      name: 'テスト案件',
      clientId: 1
    };
    const response = await POST(new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation Error');
  });

  test('重複する工番は登録できない', async () => {
    // 1回目の登録
    await POST(new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        projectCode: '123456789012',
        name: 'テスト案件1',
        clientId: 1
      })
    }));
    
    // 2回目の登録（重複）
    const response = await POST(new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        projectCode: '123456789012',
        name: 'テスト案件2',
        clientId: 1
      })
    }));
    expect(response.status).toBe(409);
  });
});
```

#### 3. E2Eテスト（オプション）
**ツール**: Playwright

**テストケース例**:
- 案件登録フロー（入力 → バリデーション → 登録 → 詳細画面表示）
- 売上・支払い登録後の粗利計算確認
- マスタ管理画面での登録・更新・削除

### テスト実行環境

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### テストデータ管理

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTestData() {
  // テスト用クライアント
  await prisma.client.create({
    data: { id: 1, name: 'テストクライアント' }
  });
  
  // テスト用担当者
  await prisma.member.create({
    data: {
      id: 1,
      name: 'テスト太郎',
      employeeType: 'PROPER',
      hourlyRate: 3000
    }
  });
  
  // テスト用年度設定
  await prisma.fiscalSetting.create({
    data: {
      fiscalYear: 2025,
      indirectRate: 0.20,
      salesRate: 0.15
    }
  });
}

export async function cleanupTestData() {
  await prisma.$executeRaw`DELETE FROM Project`;
  await prisma.$executeRaw`DELETE FROM Revenue`;
  await prisma.$executeRaw`DELETE FROM Payment`;
}
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
