export const config = { runtime: 'edge' };

// 管理画面の書き込み専用API（service_role）。
// companies/challenge_cards/projects への upsert/update/delete を ADMIN_PASSWORD 認証で実行。
// これにより anon の書き込み権限をDBから剥がせる（改竄・削除の穴を塞ぐ）。
const TABLES = ['companies', 'challenge_cards', 'projects', 'cases'];

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { password, table, action, rows, patch, id } = await req.json();
  const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

  // 認証
  const correct = process.env.ADMIN_PASSWORD;
  if (!correct || password !== correct) {
    await new Promise(r => setTimeout(r, 400));
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!TABLES.includes(table)) return json({ error: 'invalid table' }, 400);

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SK = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SK) return json({ error: 'Supabase not configured' }, 500);
  const base = `${SUPABASE_URL}/rest/v1/${table}`;
  const H = { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

  try {
    if (action === 'upsert') {
      const body = Array.isArray(rows) ? rows : [rows];
      const res = await fetch(base, {
        method: 'POST',
        headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(body),
      });
      const txt = res.ok ? '' : await res.text();
      return json({ ok: res.ok, status: res.status, error: txt || undefined }, res.ok ? 200 : 400);
    }
    if (action === 'update') {
      if (!id) return json({ error: 'id required' }, 400);
      const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(patch || {}),
      });
      return json({ ok: res.ok, status: res.status });
    }
    if (action === 'delete') {
      if (!id) return json({ error: 'id required' }, 400);
      const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: H });
      return json({ ok: res.ok, status: res.status });
    }
    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
}
