import { ImageResponse } from '@vercel/og';
export const config = { runtime: 'edge' };

// 動的OG画像（1200x630）。2モード：
//   /api/og?cid=<companyId>            … 経営層記事カード（写真＋キャッチ＋名前）
//   /api/og?d=m.a.p.l.t.e&t=<タイプ名>  … 仕事の軸カード（レーダー＋タイプ名）
// 日本語はGoogle FontsからNoto Sans JPを「使う文字だけ」サブセット取得（satoriはttf/otfのみ対応）。

const SITE = 'https://app.sokonara.co.jp';
const h = (type, style, children, extra) => ({ type, props: { style, ...(extra || {}), children } });

async function loadFont(text, weight) {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`;
  // 古いUAを名乗るとwoff2ではなくttfのURLが返る（satoriがwoff2非対応のため）
  const css = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1' } }).then(r => r.text());
  const m = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/);
  if (!m) return null;
  return await fetch(m[1]).then(r => r.arrayBuffer());
}

const AX_LABELS = ['意味・使命', '裁量・挑戦', '人・近さ', '地域・つながり', '時間・ゆとり', '経済（年収）'];

function radarSvg(vals) {
  const cx = 260, cy = 260, R = 190;
  const pt = (i, v) => { const a = (-90 + i * 60) * Math.PI / 180, r = R * Math.max(0, Math.min(100, v)) / 100; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const ring = g => Array.from({ length: 6 }, (_, i) => pt(i, g).map(n => n.toFixed(1)).join(',')).join(' ');
  const poly = Array.from({ length: 6 }, (_, i) => pt(i, vals[i]).map(n => n.toFixed(1)).join(',')).join(' ');
  const dots = Array.from({ length: 6 }, (_, i) => { const q = pt(i, vals[i]); return h('circle', {}, null, { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: '8', fill: '#fff', stroke: '#c9a95c', strokeWidth: '4' }); });
  const axes = Array.from({ length: 6 }, (_, i) => { const e = pt(i, 100); return h('line', {}, null, { x1: cx, y1: cy, x2: e[0].toFixed(1), y2: e[1].toFixed(1), stroke: 'rgba(255,255,255,0.16)', strokeWidth: '1.5' }); });
  return h('svg', {}, [
    ...[100, 66, 33].map(g => h('polygon', {}, null, { points: ring(g), fill: 'none', stroke: 'rgba(255,255,255,0.16)', strokeWidth: '1.5' })),
    ...axes,
    h('polygon', {}, null, { points: poly, fill: 'rgba(94,207,190,0.35)', stroke: '#5ecfbe', strokeWidth: '4', strokeLinejoin: 'round' }),
    ...dots,
  ], { width: '520', height: '520', viewBox: '0 0 520 520' });
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cid = searchParams.get('cid');

    if (cid) {
      // ===== 経営層記事カード =====
      const SUPA = process.env.SUPABASE_URL, SK = process.env.SUPABASE_SERVICE_KEY;
      const rows = await fetch(`${SUPA}/rest/v1/companies?id=eq.${encodeURIComponent(cid)}&select=ceo,name,catchphrase,quote,photoUrl`, { headers: { apikey: SK, Authorization: `Bearer ${SK}` } }).then(r => r.json());
      const co = rows && rows[0];
      if (!co) return new Response('not found', { status: 404 });
      const catch_ = String(co.catchphrase || co.quote || co.ceo || '').split('\n').join('');
      const ceo = co.ceo || '';
      const comp = co.name || '';
      let photo = co.photoUrl || '';
      if (photo && photo.startsWith('/')) photo = SITE + photo;
      const text = catch_ + ceo + comp + 'ソコナラ経営層と話せるSOKONARA' + SITE;
      const [f700, f400] = await Promise.all([loadFont(text, 700), loadFont(text, 400)]);
      return new ImageResponse(
        h('div', { width: '100%', height: '100%', display: 'flex', backgroundColor: '#101b38', backgroundImage: 'linear-gradient(135deg,#101b38 0%,#1c2f5e 100%)', padding: '56px 64px', fontFamily: 'NotoJP' }, [
          h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, paddingRight: '40px' }, [
            h('div', { display: 'flex', flexDirection: 'column' }, [
              h('div', { fontSize: 22, letterSpacing: 6, color: '#5ecfbe', marginBottom: 28 }, 'SOKONARA — 経営層と話せる'),
              h('div', { fontSize: catch_.length > 22 ? 44 : 52, fontWeight: 700, color: '#ffffff', lineHeight: 1.45 }, catch_),
            ]),
            h('div', { display: 'flex', flexDirection: 'column' }, [
              h('div', { fontSize: 34, fontWeight: 700, color: '#ffffff' }, ceo),
              h('div', { fontSize: 24, color: 'rgba(255,255,255,0.65)', marginTop: 6 }, comp),
              h('div', { fontSize: 20, color: 'rgba(255,255,255,0.45)', marginTop: 22 }, SITE.replace('https://', '')),
            ]),
          ]),
          photo ? h('img', { width: 300, height: 300, borderRadius: 150, objectFit: 'cover', border: '6px solid rgba(94,207,190,0.7)' }, null, { src: photo }) : h('div', { width: 0, height: 0, display: 'flex' }, ''),
        ]),
        { width: 1200, height: 630, fonts: [f700 && { name: 'NotoJP', data: f700, weight: 700 }, f400 && { name: 'NotoJP', data: f400, weight: 400 }].filter(Boolean) }
      );
    }

    // ===== 仕事の軸カード =====
    const d = (searchParams.get('d') || '').split('.').map(n => parseInt(n) || 50).slice(0, 6);
    while (d.length < 6) d.push(50);
    const type = (searchParams.get('t') || '').slice(0, 20);
    const labels = AX_LABELS.join('') + type + 'わたしの仕事の軸タイプ年収や知名度だけがキャリアの正解じゃない。CAREERAXISソコナラ' + SITE;
    const [f700, f400] = await Promise.all([loadFont(labels, 700), loadFont(labels, 400)]);
    const lp = (i) => { const a = (-90 + i * 60) * Math.PI / 180; return { x: 260 + 245 * Math.cos(a), y: 260 + 245 * Math.sin(a) }; };
    return new ImageResponse(
      h('div', { width: '100%', height: '100%', display: 'flex', backgroundColor: '#0e1730', backgroundImage: 'linear-gradient(180deg,#0e1730 0%,#1b2b53 100%)', padding: '48px 60px', fontFamily: 'NotoJP', alignItems: 'center' }, [
        h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingRight: '30px' }, [
          h('div', { fontSize: 22, letterSpacing: 8, color: '#c9a95c' }, 'CAREER AXIS'),
          h('div', { fontSize: 34, color: '#ffffff', marginTop: 18 }, 'わたしの“仕事の軸”'),
          type ? h('div', { fontSize: 58, fontWeight: 700, color: '#e8cf8f', marginTop: 14, lineHeight: 1.3 }, `『${type}』タイプ`) : h('div', { display: 'flex' }, ''),
          h('div', { fontSize: 22, color: 'rgba(255,255,255,0.72)', marginTop: 30, lineHeight: 1.6 }, '年収や知名度だけが、キャリアの正解じゃない。'),
          h('div', { fontSize: 19, color: 'rgba(255,255,255,0.45)', marginTop: 26 }, SITE.replace('https://', '')),
        ]),
        h('div', { display: 'flex', width: 540, height: 540, position: 'relative', alignItems: 'center', justifyContent: 'center' }, [
          radarSvg(d),
          ...AX_LABELS.map((t, i) => { const p = lp(i); return h('div', { position: 'absolute', left: p.x - 70 + 10, top: p.y - 14 + 10, width: 140, display: 'flex', justifyContent: 'center', fontSize: 19, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }, t); }),
        ]),
      ]),
      { width: 1200, height: 630, fonts: [f700 && { name: 'NotoJP', data: f700, weight: 700 }, f400 && { name: 'NotoJP', data: f400, weight: 400 }].filter(Boolean) }
    );
  } catch (e) {
    return new Response('og error: ' + (e && e.message || e), { status: 500 });
  }
}
