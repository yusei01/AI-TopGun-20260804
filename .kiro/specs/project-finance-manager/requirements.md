# Requirements Document

## Introduction

案件単位で売上・支払いを管理する社内向けWebアプリ。少人数チームが共同利用し、案件ごとの収支・粗利を可視化する。

## Glossary

| 用語 | 説明 |
|------|------|
| 工番 | 案件を一意に識別するコード |
| プロパー | 自社社員 |
| 協力会社 | 外部パートナー会社・個人 |
| 基準金額 | 協力会社の月額固定契約金額 |
| 間接費係数 | プロパーの原価に対する間接費の割合（年度設定） |
| 基準販売費係数 | 原価に対する基準販売費の割合（年度設定、プロパー・協力会社共通） |
| 計算基準時間 | 超過・控除の単価算出に用いる基準時間（準委任・SES、個別設定） |
| 粗利 | 売上合計 - 支払い合計 |

## Requirements

### 1. 案件管理

#### 1.1 案件の登録

**User Story:** As a プロジェクトマネージャー, I want 案件情報を登録する, so that 案件を一元管理できる

##### Acceptance Criteria

1. THE System SHALL accept 工番, 案件名, 案件種別, クライアント名, 担当者, 期日, ステータス for 案件登録
2. WHEN 工番 is provided, THE System SHALL validate that 工番 is exactly 12 digits
3. IF 工番 is not 12 digits, THEN THE System SHALL reject the registration and display an error message
4. THE System SHALL enforce 工番 uniqueness across all 案件
5. THE System SHALL require 工番, 案件名, and クライアント名 as mandatory fields
6. WHERE 案件種別 is not specified, THE System SHALL set the default value to "SES"
7. THE System SHALL restrict 案件種別 to one of: 一括請負, 準委任契約, SES
8. THE System SHALL restrict ステータス to one of: 未着手, 進捗中, 完了
9. THE System SHALL allow multiple 担当者 to be assigned to a single 案件

#### 1.2 案件の更新
- 登録済み案件の全項目を編集できること
- 更新は1〜3回程度を想定

#### 1.3 案件一覧
- 全案件を一覧表示できること
- ステータス・クライアント・期日・案件種別でフィルタリングできること

1. THE System SHALL display all 案件 in a list view
2. THE System SHALL provide search functionality for 工番, 案件名, クライアント, 協力会社, 担当者
3. THE System SHALL provide filter functionality for ステータス, クライアント, 期日, 案件種別
4. WHEN searching by 工番 or 案件名, THE System SHALL perform partial match search
5. WHEN searching by クライアント, 協力会社, or 担当者, THE System SHALL display matching 案件
6. THE System SHALL allow combining multiple search and filter criteria

---

### 2. 売上管理

案件種別によって売上の登録方法・計算ロジックが異なる。

#### 2.1 一括請負の売上

- 案件全体で売上金額を登録する（人単位ではない）
- 分割払いに対応するため、請求明細を複数件登録できること
  - 請求予定日
  - 請求金額
  - 入金状況（未請求 / 請求済 / 入金済）
- 請求明細の合計を売上合計として表示すること

#### 2.2 準委任契約の売上

- 担当者ごとに売上を登録すること
- 入力項目（担当者別）：
  - 担当者名
  - 基準金額（月額固定）
  - 稼働時間
  - 下限時間（動的設定）
  - 上限時間（動的設定）
  - 計算基準時間（超過単価算出用、例：160h）
- 計算ロジック：
  ```
  単価     = 基準金額 ÷ 計算基準時間
  稼働 < 下限時間    → 売上 = 基準金額（減額なし）
  稼働 下限〜上限時間 → 売上 = 基準金額
  稼働 > 上限時間    → 売上 = 基準金額 + (稼働h - 上限h) × 単価
  ```
- 超過が発生した場合は調整額を明示すること

#### 2.3 SESの売上

- 担当者ごとに売上を登録すること
- 入力項目（担当者別）：
  - 担当者名
  - 基準金額（月額固定）
  - 稼働時間
  - 下限時間（動的設定）
  - 上限時間（動的設定）
  - 計算基準時間（単価算出用）
