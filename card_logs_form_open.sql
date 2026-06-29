-- card_logs に form_open 列を追加（CV直結指標）。
-- 意味: P5で「フォームを開く」(WEBCAS)を押した＝最も強い在アプリCVシグナル。
--   contact_cta（=共感→P5到達／興味）より一段強い、フォーム開封の歩留まりを測る。
-- 書き込みは service_role API(/api/card-log) 経由（ホワイトリストに 'form_open' 追加済み）。
-- 未適用でもAPI側で PGRST204 を検出して該当列だけ外し再試行するため、本体ログは失われない。
ALTER TABLE card_logs ADD COLUMN IF NOT EXISTS form_open boolean;
