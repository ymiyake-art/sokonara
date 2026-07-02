-- card_logs に「報酬の重心」レポートの計測列を追加（H1検証：レポート閲覧がCVを増やすか）。
-- wb_view    = 報酬の重心レポート(p-wb)を開いた
-- wb_compare = 「いまの仕事と比べる」を実行した
-- 書き込みは service_role API(/api/card-log) 経由（ホワイトリストに追加済み）。
-- 未適用でもAPI側で PGRST204 を検出して該当列だけ外し再試行するため、本体ログは失われない。
ALTER TABLE card_logs ADD COLUMN IF NOT EXISTS wb_view boolean;
ALTER TABLE card_logs ADD COLUMN IF NOT EXISTS wb_compare boolean;