- 計算ロジック：
  ```
  単価     = 基準金額 ÷ 計算基準時間
  稼働 < 下限時間    → 売上 = 基準金額 - (下限h - 稼働h) × 単価
  稼働 下限〜上限時間 → 売上 = 基準金額
  稼働 > 上限時間    → 売上 = 基準金額 + (稼働h - 上限h) × 単価
  ```
- 控除・超過が発生した場合は調整額を明示すること

#### 2.4 売上合計
- 案件内の売上合計を自動計算して表示すること
- 案件種別に応じた計算方法を適用すること

#### 2.5 売上明細の編集制限
1. WHEN 案件ステータス is "進捗中", THE System SHALL allow editing of 売上明細
2. WHEN 案件ステータス is "未着手" OR "完了", THE System SHALL prevent editing of 売上明細
3. THE System SHALL display an appropriate message when editing is not allowed

#### 2.6 売上登録時の担当者制限
1. WHEN 売上明細 is registered, THE System SHALL restrict 担当者 selection to members assigned to the 案件
2. THE System SHALL display only 案件担当者 in the 担当者 selection list
3. IF a 担当者 is not assigned to the 案件, THEN THE System SHALL not allow selection of that 担当者

---

### 3. 支払い管理

#### 3.1 支払いの登録
- 案件に紐づく支払い明細を登録できること
  - 支払い先（会社名 or 個人名）
  - 社員区分（プロパー / 協力会社）
  - 費目（外注費 / 交通費 / 材料費 / 間接費 / 基準販売費）
  - 金額（計算後の値を表示）

1. THE System SHALL accept 支払い明細 with 費目, 担当者, 社員区分, and other relevant fields
2. WHEN 費目 is "交通費", THE System SHALL require only 担当者, 金額, and 日付 as input
3. WHEN 費目 is NOT "交通費", THE System SHALL require standard input fields (稼働時間, 時間単価 or 基準金額)
4. WHEN 支払い明細 is registered, THE System SHALL restrict 担当者 selection to members assigned to the 案件
5. THE System SHALL display only 案件担当者 in the 担当者 selection list

#### 3.2 プロパーの支払い計算

```
原価       = 稼働時間 × 時間単価
間接費     = 原価 × 間接費係数（年度設定）
基準販売費 = (原価 + 間接費) × 基準販売費係数（年度設定）
支払い合計 = 原価 + 間接費 + 基準販売費
```

入力項目：
- 稼働時間
- 時間単価

#### 3.2.1 支払い明細の編集制限
1. WHEN 案件ステータス is "進捗中", THE System SHALL allow editing of 支払い明細
2. WHEN 案件ステータス is "未着手" OR "完了", THE System SHALL prevent editing of 支払い明細
3. THE System SHALL display an appropriate message when editing is not allowed

#### 3.3 協力会社の支払い計算

```
基準金額 = 月額固定契約金額

稼働 < 140h   → 支払い = 基準金額 - (140 - 稼働h) × (基準金額 ÷ 140)
稼働 140〜180h → 支払い = 基準金額
稼働 > 180h   → 支払い = 基準金額 + (稼働h - 180) × (基準金額 ÷ 180)

基準販売費 = 基準金額 × 基準販売費係数（年度設定）
支払い合計 = 上記支払い + 基準販売費
```

入力項目：
- 基準金額（月額固定契約金額）
- 稼働時間
- 控除・超過の状態と調整額を自動表示

---

### 4. マスタ管理

#### 4.1 年度設定
- 年度ごとに以下の係数を設定・保存できること
  - 間接費係数（プロパーのみ適用）
  - 基準販売費係数（プロパー・協力会社 共通）
- 係数は社内共通

#### 4.2 担当者マスタ
- 担当者情報を登録・管理できること
  - 担当者名
  - 所属区分（プロパー / 協力会社）
  - 時間単価（プロパーの場合）
- 案件・売上・支払い登録時にプルダウンで選択できること

#### 4.3 協力会社マスタ
- 協力会社情報を登録・管理できること
  - 会社名
  - 基準金額（月額固定契約金額）
- 支払い登録時に選択すると基準金額が自動入力されること

#### 4.4 クライアントマスタ
- クライアント情報を登録・管理できること
  - クライアント名
