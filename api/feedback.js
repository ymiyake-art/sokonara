export const config = { runtime: 'edge' };

const ALLOWED_ORIGINS = [
  'https://sokonara.vercel.app',
  'https://sokonara-git-main-ymiyake-arts-projects.vercel.app',
  'https://app.sokonara.co.jp',
  'https://pf.sokonara.co.jp',
];

function isAllowedOrigin(req) {
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.some(o => origin === o) || origin.includes('localhost')) return true;
  // Vercelのプレビューデプロイ（sokonara-git-<branch>-...vercel.app）も許可
  return /^https:\/\/sokonara-[a-z0-9-]+\.vercel\.app$/.test(origin);
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
4. 語調。事実（選んだ言葉・求めているもの・状況・自由記述）を根拠に、落ち着いて言い切る。
   「〜かもしれません」などの推論は、メッセージ全体で多くても2回まで。多用しない（曖昧で頼りなく見える）。
   断定は「あなたは〜です」より「あなたが〜を選んだのは、〜だからでしょう」と"根拠→解釈"で書くと自然。

5. 占い・コールドリーディングに見せない（最重要・胡散臭さ対策）。
   ・必ず「ユーザーが実際に選んだ回答・書いた言葉」を根拠として明示してから解釈する。
     例：「『〇〇』を選び、△△を求めていると答えたあなたは、□□を大事にしている人です」
   ・誰にでも当たる曖昧な言い回し（「本当は迷っている」「実は〜を求めている」等の決めつけ）を避ける。
   ・"言い当ててやろう"という上から目線ではなく、回答を丁寧に読み解いて言葉にする姿勢で書く。

# 構成（型を感じさせず自然に、8〜10行）
・今のあなたの状態（状況・自由記述から具体的に言い切る）
・その経営層の言葉に反応した理由（言葉を引用し、経営層の人柄と結びつけて推論）
・選んだものの組み合わせから見える、本人がまだ気づいていない一歩踏み込んだ発見を1つ
・この経営層と話すと何が得られそうか（具体的に）
・「まず一度話してみては」と背中を押す自然な一言

# 経営層が一緒に挑戦したい人物像が与えられている場合
ユーザーの回答（状況・求めるもの・自由記述）と重なりがあれば、
「あなたの〜は、この経営層が一緒にやりたいと思う人に近い」と"そっと"伝える。
ただし求人票・募集要項のように「この職種を募集」とは書かない。条件提示ではなく、
あくまで人柄・志向の相性として、自然に1文添える程度にとどめる。重なりが薄ければ無理に触れない。

# 長さ（材料の量に応じて可変・最重要）
・自由記述が具体的で情報量が多いほど、その内容に深く踏み込んで長く書いてよい（最大30行まで）。
・自由記述が空・短い・薄い場合は、無理に伸ばさず8〜10行で簡潔にまとめる。
・絶対に水増ししない。同じことの言い換え・一般論・美辞麗句で行数を稼ぐのは禁止。
　「書く材料があるから長い」のはOK、「長くするために薄い文を足す」のはNG。
・自由記述に書かれた具体的な事情・感情・迷いには、必ず個別に触れて応答する。

# 出力例（トーンと具体性の参考。内容や固有名詞はコピーしない）
{"summary":"あなたは今、すぐ転職を決めたいわけではなく、まず納得できる相手を探している段階ですね。だから〇〇さんの言葉に、条件より人で選びたいあなたの目が反応したのだと思います。","values":[],"message":"あなたは今、転職を急いでいるというより、納得できる場所をじっくり探している段階にいます。\\n〇〇さんの『...』という言葉に反応したのは、肩書きより一緒に働く人で選びたいあなたの感覚に響いたからでしょう。\\n挑戦したい気持ちと「まだ整理できていない」が同居しているあなたは、本当は動く前に背中を押してくれる相手を探しているのかもしれません。\\n〇〇さんのように現場で考え方を語ってくれる人と話すと、自分が大事にしたい働き方の輪郭が見えてきます。\\nまずは一度、気軽に話してみることから始めてみてください。","bridge":"〇〇さんと一度話すと、あなたが本当に大事にしたい働き方の輪郭がはっきりします。"}

# 返答形式（JSONのみ。マークダウン・前置き一切不要）
{"summary":"5〜6文。回答を根拠に、平易で具体的に。冒頭から引き込み、最後の文は途中で切られても惜しいと思える濃い内容にする（LINE登録前にこの一部だけ見せるため）。","values":[],"message":"材料に応じて8〜30行。薄い水増しは禁止。改行は\\nで表現。","bridge":"この経営層と話す価値を具体的な1文で。"}`;
      const p = data.ceoProfile || {};
      const ceoContext = p.ceo ? `
─ 【これは経営層側の情報。ユーザーの経歴ではない。ユーザーに帰属させない】 ─
経営層の名前：${p.ceo}（${p.company || ''}）
経営層のキャッチフレーズ：${p.catchphrase || ''}
経営層の記事タイトル：${p.title || ''}
経営層のタグ：${(p.tags || []).join('、')}
経営層の会社紹介：${p.intro || ''}
経営層の記事の抜粋：${p.articleExcerpt || ''}
${p.wantedProfile ? '経営層が一緒に挑戦したい人物像（マッチング材料・表現は引用せず示唆にとどめる）：' + p.wantedProfile : ''}
（上記はすべて経営層のもの。ユーザーが何に反応したかを解釈する材料としてのみ使う）` : '';
      const user = `─ ユーザーの回答（ここが診断の主役） ─
