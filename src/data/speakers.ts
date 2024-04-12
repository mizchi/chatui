import { Speaker } from "../types";

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
    speakerId: 3,
    speedScale: 1.5,
    pitchScale: -0.1,
  },
  {
    displayName: '四国めたん',
    id: 'metan',
    speakerId: 2,
    type: 'voicevox',
    speedScale: 1.5,
    pitchScale: 0,
  },
  {
    displayName: '春日部つむぎ',
    id: 'saitama',
    type: 'voicevox',
    speakerId: 8,
    speedScale: 1.5,
    pitchScale: 0,
  },
]