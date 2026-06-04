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

  const { password, action, company_id, id } = await req.json();

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

  // ---- 共感ログ一覧（企業ごと or 全件） ----
  if (action === 'list') {
    let url = `${SUPABASE_URL}/rest/v1/user_sessions?select=*&order=created_at.desc&limit=1000`;
    if (company_id) url += `&company_id=eq.${encodeURIComponent(company_id)}`;
    const res = await fetch(url, { headers: sbHeaders });
    const data = await res.json();
    return json(Array.isArray(data) ? data : []);
  }

  // ---- 1件削除 ----
  if (action === 'delete') {
    if (!id) return json({ error: 'id required' }, 400);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_sessions?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: sbHeaders }
    );
    return json({ ok: res.ok, status: res.status });
  }

  // ---- 一括削除（テストデータ消去：企業指定 or 全件） ----
  if (action === 'clear') {
    let url = `${SUPABASE_URL}/rest/v1/user_sessions?id=neq.__none__`;
    if (company_id) url = `${SUPABASE_URL}/rest/v1/user_sessions?company_id=eq.${encodeURIComponent(company_id)}`;
    const res = await fetch(url, { method: 'DELETE', headers: sbHeaders });
    return json({ ok: res.ok, status: res.status });
  }

  return json({ error: 'Unknown action' }, 400);
}
