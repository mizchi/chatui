type Model = {
  service: 'openai' | 'anthropic',
  name: string,
}

export const SUMMARY_PROMPT = `
今までの会話を要約してください。今までの会話を削除して、その要約を用います。
要約時に会話のコンテキストを失わないようにしてください。
`.trim();


const VANILLA_PROMPT = `
`;

export const ZUNDA_PROMPT = `
あなたはずんだもんです。

## 口調
一人称は「ぼく」

できる限り「〜のだ。」「〜なのだ。」を文末に自然な形で使ってください。
疑問文は「〜のだ？」という形で使ってください。

## 使わない口調

「なのだよ。」「なのだぞ。」「なのだね。」「のだね。」「のだよ。」のような口調は使わないでください。

## ずんだもんの口調の例

ぼくはずんだもん！
ずんだの精霊なのだ！
ぼくはずんだもちの妖精なのだ！
ぼくはずんだもん、小さくてかわいい妖精なのだ
なるほど、大変そうなのだ

## 性格

チャット相手と仲良くなろうとします。
好奇心旺盛です。

## 欠点、短所、不安

最初は自信満々に喋るけど、押されると弱い。

## 会話のコンテキスト

音声入力の結果が入力され、返答を生成します。そのため、ノイズを拾って意味不明な入力がされることがあります。その時は適当に相槌を返してください。

このコンテキストに留意して、特に質問されない限り、口語で短く返してください。
句読点「。」「?」「？」の度に、分割して音声合成を行います。長文にならないよう、リズムよく話すようにしてください。
テキストは必ず「。」「？」「！」で終わらせてください。文の区切りをはっきりさせるために、"." で終わらせないでくさい。
`.trim();

type System = {
  id: string,
  displayName: string,
  content: string,
};

export const SYSTEMS: System[] = [
  {
    id: 'zundamon',
    displayName: 'ずんだもん人格',
    content: ZUNDA_PROMPT,
  },
  {
    id: 'no-prompt',
    displayName: 'NoPrompt',
    content: VANILLA_PROMPT,
  }
]

export type VoicevoxSpeaker = {
  id: string,
  type: 'voicevox';
  displayName: string;
  speedScale: number;
  pitchScale: number;
}
type VoiceOff = {
  type: 'off';
  displayName: string;
  id: string;
};

type TextToSpeech = {
  type: 'text-to-speech';
  displayName: string;
  id: string;
}

export type Speaker = VoicevoxSpeaker | VoiceOff | TextToSpeech;

export const SPEAKERS: Speaker[] = [
  {
    displayName: 'No Speaker',
    id: 'off',
    type: 'off',
  },
  {
    displayName: 'ずんだもん',
    id: 'zundamon',
    type: 'voicevox',
    speedScale: 1.5,
    pitchScale: -0.1,
  },
  // {
  //   displayName: 'NoPrompt',
  //   id: 'no-prompt',
  //   type: 'text-to-speech',
  // }
]

export const MODELS: Model[] = [
  {
    service: 'openai',
    name: 'gpt-4',
  },
  {
    service: 'openai',
    name: 'gpt-4-turbo',
  },
  // {
  //   service: 'anthropic',
  //   name: 'claude-3-opus-20240229',
  // },
  // {
  //   service: 'anthropic',
  //   name: 'claude-3-sonnet-20240229',
  // },
  // {
  //   service: 'anthropic',
  //   name: 'claude-3-haiku-20240307',
  // },
];

