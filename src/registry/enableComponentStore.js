import {applyMiddleware, createStore} from 'redux';
import * as ActionType from '../constants/actionTypes';
import getIn from '../util/getIn'
import lifecycleMiddleware from "./lifecycleMiddleware";
import componentRegistryReducer, {DEFAULT_COMPONENT_REGISTRY_STATE} from './componentRegistry';
import callEventChain from "../util/callEventChain";

function isMainStoreEligible(action) {
    return true;
}

function isComponentStoreEligible(action) {
    const excludedActionTypes = [
        ActionType.DATA_COMPONENT_REFRESH_PROXIES,
        ActionType.DATA_COMPONENT_UPDATE
    ];
    if  (
            action &&
            typeof action === 'function' ||
            (
                action.type
                && (excludedActionTypes.indexOf(action.type) >= 0 || action.type.match(/^persist\//))
            )
        ) {
        return false;
    }
    return true;
}

function enableComponentStore(store, ...middleware) {
    const componentRegistryMiddleware = applyMiddleware(lifecycleMiddleware, ...middleware);
    const componentRegistry = createStore(
        componentRegistryReducer,
        DEFAULT_COMPONENT_REGISTRY_STATE,
        componentRegistryMiddleware
    );

    const mount = (ids) => {
        const registeredComponents = componentRegistry.getState().state;
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const component = registeredComponents[id];
            if(typeof component !== 'undefined') {
                callEventChain(component, component, 'componentDidMount');
            }
        }
    }

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
        reflection: () => componentRegistry.getState()['__@@_reflected_component_data'],
        rehydrate: () => Promise.resolve().then(() => originalDispatch({
            type: ActionType.DATA_COMPONENT_REFLECTOR_REHYDRATED,
            rehydrate: (state) => {
                componentRegistry.dispatch({
                    type: ActionType.DATA_COMPONENT_REHYDRATE,
                    state
                });
                Promise.resolve().then(() => mount(Object.keys(state)));
            }
        })).then(() => store.dispatch({ type: ActionType.DATA_COMPONENT_REFRESH_PROXIES })),
        defer: (ids) => componentRegistry.dispatch({
            type: ActionType.DATA_COMPONENT_DEFER_MOUNT,
            ids
        })
    }

    store.dispatch = (action) => {
        if (isComponentStoreEligible(action)) componentRegistry.dispatch(action);
        if (isMainStoreEligible(action)) originalDispatch(action);
    }

    originalDispatch({type: ActionType.DATA_COMPONENT_PROBE, methods});

    const registeredComponents = componentRegistry.getState().state;
    const deferrals = componentRegistry.getState().deferrals;
    const immediate = Object.keys(registeredComponents).filter(item => deferrals.indexOf(item) < 0);
    mount(immediate);

    return store;
}

export default enableComponentStore;