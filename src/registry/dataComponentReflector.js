import * as ActionType from "../constants/actionTypes";
import getIn from "../util/getIn";

const DEFAULT_OPTIONS = {
    auto: true, // redux-persist uses auto-rehydrate.
    key: 'root',  // redux-persist key for the store in which the reflector is mounted.
    path: [] // path to the reflection in the persist store.  Can be a list of path components or a slash/separated/string.
}
// optional option: 'include': a single component ID or array of component IDs that will be persisted.
// optional option: 'exclude': a single component ID or array of component IDs that will be excluded from persistence.

function normalizePath(options) {
    if(typeof options.path === 'string') {
        return { ...options, ...{ path: options.path.split('/') } };
    } else {
        return options;
    }
}

function getSelectionKeys(state, options) {
    let { include, exclude } = options;
    if (typeof include === 'undefined') include = Object.keys(state);
    else if(!Array.isArray(include)) include = [include];
    if (typeof exclude === 'undefined') exclude = [];
    else if(!Array.isArray(exclude)) exclude = [exclude];
    for(let i = 0; i < exclude.length; i++) {
        while(true) {
            const pos = include.indexOf(exclude[i]);
            if(pos < 0) break;
            delete include[pos];
        }
    }
    return include.filter(i => i);
}

function filterByKeys(state, keys) {
    return keys.reduce((r, key) => {
        r[key] = state[key];
        return r;
    }, {});
}

function dataComponentReflector(options = {}) {
    let reflection, rehydrate;
    let keys = [];
    const config = normalizePath({ ...DEFAULT_OPTIONS, ...options });
    return (state = {}, action) => {
        switch(action.type) {
            case ActionType.DATA_COMPONENT_REFLECTOR_REHYDRATED:
                action.rehydrate(state);
                return state;
            case ActionType.DATA_COMPONENT_PROBE:
                reflection = action.methods.reflection;
                rehydrate = action.methods.rehydrate;
                const result = reflection();
                keys = getSelectionKeys(result, options);
                action.methods.defer(keys);
                return filterByKeys(result, keys);
            case 'persist/REHYDRATE':
                let newState = state;
                if(!config.auto && action.key === config.key) {
                    newState = getIn(action.payload, config.path);
                }
                if(rehydrate) rehydrate();
                return newState;
            default:
                return reflection ? filterByKeys(reflection(), keys) : state;
        }
    }
}

export default dataComponentReflector;