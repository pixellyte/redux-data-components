import callEventChain from "../util/callEventChain";
import * as ActionType from "../constants/actionTypes";

const UPDATE_TYPES = {
    'persist/REHYDRATE': 'REHYDRATE',
    [ActionType.DATA_COMPONENT_RESET]: 'RESET',
    [ActionType.DATA_COMPONENT_REHYDRATE]: 'REHYDRATE'
};

function runLifecycleMethods(original, updated, updateType) {
    return Promise.resolve().then(() => {
        if(typeof original !== 'undefined') {
            callEventChain(original, original, 'componentWillUpdate', updated, updateType);
            if (updateType === 'REHYDRATE') callEventChain(original, original, 'componentWillRehydrate');
            if (updateType === 'RESET') callEventChain(original, original, 'componentWillReset');
        }
    }).then(() => {
        if (typeof original !== 'undefined') {
            callEventChain(updated, updated, 'componentDidUpdate', original, updateType);
            if (updateType === 'REHYDRATE') callEventChain(updated, updated, 'componentDidRehydrate');
            if (updateType === 'RESET') callEventChain(updated, updated, 'componentDidReset');
        }
    });
}

export default function lifecycleMiddleware(store) {
    return next => action => {
        const originalState = store.getState();
        const original = originalState.state || {}
        const nextAction = next(action);
        const updatedState = store.getState();
        const updated = updatedState.state || {};
        const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(updated)]));
        let updates = [];
        for (let i in allKeys) {
            const name = allKeys[i];
            const o = original[name];
            const u = updated[name];
            if (o !== u) {
                updates[name] = updated[name].lastReducedDataState;
                runLifecycleMethods(o, u, UPDATE_TYPES[action.type] || 'UPDATED')
            }
        }
        return nextAction;
    }
}

