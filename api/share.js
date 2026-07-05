export const config = { runtime: 'edge' };

// 共有用の中間ページ（/s にrewrite）。クローラーにはOGタグを返し、人間は即アプリへリダイレクト。
//   /s?cid=<companyId>        … 経営層記事のシェア → /?cid= へ
//   /s?d=m.a.p.l.t.e&t=<型名> … 仕事の軸のシェア → / へ
// これにより X/LINE 等でリンクが「経営層の顔＋キャッチ」「自分のレーダー＋タイプ名」のカードとして展開される。

const SITE = 'https://app.sokonara.co.jp';
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const cid = searchParams.get('cid');
  let title, desc, ogImg, target;

  if (cid) {
    const SUPA = process.env.SUPABASE_URL, SK = process.env.SUPABASE_SERVICE_KEY;
    let co = null;
    try {
      const rows = await fetch(`${SUPA}/rest/v1/companies?id=eq.${encodeURIComponent(cid)}&select=ceo,name,catchphrase,quote`, { headers: { apikey: SK, Authorization: `Bearer ${SK}` } }).then(r => r.json());
      co = rows && rows[0];
    } catch (e) {}
    const catch_ = co ? String(co.catchphrase || co.quote || '').split('\n').join('') : '';
    title = co ? `${catch_ ? catch_ + '｜' : ''}${co.ceo || ''}（${co.name || ''}）` : 'ソコナラ｜経営層と話せる';
    desc = '求人票では分からない、経営層の想いと挑戦。読んだら、あなたの“仕事の軸”も診断できます。';
    ogImg = `${SITE}/api/og?cid=${encodeURIComponent(cid)}`;
    target = `${SITE}/?cid=${encodeURIComponent(cid)}&utm_source=share&utm_medium=social&utm_campaign=article_share`;
  } else {
    const d = searchParams.get('d') || '';
    const t = (searchParams.get('t') || '').slice(0, 20);
    title = t ? `私の仕事の軸は『${t}』タイプ｜ソコナラ` : 'わたしの“仕事の軸”｜ソコナラ';
    desc = '年収や知名度だけが、キャリアの正解じゃない。あなたの“仕事の軸”も1分で診断できます。';
    ogImg = `${SITE}/api/og?d=${encodeURIComponent(d)}&t=${encodeURIComponent(t)}`;
    target = `${SITE}/?utm_source=share&utm_medium=social&utm_campaign=axis_share`;
  }

  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(ogImg)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
</head><body><script>location.replace(${JSON.stringify(target)});</script>
<a href="${esc(target)}">ソコナラを開く</a></body></html>`;

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
