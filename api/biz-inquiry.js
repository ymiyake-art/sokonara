export const config = { runtime: 'edge' };

// 法人LP（/biz/）の問い合わせ受付API。
// - 公開POST（パスワード不要）：フォーム送信を biz_inquiries に保存（service_role）。
//   anon には一切のDB権限が無いため、保存は必ずこのAPIを通る＝公開テーブルからの漏洩を防ぐ。
// - 管理用（ADMIN_PASSWORD 必須）：action='list' / 'count_unread' / 'delete' / 'mark'。
// スパム対策：ハニーポット(website)・必須/形式チェック・文字数上限。

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  const json = (d, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let payload;
  try { payload = await req.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SK = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SK) return json({ error: 'Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY)' }, 500);

  const base = `${SUPABASE_URL}/rest/v1/biz_inquiries`;
  const H = { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

  const action = payload.action || 'submit';

  // ===== 管理用（パスワード必須） =====
  if (action === 'list' || action === 'count_unread' || action === 'delete' || action === 'mark') {
    const correct = process.env.ADMIN_PASSWORD;
    if (!correct || payload.password !== correct) {
      await new Promise(r => setTimeout(r, 400));
      return json({ error: 'Unauthorized' }, 401);
    }

    if (action === 'list') {
      const res = await fetch(`${base}?select=*&order=created_at.desc&limit=300`, { headers: H });
      return json(await res.json());
    }
    if (action === 'count_unread') {
      let url = `${base}?select=id&handled=eq.false`;
      if (payload.since) url += `&created_at=gt.${encodeURIComponent(payload.since)}`;
      const res = await fetch(url, { headers: { ...H, Prefer: 'count=exact', Range: '0-0' } });
      const m = (res.headers.get('content-range') || '').match(/\/(\d+)/);
      return json({ count: m ? parseInt(m[1], 10) : 0 });
    }
    if (action === 'delete') {
      if (!payload.id) return json({ error: 'id required' }, 400);
      const res = await fetch(`${base}?id=eq.${encodeURIComponent(payload.id)}`, { method: 'DELETE', headers: H });
      return json({ ok: res.ok, status: res.status });
    }
    if (action === 'mark') {
      if (!payload.id) return json({ error: 'id required' }, 400);
      const res = await fetch(`${base}?id=eq.${encodeURIComponent(payload.id)}`, {
        method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
        body: JSON.stringify({ handled: payload.handled !== false }),
      });
      return json({ ok: res.ok, status: res.status });
    }
  }

  // ===== 公開：問い合わせ保存 =====
  // ハニーポット（人間は触らない隠しフィールド）。埋まっていれば成功偽装して破棄。
  if (payload.website) return json({ ok: true });

  const s = v => (v == null ? '' : String(v)).trim();
  const company = s(payload.company);
  const name    = s(payload.name);
  const email   = s(payload.email);
  const tel     = s(payload.tel);
  const size    = s(payload.size);
  const message = s(payload.message);

  if (!company || !name || !email || !message) return json({ error: '必須項目が未入力です。' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'メールアドレスの形式が正しくありません。' }, 400);
  if (company.length > 200 || name.length > 100 || email.length > 254 ||
      tel.length > 50 || size.length > 50 || message.length > 5000) {
    return json({ error: '入力内容が長すぎます。' }, 400);
  }

  const row = {
    company, name, email, tel, size, message,
    source: 'biz_lp',
    user_agent: (req.headers.get('user-agent') || '').slice(0, 300),
  };

  const res = await fetch(base, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const t = await res.text();
    return json({ error: '保存に失敗しました。時間をおいて再度お試しください。', detail: t.slice(0, 200) }, 502);
  }
  return json({ ok: true });
}
