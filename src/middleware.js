import DataComponent from "./DataComponent";
import * as ActionType from './constants/actionTypes'

function isDataComponent(item) {
    return (item instanceof DataComponent);
}

function mapKey(componentPath) {
    return componentPath.join('/');
}

function scanDataComponents(state, dispatch, path = [], f = _ => _) {
    let result = {};
    const dataKeys = isDataComponent(state) ? Object.keys(state.classReducers()) : Object.keys(state);
    dataKeys.forEach((key) => {
        const componentPath = [...path, key];
        if (state[key] instanceof DataComponent) {
            state[key].props = {dispatch, path: componentPath};
            f(state[key], componentPath);
            result[mapKey(componentPath)] = state[key];
        }
        if (state[key] instanceof Object) {
            result = {...result, ...scanDataComponents(state[key], dispatch, componentPath, f) };
        }
    });
    return result;
}

function callEventChain(thisArg, object, method, ...args) {
    if (typeof object.__proto__[method] !== 'undefined') {
        callEventChain(thisArg, object.__proto__, method, ...args);
        if(object.__proto__[method] !== object.__proto__.__proto__[method]) {
            object.__proto__[method].bind(thisArg)(...args);
        }
    }
}

export default store => {
    const {dispatch, getState} = store;
    let dataTree = scanDataComponents(getState(), dispatch, [], (obj) => {
        Promise.resolve().then(callEventChain(obj, obj, 'componentDidMount'));
    });
    return next => action => {
        const nextAction = next(action);
        dataTree = scanDataComponents(getState(), dispatch, [], (obj, path) => {
            const oldInstance = dataTree[mapKey(path)];
            if (oldInstance !== obj) {
                let updateReason = 'UPDATE';
                if (action.type === 'persist/REHYDRATE') {
                    updateReason = 'REHYDRATE';
                    callEventChain(oldInstance, oldInstance, 'componentWillRehydrate');
                } else if (action.type === ActionType.DATA_COMPONENT_RESET) {
                    updateReason = 'RESET';
                    callEventChain(oldInstance, oldInstance, 'componentWillReset');
                }
                callEventChain(oldInstance, oldInstance, 'componentWillUpdate', obj, updateReason);
                Promise.resolve()
                    .then(() => {
                        if (action.type === 'persist/REHYDRATE') {
                            callEventChain(obj, obj, 'componentDidRehydrate');
                        } else if (action.type === ActionType.DATA_COMPONENT_RESET) {
                            callEventChain(obj, obj, 'componentDidReset');
                        }
                        callEventChain(obj, obj, 'componentDidUpdate', oldInstance, updateReason);
                    });
            }
        });
        return nextAction
    }
}