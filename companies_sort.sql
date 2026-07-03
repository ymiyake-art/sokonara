-- companies に表示順(sort)を追加。経営層一覧・アプリ・MEET当日ページの並びを制御する。
-- NULL＝末尾扱い（既存企業は登録日時順のまま）。並び替えは admin「掲載企業一覧」の ↑↓ ボタンで編集。
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sort int;
