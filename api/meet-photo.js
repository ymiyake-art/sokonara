export const config = { runtime: 'edge' };

// ソコナラMEET 参加者の顔写真・事前登録API（service_role）。
// - upload: 参加者本人が使う（認証なし・公開）。画像をStorage非公開バケット(meet-photos)へ保存し、
//   meet_entriesに事前行(id=meet_ph_*)を作成。当日の受付行(meet_*)とは別行＝adminが氏名で突合する。
// - list / delete: ADMIN_PASSWORD認証。非公開バケットのため署名URL(1時間)を発行して返す（admin表示・企業レポート用）。
// PII方針は meet-log.js と同じ：anonの直接読み書きは不可、必ずこのAPIを通す。

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const BUCKET = 'meet-photos';

export default async function handler(req) {
  const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }

  const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SERVICE_KEY;
  if (!U || !K) return json({ error: 'Supabase not configured' }, 500);
  const H = { apikey: K, Authorization: `Bearer ${K}` };
  const action = body && body.action;

  // ===== 参加者アップロード（公開） =====
  if (action === 'upload') {
    const name = String(body.name || '').trim().slice(0, 40);
    if (!name) return json({ error: 'name required' }, 400);
    const eventId = /^[a-z0-9_]{1,40}$/.test(String(body.event_id || '')) ? String(body.event_id) : 'meet_2026_07_30';
    // id：photo.html側がlocalStorageで再利用＝再送は同じ行・同じパスの上書き（重複行を作らない）
    const id = /^meet_ph_[a-z0-9_]{1,60}$/.test(String(body.id || '')) ? String(body.id) : ('meet_ph_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
    const consentShare = body.consent_share === true;
    // dataURL(JPEG) → バイナリ。base64で約4.5MB（実体約3.3MB）まで＝photo.html側で長辺1200に圧縮済み前提
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.photo || ''));
    if (!m) return json({ error: 'photo must be jpeg dataURL' }, 400);
    if (m[1].length > 4500000) return json({ error: 'photo too large' }, 400);
    let bytes;
    try { bytes = Uint8Array.from(atob(m[1]), c => c.charCodeAt(0)); } catch (e) { return json({ error: 'invalid base64' }, 400); }
    const path = `${eventId}/${id}.jpg`;
    const up = await fetch(`${U}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: bytes,
    });
    if (!up.ok) {
      const t = await up.text().catch(() => '');
      return json({ ok: false, error: 'storage upload failed', detail: t.slice(0, 200), needBucket: up.status === 404 || /Bucket not found/i.test(t) }, 200);
    }
    const row = { id, event_id: eventId, name, photo_path: path, photo_consent: consentShare };
    const ins = await fetch(`${U}/rest/v1/meet_entries?on_conflict=id`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([row]),
    });
    if (!ins.ok) {
      const t = await ins.text().catch(() => '');
      // photo_path/photo_consent 列が未作成（PGRST204）＝SQL未実行を明示して返す（プローブで検知できるように）
      return json({ ok: false, error: 'db insert failed', detail: t.slice(0, 200), needSql: /photo_path|photo_consent|PGRST204/.test(t) }, 200);
    }
    return json({ ok: true, id });
  }

  // ===== 以降はADMIN_PASSWORD認証 =====
  const correct = process.env.ADMIN_PASSWORD;
  if (!correct || String(body.password || '') !== correct) return json({ error: 'unauthorized' }, 401);

  if (action === 'list') {
    const r = await fetch(`${U}/rest/v1/meet_entries?photo_path=not.is.null&select=id,event_id,name,photo_path,photo_consent,created_at&order=created_at.desc`, { headers: H });
    if (!r.ok) return json({ error: 'db list failed' }, 500);
    const rows = await r.json();
    const paths = rows.map(x => x.photo_path);
    let signed = {};
    if (paths.length) {
      const s = await fetch(`${U}/storage/v1/object/sign/${BUCKET}`, {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 3600, paths }),
      });
      if (s.ok) {
        const arr = await s.json();
        (arr || []).forEach(x => { if (x && x.signedURL) signed[x.path] = `${U}/storage/v1${x.signedURL}`; });
      }
    }
    return json({ ok: true, rows: rows.map(x => ({ ...x, url: signed[x.photo_path] || null })) });
  }

  if (action === 'delete') {
    const id = String(body.id || '');
    if (!/^meet_ph_/.test(id)) return json({ error: 'invalid id' }, 400);
    const r = await fetch(`${U}/rest/v1/meet_entries?id=eq.${encodeURIComponent(id)}&select=photo_path`, { headers: H });
    const rows = r.ok ? await r.json() : [];
    const path = rows && rows[0] && rows[0].photo_path;
    if (path) {
      await fetch(`${U}/storage/v1/object/${BUCKET}/${path}`, { method: 'DELETE', headers: H }).catch(() => {});
    }
    const del = await fetch(`${U}/rest/v1/meet_entries?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: H });
    return json({ ok: del.ok });
  }

  return json({ error: 'unknown action' }, 400);
}
