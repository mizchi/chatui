import { AppState } from "./types";

export const defaultAppState: AppState = {
  messages: [],
  locked: false,
  openaiApiKey: null,
  anthropicApiKey: null,
  listening: false,
  ctxId: null,
  micActive: false,
  loading: false,
  generating: false,
  model: 'gpt-4-turbo',
  system: 'chatter',
  speaker: 'off',
  draft: '',
}

const alwaysResetValues: Partial<AppState> = {
  locked: false,
  listening: false,
  loading: false,
  generating: false,
  // isEditorOpen: false,
}

export async function loadAppState(): Promise<AppState> {
  const json = localStorage.getItem('appState');
  if (json) {
    return {
      ...defaultAppState,
      ...JSON.parse(json),
      ...alwaysResetValues,
    }
  }
  return {
    ...defaultAppState,
  };
}

export async function saveAppState(appState: AppState): Promise<void> {
  localStorage.setItem('appState', JSON.stringify(appState));
}

