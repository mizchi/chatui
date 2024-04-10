import AnthropicAI from "@anthropic-ai/sdk";
import { OpenAI } from "openai";
import { ANTHROPIC_API_KEY, OPENAI_API_KEY, loadOrPromptOpenAIApiKey } from "./storage";

export type ChatMessage = {
  role: "user" | "assistant",
  content: string,
  generating?: boolean,
}

// TODO: Proxy
export async function runChatAnthropicAI(options: {
  system: string,
  messages: AnthropicAI.Messages.MessageParam[],
  model: string,
  onUpdate: (text: string, delta: string) => void,
}) {
  const apiKey = await loadOrPromptOpenAIApiKey(ANTHROPIC_API_KEY);
  const client = new AnthropicAI({
    apiKey,
  });

  let result = '';
  const stream = client.messages.stream({
    system: options.system,
    messages: options.messages as AnthropicAI.Messages.MessageParam[],
    model: options.model,
    max_tokens: 1024,
  }).on('text', (text) => {
    result += text;
    options.onUpdate(result, text);
  });
  // const mes = await stream.finalMessage();
  return result;
}

export async function runOpenAI(opts: {
  model: string, system: string, messages: { role: string; content: string }[],
  onUpdate: (text: string, delta: string) => void,
}) {
  const openai = new OpenAI({
    apiKey: await loadOrPromptOpenAIApiKey(OPENAI_API_KEY)!,
    dangerouslyAllowBrowser: true
  });

  const response = await openai.chat.completions.create({
    model: opts.model,
    stream: true,
    messages: [
      { role: 'system', content: opts.system },
      ...opts.messages as any,
    ],
  });

  let result = '';
  for await (const chunk of response) {
    for (const line of chunk.choices) {
      if (!line.delta.content) continue;
      result += line.delta.content;
      opts.onUpdate(result, line.delta.content);
      // console.log(result);
    }
  }
  return result;
}

export async function transcript(wavBuffer: ArrayBuffer): Promise<{ text: string }> {
  const apiKey = await loadOrPromptOpenAIApiKey(OPENAI_API_KEY);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });

  const transcriptionFormData = new FormData();
  // transcriptionFormData.set("file", resource); // 音声データをセット
  transcriptionFormData.set("model", "whisper-1"); // モデルをwhisper-1にする
  transcriptionFormData.set("language", "ja"); // 言語を日本語にする
  transcriptionFormData.set("prompt", "テスト");
  transcriptionFormData.set("file", blob);
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
    body: transcriptionFormData,
  });
  const json = await res.json();
  // console.log(json);
  return json;
}

