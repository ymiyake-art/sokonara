export const config = { runtime: 'edge' };

// ソコナラMEET 参加者エントリ(meet_entries)の保存API（service_role）。
// PII（氏名）を含むため anon の直接書込は許可せず、必ずこのAPIを通す（card-log.jsと同方式）。
// upsert（merge-duplicates）なので、氏名登録がINSERT、以降のチェック更新・アンケートはUPDATEとして機能する。

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 書き込みを許可する列（任意の列を書かれないようホワイトリスト化）
const ALLOWED = new Set([
  'event_id', 'name', 'checks', 'deep', 'talk', 'consent', 'rtags', 'comment', 'survey_done', 'groups',
]);

export default async function handler(req) {
  const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }

  const id = (body && body.id != null) ? String(body.id) : '';
  if (!id || id.length > 80 || !/^meet_/.test(id)) return json({ error: 'invalid id' }, 400);

  // 本人の班分けスケジュールのみ返す（PIIは返さない。id＝端末秘匿値なので本人限定の読取）
  if (body && body.action === 'get') {
    const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SERVICE_KEY;
    if (!U || !K) return json({ error: 'Supabase not configured' }, 500);
    try {
      const r = await fetch(`${U}/rest/v1/meet_entries?id=eq.${encodeURIComponent(id)}&select=groups`, { headers: { apikey: K, Authorization: `Bearer ${K}` } });
      const rows = await r.json();
      return json({ ok: true, groups: (rows && rows[0] && rows[0].groups) || null });
    } catch (e) { return json({ ok: false, error: String(e && e.message || e) }, 200); }
  }

  // 本人による自己データ削除（id＝端末秘匿値なので本人しか呼べない）
  if (body && body.action === 'delete') {
    const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SERVICE_KEY;
    if (!U || !K) return json({ error: 'Supabase not configured' }, 500);
    try {
      const r = await fetch(`${U}/rest/v1/meet_entries?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { apikey: K, Authorization: `Bearer ${K}` } });
      return json({ ok: r.ok, status: r.status });
    } catch (e) { return json({ ok: false, error: String(e && e.message || e) }, 200); }
  }

  const src = (body && typeof body.set === 'object' && body.set) ? body.set : {};
  const row = { id };
  for (const k of Object.keys(src)) {
    if (!ALLOWED.has(k)) continue;
    let v = src[k];
    if (typeof v === 'string' && v.length > 500) v = v.slice(0, 500);
    if (Array.isArray(v) && v.length > 20) v = v.slice(0, 20);
    row[k] = v;
  }
  row.updated_at = new Date().toISOString();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SK = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SK) return json({ error: 'Supabase not configured' }, 500);

  const upsert = (r) => fetch(`${SUPABASE_URL}/rest/v1/meet_entries?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: SK, Authorization: `Bearer ${SK}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([r]),
  });

  try {
    let res = await upsert(row);
    // 未マイグレーションの列(PGRST204)があってもエントリ全体を失わないよう、欠落列だけ外して再試行（最大4回）。
    const dropped = [];
    for (let i = 0; i < 4 && !res.ok && res.status === 400; i++) {
      const t = await res.text();
      const m = t.match(/Could not find the '([^']+)' column/);
      if (!m || !(m[1] in row)) { return json({ ok: false, status: res.status, error: t.slice(0, 200) }, 200); }
      delete row[m[1]];
      dropped.push(m[1]);
      res = await upsert(row);
    }
    if (!res.ok) {
      const t = await res.text();
      return json({ ok: false, status: res.status, error: t.slice(0, 200) }, 200);
    }
    return json(dropped.length ? { ok: true, dropped } : { ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 200);
  }
}
