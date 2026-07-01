-- Career Well-being 6軸スコア一括投入（AI推定4軸＋time/econ=60の初期値／フロア45・上限90）。
-- 総合列は作らない方針。time・経済は後でマトリクスで手動調整してください。
UPDATE companies SET wb = '{"meaning": 80, "agency": 75, "people": 85, "local": 90, "time": 60, "econ": 60}'::jsonb WHERE id = 'co_ishikura_1777510220';
UPDATE companies SET wb = '{"meaning": 80, "agency": 90, "people": 85, "local": 90, "time": 60, "econ": 60}'::jsonb WHERE id = 'co_import_1776760337430';
UPDATE companies SET wb = '{"meaning": 80, "agency": 90, "people": 85, "local": 90, "time": 60, "econ": 60}'::jsonb WHERE id = 'co_import_1776760337433';
UPDATE companies SET wb = '{"meaning": 80, "agency": 85, "people": 80, "local": 90, "time": 60, "econ": 60}'::jsonb WHERE id = 'co_import_1776760337431';
UPDATE companies SET wb = '{"meaning": 80, "agency": 90, "people": 85, "local": 60, "time": 60, "econ": 60}'::jsonb WHERE id = 'co_import_1776760337432';
UPDATE companies SET wb = '{"meaning": 80, "agency": 80, "people": 85, "local": 75, "time": 60, "econ": 60}'::jsonb WHERE id = 'co_import_1776760337434';
UPDATE companies SET wb = '{"meaning": 80, "agency": 85, "people": 80, "local": 90, "time": 60, "econ": 60}'::jsonb WHERE id = 'co_1781331906205';
