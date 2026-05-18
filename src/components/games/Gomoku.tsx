import React, { useState } from 'react';

const SIZE = 15;

const Gomoku: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
    const t = {
        ko: { title: "오목 (Gomoku)", turn: "차례", black: "흑", white: "백", win: "승리!", over: "게임 종료", reset: "판 갈기" },
        en: { title: "Gomoku", turn: "Turn", black: "Black", white: "White", win: "Wins!", over: "Game Over", reset: "New Match" }
    }[locale === 'ko' ? 'ko' : 'en'];

    const [board, setBoard] = useState<(number | null)[]>(Array(SIZE * SIZE).fill(null));
    const [isBlackTurn, setIsBlackTurn] = useState(true);
    const [winner, setWinner] = useState<number | null>(null);

    const checkWinner = (newBoard: (number | null)[], index: number) => {
        const player = newBoard[index];
        if (player === null) return false;

        const x = index % SIZE;
        const y = Math.floor(index / SIZE);

        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (const [dx, dy] of directions) {
            let count = 1;
            // Check one side
            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i, ny = y + dy * i;
                if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && newBoard[ny * SIZE + nx] === player) count++;
                else break;
            }
            // Check other side
            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i, ny = y - dy * i;
                if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && newBoard[ny * SIZE + nx] === player) count++;
                else break;
            }
            if (count >= 5) return true;
        }
        return false;
    };

    const handleClick = (index: number) => {
        if (board[index] !== null || winner !== null) return;

        const newBoard = [...board];
        const player = isBlackTurn ? 1 : 2;
        newBoard[index] = player;
        setBoard(newBoard);

        if (checkWinner(newBoard, index)) {
            setWinner(player);
        } else {
            setIsBlackTurn(!isBlackTurn);
        }
    };

    const reset = () => {
        setBoard(Array(SIZE * SIZE).fill(null));
        setIsBlackTurn(true);
        setWinner(null);
    };

    return (
        <div className="not-prose my-12 p-4 sm:p-8 bg-card border border-border rounded-4xl shadow-sm max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black text-foreground">{t.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${isBlackTurn ? 'bg-slate-900' : 'bg-slate-200 border border-slate-400'}`} />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {isBlackTurn ? t.black : t.white} {t.turn}
                        </span>
                    </div>
                </div>
                <button onClick={reset} className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl text-xs font-bold transition-colors border border-border">
                    {t.reset}
                </button>
            </div>

            <div className="relative aspect-square w-full bg-[#f3e5ab] rounded-sm p-[2%] shadow-inner border-[6px] border-[#d4c38d]">
                {/* Board Lines */}
                <div className="absolute inset-0 grid grid-cols-14 grid-rows-14 pointer-events-none p-[calc(2%+1.3%)]">
                    {Array.from({ length: 196 }).map((_, i) => (
                        <div key={i} className="border-t border-l border-slate-900/20" />
                    ))}
                </div>

                {/* Stone Layer */}
                <div className="relative grid grid-cols-15 grid-rows-15 w-full h-full">
                    {board.map((stone, i) => (
                        <button
                            key={i}
                            onClick={() => handleClick(i)}
                            className="relative flex items-center justify-center group"
                        >
                            {/* Hover Ghost */}
                            {stone === null && winner === null && (
                                <div className={`absolute w-[80%] h-[80%] rounded-full opacity-0 group-hover:opacity-30 transition-opacity ${isBlackTurn ? 'bg-slate-900' : 'bg-white shadow-sm'}`} />
                            )}
                            {/* Real Stone */}
                            {stone !== null && (
                                <div className={`w-[85%] h-[85%] rounded-full shadow-md transform transition-transform animate-in zoom-in-75 ${
                                    stone === 1 
                                        ? 'bg-gradient-to-br from-slate-700 to-slate-900' 
                                        : 'bg-gradient-to-br from-white to-slate-200 border border-slate-300'
                                }`} />
                            )}
                        </button>
                    ))}
                </div>

                {winner && (
                    <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                        <div className="bg-card p-8 rounded-3xl shadow-xl border border-border text-center">
                            <h4 className="text-3xl font-black text-foreground mb-2">
                                {winner === 1 ? t.black : t.white} {t.win}
                            </h4>
                            <p className="text-muted-foreground mb-6 uppercase tracking-widest font-bold text-xs">{t.over}</p>
                            <button onClick={reset} className="px-10 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg">
                                {t.reset}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-center gap-6 text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-50">
                <div className="flex items-center gap-1"><span>⚫</span> {t.black}</div>
                <div className="flex items-center gap-1"><span>⚪</span> {t.white}</div>
            </div>
        </div>
    );
};

export default Gomoku;
