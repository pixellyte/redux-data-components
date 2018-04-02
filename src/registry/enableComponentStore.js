import {applyMiddleware, createStore} from 'redux';
import * as ActionType from '../constants/actionTypes';
import getIn from '../util/getIn'
import lifecycleMiddleware from "./lifecycleMiddleware";
import componentRegistryReducer, {DEFAULT_COMPONENT_REGISTRY_STATE} from './componentRegistry';
import callEventChain from "../util/callEventChain";

function enableComponentStore(store, ...middleware) {
    const componentRegistryMiddleware = applyMiddleware(lifecycleMiddleware, ...middleware);
    const componentRegistry = createStore(
        componentRegistryReducer,
        DEFAULT_COMPONENT_REGISTRY_STATE,
        componentRegistryMiddleware
    );

    const originalDispatch = store.dispatch;
    const methods = {
        get: (id) => getIn(componentRegistry.getState(), ['state', id]) || {},
        put: (id, component) => {
            componentRegistry.dispatch({type: ActionType.DATA_COMPONENT_UPDATE, id, component})
        },
        reference: (id, forceRegenerate = false) => {
            const component = methods.get(id);
            if (component && component.reference) {
                // This component has been registered.
                const componentReference = component.reference(forceRegenerate);
                return componentReference || null;
            } else {
                // Unregistered component.  Return a dummy reducer.
                return (..._) => null;
            }
        },
        register: (id, componentClass, classOptions) => {
            if (!componentRegistry.getState().state.hasOwnProperty(id)) {
                componentRegistry.dispatch({
                    type: ActionType.DATA_COMPONENT_REGISTER, id, componentClass, classOptions, store
                })
            }
        },
        reflection: (options = {}) => {
            const state = componentRegistry.getState()['__@@_reflected_component_data']
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
            const keys = [...include];
            return keys.reduce((r, key) => {
                r[key] = state[key];
                return r;
            }, {});
        },
        rehydrate: () => Promise.resolve().then(() => originalDispatch({
            type: ActionType.DATA_COMPONENT_REFLECTOR_REHYDRATED,
            rehydrate: (state) => componentRegistry.dispatch({
                type: ActionType.DATA_COMPONENT_REHYDRATE,
                state
            })
        })).then(() => store.dispatch({ type: ActionType.DATA_COMPONENT_REFRESH_PROXIES }))
    }

    store.dispatch = (action) => {
        if (action.type !== ActionType.DATA_COMPONENT_UPDATE
            && !action.type.match(/^persist\//)
            && action.type !== ActionType.DATA_COMPONENT_REFRESH_PROXIES) {
            componentRegistry.dispatch(action);
        }
        originalDispatch(action);
    }

    originalDispatch({type: ActionType.DATA_COMPONENT_PROBE, methods});

    const registeredComponents = componentRegistry.getState().state;
    for (const id in registeredComponents) {
        const component = registeredComponents[id];
        callEventChain(component, component, 'componentDidMount');
    }

    return store;
}

export default enableComponentStore;