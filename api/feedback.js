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
ユーザーが地域企業の経営層の記事を読んだあとに答えた内容から、
本人が「自分のことを分かってもらえた」と感じる、温かく具体的な診断文を書きます。

# 守ること（これだけ）
1. 主語を間違えない。経営層の記事・経歴・事業は「経営層のもの」であり、ユーザーのものではない。
   それをユーザーの経験として書かない（禁止例：「あなたは事業承継に取り組んできた」）。
   記事は「ユーザーがなぜその言葉に反応したか」を読み解く材料として使うだけ。
2. 平易で具体的に。中学生でも一読で分かる普通の言葉で書く。
   「真の共鳴」「本質を映し出す」「可能性を秘めている」「〜があなたを待っている」のような、
   具体的に何も言っていない曖昧な美文は禁止。どの文も「具体的に何を言っているか」が分かること。
3. 主役はユーザー。診断の中心は、ユーザーが答えた「今の状況」「求めているもの」「自由記述」。
   特に「今の状況」と「自由記述」はその人固有の情報なので、ここを起点に書く。
   自由記述は丸写しせず、そこから読み取れる気持ち・迷い・願いを汲んで反映する。
   経営層の記事の要約（信頼・事業内容のなぞり）にならないこと。
4. 語調。事実（求めているもの・状況・接点）は言い切る。
   そこから読み取る深層は「〜なのかもしれません」と柔らかく。断言と推論を自然に混ぜ、同じ語尾を続けない。

# 構成（型を感じさせず自然に、8〜10行）
・今のあなたの状態（状況・自由記述から具体的に言い切る）
・その経営層の言葉に反応した理由（言葉を引用し、経営層の人柄と結びつけて推論）
・選んだものの組み合わせから見える、本人がまだ気づいていない一歩踏み込んだ発見を1つ
・この経営層と話すと何が得られそうか（具体的に）
・「まず一度話してみては」と背中を押す自然な一言

# 長さ（材料の量に応じて可変・最重要）
・自由記述が具体的で情報量が多いほど、その内容に深く踏み込んで長く書いてよい（最大30行まで）。
・自由記述が空・短い・薄い場合は、無理に伸ばさず8〜10行で簡潔にまとめる。
・絶対に水増ししない。同じことの言い換え・一般論・美辞麗句で行数を稼ぐのは禁止。
　「書く材料があるから長い」のはOK、「長くするために薄い文を足す」のはNG。
・自由記述に書かれた具体的な事情・感情・迷いには、必ず個別に触れて応答する。

# 出力例（トーンと具体性の参考。内容や固有名詞はコピーしない）
{"summary":"あなたは今、すぐ転職を決めたいわけではなく、まず納得できる相手を探している段階ですね。だから〇〇さんの言葉に、条件より人で選びたいあなたの目が反応したのだと思います。","values":[],"message":"あなたは今、転職を急いでいるというより、納得できる場所をじっくり探している段階にいます。\\n〇〇さんの『...』という言葉に反応したのは、肩書きより一緒に働く人で選びたいあなたの感覚に響いたからでしょう。\\n挑戦したい気持ちと「まだ整理できていない」が同居しているあなたは、本当は動く前に背中を押してくれる相手を探しているのかもしれません。\\n〇〇さんのように現場で考え方を語ってくれる人と話すと、自分が大事にしたい働き方の輪郭が見えてきます。\\nまずは一度、気軽に話してみることから始めてみてください。","bridge":"〇〇さんと一度話すと、あなたが本当に大事にしたい働き方の輪郭がはっきりします。"}

# 返答形式（JSONのみ。マークダウン・前置き一切不要）
{"summary":"3〜4文。平易・具体的に、言い当てられた感を。","values":[],"message":"材料に応じて8〜30行。薄い水増しは禁止。改行は\\nで表現。","bridge":"この経営層と話す価値を具体的な1文で。"}`;
      const p = data.ceoProfile || {};
      const ceoContext = p.ceo ? `
─ 【これは経営層側の情報。ユーザーの経歴ではない。ユーザーに帰属させない】 ─
経営層の名前：${p.ceo}（${p.company || ''}）
経営層のキャッチフレーズ：${p.catchphrase || ''}
経営層の記事タイトル：${p.title || ''}
経営層のタグ：${(p.tags || []).join('、')}
経営層の会社紹介：${p.intro || ''}
経営層の記事の抜粋：${p.articleExcerpt || ''}
（上記はすべて経営層のもの。ユーザーが何に反応したかを解釈する材料としてのみ使う）` : '';
      const user = `─ ユーザーの回答（ここが診断の主役） ─
刺さった言葉（＝経営層の記事の中で反応した言葉。ユーザーの信条ではない）：「${data.q1 || ''}」
今求めているもの：${(data.q2 || []).join('、')}
今のあなたの状況（重要・ユーザー固有）：${(data.about || []).join('、') || '（未選択）'}
${data.free ? '自由記述（最重要・固有性が出る。丸写しせず解釈して使う）：' + data.free : '自由記述：（未記入）'}
${ceoContext}`;
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
      // ユーザー向けのAI診断(values)は品質優先で4o、その他の軽い処理はminiでコスト抑制
      model: type === 'values' ? 'gpt-4o' : 'gpt-4o-mini',
      max_tokens: type === 'values' ? 1800 : 1000,
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
