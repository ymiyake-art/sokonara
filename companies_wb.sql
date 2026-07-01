-- companies に Career Well-being の6軸スコア列を追加。
-- {meaning, agency, people, local, time, econ} 各0-100（jsonb）。
-- 記事貼付→「記事から推定(4軸)」でmeaning/agency/people/localをAI採点、time/経済は手動。
-- adminの経営層編集で調整→保存。未設定の会社は rtags/btags/tags から自動導出（アプリ側フォールバック）。
ALTER TABLE companies ADD COLUMN IF NOT EXISTS wb jsonb DEFAULT '{}'::jsonb;
