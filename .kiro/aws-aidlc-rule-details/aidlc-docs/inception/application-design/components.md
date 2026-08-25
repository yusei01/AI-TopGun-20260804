# コンポーネント定義

## コンポーネント一覧

| ID | 名前 | 種別 | 責務 |
|---|---|---|---|
| C-01 | StorefrontUI | フロントエンド | 購入者向けの全画面表示・操作 |
| C-02 | AdminUI | フロントエンド | 管理者向けの全画面表示・操作 |
| C-03 | ProductService | バックエンド | 商品データのCRUDと公開管理 |
| C-04 | OrderService | バックエンド | 注文の作成・状態管理・履歴管理 |
| C-05 | PaymentService | バックエンド | Stripe連携による決済処理 |
| C-06 | DeliveryService | バックエンド | デジタルコンテンツの安全な配信 |
| C-07 | AuthService | バックエンド | ユーザー認証・セッション管理 |
| C-08 | NotificationService | バックエンド | メール送信（購入完了・ダウンロードリンク・パスワードリセット） |
| C-09 | Database | インフラ | PostgreSQLによるデータ永続化 |
| C-10 | FileStorage | インフラ | AWS S3によるデジタルファイル保存 |
| C-11 | CDN | インフラ | CloudFrontによる署名付きURL配信 |

---

## C-01: StorefrontUI（購入者向けフロントエンド）

**技術**: Next.js (App Router) + TypeScript + Tailwind CSS  
**ホスティング**: Vercel

### 責務
- 商品一覧・詳細ページの表示
- 2ステップ購入フローの画面制御
- Stripeフォームの表示（Stripe Elements使用）
- 購入完了画面・ダウンロード案内の表示
- 任意アカウント登録フローの表示
- マイページ（購入履歴・再ダウンロード）の表示
- ログイン・パスワードリセット画面の表示
- モバイルファーストのレスポンシブレイアウト

### インターフェース
- バックエンドAPIへのHTTPS通信（REST）
- NextAuth.jsによるセッション管理

---

## C-02: AdminUI（管理者向けフロントエンド）

**技術**: Next.js (App Router) + TypeScript + Tailwind CSS  
**ホスティング**: Vercel（`/admin` 以下のルート）

### 責務
- 管理者ログイン画面の表示
- 商品管理画面（一覧・登録・編集・公開切替）
- 注文管理画面（一覧・詳細）
- 顧客管理画面（一覧・検索）
- 管理者以外のアクセス拒否（ミドルウェアによるルート保護）

### インターフェース
- バックエンドAPIへのHTTPS通信（REST）
- 管理者専用NextAuth.jsセッション

---

## C-03: ProductService（商品サービス）

**技術**: Next.js API Routes / TypeScript  
**データストア**: PostgreSQL（C-09）

### 責務
- 商品の登録・更新・削除・一覧取得・詳細取得
- 公開/非公開フラグの管理
- カテゴリ・タグによる絞り込み
- キーワード検索
- デジタルファイルのメタデータ管理（S3パスの記録）
- ライセンスキーのプール管理

---

## C-04: OrderService（注文サービス）

**技術**: Next.js API Routes / TypeScript  
**データストア**: PostgreSQL（C-09）

### 責務
- 注文レコードの作成（ゲスト・会員両対応）
- 決済完了後の注文ステータス更新（Stripeからのwebhook受信）
- 注文履歴の取得（会員マイページ向け）
- 注文詳細の取得（管理画面向け）
- ゲスト注文のアカウント紐付け（任意登録時）

---

## C-05: PaymentService（決済サービス）

**技術**: Stripe SDK（Node.js）/ Next.js API Routes  
**外部依存**: Stripe API

### 責務
- Stripe PaymentIntentの作成
- 決済フォーム用クライアントシークレットの発行
- Stripe Webhookの受信・署名検証
- 決済成功/失敗イベントのOrderServiceへの通知
- チャージバック対策（ダウンロード前の決済ステータス確認）

---

## C-06: DeliveryService（配信サービス）

**技術**: Next.js API Routes / TypeScript  
**外部依存**: AWS S3 + CloudFront（署名付きURL）

### 責務
- 購入確認済み注文に対する署名付きダウンロードURLの生成
- ダウンロード回数・有効期限の管理
- 未購入者・期限切れ・上限超過へのアクセス拒否
- ライセンスキーの割り当てと返却

---

## C-07: AuthService（認証サービス）

**技術**: NextAuth.js / bcrypt  
**データストア**: PostgreSQL（C-09）

### 責務
- メールアドレス＋パスワード認証
- セッションの発行・検証・無効化
- パスワードのハッシュ化（bcrypt）
- パスワードリセットトークンの発行・検証
- 管理者ロールの判定

---

## C-08: NotificationService（通知サービス）

**技術**: Amazon SES または Resend  
**テンプレート**: 日本語メールテンプレート

### 責務
- 購入完了メールの送信（注文番号・ダウンロードリンク・領収書情報）
- ライセンスキー通知メールの送信
- パスワードリセットメールの送信
- 送信失敗時のリトライ（SESのリトライポリシー活用）
