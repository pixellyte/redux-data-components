import { DataComponent, connect } from 'redux-data-components';
import * as ActionType from '../constants/actionTypes';
import * as CellState from '../constants/cellFlags';
import GameMode from "./GameMode";
import GameClock from "./GameClock";

class GameBoard extends DataComponent {
    componentDidUpdate(prev, reason) {
        if(reason !== 'REHYDRATE') {
            if (prev.mode !== this.mode) {
                // Must reset the game when changing mode.
                this.newGame();
            } else if (this.isGameOver()) {
                this.clock.stop();
            } else {
                // Detect a revealed cell.  If there are no adjacent mines, reveal the adjacent cells as well.
                const revealedCells = this.revealedCells().filter(cell => !prev.isRevealed(cell));
                if(revealedCells.length > 0) {
                    this.clock.start();
                    const cell = revealedCells[0];
                    if(!this.isExploded(cell) && this.adjacentMineCount(cell) === 0) {
                        this.adjacentCells(cell).filter(i => !this.isRevealed(i)).forEach(i => this.reveal(i));
                    }
                }
            }
        }
    }

    classReducers() {
        return {
            ...super.classReducers(),
            mode: GameMode,
            clock: GameClock
        }
    }

    defaultState() {
        return [];
    }

    static newBoard(cx, cy, mines) {
        const board = Array(cx*cy).fill(0);
        while(true) {
            const coord = Math.floor(cx * cy * Math.random());
            if(board[coord] === 0) {
                board[coord] = CellState.MINE;
                mines--;
            }
            if(mines === 0) break;
        }
        return board;
    }

    // TRANSFORMATION HELPERS
    // Used by reduceData to generate the next board state.
    static revealCell(board, id) {
        const newBoard = [...board];
        newBoard[id] = newBoard[id] | CellState.REVEALED;
        return newBoard;
    }

    static unmarkCell(board, id) {
        const newBoard = [...board];
        if((newBoard[id] & ~CellState.MINE) !== CellState.REVEALED) {
            newBoard[id] = (newBoard[id] & CellState.MINE);
        }
        return newBoard;
    }

    static markCell(board, id) {
        const newBoard = [...board];
        if((newBoard[id] & ~CellState.MINE) !== CellState.REVEALED) {
            newBoard[id] = (newBoard[id] & CellState.MINE) | CellState.MARKED;
        }
        return newBoard;
    }

    static questionCell(board, id) {
        const newBoard = [...board];
        if((newBoard[id] & ~CellState.MINE) !== CellState.REVEALED) {
            newBoard[id] = (newBoard[id] & CellState.MINE) | CellState.QUESTIONED;
        }
        return newBoard;
    }

    reduceData(state, action) {
        switch(action.type) {
            case ActionType.NEW_GAME:
                return GameBoard.newBoard(action.cx, action.cy, action.mines);
            case ActionType.REVEAL_CELL:
                return GameBoard.revealCell(state, action.cell);
            case ActionType.MARK_CELL:
                return GameBoard.markCell(state, action.cell);
            case ActionType.UNMARK_CELL:
                return GameBoard.unmarkCell(state, action.cell);
            case ActionType.QUESTION_CELL:
                return GameBoard.questionCell(state, action.cell);
            default:
                return super.reduceData(state, action);
        }
    }

    isMine(cell) {
        return (this.data[cell] & CellState.MINE) === CellState.MINE;
    }

    isExploded(cell) {
        return this.data[cell] === CellState.EXPLODED;
    }

    isRevealed(cell) {
        return (this.data[cell] & CellState.REVEALED) === CellState.REVEALED;
    }

    isMarked(cell) {
        return (this.data[cell] & CellState.REVEALED) === CellState.MARKED;
    }

    isQuestioned(cell) {
        return (this.data[cell] & CellState.REVEALED) === CellState.QUESTIONED;
    }

    isGameOver() {
        return this.isGameWon() || this.isGameLost();
    }

    isGameLost() {
        return this.data.filter(cell => cell === CellState.EXPLODED).length > 0;
    }

    isGameWon() {
        return (this.data.filter(cell => (cell & CellState.REVEALED) === CellState.REVEALED).length
        + this.data.filter(cell => (cell & CellState.MINE) === CellState.MINE).length
        === this.data.length);
    }

    revealedCells() {
        const revealed = [];
        for(let i = 0; i < this.data.length; i++) {
            if (this.isRevealed(i)) revealed.push(i);
        }
        return revealed;
    }

    adjacentCells(cell) {
        const width = this.mode.boardWidth();
        const adjacentCells = [];
        const prev = cell - width;
        const next = cell + width;
        if(prev >= 0) {
            adjacentCells.push(prev);
            if(prev % width > 0) adjacentCells.push(prev - 1);
            if(prev % width < (width-1)) adjacentCells.push(prev + 1);
        }
        if(next < this.data.length) {
            adjacentCells.push(next);
            if(next % width > 0) adjacentCells.push(next - 1);
            if(next % width < (width-1)) adjacentCells.push(next + 1);
        }
        if(cell % width > 0) adjacentCells.push(cell - 1);
        if(cell % width < (width-1)) adjacentCells.push(cell + 1);
        return adjacentCells;
    }

    adjacentMineCount(cell) {
        return this.adjacentCells(cell).filter(i => this.isMine(i)).length;
    }

    minesRemaining() {
        return this.mode.mineCount() - this.data.filter(cell => (cell & CellState.REVEALED) === CellState.MARKED).length;
    }

    /// ACTIONS
    cellAction(cell, type) { if(!this.isGameOver()) this.props.dispatch({type, cell}); }
    reveal(cell) { this.cellAction(cell, ActionType.REVEAL_CELL); }
    unmark(cell) { this.cellAction(cell, ActionType.UNMARK_CELL); }
    mark(cell) { this.cellAction(cell, ActionType.MARK_CELL); }
    question(cell) { this.cellAction(cell, ActionType.QUESTION_CELL); }


    newGame() {
        const { dispatch } = this.props;
        this.clock.reset();
        dispatch({
            type: ActionType.NEW_GAME,
            cx: this.mode.boardWidth(),
            cy: this.mode.boardHeight(),
            mines: this.mode.mineCount()
        });
    }

    toggleMark(cell) {
        if(!this.isGameOver()) {
            if(this.isMarked(cell)) this.question(cell);
            else if(this.isQuestioned(cell)) this.unmark(cell);
            else this.mark(cell);
        }
    }
}

export default connect(GameBoard);