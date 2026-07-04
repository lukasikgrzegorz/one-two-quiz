import { PLAYER_TOKEN_KEY, SESSION_ID_KEY } from "./constants";

export function getPlayerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_TOKEN_KEY);
}

export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

export function storePlayerSession(playerToken: string, sessionId: string) {
  localStorage.setItem(PLAYER_TOKEN_KEY, playerToken);
  localStorage.setItem(SESSION_ID_KEY, sessionId);
}