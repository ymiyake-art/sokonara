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

// ===== サーバー側プロンプト定義 =====
function buildPrompt(type, data) {
  switch (type) {

    case 'values': {
      const system = `あなたはソコナラ（地域キャリア共創プラットフォーム）のキャリア診断AIです。
ユーザーが経営層の記事を読んで選んだ言葉・求めているもの・希望する接点をもとに、
その人固有の価値観を断言的に言語化してください。

【絶対禁止の表現 — 1回も使わないこと】
「〜ではないでしょうか」「〜かもしれません」「〜という印象を受けます」
「〜だと思います」「〜のではないでしょうか」「〜と感じます」「〜でしょう」

【語調の原則】
すべて断言で書く。「あなたは〜です」「あなたの〜は〜です」「あなたには〜があります」
ユーザーが入力していない情報（業界知識・専門スキル等）は一切補完しないこと。

価値観3語は「〜できる人」「〜を持つ人」「〜な人」など具体的な姿勢を表す形式で。
例：「場を読んで動ける人」「熱量に乗れる人」「問いを手放さない人」「本質から逃げない人」

messageは以下の構成で15行程度。改行は\\nで表現：
1. あなたが今いる状態を断言（3行）：「あなたは今〜」で始め、状態をズバリ言い切る
2. あなたが持つ固有の強み（4行）：「あなたには〜があります」「あなたの〜は〜です」で断言。業界スキルへの言及は禁止
3. 選んだ言葉の深層読み解き（3行）：Q1の言葉を必ず引用し「その言葉を選んだあなたは〜です」と断言
4. この経営層との接点の意味（3行）：希望する関わり方に合わせて「〜という選択は〜につながります」など断言
5. 次の一歩（2行）：「まず話してみてください」レベルの温度感で断言的に背中を押す

以下のJSON形式のみで返答してください（マークダウン・コードブロック・前置き一切不要）：
{"summary":"簡易フィードバック4〜5文。断言調で書き、ユーザーに「わかってもらえた」と感じさせる内容にする。途中で切れる必要はなく完結させてよい。","values":["〜な人","〜できる人","〜を持つ人"],"message":"詳細メッセージ15行程度。改行は\\nで表現。","bridge":"この経営層との接点理由を1文で断言。"}`;
      const user = `経営層：${data.ceoLabel || '経営層'}
刺さった言葉：「${data.q1 || ''}」
今求めているもの：${(data.q2 || []).join('、')}
希望する接点：${data.q3 || ''}
${data.free ? '自由記述：' + data.free : ''}`;
      return { system, user };
    }

    case 'reco': {
      const system = '各経営層について「なぜこのユーザーに合うか」の理由を各1文（35字以内）で生成。JSONのみ返答（コードブロック不要）：{"reasons":["理由1","理由2","理由3"]}';
      const leaders = (data.leaders || []).map((c, i) => `経営層${i + 1}：${c.name}（${c.co}）`).join('\n');
      const user = `ユーザーの価値観：${(data.values || []).join('、')}\n希望接点：${data.q3 || ''}\n${leaders}`;
      return { system, user };
    }

    case 'insight': {
      const system = 'あなたはソコナラの運営分析AIです。データをもとに実用的なインサイトを180字以内で日本語で返してください。';
      const d = data;
      const user = `今週データ：反応${d.reactions}件(${d.reactionsDelta})、完了率${d.completionRate}%(${d.completionDelta})、会いたい率${d.ctaRate}%、HOT${d.hotCount}件、最多共感ワード「${d.topWord}」(${d.topPct}%)。`;
      return { system, user };
    }

    case 'report': {
      const system = 'あなたはソコナラの月次レポートライターです。【今月のサマリ】【どんな人が反応したか】【印象的なコメント2件】【来月への示唆】の4構成で日本語レポートを書いてください。';
      const user = `企業：${data.name}（${data.ceo}）\n反応${data.reactions}件、CTA${data.cta}件(${data.ctaRate}%)、HOT${data.hot}件、WARM${data.warm}件`;
      return { system, user };
    }

    case 'cardphrase': {
      const system = `あなたは日本語コピーライターです。与えられた文章を、経営者カードに表示する「体言止め」フレーズに変換してください。
ルール：
- 必ず名詞または名詞句で終わる（〜感、〜観、〜力、〜想い、〜覚悟、〜問い、〜姿勢 等）
- 元の意味・ニュアンスを保ちつつ、20〜35字程度でまとめる
- 読んで心に引っかかる、具体的な言葉にする
- 「重要性」「活用」「具体化」のような抽象的な語尾は避ける
- 改行なしの1文で返す（改行位置はユーザーが後で決める）
- JSON形式のみで返す（コードブロック不要）：{"phrase":"変換後フレーズ"}`;
      const user = `次の文章を体言止めのカードフレーズに変換：「${data.line||''}」`;
      return { system, user };
    }

    case 'q1rewrite': {
      const system = `あなたは日本語コピーライターです。与えられた選択肢テキストを「体言止め」スタイルに書き直してください。
ルール：
- 必ず名詞または名詞句で終わる（〜こと、〜もの、〜感、〜観、〜力、〜想い、〜姿勢、〜覚悟、〜問い 等）
- 元の意味・ニュアンスを保ちつつ、20〜35字程度でまとめる（短くなりすぎない）
- 読んだ人が「わかる」と感じるような、具体性のある表現にする
- 抽象的な一般名詞（「重要性」「活用」「具体化」等）で終わらせない
- カードに表示するので、読んで心に引っかかる言葉にする
- 以下のJSON形式のみで返す（コードブロック不要）：{"lines":["体言止め1","体言止め2","体言止め3","体言止め4"]}`;
      const user = `以下の選択肢を体言止めに書き直してください：\n${(data.lines||[]).map((l,i)=>`${i+1}. ${l}`).join('\n')}`;
      return { system, user };
    }

    default:
      return null;
  }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(req)) return new Response('Forbidden', { status: 403 });
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': req.headers.get('origin'),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!isAllowedOrigin(req)) return new Response('Forbidden', { status: 403 });

  const body = await req.json();
  const { type, data } = body;

  const prompt = buildPrompt(type, data || {});
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'invalid type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const allowOrigin = req.headers.get('origin') || '';

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
        { role: 'system', content: prompt.system },
        { role: 'user',   content: prompt.user }
      ]
    })
  });

  const result = await res.json();

  if (!res.ok) {
    return new Response(JSON.stringify(result), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin }
    });
  }

  const text = result.choices?.[0]?.message?.content ?? '';
  return new Response(JSON.stringify({ content: [{ text }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin }
  });
}
