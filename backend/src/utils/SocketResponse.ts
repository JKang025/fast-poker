export interface SocketResponse {
  success: boolean;
  message?: string;
  gameId?: string; // Specific to certain responses
  players?: {
      playerId: string;
      username: string;
  }[]; // Add this to include the `players` field
}