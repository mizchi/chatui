import { ChatMessage } from "./api";

export const OPENAI_API_KEY = "OPENAI_API_KEY";
export const ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY";

export async function saveHistory(newHistory: ChatMessage[]) {
  localStorage.setItem('history', JSON.stringify(newHistory));
}

export async function loadHistory() {
  const history = localStorage.getItem('history');
  if (!history) {
    return [];
  }
  return JSON.parse(history) as ChatMessage[];
}

export async function loadOrPromptOpenAIApiKey(key: string) {
  const apiKey = localStorage.getItem(key);
  if (apiKey) {
    return apiKey;
  }
  const newApiKey = prompt(`Enter ${key}`);
  if (newApiKey) {
    localStorage.setItem(key, newApiKey);
    return newApiKey;
  }
  return undefined;
}

