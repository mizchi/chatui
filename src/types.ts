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

