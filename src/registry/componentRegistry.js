import {combineReducers} from "redux";
import * as ActionType from "../constants/actionTypes";

function makeInstanceReducer(componentClass, classOptions, dispatch) {
    return (oldInstance, action) => {
        try {
            oldInstance = oldInstance || new componentClass(dispatch, classOptions);
            return oldInstance.reduce(action);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
}

const REFLECT_PROP = '__@@_reflected_component_data';

export const DEFAULT_COMPONENT_REGISTRY_STATE = {
    reducers: {},
    state: {},
    deferrals: [],
    [REFLECT_PROP]: {},
    combinedReducers: (..._) => null
}

function compileDataReflection(state) {
    return Object.keys(state).reduce((data, key) => {
        data[key] = state[key].lastReducedDataState;
        return data;
    }, {});
}

// Reconcile embedded references to other data components.  This needs to be done after other reducer updates have
// been completed.  A component that was not otherwise regenerated may depend on a component that was, and thus will
// need to be regenerated itself to correctly trigger lifecycle methods.  But any single component should only be
// regenerated at most once per reduce.  After that, update references to touched components, but do not regenerate
// them again.  This allows the state to stabilize even if there are circular dependencies.
function syncReferences(action, oldState, newState) {
    const updatedComponents = Object.keys(newState).filter(key => oldState[key] !== newState[key]);
    let anyUpdated = updatedComponents.length > 0;
    while(anyUpdated) {
        anyUpdated = false;
        for(let i in newState) {
            const regenerate = (updatedComponents.indexOf(i) < 0);
            if(newState[i].syncReferences(newState, regenerate)) {
                updatedComponents.push(i);
                anyUpdated = true;
            }
        }
    }
    return newState;
}

export default function componentRegistryReducer(state = DEFAULT_COMPONENT_REGISTRY_STATE, action) {
    let newState;
    const oldState = state.state;
    switch(action.type) {
        case ActionType.DATA_COMPONENT_REGISTER:
            const { id, componentClass, classOptions, store } = action;
            const instanceReducer = makeInstanceReducer(componentClass, classOptions, store.dispatch);
            const reducers = {
                ...state.reducers,
                [id]: instanceReducer
            }
            return {
                state: syncReferences(action, oldState, {
                    ...state.state,
                    [id]: instanceReducer(undefined, {})
                }),
                reducers,
                deferrals: state.deferrals,
                combinedReducers: combineReducers(reducers)
            }
        case ActionType.DATA_COMPONENT_UPDATE:
            // This should be a really uncommon case, but there is one instance during initialization
            // where we really need to push a full updated value into the registry without going through
            // the local reducer.
            newState = { ...state.state, [action.id]: action.component }
            return {
                ...state,
                state: syncReferences(action, oldState, newState),
                [REFLECT_PROP]: compileDataReflection(newState)
            }
        case ActionType.DATA_COMPONENT_DEFER_MOUNT:
            return {
                ...state,
                deferrals: Array.from(new Set([ ...state.deferrals, ...action.ids ]))
            }
        default:
            if(Object.keys(state.reducers).length === 0) return state;
            newState = state.combinedReducers(state.state, action);
            return {
                ...state,
                state: syncReferences(action, oldState, newState),
                [REFLECT_PROP]: compileDataReflection(newState)
            }
    }
}

