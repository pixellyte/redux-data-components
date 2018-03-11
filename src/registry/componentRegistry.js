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
    [REFLECT_PROP]: {},
    combinedReducers: (..._) => null
}

function compileDataReflection(state) {
    return Object.keys(state).reduce((data, key) => {
        data[key] = state[key].lastReducedDataState;
        return data;
    }, {});
}

export default function componentRegistryReducer(state = DEFAULT_COMPONENT_REGISTRY_STATE, action) {
    let newState;
    switch(action.type) {
        case ActionType.DATA_COMPONENT_REGISTER:
            const { id, componentClass, classOptions, store } = action;
            const instanceReducer = makeInstanceReducer(componentClass, classOptions, store.dispatch);
            const reducers = {
                ...state.reducers,
                [id]: instanceReducer
            }
            return {
                state: {
                    ...state.state,
                    [id]: instanceReducer(undefined, {})
                },
                reducers,
                combinedReducers: combineReducers(reducers)
            }
        case ActionType.DATA_COMPONENT_UPDATE:
            // This should be a really uncommon case, but there is one instance during initialization
            // where we really need to push a full updated value into the registry without going through
            // the local reducer.
            newState = { ...state.state, [action.id]: action.component }
            return {
                ...state,
                state: newState,
                [REFLECT_PROP]: compileDataReflection(newState)
            }
        default:
            if(Object.keys(state.reducers).length === 0) return state;
            newState = state.combinedReducers(state.state, action);
            return {
                ...state,
                state: newState,
                [REFLECT_PROP]: compileDataReflection(newState)
            }
    }
}

