import { DataComponent, connect } from 'redux-data-components'
import * as ActionType from '../constants/actionTypes';
import * as Mode from '../constants/gameModes';

class GameMode extends DataComponent {
    defaultState() {
        return Mode.BEGINNER;
    }

    reduceData(state, action) {
        switch(action.type) {
            case ActionType.SET_GAME_MODE:
                return action.mode;
            default:
                return super.reduceData(state, action);
        }
    }

    beginner() {
        this.props.dispatch({
            type: ActionType.SET_GAME_MODE,
            mode: Mode.BEGINNER
        });
    }

    intermediate() {
        this.props.dispatch({
            type: ActionType.SET_GAME_MODE,
            mode: Mode.INTERMEDIATE
        });
    }

    expert() {
        this.props.dispatch({
            type: ActionType.SET_GAME_MODE,
            mode: Mode.EXPERT
        });
    }

    boardWidth() {
        switch(this.data) {
            default:
            case Mode.BEGINNER:
                return 8;
            case Mode.INTERMEDIATE:
                return 16;
            case Mode.EXPERT:
                return 30;
        }
    }

    boardHeight() {
        switch(this.data) {
            default:
            case Mode.BEGINNER:
                return 8;
            case Mode.INTERMEDIATE:
                return 16;
            case Mode.EXPERT:
                return 16;
        }
    }

    mineCount() {
        switch(this.data) {
            default:
            case Mode.BEGINNER:
                return 10;
            case Mode.INTERMEDIATE:
                return 40;
            case Mode.EXPERT:
                return 99;
        }
    }
}

export default connect(GameMode);