export const config = { runtime: 'edge' };

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
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { password, action, since } = await req.json();

  // パスワード検証
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
    return new Response(JSON.stringify({ error: 'Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY)' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const sbHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  // ---- 一覧取得 ----
  if (action === 'list') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/interest_forms?select=*&order=created_at.desc&limit=200`,
      { headers: sbHeaders }
    );
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // ---- LINE連携ユーザー一覧 ----
  if (action === 'list_line_users') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/interest_forms?select=line_id,form_data,company_name,ceo_name,created_at&line_id=not.is.null&order=created_at.desc`,
      { headers: sbHeaders }
    );
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // ---- 未読件数カウント ----
  if (action === 'count_unread') {
    let url = `${SUPABASE_URL}/rest/v1/interest_forms?select=id`;
    if (since) {
      url += `&created_at=gt.${encodeURIComponent(since)}`;
    }
    const res = await fetch(url, {
      headers: { ...sbHeaders, 'Prefer': 'count=exact', 'Range': '0-0' }
    });
    const contentRange = res.headers.get('content-range') || '';
    // "0-0/N" または "*/N"
    const match = contentRange.match(/\/(\d+)/);
    const count = match ? parseInt(match[1], 10) : 0;
    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
