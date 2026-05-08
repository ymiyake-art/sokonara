export const config = { runtime: 'edge' };

const ALLOWED_ORIGINS = [
  'https://sokonara.vercel.app',
  'https://sokonara-git-main-ymiyake-arts-projects.vercel.app',
];

function isAllowedOrigin(req) {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.some(o => origin === o) || origin.includes('localhost');
}

export default async function handler(req) {
  const allowOrigin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(req)) return new Response('Forbidden', { status: 403 });
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  if (!isAllowedOrigin(req)) {
    return new Response('Forbidden', { status: 403 });
  }

  const { code, redirect_uri } = await req.json();
  if (!code || !redirect_uri) {
    return new Response(JSON.stringify({ error: 'code and redirect_uri are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // LINE token exchange
  const params = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    redirect_uri,
    client_id:     process.env.LINE_CLIENT_ID,
    client_secret: process.env.LINE_CLIENT_SECRET,
  });

  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return new Response(JSON.stringify(tokenData), {
      status: tokenRes.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin }
    });
  }

  // LINE profile 取得
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
  });
  const profile = await profileRes.json();

  // 公式アカウントの友だち状態を確認
  const friendRes = await fetch('https://access.line.me/friendship/v1/status', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
  });
  const friendData = friendRes.ok ? await friendRes.json() : {};
  const friend_flag = friendData.friendFlag === true;

  return new Response(JSON.stringify({
    access_token: tokenData.access_token,
    line_id:      profile.userId,
    display_name: profile.displayName,
    picture_url:  profile.pictureUrl,
    friend_flag,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowOrigin,
    }
  });
}
