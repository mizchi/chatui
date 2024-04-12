
export type ChatMessage = {
  role: "user" | "assistant",
  content: string,
}

export type AppState = {
  draft: string,
  messages: ChatMessage[],
  locked: boolean,
  listening: boolean,
  ctxId: string | null,
  micActive: boolean,
  loading: boolean,
  openaiApiKey: string | null,
  anthropicApiKey: string | null,
  generating: boolean,
  model: string | null,
  system: string | null,
  speaker: string | null,
  // isEditorOpen: boolean,
};

export interface Dialog {
  id?: string;
  createdAt: number,
  updatedAt: number,
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  summary?: string;
}


export type VoicevoxSpeaker = {
  id: string,
  type: 'voicevox';
  displayName: string;
  speakerId: number;
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

export type System = {
  id: string,
  displayName: string,
  content: string,
};


export type Model = {
  service: 'openai' | 'anthropic',
  displayName: string,
  id: string,
}

