-- 人物マッチ用カード文言 A/B（3アーム）＋計測列。
-- cc_what=事業/役割で選ぶ, cc_value=価値観・人で共鳴, cc_life=転機スニペット(一人称)。
-- 空ならアプリ側で catchphrase にフォールバック。pf がセッションごとにアームをランダム表示し card_logs.copy_arm に記録。
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cc_what  text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cc_value text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cc_life  text;
ALTER TABLE card_logs ADD COLUMN IF NOT EXISTS copy_arm text;

-- 初期投入（2026-06-25 確定の赤入れ版）。以降は admin の企業編集で上書き可。
UPDATE companies SET
  cc_what ='IT×XRの第2創業期に、仲間として飛び込みたい人へ',
  cc_value='“傍(はた)を楽にする”に共感して働きたい人へ',
  cc_life ='銀行員から、50代で好きだったITの世界へ。'
WHERE id='co_import_1776760337433';

UPDATE companies SET
  cc_what ='AI時代のエンジニアの価値を、チームで作り直したい人へ',
  cc_value='手を挙げた人に、機会が回るチームで働きたい人へ',
  cc_life ='対馬の漁師の家から、19歳で学び直した。'
WHERE id='co_import_1776760337432';

UPDATE companies SET
  cc_what ='紙の会社を、データで“勝てる”会社に変えたい人へ',
  cc_value='“人情とおせっかい”で、面倒も一緒にやり切りたい人へ',
  cc_life ='営業が嫌で理系へ。なのに、営業から経営者に。'
WHERE id='co_import_1776760337434';

UPDATE companies SET
  cc_what ='遮熱シートの全国展開を、仲間と共に走りたい人へ',
  cc_value='“建材で地球を救う”を、仲間と本気でやりたい人へ',
  cc_life ='父の病をきっかけに、家業を継いだ元銀行員。'
WHERE id='co_ishikura_1777510220';

UPDATE companies SET
  cc_what ='学びを“事業”にする九州拠点の立ち上げに加わりたい人へ',
  cc_value='学びが当たり前の文化を、社会につくりたい人へ',
  cc_life ='救いたかった地域の学びが、救えていなかった。'
WHERE id='co_import_1776760337430';

UPDATE companies SET
  cc_what ='学びの拠点を、地域にゼロからつくりたい人へ',
  cc_value='学びで“選べる未来”を、地域に増やしたい人へ',
  cc_life ='3度の転職の末、“学びで地域を変える”に辿り着いた。'
WHERE id='co_import_1776760337431';

UPDATE companies SET
  cc_what ='建設×観光×デザインで、地域の価値を再編集したい人へ',
  cc_value='“建設は超サービス業”——まちを元気にしたい人へ',
  cc_life ='継ぐ気のなかった家業を、“まちづくり創造業”へ。'
WHERE id='co_1781331906205';
