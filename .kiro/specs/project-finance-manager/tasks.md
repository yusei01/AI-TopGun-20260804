# Tasks Document

## Phase 1: バックエンド基盤

- [ ] 1. プロジェクト初期セットアップ
  - FastAPIプロジェクトの作成
  - 依存パッケージのインストール（fastapi, sqlalchemy, uvicorn, python-dotenv, alembic）
  - フォルダ構成の作成（app/, models/, routers/, schemas/, services/）

- [ ] 2. データベース設定
  - SQLAlchemyの接続設定（database.py）
  - Alembicによるマイグレーション初期化

- [ ] 3. データモデルの実装
  - Project（案件）モデル ※project_type, client_id含む
  - ProjectMember（案件担当者）モデル
  - Revenue（売上明細）モデル ※種別統合テーブル
  - Payment（支払い明細）モデル
  - FiscalSetting（年度設定）モデル
  - Member（担当者マスタ）モデル
  - Partner（協力会社マスタ）モデル
  - Client（クライアントマスタ）モデル

- [ ] 4. Pydanticスキーマの実装
  - 各モデルのRequest / Responseスキーマ
  - 案件種別ごとの売上スキーマ（一括請負 / 準委任 / SES）

## Phase 2: バックエンドAPI実装

- [ ] 5. マスタ管理APIの実装
  - 担当者マスタ CRUD（GET/POST/PUT/DELETE /api/members）
  - 協力会社マスタ CRUD（GET/POST/PUT/DELETE /api/partners）
  - クライアントマスタ CRUD（GET/POST/PUT/DELETE /api/clients）
  - 年度設定 CRUD（GET/POST/PUT /api/fiscal-settings）

- [ ] 6. 案件APIの実装
  - GET /api/projects（一覧・フィルタ：status, client_id, project_type, due_date）
  - POST /api/projects（登録）
  - GET /api/projects/{id}（詳細：売上・支払い・粗利含む）
  - PUT /api/projects/{id}（更新）
  - DELETE /api/projects/{id}（削除）

- [ ] 7. 売上APIの実装（計算ロジック含む）
  - GET /api/projects/{id}/revenues
  - POST /api/projects/{id}/revenues（種別判定・自動計算）
  - PUT /api/revenues/{id}
  - DELETE /api/revenues/{id}
  - 準委任契約の売上計算サービス
    - 単価 = 基準金額 ÷ 計算基準時間
    - 下限未達でも減額なし
    - 上限超過分を加算
  - SESの売上計算サービス
    - 単価 = 基準金額 ÷ 計算基準時間
    - 下限未達：控除あり
    - 上限超過：加算あり
  - 一括請負の売上合計計算（請求明細の合計）

- [ ] 8. 支払いAPIの実装（計算ロジック含む）
  - GET /api/projects/{id}/payments
  - POST /api/projects/{id}/payments（区分判定・自動計算）
  - PUT /api/payments/{id}
  - DELETE /api/payments/{id}
  - プロパーの支払い計算サービス
    - 原価 = 稼働時間 × 時間単価
    - 間接費 = 原価 × 間接費係数
    - 基準販売費 = (原価 + 間接費) × 基準販売費係数
    - 支払い合計 = 原価 + 間接費 + 基準販売費
  - 協力会社の支払い計算サービス
    - 140h未満：控除、180h超過：加算
    - 基準販売費 = 基準金額 × 基準販売費係数
    - 支払い合計 = 基準金額 ± 調整額 + 基準販売費

- [ ] 9. 集計APIの実装
  - GET /api/reports/summary
  - クエリパラメータ：fiscal_year, period_type（monthly / first_half / second_half / annual）, month
  - 上期：4〜9月、下期：10〜3月、通期：4〜3月
  - レスポンス：売上合計・支払い合計・粗利合計

## Phase 3: フロントエンド基盤

- [ ] 10. フロントエンドプロジェクト初期セットアップ
  - Vite + React + TypeScriptの初期化
  - Tailwind CSS + shadcn/uiの設定
  - React Routerの設定
  - APIクライアント（axios）の設定・型定義

- [ ] 11. 共通コンポーネントの実装
  - レイアウト（ヘッダー・サイドナビ）
  - ローディング・エラー表示
  - 確認ダイアログ
  - 金額フォーマット表示（カンマ区切り）

## Phase 4: 画面実装

- [ ] 12. 案件一覧画面
  - 案件テーブル表示（工番・案件名・種別・クライアント・期日・ステータス・粗利）
  - フィルター（種別・ステータス・クライアント・期日）
  - 新規登録ボタン

- [ ] 13. 案件登録・編集画面
  - 基本情報フォーム（工番・案件名・種別・クライアント・期日・ステータス）
  - クライアントはプルダウン（クライアントマスタから選択）
  - 担当者の追加・削除（担当者マスタから選択）

- [ ] 14. 案件詳細画面
  - 案件基本情報表示
  - 売上明細テーブル（種別に応じた列表示・合計）
  - 支払い明細テーブル（合計・内訳）
  - 粗利表示（売上合計 - 支払い合計）

- [ ] 15. 売上登録・編集画面
  - 案件種別に応じて入力フォームを動的切り替え
  - 一括請負：請求予定日・金額・入金状況
  - 準委任契約：担当者・基準金額・稼働時間・下限/上限時間・計算基準時間・自動計算プレビュー
  - SES：準委任と同構成・控除も表示

- [ ] 16. 支払い登録・編集画面
  - プロパー / 協力会社の切り替えで入力項目を動的変更
  - プロパー：稼働時間・時間単価（担当者マスタから自動入力可）
  - 協力会社：基準金額（協力会社マスタから自動入力）・稼働時間
  - 自動計算プレビュー（原価・間接費・基準販売費・調整額・合計）

- [ ] 17. 集計・レポート画面
  - 年度選択
  - 集計タブ切り替え：月次 / 上期 / 下期 / 通期
  - 売上合計・支払い合計・粗利合計の表形式表示

- [ ] 18. マスタ管理画面
  - タブ切り替え：年度設定 / 担当者 / 協力会社 / クライアント
  - 各マスタの一覧・登録・編集・削除

## Phase 5: 仕上げ

- [ ] 19. バリデーション・エラーハンドリング
  - フロントエンドのフォームバリデーション（必須チェック・数値チェック）
  - バックエンドのエラーレスポンス整備
  - 工番重複チェック

- [ ] 20. 動作確認・デバッグ
  - 各計算ロジックの正確性確認
  - 案件種別ごとの売上計算確認
  - プロパー・協力会社の支払い計算確認
  - 一括請負の分割請求フロー確認

- [ ] 21. 起動手順のドキュメント作成（README.md）
  - バックエンド起動方法（uvicorn）
  - フロントエンド起動方法（npm run dev）
  - 初期データの投入方法（マスタ登録手順）
  - 年度係数の設定手順
