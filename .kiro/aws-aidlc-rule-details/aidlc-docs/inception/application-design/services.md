# サービス定義

サービス層はユーザー操作（APIリクエスト）に対して、複数のコンポーネントを調整・オーケストレーションします。

---

## SVC-01: PurchaseOrchestrator（購入オーケストレーター）

**役割**: 購入フローの全体調整（最重要サービス）

### フロー1: 決済開始（ゲスト / 会員共通）
```
1. ProductService.getProductById() → 商品存在確認・在庫確認
2. ProductService.hasAvailableLicenseKey() → ライセンス型の場合のみ
3. PaymentService.createPaymentIntent() → Stripe PaymentIntent作成
4. OrderService.createOrder() → ペンディング注文作成
5. → クライアントにclientSecretを返す（Stripeフォームの初期化用）
```

### フロー2: 決済完了（Stripe Webhook受信）
```
1. PaymentService.handleWebhook() → 署名検証・イベント種別確認
2. OrderService.updateOrderStatus('completed') → 注文ステータス更新
3. DeliveryService.generateDownloadUrl() または getLicenseKey()
4. NotificationService.sendPurchaseConfirmation() → メール送信
```

---

## SVC-02: AccountOrchestrator（アカウントオーケストレーター）

**役割**: アカウント登録・認証フローの調整

### フロー1: 購入後の任意アカウント登録
```
1. AuthService.register() → アカウント作成（購入時のメールアドレスで）
2. OrderService.attachOrderToUser() → ゲスト注文をアカウントに紐付け
```

### フロー2: パスワードリセット
```
1. AuthService.requestPasswordReset() → トークン生成・DB保存
2. NotificationService.sendPasswordReset() → リセットメール送信
```

---

## SVC-03: ContentDeliveryOrchestrator（コンテンツ配信オーケストレーター）

**役割**: 安全なダウンロード配信の制御

### フロー: ダウンロードリクエスト処理
```
1. DeliveryService.validateDownloadAccess() → トークン・有効期限・回数確認
2. PaymentService.verifyPaymentStatus() → 決済確認（二重チェック）
3. DeliveryService.recordDownload() → ダウンロード回数更新
4. → 署名付きS3 URLへリダイレクト
```

---

## SVC-04: AdminOrchestrator（管理オーケストレーター）

**役割**: 管理画面操作の調整

### フロー: 商品登録（ファイル型）
```
1. FileStorage（S3）へファイルをアップロード → S3キー取得
2. ProductService.createProduct() → 商品レコード作成（S3キーを保存）
```

### フロー: 商品登録（ライセンスキー型）
```
1. ProductService.createProduct() → 商品レコード作成
2. ProductService.addLicenseKeys() → キープール登録
```
