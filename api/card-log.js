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
  'article_read', 'read_pct', 'ai_viewed', 'line_registered', 'contact_cta', 'form_open',
  'wb_view', 'wb_compare', 'wb_cta',
  'ai_summary', 'ai_message', 'ai_bridge',
  'reached_result', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
  'variant', 'copy_arm', 'arm_events',
  'is_internal',
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

  const upsert = (r) => fetch(`${SUPABASE_URL}/rest/v1/card_logs?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: SK, Authorization: `Bearer ${SK}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([r]),
  });

  try {
    // upsert（merge-duplicates）：初回INSERT／以降は該当列のみUPDATE。service_roleなのでRLS非依存で必ず保存。
    let res = await upsert(row);
    // 未マイグレーションの列(PGRST204)があっても“ログ全体”を失わないよう、欠落列だけ外して再試行（最大4回）。
    // 例: variant 列が未追加でも started/picked 等の本体は確実に保存する。
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
    // ok:true。欠落列を外して保存した場合は dropped を返す（呼び出し側は無視可・運用確認用）。
    return json(dropped.length ? { ok: true, dropped } : { ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 200);
  }
}
