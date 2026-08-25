# 実行計画

## 詳細分析サマリー

### 変更影響評価
| 観点 | 有無 | 内容 |
|---|---|---|
| ユーザー向け変更 | あり | ECサイト全体（商品閲覧・購入・マイページ・管理画面） |
| 構造的変更 | あり | 新規システム構築（グリーンフィールド） |
| データモデル変更 | あり | 商品・注文・ユーザー・ライセンスキーなど新規スキーマ設計が必要 |
| API変更 | あり | 決済API（Stripe）・メール送信API（SES/Resend）との連携 |
| NFR影響 | あり | セキュリティ（PCI DSS準拠・OWASP対策）・パフォーマンス（3秒以内） |

### リスク評価
| 項目 | 評価 | 低減策 |
|---|---|---|
| リスクレベル | **低**（対策済み） | 実績ある既製品を組み合わせる設計を採用：Stripe（決済）・NextAuth.js（認証）・Vercel（ホスティング）。独自実装を最小化することで設計ミスのリスクを排除 |
| ロールバック難度 | 低 | グリーンフィールドのため既存システムへの影響なし |
| テスト複雑度 | **低**（対策済み） | Stripe テストモード（偽カード番号）を使った自動テストをビルドフェーズで整備。決済→ダウンロードの一連フローをE2Eテストでカバー |

---

## ワークフロー可視化

```mermaid
flowchart TD
    Start(["ユーザーリクエスト"])

    subgraph INCEPTION["🔵 インセプションフェーズ"]
        WD["ワークスペース検出\n✅ COMPLETED"]
        RE["リバースエンジニアリング\n⏭ SKIPPED"]
        RA["要件分析\n✅ COMPLETED"]
        US["ユーザーストーリー\n✅ COMPLETED"]
        WP["ワークフロー計画\n🔄 IN PROGRESS"]
        AD["アプリケーション設計\n🟠 EXECUTE"]
        UG["ユニット生成\n🟠 EXECUTE"]
    end

    subgraph CONSTRUCTION["🟢 コンストラクションフェーズ"]
        FD["機能設計\n🟠 EXECUTE"]
        NFRA["NFR要件\n🟠 EXECUTE"]
        NFRD["NFR設計\n🟠 EXECUTE"]
        ID["インフラ設計\n🟠 EXECUTE"]
        CG["コード生成\n🟢 EXECUTE"]
        BT["ビルドとテスト\n🟢 EXECUTE"]
    end

    subgraph OPERATIONS["🟡 オペレーションフェーズ"]
        OPS["オペレーション\n⬜ PLACEHOLDER"]
    end

    Start --> WD
    WD --> RA
    RE -.->|スキップ| RA
    RA --> US
    US --> WP
    WP --> AD
    AD --> UG
    UG --> FD
    FD --> NFRA
    NFRA --> NFRD
    NFRD --> ID
    ID --> CG
    CG --> BT
    BT -.-> OPS
    BT --> End(["完了"])

    style WD fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style RA fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style US fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style WP fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style RE fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style AD fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style UG fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style FD fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style NFRA fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style NFRD fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style ID fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style CG fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style BT fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style OPS fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style INCEPTION fill:#BBDEFB,stroke:#1565C0,stroke-width:3px,color:#000
    style CONSTRUCTION fill:#C8E6C9,stroke:#2E7D32,stroke-width:3px,color:#000
    style OPERATIONS fill:#FFF59D,stroke:#F57F17,stroke-width:3px,color:#000
    style Start fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000
    style End fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000

    linkStyle default stroke:#333,stroke-width:2px
```

### テキスト代替表現

```
インセプションフェーズ:
  - ワークスペース検出    : ✅ COMPLETED
  - リバースエンジニアリング: ⏭ SKIPPED（グリーンフィールドのため）
  - 要件分析            : ✅ COMPLETED
  - ユーザーストーリー    : ✅ COMPLETED
  - ワークフロー計画      : 🔄 IN PROGRESS
  - アプリケーション設計  : 🟠 EXECUTE
  - ユニット生成         : 🟠 EXECUTE

コンストラクションフェーズ（ユニットごとに繰り返し）:
  - 機能設計            : 🟠 EXECUTE
  - NFR要件             : 🟠 EXECUTE
  - NFR設計             : 🟠 EXECUTE
  - インフラ設計         : 🟠 EXECUTE
  - コード生成           : 🟢 EXECUTE（常時）
  - ビルドとテスト        : 🟢 EXECUTE（常時）

オペレーションフェーズ:
  - オペレーション        : ⬜ PLACEHOLDER
```

---

## 実行ステージ一覧

### 🔵 インセプションフェーズ
- [x] ワークスペース検出（COMPLETED）
- [x] リバースエンジニアリング（SKIPPED — グリーンフィールドのため）
- [x] 要件分析（COMPLETED）
- [x] ユーザーストーリー（COMPLETED）
- [x] ワークフロー計画（IN PROGRESS）
- [ ] アプリケーション設計 — **EXECUTE**
  - **理由**: 新規システムにつき、フロントエンド・バックエンド・管理画面・決済・配信サービスなどコンポーネント境界とサービス層の設計が必要
- [ ] ユニット生成 — **EXECUTE**
  - **理由**: 20ストーリー・5エピックを開発ユニットに分割し、並行開発の計画を立てるために必要

### 🟢 コンストラクションフェーズ（ユニットごと）
- [ ] 機能設計 — **EXECUTE**
  - **理由**: 新規データモデル（商品・注文・ユーザー・ライセンスキー）と決済フローのビジネスロジック設計が必要
- [ ] NFR要件 — **EXECUTE**
  - **理由**: セキュリティ（OWASP・PCI DSS）・パフォーマンス（3秒以内）要件の技術スタック選定が必要
- [ ] NFR設計 — **EXECUTE**
  - **理由**: NFR要件を設計パターンに落とし込む（署名付きURL・Stripeセキュリティ・認証フロー等）
- [ ] インフラ設計 — **EXECUTE**
  - **理由**: AWS S3 + CloudFront（署名付きURL）・RDS・SES・Vercel等のインフラマッピングが必要
- [ ] コード生成 — **EXECUTE**（常時）
- [ ] ビルドとテスト — **EXECUTE**（常時）

### 🟡 オペレーションフェーズ
- [ ] オペレーション — PLACEHOLDER（将来拡張）

---

## 成功基準
- **主目標**: UXに優れたシンプルなデジタル商品ECサイトの構築
- **主要成果物**: 動作するWebアプリケーション（フロントエンド・バックエンド・管理画面）
- **品質ゲート**:
  - 購入完了まで最大2ステップ
  - ページ読み込み3秒以内（Core Web Vitals）
  - OWASP Top 10対策済み
  - 全ユーザーストーリー（20件）の受け入れ基準をパス
