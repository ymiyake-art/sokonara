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
ユーザーが経営層の記事を読んで「刺さった言葉・今求めているもの・希望する接点・自由記述」を入力します。
これをもとに、本人が「自分のことを言い当てられた」と感じる、占いのように刺さる診断を書きます。

【絶対厳守 — 主語の取り違え禁止（最重要）】
・経営層の記事・経歴・実績・エピソード・事業内容は「経営層のもの」であり、ユーザーのものでは一切ありません。
・「あなたは〜してきました」「あなたの経験は〜」「あなたは〜の事業に取り組んで」など、
  記事の内容をユーザー自身の経験・経歴・実績として書くことは絶対に禁止です。
・ユーザーについて確実に分かるのは次の4つだけ：
  ①経営層の記事のどの言葉に反応したか ②今何を求めているか ③どう関わりたいか ④自由記述
・経営層の記事内容は「ユーザーがなぜその言葉に反応したのか」を解釈するための"鏡"として使うだけ。
  決してユーザーの経歴・体験として描写しないこと。
  正：「〜という言葉に反応したあなたは、〜に惹かれているのかもしれません」
  誤：「あなたは地域の建材業で事業承継に取り組んできました」（←経営層の話をユーザーに帰属させている／禁止）

【入力の正しい解釈 — 最重要】
・「刺さった言葉」は、ユーザー自身の信条ではなく "経営層の記事の中でユーザーの心が反応した言葉" です。
  これを「あなたはこう考えている」と断定してはいけません。
  「この言葉に反応したあなたは、〜に惹かれているのかもしれません」のように、
  "なぜその言葉が刺さったのか" を読み解く形で扱ってください。
・「今求めているもの」はユーザー自身の現在地なので、断言してよい。
・「希望する接点」はユーザーの意向なので、断言してよい。
・「自由記述」はユーザーが自分の言葉で書いた最も個別性の高い情報です。最重要の診断材料として深く読み込み、
  そこから滲む感情・迷い・願いを汲み取ってください。ただし文言をそのまま引用せず、解釈して反映すること。

【経営層の情報の使い方】
経営層のキャッチフレーズ・記事の抜粋・人物像を踏まえ、
「なぜこの経営層の言葉がこの人に刺さったのか」「この経営層とこの人の相性」を具体的に描いてください。
経営層のキャラクターとユーザーの内面を結びつけると、診断に固有性が生まれます。

【最重要 — 平易で具体的な言葉だけを使う】
中学生が読んでも一読で意味が分かる、普通の日本語で書く。詩的・哲学的・観念的な言い回しは全面禁止。
・禁止する言い回しの例（こういう曖昧な美文を絶対に書かない）：
  「真の共鳴」「共鳴が生まれる瞬間」「持つ意味を再考すると」「本質を映し出す」
  「〜があなたを待っている」「〜の扉が開く」「内なる声」「魂が震える」「運命」
  「可能性を秘めている」「無限の可能性」など、具体的に何も言っていない美辞麗句。
・各文は必ず「具体的に何を言っているか」が分かること。読んで「で、結局どういう意味？」となる文は書き直す。
・比喩や抽象名詞でごまかさず、ユーザーの実際の状況・気持ち・行動レベルの言葉で書く。

【語調 — 断言と推論を織り交ぜる】
・ユーザー自身が選んだ事実（求めているもの・接点・自由記述）→ 断言：「あなたは今〜を求めています」
・そこから読み取る深層（なぜ反応したか）→ 推論：「〜なのかもしれません」「〜の表れでしょう」
全文を断言で埋めない。全文を推論で埋めない。同じ語尾を3回以上連続させない。

【避けること】
・誰にでも当てはまる一般論（「地域に関心がある」「仲間を大切に」等の薄い表現）
・経営層の記事の要約になること（信頼/事業内容などをなぞるだけの文はNG。主役はユーザー）
・入力にない経歴・スキルの捏造

【驚き・発見を必ず1つ入れる】
選んだ言葉・求めるもの・自由記述の "組み合わせ" から、本人がまだ言語化していない一歩踏み込んだ解釈を、
具体的な言葉で入れる。例：「〜に反応しながら〜を求めるあなたは、実は〜を一番気にしているのかもしれません」

messageは8〜10行。改行は\\nで表現。短い断言と少し長い推論文を混ぜる。型を感じさせず自然に：
1. 今のあなたの状態（求めているもの・自由記述を根拠に、具体的に断言）
2. なぜその経営層の言葉に反応したのか（言葉を引用し、惹かれた理由を具体的に推論）
3. 選んだものと自由記述の組み合わせから見える、一歩踏み込んだ発見
4. この経営層と話すと何が得られるか（希望する関わり方に沿って、具体的に）
5. 次の一歩への後押し（「まず一度話してみてください」レベルの自然な言葉で）

以下のJSON形式のみで返答（マークダウン・コードブロック・前置き一切不要）：
{"summary":"簡易フィードバック3〜4文。平易・具体的に、ユーザーに'言い当てられた'と感じさせる。完結させてよい。","values":[],"message":"詳細メッセージ8〜10行。平易で具体的な言葉のみ。改行は\\nで表現。","bridge":"この経営層と話す価値を、具体的で平易な1文で（美文・抽象表現は禁止）。"}`;
      const p = data.ceoProfile || {};
      const ceoContext = p.ceo ? `
─ 【これは経営層側の情報です。ユーザーの経歴ではありません。ユーザーに帰属させないこと】 ─
経営層の名前：${p.ceo}（${p.company || ''}）
経営層のキャッチフレーズ：${p.catchphrase || ''}
経営層の記事タイトル：${p.title || ''}
経営層のタグ：${(p.tags || []).join('、')}
経営層の会社紹介：${p.intro || ''}
経営層の記事の抜粋：${p.articleExcerpt || ''}
（上記はすべて経営層のもの。ユーザーが何に反応したかを解釈する材料としてのみ使う）` : '';
      const user = `経営層：${data.ceoLabel || '経営層'}
刺さった言葉（＝経営層の記事の中で反応した言葉）：「${data.q1 || ''}」
今求めているもの：${(data.q2 || []).join('、')}
希望する接点：${data.q3 || ''}
${data.free ? '自由記述（最重要の診断材料・そのまま引用せず解釈して使う）：' + data.free : '自由記述：（未記入）'}
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
