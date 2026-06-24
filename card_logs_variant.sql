-- card_logs に A/B variant 列を追加（課題版/人物版のカード文言A/B）。
-- 値: 'challenge'（課題起点・既定） / 'person'（人物起点）。pf の logStart で記録。
-- 書き込みは service_role API(/api/card-log) 経由（ホワイトリストに 'variant' 追加済み）。
-- 未適用でもAPI側で弾かれエラーにはならない（列がある時のみ保存される）。
ALTER TABLE card_logs ADD COLUMN IF NOT EXISTS variant text;
