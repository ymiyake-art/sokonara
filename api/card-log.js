export const config = { runtime: 'edge' };

// 匿名の行動ログ(card_logs)の保存API（service_role）。
// anonの直接INSERT/UPDATEはRLSの影響を受けて0行更新になり得るため、書き込みは必ずこのAPIを通す。
// service_roleはRLSをバイパスするので、ポリシー状態に関わらず確実に保存される。
// upsert（merge-duplicates）なので、最初のlogStartはINSERT、以降のマイルストーンはUPDATEとして機能する。

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 書き込みを許可する列（任意の列を書かれないようホワイトリスト化）
const ALLOWED = new Set([
  'started', 'started_at', 'shown_cards',
  'picked_cards', 'dropped_cards', 'top_tags', 'rtags_hit',
  'recommended_company', 'recommended_card',
  'q1_phrase', 'reason', 'memo_chips', 'memo_text',
  'article_read', 'ai_viewed', 'line_registered', 'contact_cta',
  'ai_summary', 'ai_message', 'ai_bridge',
  'reached_result', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
]);

export default async function handler(req) {
  const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }

  const id = (body && body.id != null) ? String(body.id) : '';
  if (!id || id.length > 80) return json({ error: 'invalid id' }, 400);

  // set: 書き込む列（ホワイトリストのみ採用・文字列は長さ制限）
  const src = (body && typeof body.set === 'object' && body.set) ? body.set : {};
  const row = { id };
  for (const k of Object.keys(src)) {
    if (!ALLOWED.has(k)) continue;
    let v = src[k];
    if (typeof v === 'string' && v.length > 4000) v = v.slice(0, 4000);
    row[k] = v;
  }
  row.updated_at = new Date().toISOString();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SK = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SK) return json({ error: 'Supabase not configured' }, 500);

  try {
    // upsert（merge-duplicates）：初回INSERT／以降は該当列のみUPDATE。service_roleなのでRLS非依存で必ず保存。
    const res = await fetch(`${SUPABASE_URL}/rest/v1/card_logs?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: SK, Authorization: `Bearer ${SK}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([row]),
    });
    if (!res.ok) {
      const t = await res.text();
      return json({ ok: false, status: res.status, error: t.slice(0, 200) }, 200);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 200);
  }
}
