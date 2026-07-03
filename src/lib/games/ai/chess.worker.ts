// Web Worker for chess search — keeps Master-level negamax off the main thread
// (audit: depth-3 midgame positions could freeze mobile for seconds).
import { chessBestMove, type ChessBoard } from "./chess";
import type { AiLevel } from "./types";

type Req = { id: number; board: ChessBoard; white: boolean; level: AiLevel };

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, board, white, level } = e.data;
  const move = chessBestMove(board, white, level);
  (self as unknown as Worker).postMessage({ id, move });
};
