# コンポーネント依存関係

## 依存関係マトリックス

| 呼び出し元 → 呼び出し先 | ProductService | OrderService | PaymentService | DeliveryService | AuthService | NotificationService | Database | FileStorage | CDN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| StorefrontUI | ✅ | ✅ | ✅ | ✅ | ✅ | | | | |
| AdminUI | ✅ | ✅ | | | ✅ | | | | |
| ProductService | | | | | | | ✅ | ✅ | |
| OrderService | ✅ | | | | | | ✅ | | |
| PaymentService | | ✅ | | | | | | | |
| DeliveryService | ✅ | ✅ | ✅ | | | | ✅ | | ✅ |
| AuthService | | | | | | | ✅ | | |
| NotificationService | | | | | | | | | |
| PurchaseOrchestrator | ✅ | ✅ | ✅ | ✅ | | ✅ | | | |
| AccountOrchestrator | | ✅ | | | ✅ | ✅ | | | |
| ContentDeliveryOrchestrator | | | ✅ | ✅ | | | | | |
| AdminOrchestrator | ✅ | | | | | | | ✅ | |

---

## データフロー図（主要フロー）

### 購入フロー
```
購入者 (ブラウザ)
  │
  ├─[1. 商品取得]──────────► StorefrontUI ──► ProductService ──► Database
  │
  ├─[2. 決済開始]──────────► StorefrontUI ──► PurchaseOrchestrator
  │                                               ├──► ProductService (在庫確認)
  │                                               ├──► PaymentService ──► Stripe API
  │                                               └──► OrderService (注文作成) ──► Database
  │
  ├─[3. 決済フォーム表示]──► StorefrontUI ──► Stripe Elements (ブラウザ内)
  │                                               └──► Stripe API (直接通信・カード情報はStripeのみ)
  │
  └─[4. 決済完了 Webhook]─► PaymentService ──► PurchaseOrchestrator
                                                    ├──► OrderService (状態更新)
                                                    ├──► DeliveryService (URL/キー生成) ──► S3/CloudFront
                                                    └──► NotificationService ──► SES/Resend
                                                                                    └──► 購入者メール
```

### ダウンロードフロー
```
購入者 (メール内のリンクをクリック)
  │
  └─[ダウンロードリクエスト]──► ContentDeliveryOrchestrator
                                    ├──► DeliveryService.validateDownloadAccess() (トークン検証)
                                    ├──► PaymentService.verifyPaymentStatus() (決済二重確認)
                                    ├──► DeliveryService.recordDownload() (回数記録)
                                    └──► CloudFront 署名付きURL ──► S3 (ファイル取得)
```

---

## 通信パターン

| パターン | 使用箇所 |
|---|---|
| HTTPS REST (同期) | フロントエンド → バックエンドAPI全般 |
| Stripe Webhook (非同期) | Stripe → PaymentService（決済完了通知） |
| AWS SDK (内部) | DeliveryService ↔ S3/CloudFront |
| SMTP/API (非同期) | NotificationService → SES/Resend |
