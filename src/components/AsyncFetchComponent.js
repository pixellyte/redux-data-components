import DataComponent from './DataComponent'
import * as ActionType from '../constants/actionTypes'
import * as State from '../constants/dataState'
import { Reducer, Action } from '../decorators/index'

export default class AsyncFetchComponent extends DataComponent {

    doDataLoad() {
        const loader = new Promise((resolve) => {
            this.props.dispatch({
                type: ActionType.DATA_COMPONENT_LOADING,
                component: this.componentIdentifier()
            });
            const data = this.fetch(...this.args);
            if(data instanceof Promise) {
                return resolve(data.then(result => result));
            } else {
                return resolve(data);
            }
        });

        loader.then(data => {
            if (data instanceof Response) {
                data = data.json();
            }
            this.props.dispatch({
                type: ActionType.DATA_COMPONENT_RESPONSE,
                component: this.componentIdentifier(),
                data: this.componentReceivedData(data)
            });
        }).catch(error => {
            this.props.dispatch({
                type: ActionType.DATA_COMPONENT_ERROR,
                component: this.componentIdentifier(),
                error
            });
        });
    }

    componentWillUpdate(next) {
        if (next.state === State.LOADING) {
            this.doDataLoad = _ => _;
        }
    }

    componentDidUpdate(previous) {
        const stateTransition = `${previous.state} => ${this.state}`;
        switch(stateTransition) {
            case 'ERROR => REQUESTED':
            case 'STALE => REQUESTED':
                this.doDataLoad();
                break;
            default:
                break;
        }
    }

    // Method called to perform any processing necessary on fetched data.
    // Result is dispatched in the DATA_COMPONENT_RESPONSE action.
    componentReceivedData(data) {
        return data;
    }

    fetch() {
        console.warn('No fetch method implemented for data class', this.componentIdentifier());
        return this.defaultState();
    }

    reduceData(previousData = this.defaultState(), action) {
        switch(action.type) {
            case ActionType.DATA_COMPONENT_RESPONSE:
                return this.isTargetFor(action) ? action.data : previousData;
            case ActionType.DATA_COMPONENT_INVALIDATE:
                return (this.isTargetFor(action) && action.reset) ? this.defaultState() : previousData;
            default:
                return super.reduceData(previousData, action);
        }
    }

    @Reducer('state')
    reduceDataState(previousState = State.STALE, action) {
        const isStale = (previousState === State.STALE || previousState === State.ERROR);
        switch(action.type) {
            case ActionType.DATA_COMPONENT_REQUEST:
                return (this.isTargetFor(action) && isStale) ? State.REQUESTED : previousState;
            case ActionType.DATA_COMPONENT_LOADING:
                return this.isTargetFor(action) ? State.LOADING : previousState;
            case ActionType.DATA_COMPONENT_RESPONSE:
                return this.isTargetFor(action) ? State.FRESH : previousState;
            case ActionType.DATA_COMPONENT_INVALIDATE:
                return this.isTargetFor(action) ? State.STALE : previousState;
            case ActionType.DATA_COMPONENT_ERROR:
                return this.isTargetFor(action) ? State.ERROR : previousState;
            case 'persist/REHYDRATE':
                return this.rehydrateItem(action.payload, 'state') || previousState;
            default:
                return previousState;
        }
    }

    @Reducer('error')
    reduceDataError(previousError = null, action) {
        switch(action.type) {
            case ActionType.DATA_COMPONENT_ERROR:
                return this.isTargetFor(action) ? action.error : previousError;
            case ActionType.DATA_COMPONENT_INVALIDATE:
                return (this.isTargetFor(action) && action.reset) ? null : previousError;
            case ActionType.DATA_COMPONENT_LOADING:
            case ActionType.DATA_COMPONENT_RESPONSE:
                return this.isTargetFor(action) ? null : previousError;
            case 'persist/REHYDRATE':
                return this.rehydrateItem(action.payload, 'error') || previousError;
            default:
                return previousError;
        }
    }

    @Reducer('args')
    reduceFetchArgs(previousArgs = [], action) {
        switch(action.type) {
            case ActionType.DATA_COMPONENT_REQUEST:
                return this.isTargetFor(action) ? action.args : previousArgs;
            default:
                return previousArgs;
        }
    }

    // One or more components can call request to indicate a need
    // for fresh data.  Only one fetch will happen no matter how many
    // components request the data, so it is possible but not necessary
    // to check the value of .state before requesting.
    @Action
    request(...args) {
        this.props.dispatch({
            type: ActionType.DATA_COMPONENT_REQUEST,
            component: this.componentIdentifier(),
            args
        });
    }

    // Reset the state of the data to STALE.  This does not automatically
    // perform a fetch for fresh data until some other component
    // performs a request.  The optional reset flag controls whether the
    // current data is cleared.  If true, the data is reset to the value
    // of this.defaultState().
    @Action
    invalidate(reset = false) {
        this.props.dispatch({
            type: ActionType.DATA_COMPONENT_INVALIDATE,
            component: this.componentIdentifier(),
            reset
        });
    }

    // Trigger an immediate reload of the data irrespective of the
    // current state.  As with .request(), any number of calls to
    // .forceReload (within the current render cycle) will trigger
    // only a single load.
    @Action
    forceReload(...args) {
        this.props.dispatch({
            type: ActionType.DATA_COMPONENT_INVALIDATE,
            component: this.componentIdentifier()
        });
        this.props.dispatch({
            type: ActionType.DATA_COMPONENT_REQUEST,
            component: this.componentIdentifier(),
            args
        });
    }

}