export const config = { runtime: 'edge' };

// 企業向け共感レポート用API（user_sessions = 匿名の共感ログを集計・削除）
export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { password, action, company_id, id, table } = await req.json();
  // 対象テーブル（ホワイトリスト）。指定なしは従来通りuser_sessions（診断ログ）
  const TBL = table === 'empathy_logs' ? 'empathy_logs'
            : table === 'card_logs' ? 'card_logs'
            : 'user_sessions';

  // ---- 診断結果の復元（パスワード不要・id必須）。card_logsの1件だけを返す ----
  // logIdは推測困難なuuidなので、これを知る本人のみ取得可能（公開SELECTは閉じる前提）。
  if (action === 'get') {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    const jsonH = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    if (!id || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers: jsonH });
    }
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/card_logs?id=eq.${encodeURIComponent(id)}&select=id,ai_summary,ai_message,ai_bridge,recommended_company`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const rows = await res.json();
    return new Response(JSON.stringify(Array.isArray(rows) && rows[0] ? rows[0] : null), { status: 200, headers: jsonH });
  }

  // 管理パスワード認証
  const correct = process.env.ADMIN_PASSWORD;
  if (!correct || password !== correct) {
    await new Promise(r => setTimeout(r, 400));
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  const sbHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });

  // ---- 一覧（企業ごと or 全件） ----
  if (action === 'list') {
    let url = `${SUPABASE_URL}/rest/v1/${TBL}?select=*&order=created_at.desc&limit=2000`;
    if (company_id) url += `&company_id=eq.${encodeURIComponent(company_id)}`;
    const res = await fetch(url, { headers: sbHeaders });
    const data = await res.json();
    return json(Array.isArray(data) ? data : []);
  }

  // ---- 1件削除 ----
  if (action === 'delete') {
    if (!id) return json({ error: 'id required' }, 400);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TBL}?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: sbHeaders }
    );
    return json({ ok: res.ok, status: res.status });
  }

  // ---- テストデータのみ削除（配布前クリーンアップ）。削除パターンはサーバー側で固定＝実ユーザー行は対象外 ----
  if (action === 'cleanup') {
    const out = {};
    // card_logs：検証用ID（probe_/apicheck_）＋ ?test=1 タグ済みの内部端末行
    const r1 = await fetch(
      `${SUPABASE_URL}/rest/v1/card_logs?or=(id.like.probe_*,id.like.apicheck_*,is_internal.is.true)`,
      { method: 'DELETE', headers: { ...sbHeaders, Prefer: 'return=representation' } }
    );
    out.card_logs = r1.ok ? (await r1.json()).length : ('error ' + r1.status);
    // 事前写真プローブはStorageの実体ファイルも先に削除（行だけ消すと孤児ファイルが残るため）
    try {
      const pr = await fetch(`${SUPABASE_URL}/rest/v1/meet_entries?id=like.meet_ph_probe_*&select=photo_path`, { headers: sbHeaders });
      const prows = pr.ok ? await pr.json() : [];
      for (const p of prows) {
        if (p.photo_path) await fetch(`${SUPABASE_URL}/storage/v1/object/meet-photos/${p.photo_path}`, { method: 'DELETE', headers: sbHeaders }).catch(() => {});
      }
    } catch (e) {}
    // meet_entries：班分けテスト参加者＋各種プローブ行
    const r2 = await fetch(
      `${SUPABASE_URL}/rest/v1/meet_entries?or=(id.like.meet_test_*,id.like.meet_probe_*,id.like.meet_co_probe_*,id.like.meet_ph_probe_*)`,
      { method: 'DELETE', headers: { ...sbHeaders, Prefer: 'return=representation' } }
    );
    out.meet_entries = r2.ok ? (await r2.json()).length : ('error ' + r2.status);
    return json({ ok: true, deleted: out });
  }

  // ---- 一括削除（テストデータ消去：企業指定 or 全件） ----
  if (action === 'clear') {
    let url = `${SUPABASE_URL}/rest/v1/${TBL}?id=neq.__none__`;
    if (company_id) url = `${SUPABASE_URL}/rest/v1/${TBL}?company_id=eq.${encodeURIComponent(company_id)}`;
    const res = await fetch(url, { method: 'DELETE', headers: sbHeaders });
    return json({ ok: res.ok, status: res.status });
  }

  return json({ error: 'Unknown action' }, 400);
}
