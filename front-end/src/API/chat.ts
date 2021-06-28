import { API_ROOT } from './root';

export async function getChatMessages() {
  const res = await fetch(`${API_ROOT}/chat/chat-messages`);
  const json = await res.json();
  return json;
}
