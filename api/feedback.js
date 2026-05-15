export const config = { runtime: 'edge' };

const ALLOWED_ORIGINS = [
  'https://sokonara.vercel.app',
  'https://sokonara-git-main-ymiyake-arts-projects.vercel.app',
  'https://app.sokonara.co.jp',
];

function isAllowedOrigin(req) {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.some(o => origin === o) || origin.includes('localhost');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(req)) {
      return new Response('Forbidden', { status: 403 });
    }
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': req.headers.get('origin'),
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

  const { system, user } = await req.json();

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });

  const data = await res.json();

  const allowOrigin = req.headers.get('origin') || '';

  if (!res.ok) {
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin }
    });
  }

  // Normalize to Anthropic-compatible shape so client parsing is unchanged
  const text = data.choices?.[0]?.message?.content ?? '';
  return new Response(JSON.stringify({ content: [{ text }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin }
  });
}
