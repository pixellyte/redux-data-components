import {DataComponent, connect} from 'redux-data-components';
import * as ActionType from '../constants/actionTypes';

class GameClock extends DataComponent {
    componentWillUpdate(nextProps, reason) {
        if (this.interval !== null && nextProps.interval === null) {
            clearInterval(this.interval);
        }
    }

    componentDidRehydrate() {
        this.stop();
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
        switch (action.type) {
            case ActionType.CLOCK_TICK:
                return state + 1;
            default:
                return super.reduceData(state, action);
        }
    }

    reduceInterval(state = null, action) {
        switch (action.type) {
            case ActionType.CLOCK_START:
                if (state === null) {
                    return setInterval(action.tick, 1000);
                } else {
                    return state;
                }
            case ActionType.CLOCK_STOP:
                return null;
            default:
                return state;
        }
    }

    start() {
        this.props.dispatch({
            type: ActionType.CLOCK_START,
            tick: () => {
                this.props.dispatch({ type: ActionType.CLOCK_TICK })
            }
        });
    }

    stop() {
        this.props.dispatch({type: ActionType.CLOCK_STOP});
    }
}

export default connect("GameClock", GameClock);