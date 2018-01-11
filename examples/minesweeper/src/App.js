import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as Mode from './constants/gameModes';
import './App.css';

class App extends Component {
    render() {
        const { mode } = this.props;
        return (
            <div className="App">
                <div className="board">
                    {this.renderHeader()}
                    <table><tbody>{this.renderBoard()}</tbody></table>
                    <div className="difficulty">
                        <a className={mode.data === Mode.BEGINNER ? 'selected' : 'available'}
                           onClick={() => mode.beginner()}>Beginner</a>
                        <a className={mode.data === Mode.INTERMEDIATE ? 'selected' : 'available'}
                           onClick={() => mode.intermediate()}>Intermediate</a>
                        <a className={mode.data === Mode.EXPERT ? 'selected' : 'available'}
                           onClick={() => mode.expert()}>Expert</a>
                    </div>
                </div>
            </div>
        );
    }

    renderHeader() {
        const { board } = this.props
        const time = board.clock.data > 999 ? '∞' : board.clock.data;
        return (
            <div className="header">
                <div className="remaining">{board.minesRemaining()}</div>
                <div className="control" onClick={() => board.newGame()}>{this.renderResetIcon()}</div>
                <div className="clock">{time}</div>
            </div>
        );
    }

    renderResetIcon() {
        const {board} = this.props
        if(board.isGameWon()) { return '😊'; }
        else if(board.isGameLost()) { return '😭'; }
        else { return '😐'; }
    }

    renderBoard () {
        const { mode } = this.props;
        let rowId = 0;
        const rows = [];
        for(let y = 0 ; y < mode.boardHeight(); y++) {
            const row = [];
            for(let x = 0; x < mode.boardWidth(); x++) {
                const id = (y * mode.boardWidth()) + x;
                row.push(this.renderCell(id));
            }
            rows.push(<tr key={`r${rowId++}`}>{row}</tr>)
        }
        return rows;
    }

    renderCell(cell) {
        const { board } = this.props;
        const count = board.adjacentMineCount(cell);
        let cellContent = (count > 0 ? count : '');
        let cellState = 'hidden';
        if (board.isExploded(cell)) cellState = 'exploded';
        else if (board.isRevealed(cell)) cellState = 'revealed';
        if(board.isMarked(cell)) cellContent = '🚩';
        else if(board.isQuestioned(cell)) cellContent = '❓';
        else if(board.isGameLost() && board.isMine(cell)) cellContent = '💣';
        else if(!board.isRevealed(cell)) cellContent = '';
        else if(board.isMine(cell)) cellContent = '💣';
        return (
            <td key={cell} className={`adj${count} ${cellState}`}
                onClick={() => board.reveal(cell)}
                onContextMenu={(e) => { e.preventDefault(); board.toggleMark(cell); } }>
                {cellContent}
            </td>
        )
    }
}

export default connect(store => store)(App);
