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

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!isAllowedOrigin(req)) return new Response('Forbidden', { status: 403 });

  const { mode, to, message } = await req.json();

  if (!message) {
    return new Response(JSON.stringify({ error: 'message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin }
    });
  }

  const token = process.env.LINE_MESSAGING_TOKEN;
  const lineMsg = { type: 'text', text: message };

  let url, body;

  if (mode === 'broadcast') {
    // 全友だちに送信
    url = 'https://api.line.me/v2/bot/message/broadcast';
    body = { messages: [lineMsg] };
  } else if (mode === 'push' && to) {
    // 特定ユーザーに送信
    url = 'https://api.line.me/v2/bot/message/push';
    body = { to, messages: [lineMsg] };
  } else if (mode === 'multicast' && Array.isArray(to) && to.length > 0) {
    // 複数ユーザーに送信（最大500件）
    url = 'https://api.line.me/v2/bot/message/multicast';
    body = { to: to.slice(0, 500), messages: [lineMsg] };
  } else {
    return new Response(JSON.stringify({ error: 'invalid mode or missing to' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin }
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const status = res.status;
  const data = status === 200 ? { ok: true } : await res.json();

  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin }
  });
}
