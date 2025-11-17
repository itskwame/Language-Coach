
export type Speaker = 'user' | 'coach' | 'system';

export interface Message {
  speaker: Speaker;
  text: string;
}

export interface Settings {
  targetLanguage: string;
  nativeLanguage: string;
  ageGroup: string;
}

export enum SessionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
}
