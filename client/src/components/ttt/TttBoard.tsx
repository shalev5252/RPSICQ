import React from 'react';
import type { TttCell, TttMark } from '@rps/shared';
import './TttBoard.css';

interface TttBoardProps {
    board: TttCell[];
    winningLine: number[] | null;
    myMark: TttMark;
    currentTurn: TttMark;
    isGameOver: boolean;
    onCellClick: (index: number) => void;
}

export const TttBoard: React.FC<TttBoardProps> = ({
    board,
    winningLine,
    myMark,
    currentTurn,
    isGameOver,
    onCellClick,
}) => {
    const isMyTurn = currentTurn === myMark && !isGameOver;

    return (
        <div className={`ttt-board ${isMyTurn ? 'ttt-board--my-turn' : ''}`}>
            {board.map((cell, i) => {
                const isWinCell = winningLine?.includes(i) ?? false;
                const isEmpty = cell === null;

                return (
                    <button
                        key={i}
                        className={`ttt-cell ${cell ? `ttt-cell--${cell}` : ''} ${isWinCell ? 'ttt-cell--win' : ''} ${isEmpty && isMyTurn ? 'ttt-cell--clickable' : ''}`}
                        onClick={() => isEmpty && isMyTurn && onCellClick(i)}
                        disabled={!isEmpty || !isMyTurn}
                        aria-label={`Cell ${Math.floor(i / 3) + 1}-${(i % 3) + 1}: ${cell || 'empty'}`}
                    >
                        {cell && (
                            <span className="ttt-cell__mark ttt-cell__mark--animate">
                                {cell}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
