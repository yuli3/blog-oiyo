import React, { useState, useEffect, useCallback } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';

const SIZE = 8;

type Piece = { player: number; isKing: boolean };

const Checkers: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
    const t = {
        ko: { title: "체커 (Checkers)", turn: "차례", red: "홍(Red)", black: "흑(Black)", win: "승리!", over: "게임 종료", reset: "판 갈기" },
        en: { title: "Checkers", turn: "Turn", red: "Red", black: "Black", win: "Wins!", over: "Game Over", reset: "New Match" }
    }[locale === 'ko' ? 'ko' : 'en'];

    const [board, setBoard] = useState<(Piece | null)[]>(Array(SIZE * SIZE).fill(null));
    const [isRedTurn, setIsRedTurn] = useState(true);
    const [selected, setSelected] = useState<number | null>(null);
    const [winner, setWinner] = useState<number | null>(null);

    const initGame = useCallback(() => {
        const newBoard = Array(SIZE * SIZE).fill(null);
        for (let i = 0; i < SIZE * SIZE; i++) {
            const r = Math.floor(i / SIZE);
            const c = i % SIZE;
            if ((r + c) % 2 === 1) {
                if (r < 3) newBoard[i] = { player: 2, isKing: false };
                else if (r > 4) newBoard[i] = { player: 1, isKing: false };
            }
        }
        setBoard(newBoard);
        setIsRedTurn(true);
        setSelected(null);
        setWinner(null);
    }, []);

    useEffect(() => { initGame(); }, [initGame]);

    const handleSquareClick = (index: number) => {
        if (winner !== null) return;
        const piece = board[index];

        if (selected !== null) {
            if (selected === index) { setSelected(null); return; }
            
            // Basic Movement (Simplified for Demo)
            const sr = Math.floor(selected / SIZE);
            const sc = selected % SIZE;
            const r = Math.floor(index / SIZE);
            const c = index % SIZE;
            const dr = r - sr;
            const dc = Math.abs(c - sc);

            const sPiece = board[selected]!;
            const isForward = sPiece.player === 1 ? dr === -1 : dr === 1;

            if (board[index] === null && (r + c) % 2 === 1) {
                if (isForward && dc === 1) {
                    executeMove(selected, index);
                } else if (Math.abs(dr) === 2 && dc === 2) {
                    // Jump Logic
                    const mr = sr + dr / 2;
                    const mc = sc + (c - sc) / 2;
                    const mIndex = mr * SIZE + mc;
                    const mPiece = board[mIndex];
                    if (mPiece && mPiece.player !== sPiece.player) {
                        executeMove(selected, index, mIndex);
                    }
                }
            }
        } else if (piece && piece.player === (isRedTurn ? 1 : 2)) {
            setSelected(index);
        }
    };

    const executeMove = (from: number, to: number, jumpOver?: number) => {
        const newBoard = [...board];
        newBoard[to] = newBoard[from];
        newBoard[from] = null;
        if (jumpOver !== undefined) newBoard[jumpOver] = null;

        // Promotion to King
        const r = Math.floor(to / SIZE);
        if ((newBoard[to]?.player === 1 && r === 0) || (newBoard[to]?.player === 2 && r === 7)) {
            newBoard[to] = { ...newBoard[to]!, isKing: true };
        }

        setBoard(newBoard);
        setSelected(null);
        setIsRedTurn(!isRedTurn);

        // Simple Win Condition
        const p1 = newBoard.filter(p => p?.player === 1).length;
        const p2 = newBoard.filter(p => p?.player === 2).length;
        if (p1 === 0) setWinner(2);
        else if (p2 === 0) setWinner(1);
    };

    return (
        <GameContainer title={t.title} subtitle="Strategic Maneuver" onReset={initGame}>
            <div className="flex justify-between items-center mb-6">
                <div className={`flex items-center gap-2 p-2 rounded-xl border ${isRedTurn ? 'bg-destructive/10 border-destructive' : 'bg-muted border-transparent opacity-50'}`}>
                    <div className="w-3 h-3 rounded-full bg-destructive shadow-sm" />
                    <span className="text-xs font-black uppercase tracking-widest">{t.red} {t.turn}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                    <span>{t.red}: {board.filter(p=>p?.player===1).length}</span>
                    <span>{t.black}: {board.filter(p=>p?.player===2).length}</span>
                </div>
            </div>

            <div className="grid grid-cols-8 grid-rows-8 aspect-square w-full border-4 border-stone-800 shadow-2xl overflow-hidden rounded-lg">
                {board.map((piece, i) => {
                    const r = Math.floor(i / SIZE), c = i % SIZE;
                    const isDark = (r + c) % 2 === 1;
                    const isSelected = selected === i;
                    return (
                        <div
                            key={i}
                            onClick={() => handleSquareClick(i)}
                            className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                                isDark ? 'bg-stone-700' : 'bg-stone-200'
                            }`}
                        >
                            {isSelected && <div className="absolute inset-0 bg-primary/20 ring-4 ring-primary ring-inset z-10" />}
                            {piece && (
                                <div className={`w-[80%] h-[80%] rounded-full shadow-lg border-b-4 transform transition-all animate-in zoom-in-75 ${
                                    piece.player === 1 ? 'bg-destructive border-destructive-foreground/30' : 'bg-slate-900 border-slate-700'
                                } flex items-center justify-center`}>
                                    {piece.isKing && <span className="text-white text-xs sm:text-lg">👑</span>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {winner && (
                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm rounded-4xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                    <h4 className="text-4xl font-black text-foreground mb-4">
                        {winner === 1 ? t.red : t.black} {t.win}
                    </h4>
                    <button onClick={initGame} className="px-10 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg">
                        {t.reset}
                    </button>
                </div>
            )}
        </GameContainer>
    );
};

export default Checkers;
