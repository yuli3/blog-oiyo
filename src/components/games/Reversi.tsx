import React, { useState, useEffect, useCallback } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';

const SIZE = 8;

const Reversi: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
    const t = {
        ko: { title: "오델로 (Othello)", turn: "차례", black: "흑", white: "백", win: "승리!", over: "게임 종료", reset: "새 게임", score: "점수" },
        en: { title: "Othello", turn: "Turn", black: "Black", white: "White", win: "Wins!", over: "Game Over", reset: "New Game", score: "Score" }
    }[locale === 'ko' ? 'ko' : 'en'];

    const [board, setBoard] = useState<(number | null)[]>(Array(SIZE * SIZE).fill(null));
    const [isBlackTurn, setIsBlackTurn] = useState(true);
    const [winner, setWinner] = useState<number | null>(null);

    const initGame = useCallback(() => {
        const newBoard = Array(SIZE * SIZE).fill(null);
        newBoard[27] = 2; newBoard[28] = 1;
        newBoard[35] = 1; newBoard[36] = 2;
        setBoard(newBoard);
        setIsBlackTurn(true);
        setWinner(null);
    }, []);

    useEffect(() => { initGame(); }, [initGame]);

    const getValidMoves = (currentBoard: (number | null)[], player: number) => {
        const moves: number[] = [];
        const opponent = player === 1 ? 2 : 1;

        for (let i = 0; i < SIZE * SIZE; i++) {
            if (currentBoard[i] !== null) continue;
            if (canFlip(currentBoard, i, player, opponent).length > 0) moves.push(i);
        }
        return moves;
    };

    const canFlip = (currentBoard: (number | null)[], index: number, player: number, opponent: number) => {
        const x = index % SIZE;
        const y = Math.floor(index / SIZE);
        const piecesToFlip: number[] = [];

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dx, dy] of directions) {
            let temp: number[] = [];
            let nx = x + dx, ny = y + dy;

            while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
                const nIndex = ny * SIZE + nx;
                if (currentBoard[nIndex] === opponent) {
                    temp.push(nIndex);
                } else if (currentBoard[nIndex] === player) {
                    piecesToFlip.push(...temp);
                    break;
                } else break;
                nx += dx; ny += dy;
            }
        }
        return piecesToFlip;
    };

    const handleClick = (index: number) => {
        if (winner !== null) return;
        const player = isBlackTurn ? 1 : 2;
        const opponent = player === 1 ? 2 : 1;
        const flips = canFlip(board, index, player, opponent);

        if (flips.length === 0) return;

        const newBoard = [...board];
        newBoard[index] = player;
        flips.forEach(i => newBoard[i] = player);
        setBoard(newBoard);

        // Check next player's moves
        const nextMoves = getValidMoves(newBoard, opponent);
        if (nextMoves.length > 0) {
            setIsBlackTurn(!isBlackTurn);
        } else {
            // If opponent cannot move, current player moves again
            const currentAgain = getValidMoves(newBoard, player);
            if (currentAgain.length === 0) {
                // Game Over
                const bCount = newBoard.filter(v => v === 1).length;
                const wCount = newBoard.filter(v => v === 2).length;
                setWinner(bCount > wCount ? 1 : wCount > bCount ? 2 : 0);
            }
        }
    };

    const bCount = board.filter(v => v === 1).length;
    const wCount = board.filter(v => v === 2).length;
    const validMoves = getValidMoves(board, isBlackTurn ? 1 : 2);

    return (
        <GameContainer title={t.title} subtitle="Reversal Strategy" onReset={initGame}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <div className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${isBlackTurn ? 'bg-primary/10 border-primary' : 'bg-muted border-transparent opacity-50'}`}>
                        <div className="w-4 h-4 rounded-full bg-slate-900" />
                        <span className="text-xs font-black">{t.black}: {bCount}</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${!isBlackTurn ? 'bg-primary/10 border-primary' : 'bg-muted border-transparent opacity-50'}`}>
                        <div className="w-4 h-4 rounded-full bg-white border border-slate-300" />
                        <span className="text-xs font-black">{t.white}: {wCount}</span>
                    </div>
                </div>
            </div>

            <div className="relative aspect-square w-full bg-chart-1/30 rounded-2xl p-2 grid grid-cols-8 grid-rows-8 gap-1 border border-chart-1/50 shadow-inner">
                {board.map((cell, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        className={`relative rounded-md flex items-center justify-center transition-all ${
                            validMoves.includes(i) ? 'bg-primary/5 hover:bg-primary/10 cursor-pointer' : 'bg-chart-1/20'
                        }`}
                    >
                        {validMoves.includes(i) && <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />}
                        {cell !== null && (
                            <div className={`w-[85%] h-[85%] rounded-full shadow-lg transform transition-all animate-in zoom-in-75 duration-300 ${
                                cell === 1 ? 'bg-slate-900 border-b-4 border-slate-700' : 'bg-white border-b-4 border-slate-200'
                            }`} />
                        )}
                    </button>
                ))}

                {winner !== null && (
                    <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                        <div className="bg-card p-10 rounded-3xl shadow-xl border-4 border-primary/20 text-center">
                            <h4 className="text-4xl font-black text-foreground mb-2">
                                {winner === 0 ? "Draw!" : winner === 1 ? t.black : t.white} {winner === 0 ? "" : t.win}
                            </h4>
                            <p className="text-muted-foreground mb-8 font-bold uppercase tracking-widest">{t.over}</p>
                            <button onClick={initGame} className="px-12 py-4 bg-primary text-primary-foreground rounded-full font-black shadow-lg hover:scale-105 transition-transform">
                                {t.reset}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </GameContainer>
    );
};

export default Reversi;
