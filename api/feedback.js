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
      const system = `あなたはソコナラ（地域キャリア共創プラットフォーム）のキャリアカウンセラーです。
ユーザーが経営層の記事を読んで選んだ言葉・求めているもの・希望する接点をもとに、
その人固有の価値観を言語化してください。

【重要】ユーザーが入力していない情報（専門知識・業界経験・スキル等）を勝手に補完・推測して記述しないこと。
あくまで「選んだ言葉」「求めているもの」「希望する接点」という3つの回答だけを根拠にしてください。

価値観3語は抽象的な概念語（変革・挑戦など）を避け、
その人の回答から滲み出る具体的な姿勢や信念を表す言葉にしてください。
例：「腹を括れる人」「問いを持ち続ける人」「場をつくる側の人」

メッセージは以下の構成で20行程度の充実した内容にしてください：
1. その人が今どんな状態にいるかの言語化（4〜5行）
   「あなたは今〜かもしれません」「〜ではないでしょうか」など推測・問いかける語調で始める
2. その人が持っている可能性（4〜5行）
   断定せず「〜という印象を受けます」「〜のではないでしょうか」など柔らかい表現にする
   ※業界知識・専門スキルの有無は一切言及しない
3. 選んだキーワードや回答が示す深層的な意味（3〜4行）
   「〜という言葉を選んだということは」など、回答そのものを根拠にして読み解く
4. この経営層との接点がなぜ意味を持つか（4〜5行）
   転職・副業・壁打ちなど希望する関わり方に合わせて「〜かもしれません」調で具体的に
5. 次の一歩への背中押し（2〜3行）
   転職を急かさず「まず話してみるだけでも」レベルの温度感で

以下のJSON形式のみで返答してください（マークダウン・コードブロック・前置き一切不要）：
{"summary":"LINE登録前に表示する簡易フィードバック。必ず5文で構成し途中で自然に終わるよう書く。ユーザーの回答から読み取れる特徴・傾向・可能性を具体的に。","values":["価値観語1","価値観語2","価値観語3"],"message":"詳細メッセージ。上記の構成で必ず10行以上書くこと。改行は\\nで表現。","bridge":"接点理由1文"}`;
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
