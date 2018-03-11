import {applyMiddleware, createStore} from 'redux';
import * as ActionType from '../constants/actionTypes';
import getIn from '../util/getIn'
import lifecycleMiddleware from "./lifecycleMiddleware";
import componentRegistryReducer, {DEFAULT_COMPONENT_REGISTRY_STATE} from './componentRegistry';
import callEventChain from "../util/callEventChain";

function rehydrateRegistryFromReflection(componentRegistry, state) {
    console.log("REHYDRATING:", componentRegistry.getState());
    componentRegistry.dispatch({
        type: ActionType.DATA_COMPONENT_REHYDRATE,
        state
    })
    console.log("REHYDRATED:", componentRegistry.getState());
}

function enableComponentStore(store, ...middleware) {
    const componentRegistryMiddleware = applyMiddleware(lifecycleMiddleware, ...middleware);
    const componentRegistry = createStore(
        componentRegistryReducer,
        DEFAULT_COMPONENT_REGISTRY_STATE,
        componentRegistryMiddleware
    );

    const methods = {
        get: (id) => getIn(componentRegistry.getState(), ['state', id]) || {},
        put: (id, component) => { componentRegistry.dispatch({ type: ActionType.DATA_COMPONENT_UPDATE, id, component }) },
        reference: (id, forceRegenerate = false) => {
            const component = methods.get(id);
            if(component && component.reference) {
                // This component has been registered.
                const componentReference = component.reference(forceRegenerate);
                console.log("GENERATED REFERENCE:", componentReference, "\nSTATE:", componentRegistry.getState());
                return componentReference || null;
            } else {
                // Unregistered component.  Return a dummy reducer.
                return (..._) => null;
            }
        },
        register: (id, componentClass, classOptions) => {
            if(!componentRegistry.getState().state.hasOwnProperty(id)) {
                componentRegistry.dispatch({
                    type: ActionType.DATA_COMPONENT_REGISTER, id, componentClass, classOptions, store
                })
            }
        },
        reflection: () => componentRegistry.getState()['__@@_reflected_component_data']
    }

    const originalDispatch = store.dispatch;
    store.dispatch = (action) => {
        console.log("START DISPATCH:", action, store.getState(), componentRegistry.getState());
        if(action.type !== ActionType.DATA_COMPONENT_UPDATE && !action.type.match(/^persist\//)) {
            componentRegistry.dispatch(action);
        }
        console.log("AFTER COMPONENT DISPATCH:", action, store.getState(), componentRegistry.getState());
        originalDispatch(action);
        console.log("AFTER STORE DISPATCH:", action, store.getState(), componentRegistry.getState());


        if(action.type === 'persist/REHYDRATE') {
            originalDispatch({
                type: ActionType.DATA_COMPONENT_REHYDRATE,
                rehydrate: rehydrateRegistryFromReflection.bind(componentRegistry, componentRegistry)
            });
        }
    }

    originalDispatch({ type: ActionType.DATA_COMPONENT_PROBE, methods });

    const registeredComponents = componentRegistry.getState().state;
    for(const id in registeredComponents) {
        const component = registeredComponents[id];
        callEventChain(component, component, 'componentDidMount');
    }

    return store;
}

export default enableComponentStore;