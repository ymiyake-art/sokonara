-- companies に btags（事業テーマ）/ rtags（価値観）列を追加。
-- 逆引き（モヤモヤ→経営層レコメンド）のマッチ精度と、共鳴データの傾向集計に使う。
-- 記事貼付時に cardgen で自動生成→管理画面の経営層編集で微調整→保存、の運用。
-- 値は英語キーの配列（btags: it_dx/newbiz/expand/org/local/expertise/craft/global、
--                    rtags: challenge/autonomy/team/mission/trust/dialogue/inquiry）。
ALTER TABLE companies ADD COLUMN IF NOT EXISTS btags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rtags jsonb DEFAULT '[]'::jsonb;