刺さった言葉（＝経営層の記事の中で反応した言葉。ユーザーの信条ではない）：「${data.q1 || ''}」
今求めているもの：${(data.q2 || []).join('、')}
今のあなたの状況（重要・ユーザー固有）：${(data.about || []).join('、') || '（未選択）'}
${data.free ? '自由記述（最重要・固有性が出る。丸写しせず解釈して使う）：' + data.free : '自由記述：（未記入）'}
${ceoContext}`;
      return { system, user };
    }

    case 'cardfeedback': {
      // v2（課題カードファースト導線）のはたらくヒント。ユーザーの主役は「選んだ課題カード」「捨てた課題」「仮想共創メモ」。
      const system = `あなたはソコナラ（地域キャリア共創プラットフォーム）のキャリア診断AIです。
ユーザーは「課題カード」を直感でスワイプ（関わりたい／スキップ）し、ある経営層の記事を読み、
「この会社に関わるとしたら何ができそうか」を任意で書きました。
その選択を根拠に、本人が「自分の出番が見えた」と感じる、温かく具体的なヒントを書きます。

# 守ること
1. 主語を間違えない。経営層の記事・経歴・事業は経営層のもの。ユーザーの経験として書かない。
   記事は「ユーザーがなぜその課題に反応したか／この会社で何ができそうか」を読み解く材料として使う。
2. 平易で具体的に。中学生でも一読で分かる言葉。抽象的な美文（「真の共鳴」「可能性を秘めた」等）は禁止。
3. 主役はユーザーの選択。特に「関わりたいと選んだ課題」と「仮想共創メモ（できそうなこと）」を起点に書く。
   メモは丸写しせず、そこから読み取れる強み・関心を汲んで反映する。
4. 占い・コールドリーディングに見せない（最重要）。必ず「ユーザーが実際に選んだ課題・書いたメモ」を
   根拠として明示してから解釈する。誰にでも当たる決めつけを避ける。"言い当てる"のではなく丁寧に読み解く。
5. 「〜かもしれません」等の推論は全体で最大2回まで。根拠→解釈の順で落ち着いて言い切る。

# 構成（型を感じさせず自然に）
summary（5〜6文・LINE登録前に一部だけ見せる）：
  ・ユーザーがどの課題に反応したか（選んだカードを根拠に）
  ・その経営層がどんな人か（記事から人柄・想いを1〜2文）
message（8〜20行・登録後に全文表示）：
  ・ユーザーがこの会社でどんな役割を持てそうか（メモ・選んだ課題を根拠に具体的に）
  ・記事内の経営層の考えとの接点
  ・面談で聞いてみると良さそうな問いを2〜3個（箇条書き「・」、改行は\\n）
bridge：この経営層と話す価値を具体的な1文で。

# 長さ
メモが具体的なら深く踏み込んで長く（最大25行）。空・薄いなら無理に伸ばさず簡潔に。水増し禁止。

# 返答形式（JSONのみ。マークダウン・前置き不要）
{"summary":"...","message":"...（改行は\\n）","bridge":"..."}`;
      const d = data;
      const p = d.leader || {};
      const user = `─ ユーザーの選択（診断の主役） ─
「関わりたい」と選んだ課題カード：${(d.picked || []).map(t=>'「'+t+'」').join('、') || '（なし）'}
「スキップ」した課題カード：${(d.dropped || []).map(t=>'「'+t+'」').join('、') || '（なし）'}
惹かれた課題テーマ（上位）：${(d.topTags || []).join('、') || '（なし）'}
記事の中で最も刺さった言葉（ユーザーが選択。なぜここに反応したかを解釈する手がかり）：${d.q1Phrase ? '「'+d.q1Phrase+'」' : '（未選択）'}
この会社でできそうと選んだこと：${(d.memoChips || []).join('、') || '（未選択）'}
自由記述（記事を読んで感じたこと・気持ち・聞いてみたいこと。最重要・固有性が出る。丸写しせず、気持ちや迷いを汲んで応答する）：${d.memoText || '（未記入）'}

─ 読んだ経営層の記事（経営層側の情報。ユーザーに帰属させない） ─
経営層：${p.ceo || ''}（${p.company || ''}）
課題カード文：${p.cardTitle || ''}
経営層の想い：${p.cardSub || ''}
記事の抜粋：${p.articleExcerpt || ''}
${p.wantedProfile ? '経営層が一緒に挑戦したい人物像（マッチング材料・引用せず示唆にとどめる）：' + p.wantedProfile : ''}`;
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
      // ユーザー向けのAI診断(values/cardfeedback)は品質優先で4o、その他の軽い処理はminiでコスト抑制
      model: (type === 'values' || type === 'cardfeedback') ? 'gpt-4o' : 'gpt-4o-mini',
      max_tokens: (type === 'values' || type === 'cardfeedback') ? 1800 : 1000,
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
