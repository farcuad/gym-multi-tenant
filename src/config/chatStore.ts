import { getModel } from "./geminis.js";

const chatStore = new Map<number, any>();

// chatStore.ts
const chats = new Map<string, any>();

export const getChatForUser = (userId: string, model: any) => {
  if (!chats.has(userId)) {
    chats.set(
      userId,
      model.startChat({
        history: [],
      })
    );
  }

  return chats.get(userId);
};

export const clearChatUser = (userId: string) => {
    chats.delete(userId);
}