- 案件登録時にプルダウンで選択できること
- 表記ゆれを防止すること

#### 5.1 案件ごとの粗利
```
粗利 = 売上合計 - 支払い合計
```
- 案件詳細画面で粗利を表示すること

#### 5.2 期間集計
- 以下の集計単位で売上合計・支払い合計・粗利合計を表示できること
  - 月次（指定月）
  - 上期（4月〜9月）
  - 下期（10月〜3月）
  - 通期（4月〜3月）
- 年度を指定して切り替えられること

---

### 6. 案件履歴管理

#### 6.1 案件変更履歴の記録
1. WHEN 案件 is created, THE System SHALL record a history entry with action "登録"
2. WHEN 案件 is updated, THE System SHALL record a history entry with action "更新" and changed fields
3. WHEN 案件 is deleted, THE System SHALL record a history entry with action "削除"
4. THE System SHALL store 操作日時, 操作者, 操作内容, 変更前後の値 for each history entry

#### 6.2 履歴の閲覧
1. THE System SHALL display 案件変更履歴 in chronological order
2. THE System SHALL show 操作日時, 操作内容, 変更項目 for each history entry
3. THE System SHALL allow filtering history by 操作内容 (登録 / 更新 / 削除)

---

### 7. 案件の複製

#### 7.1 案件の複製機能
1. THE System SHALL provide a "複製" button on 案件詳細 screen
2. WHEN "複製" button is clicked, THE System SHALL copy the following fields from the original 案件:
   - 案件名 (with suffix "（コピー）")
   - 案件種別
   - クライアント
   - 担当者
3. THE System SHALL NOT copy the following fields:
   - 工番 (user must provide new unique 工番)
   - 期日
   - ステータス (defaults to 未着手)
   - 売上明細
   - 支払い明細
4. THE System SHALL open 案件登録 screen pre-filled with copied data
5. THE System SHALL require user to enter new 工番 before saving

---

### 8. CSV一括登録

#### 8.1 売上明細のCSV一括登録
1. THE System SHALL provide "CSVダウンロード" button on 案件詳細 screen
2. WHEN "CSVダウンロード" is clicked for 売上明細, THE System SHALL generate a CSV template with the following columns:
   - 案件種別に応じたヘッダー（一括請負 / 準委任契約 / SES）
3. THE System SHALL provide "CSVアップロード" button on 案件詳細 screen
4. WHEN CSV file is uploaded, THE System SHALL validate each row:
   - 必須項目の入力チェック
   - データ型チェック
   - 担当者の存在チェック
   - 案件種別との整合性チェック
5. IF validation fails, THE System SHALL display error messages with row numbers
6. IF validation succeeds, THE System SHALL register all rows as 売上明細
7. THE System SHALL display a summary of registered records

#### 8.2 支払い明細のCSV一括登録
1. THE System SHALL provide "CSVダウンロード" button for 支払い明細
2. WHEN "CSVダウンロード" is clicked for 支払い明細, THE System SHALL generate a CSV template with the following columns:
   - 費目、社員区分、担当者、稼働時間、金額など
3. THE System SHALL provide "CSVアップロード" button for 支払い明細
4. WHEN CSV file is uploaded, THE System SHALL validate each row:
   - 必須項目の入力チェック（費目に応じた項目）
   - データ型チェック
   - 担当者の存在チェック
   - 費目別の入力項目チェック（交通費の場合は異なる）
5. IF validation fails, THE System SHALL display error messages with row numbers
6. IF validation succeeds, THE System SHALL register all rows as 支払い明細
7. THE System SHALL calculate 原価、間接費、基準販売費、調整額 for each row
8. THE System SHALL display a summary of registered records

---

### 9. 非機能要件

| 項目 | 内容 |
|------|------|
| 利用形態 | 社内ローカルネットワーク or ローカル起動 |
| 利用人数 | 少人数（複数人同時操作の可能性あり） |
| UI | 非エンジニアでも使える直感的な画面 |
| インストール | 不要（ブラウザのみ） |
| データ | SQLite（将来的にPostgreSQLへ移行可能な構成） |
| 将来拡張 | クラウド・社内サーバーへのホスティング移行を考慮 |
