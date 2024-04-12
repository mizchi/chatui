import { Model } from "../types";

export const MODELS: Model[] = [
  {
    service: 'openai',
    displayName: 'gpt-4',
    id: 'gpt-4',
  },
  {
    service: 'openai',
    displayName: 'gpt-4-turbo',
    id: 'gpt-4-turbo',
  },
  {
    service: 'anthropic',
    displayName: 'claude-3-opus',
    id: 'claude-3-opus-20240229',
  },
  {
    service: 'anthropic',
    displayName: 'claude-3-sonnet',
    id: 'claude-3-sonnet-20240229',
  },
  {
    service: 'anthropic',
    displayName: 'claude-3-haiku',
    id: 'claude-3-haiku-20240307',
  },
];

