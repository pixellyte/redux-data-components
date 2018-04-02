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

function dataComponentReflector(options = {}) {
    let reflection, rehydrate;
    const config = normalizePath({ ...DEFAULT_OPTIONS, ...options });
    return (state = {}, action) => {
        switch(action.type) {
            case ActionType.DATA_COMPONENT_REFLECTOR_REHYDRATED:
                action.rehydrate(state);
                return state;
            case ActionType.DATA_COMPONENT_PROBE:
                reflection = action.methods.reflection;
                rehydrate = action.methods.rehydrate;
                return reflection(options);
            case 'persist/REHYDRATE':
                let newState = state;
                if(!config.auto && action.key === config.key) {
                    newState = getIn(action.payload, config.path);
                }
                if(rehydrate) rehydrate();
                return newState;
            default:
                return reflection ? reflection(options) : state;
        }
    }
}

export default dataComponentReflector;