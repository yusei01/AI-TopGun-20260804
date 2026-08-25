# 作業ユニット定義

## ユニット分割方針

Next.js モノリポ構成のため、デプロイは単一ユニットですが、**開発の関心事**に基づいて3つのユニットに分割します。各ユニットは独立して開発・テスト可能です。

---

## ユニット一覧

| ID | ユニット名 | 種別 | 説明 |
|---|---|---|---|
| U-01 | core-infrastructure | 基盤 | データモデル・DB・認証・共通基盤 |
| U-02 | storefront | 購入者向け | 商品閲覧・購入フロー・マイページ |
| U-03 | admin | 管理者向け | 管理画面・商品/注文/顧客管理 |

---

## U-01: core-infrastructure（基盤ユニット）

**目的**: 他のユニットが依存する共通基盤を構築する

### 含まれるコンポーネント
- データベーススキーマ設計・マイグレーション（Prisma）
- AuthService（NextAuth.js設定・パスワードリセット）
- ProductService（CRUD・キー管理）
- OrderService（注文管理・状態管理）
- PaymentService（Stripe PaymentIntent・Webhook受信）
- DeliveryService（署名付きURL・ダウンロード管理）
- NotificationService（SES/Resend メール送信）
- 全オーケストレーター（Purchase / Account / ContentDelivery / Admin）

### 対応ユーザーストーリー
- US-04〜US-09（購入・配信フロー）
- US-10〜US-14（認証・アカウント管理）
- US-15〜US-20（管理機能のデータ層）

### コード配置
```
src/
  lib/
    db/           # Prismaクライアント・スキーマ
    auth/         # NextAuth.js設定
    stripe/       # Stripe SDK設定
    s3/           # AWS SDK設定
    email/        # SES/Resend設定
  services/
    product.service.ts
    order.service.ts
    payment.service.ts
    delivery.service.ts
    auth.service.ts
    notification.service.ts
  orchestrators/
    purchase.orchestrator.ts
    account.orchestrator.ts
    content-delivery.orchestrator.ts
    admin.orchestrator.ts
  app/api/        # API Routes（エンドポイント）
```

---

## U-02: storefront（購入者向けユニット）

**目的**: 購入者向けの全画面とUXを実装する

### 含まれるコンポーネント
- StorefrontUI（全購入者向けページ）
- 商品一覧・詳細ページ
- 2ステップ購入フロー（決済入力・完了）
- Stripe Elementsフォーム統合
- マイページ（購入履歴・再ダウンロード）
- ログイン・パスワードリセット画面
- 任意アカウント登録フロー

### 対応ユーザーストーリー
- US-01, US-02, US-03（商品閲覧）
- US-04, US-05, US-06（購入フロー）
- US-07, US-08, US-09（コンテンツ受取）
- US-10, US-11, US-12, US-13, US-14（アカウント管理）

### コード配置
```
src/
  app/
    (storefront)/
      page.tsx              # 商品一覧
      products/[id]/
        page.tsx            # 商品詳細
      checkout/
        page.tsx            # 決済入力（ステップ1→2）
      purchase-complete/
        page.tsx            # 購入完了
      download/[token]/
        page.tsx            # ダウンロード
      mypage/
        page.tsx            # 購入履歴
      auth/
        login/page.tsx
        register/page.tsx
        reset-password/page.tsx
  components/
    storefront/             # 購入者向けUIコンポーネント
```

---

## U-03: admin（管理者向けユニット）

**目的**: 管理者向けの全画面と操作を実装する

### 含まれるコンポーネント
- AdminUI（全管理画面ページ）
- 管理者ログイン・ルート保護ミドルウェア
- 商品管理画面（一覧・登録・編集）
- 注文管理画面（一覧・詳細）
- 顧客管理画面（一覧・検索）

### 対応ユーザーストーリー
- US-15（管理画面ログイン）
- US-16, US-17（商品管理）
- US-18, US-19（注文管理）
- US-20（顧客管理）

### コード配置
```
src/
  app/
    admin/
      layout.tsx            # 管理画面共通レイアウト（認証ガード）
      page.tsx              # ダッシュボード
      products/
        page.tsx            # 商品一覧
        new/page.tsx        # 商品登録
        [id]/edit/page.tsx  # 商品編集
      orders/
        page.tsx            # 注文一覧
        [id]/page.tsx       # 注文詳細
      customers/
        page.tsx            # 顧客一覧
  components/
    admin/                  # 管理者向けUIコンポーネント
  middleware.ts             # 管理者ルート保護
```

---

## 開発順序の推奨

```
U-01（基盤）→ U-02（購入者向け）→ U-03（管理者向け）
```

U-01が他の2ユニットの土台となるため、先に完成させることが必須です。U-02とU-03はU-01完了後、並行開発可能です。
