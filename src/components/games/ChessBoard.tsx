import React, { useState } from 'react';

const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const ChessBoard: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
    const t = {
        ko: { title: "전략의 정수: 체스", turn: "차례", white: "백", black: "흑", reset: "초기화", pawn: "졸", knight: "마", bishop: "상", rook: "차", queen: "퀸", king: "킹" },
        en: { title: "Chess Strategy", turn: "Turn", white: "White", black: "Black", reset: "Reset", pawn: "Pawn", knight: "Knight", bishop: "Bishop", rook: "Rook", queen: "Queen", king: "King" }
    }[locale === 'ko' ? 'ko' : 'en'];

    const [board, setBoard] = useState(INITIAL_BOARD);
    const [selected, setSelected] = useState<[number, number] | null>(null);
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);

    const pieceIcons: Record<string, string> = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    };

    const handleSquareClick = (r: number, c: number) => {
        const piece = board[r][c];
        
        if (selected) {
            const [sr, sc] = selected;
            if (sr === r && sc === c) {
                setSelected(null);
                return;
            }
            
            // Basic Move Logic (No complex validation for MVP, just move)
            const newBoard = board.map(row => [...row]);
            newBoard[r][c] = newBoard[sr][sc];
            newBoard[sr][sc] = null;
            setBoard(newBoard);
            setSelected(null);
            setIsWhiteTurn(!isWhiteTurn);
        } else if (piece) {
            const isWhite = piece === piece.toUpperCase();
            if (isWhite === isWhiteTurn) {
                setSelected([r, c]);
            }
        }
    };

    return (
        <div className="not-prose my-12 p-8 bg-card border border-border rounded-4xl shadow-sm max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black text-foreground">{t.title}</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
                        {isWhiteTurn ? t.white : t.black} {t.turn}
                    </p>
                </div>
                <button onClick={() => setBoard(INITIAL_BOARD)} className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-bold border border-border">
                    {t.reset}
                </button>
            </div>

            <div className="grid grid-cols-8 grid-rows-8 border-4 border-stone-800 shadow-2xl aspect-square w-full">
                {board.map((row, r) => row.map((piece, c) => {
                    const isDark = (r + c) % 2 === 1;
                    const isSelected = selected && selected[0] === r && selected[1] === c;
                    return (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => handleSquareClick(r, c)}
                            className={`flex items-center justify-center text-3xl sm:text-4xl cursor-pointer transition-colors ${
                                isDark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]'
                            } ${isSelected ? 'ring-4 ring-primary inset-0 z-10' : ''}`}
                        >
                            <span className={`select-none transform ${piece && piece === piece.toLowerCase() ? 'text-black' : 'text-white drop-shadow-sm'}`}>
                                {piece ? pieceIcons[piece] : ''}
                            </span>
                        </div>
                    );
                }))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2">
                {Object.entries(pieceIcons).slice(0, 6).map(([key, icon]) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded-xl">
                        <span className="text-xl">{icon}</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">{t[Object.keys(pieceIcons).find(k=>pieceIcons[k]===icon) as keyof typeof t] || key}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChessBoard;
