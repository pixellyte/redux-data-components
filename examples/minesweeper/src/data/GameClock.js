import { DataComponent, connect } from 'redux-data-components';
import * as ActionType from '../constants/actionTypes';

class GameClock extends DataComponent {
    componentWillUpdate(nextProps, reason) {
        if (this.interval !== null && nextProps.interval === null) {
            clearInterval(this.interval);
        }
    }

    classReducers() {
        return {
            ...super.classReducers(),
            interval: this.reduceInterval
        }
    }

    defaultState() {
        return 0;
    }

    reduceData(state, action) {
        switch(action.type) {
            case ActionType.CLOCK_TICK:
                return state+1;
            default:
                return super.reduceData(state, action);
        }
    }

    reduceInterval(state = null, action) {
        switch(action.type) {
            case ActionType.CLOCK_START:
                return action.interval;
            case ActionType.CLOCK_STOP:
                return null;
            default:
                return state;
        }
    }

    start() {
        if (this.interval === null) {
            const interval = setInterval(() => this.props.dispatch({ type: ActionType.CLOCK_TICK }), 1000);
            this.props.dispatch({ type: ActionType.CLOCK_START, interval })
        }
    }

    stop() {
        this.props.dispatch({ type: ActionType.CLOCK_STOP });
    }
}

export default connect(GameClock);