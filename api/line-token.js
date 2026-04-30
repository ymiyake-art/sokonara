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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // LINE profile 取得
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
  });
  const profile = await profileRes.json();

  return new Response(JSON.stringify({
    access_token: tokenData.access_token,
    line_id:      profile.userId,
    display_name: profile.displayName,
    picture_url:  profile.pictureUrl,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
