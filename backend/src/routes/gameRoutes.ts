import express, { Request, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../utils/auth';
import { GameManager } from '../game/GameManager';
import { Player } from '../game/models/Player';

const router = express.Router();

function generateUniqueGameId(): string {
  return 'game_' + Math.random().toString(36).substr(2, 9);
}

/**
 * @route   POST /games
 * @desc    Create a new game
 * @access  Protected
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Generate a unique game ID
    const gameId = generateUniqueGameId();

    // Create the game using GameManager
    const game = GameManager.createGame(gameId);

    // Respond with the created game ID
    return res.status(201).json({ success: true, gameId });
  } catch (error: unknown) {
    console.error('Error creating game:', error);
    if (error instanceof Error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
});

/**
 * @route   POST /games/:gameId/join
 * @desc    Join an existing game
 * @access  Protected
 */
router.post('/:gameId/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { gameId } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required to join a game.' });
    }

    // Create a new player
    const player = new Player(userId, username, 1000); // Starting chips

    // Add the player to the game using GameManager
    GameManager.addPlayerToGame(gameId, player);

    // Note:
    // Since this is a REST API endpoint, we cannot directly manage socket rooms here.
    // After successfully joining via REST, the client should connect or join the appropriate Socket.IO room.

    return res.status(200).json({ success: true, message: 'Joined the game successfully.' });
  } catch (error: unknown) {
    console.error('Error joining game:', error);
    if (error instanceof Error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
});

export default router;
