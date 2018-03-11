import * as ActionType from "../constants/actionTypes";

function createDataComponentReflector() {
    let reflection;
    return (state = {}, action) => {
        switch(action.type) {
            case ActionType.DATA_COMPONENT_REHYDRATE:
                action.rehydrate(state);
                return state;
            case ActionType.DATA_COMPONENT_PROBE:
                reflection = action.methods.reflection;
                return reflection();
            case 'persist/REHYDRATE':
                return state;
            default:
                return reflection ? reflection() : state;
        }
    }
}

export default createDataComponentReflector();