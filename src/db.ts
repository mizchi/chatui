// db.js
import Dexie, { Table } from 'dexie';

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
export class MySubClassedDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  dialog!: Table<Dialog>;
  constructor() {
    super('mydb');
    this.version(3).stores({
      dialog: '&id, createdAt, updatedAt' // Primary key and indexed props
    });
  }
}

export async function updateMessages(ctxId: string, messages: Dialog['messages']) {
  await db.dialog.update(ctxId, {
    updatedAt: Date.now(),
    messages: messages,
  });
}

export async function createNewDialog(ctxId?: string) {
  const id = ctxId || Math.random().toString(36).slice(2);
  const _ = db.dialog.add({
    id: id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    messages: [],
  }, id);
  return await db.dialog.get(id)!;
}


export const db = new MySubClassedDexie();