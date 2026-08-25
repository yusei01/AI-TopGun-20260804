# コンポーネントメソッド定義

※詳細なビジネスロジックはコンストラクションフェーズの機能設計で定義します。ここではメソッドシグネチャと目的を記載します。

---

## C-03: ProductService

```typescript
// 商品一覧取得（公開済みのみ / 管理者は全件）
getProducts(options: {
  category?: string;
  tag?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  includeUnpublished?: boolean; // 管理者のみtrue
}): Promise<{ products: Product[]; total: number }>

// 商品詳細取得
getProductById(productId: string): Promise<Product | null>

// 商品登録（管理者のみ）
createProduct(data: CreateProductInput): Promise<Product>

// 商品更新（管理者のみ）
updateProduct(productId: string, data: UpdateProductInput): Promise<Product>

// 公開/非公開切替（管理者のみ）
togglePublish(productId: string, published: boolean): Promise<Product>

// 商品削除（管理者のみ）
deleteProduct(productId: string): Promise<void>

// ライセンスキー登録（管理者のみ）
addLicenseKeys(productId: string, keys: string[]): Promise<void>

// 利用可能なライセンスキーがあるか確認
hasAvailableLicenseKey(productId: string): Promise<boolean>
```

---

## C-04: OrderService

```typescript
// 注文作成（決済前のペンディング状態で作成）
createOrder(data: {
  productId: string;
  email: string;
  userId?: string; // ログイン済みなら設定
  stripePaymentIntentId: string;
}): Promise<Order>

// 注文ステータス更新（Webhookから呼ばれる）
updateOrderStatus(
  stripePaymentIntentId: string,
  status: 'completed' | 'failed' | 'refunded'
): Promise<Order>

// 会員の注文履歴取得
getOrdersByUser(userId: string): Promise<Order[]>

// ゲスト注文一覧取得（管理者用）
getOrders(options: {
  status?: string;
  keyword?: string; // email or orderId
  page?: number;
}): Promise<{ orders: Order[]; total: number }>

// 注文詳細取得
getOrderById(orderId: string): Promise<Order | null>

// ゲスト注文をアカウントに紐付け
attachOrderToUser(email: string, userId: string): Promise<void>
```

---

## C-05: PaymentService

```typescript
// PaymentIntent作成（決済フォーム初期化）
createPaymentIntent(data: {
  productId: string;
  email: string;
}): Promise<{ clientSecret: string; paymentIntentId: string }>

// Webhook受信・署名検証・イベント処理
handleWebhook(
  rawBody: Buffer,
  signature: string
): Promise<void>

// 決済ステータス確認（ダウンロード前チェック用）
verifyPaymentStatus(stripePaymentIntentId: string): Promise<boolean>
```

---

## C-06: DeliveryService

```typescript
// 署名付きダウンロードURL発行
generateDownloadUrl(data: {
  orderId: string;
  userId?: string; // 会員ならID、ゲストならundefined
}): Promise<{
  url: string;
  expiresAt: Date;
  remainingDownloads: number;
}>

// ライセンスキー取得
getLicenseKey(orderId: string): Promise<string | null>

// ダウンロードアクセス検証（URL有効期限・回数・決済ステータス）
validateDownloadAccess(token: string): Promise<{
  valid: boolean;
  reason?: 'expired' | 'limit_exceeded' | 'payment_not_confirmed' | 'not_found';
  s3Key?: string;
}>

// ダウンロード回数インクリメント
recordDownload(orderId: string): Promise<void>
```

---

## C-07: AuthService

```typescript
// ユーザー登録
register(data: {
  email: string;
  password: string;
}): Promise<User>

// パスワードリセットトークン発行
requestPasswordReset(email: string): Promise<void>

// パスワードリセット実行
resetPassword(token: string, newPassword: string): Promise<void>

// 管理者ロール確認
isAdmin(userId: string): Promise<boolean>
```

---

## C-08: NotificationService

```typescript
// 購入完了メール送信
sendPurchaseConfirmation(data: {
  to: string;
  orderId: string;
  productName: string;
  amount: number;
  downloadUrl?: string;   // ダウンロード型
  licenseKey?: string;    // ライセンス型
  expiresAt?: Date;
  remainingDownloads?: number;
}): Promise<void>

// パスワードリセットメール送信
sendPasswordReset(data: {
  to: string;
  resetUrl: string;
  expiresAt: Date;
}): Promise<void>
```
