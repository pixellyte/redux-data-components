import * as ActionType from '../constants/actionTypes'
import ReducerContext from "../registry/ReducerContext";
import isComponentProxy from '../util/isComponentProxy';

const UPDATED_FLAG = '__REDUCE_UPDATED_COMPONENT';
const REDUCERS = '__@@_annotated_reducers';
const ACTIONS = '__@@_annotated_actions';

function resolveReducers(functionMap, thisArg) {
    Object.keys(functionMap).forEach(key => functionMap[key] = thisArg[functionMap[key]]);
    return functionMap;
}

function allAnnotatedReducers(item) {
    if(item === null) {
        return {}
    } else if(item.hasOwnProperty(REDUCERS)) {
        return {
            ...allAnnotatedReducers(Object.getPrototypeOf(item)),
            ...item[REDUCERS]
        }
    } else {
        return allAnnotatedReducers(Object.getPrototypeOf(item));
    }
}

function allAnnotatedActions(item) {
    if(item === null) {
        return {}
    } else if(item.hasOwnProperty(ACTIONS)) {
        return {
            ...allAnnotatedActions(Object.getPrototypeOf(item)),
            ...item[ACTIONS]
        }
    } else {
        return allAnnotatedActions(Object.getPrototypeOf(item));
    }
}

function _coreReducer(component, action) {
    const reducers = {
        ...component.classReducers(),
        isMounted: (state = false) => state
    };
    const previous = Object.keys(reducers).reduce((r, k) => {
        r[k] = component[k];
        return r;
    }, {});
    previous.updated_at = previous.updated_at || (new Date()).getTime();
    const context = new ReducerContext(component, component.classOptions);
    const fingerprint = context.fingerprint();
    const reducerKeys = Object.keys(reducers);
    if(action.type === ActionType.DATA_COMPONENT_REHYDRATE) reducerKeys.push('updated_at');
    const reduced = reducerKeys.reduce((result, key) => {
        const was_updated = result[UPDATED_FLAG];
        if(previous.hasOwnProperty(key)) {
            result[key] = previous[key];
        }

        if (action.type === ActionType.DATA_COMPONENT_MOUNT) {
            if (key === 'isMounted' &&
                action.component === component.componentIdentifier()) {
                result.isMounted = true;
                result[UPDATED_FLAG] = (result[UPDATED_FLAG] || previous.isMounted !== true);
            }
        } else if(action.type === ActionType.DATA_COMPONENT_REHYDRATE) {
            const restored = action.state[component.componentIdentifier()];
            if(restored && restored.hasOwnProperty(key)) {
                result[key] = restored[key];
                result[UPDATED_FLAG] = true;
            }
        } else {
            const reducer = reducers[key].bind(context);
            if(action.type === ActionType.DATA_COMPONENT_RESET && action.component === component.componentIdentifier()) {
                result[key] = reducer(undefined, {});
                result[UPDATED_FLAG] = true;
            } else {
                result[key] = reducer(previous[key], action);
                result[UPDATED_FLAG] = result[UPDATED_FLAG] || (result[key] !== previous[key]);
            }
            if(!was_updated && result[UPDATED_FLAG] && action.type !== 'persist/REHYDRATE') {
                result.updated_at = (new Date()).getTime();
            }
        }

        if(fingerprint !== context.fingerprint()) {
            throw new Error(`Illegal side-effect in reducer for ${key} in ${component.constructor.name}.  Do not modify "this" in a reducer.`);
        }
        return result;
    }, { [UPDATED_FLAG]: false, updated_at: previous.updated_at, isMounted: previous.isMounted || false });
    return reduced;
}



export default class BaseDataComponent {
    componentDidMount() {
        this.props.dispatch({ type: ActionType.DATA_COMPONENT_MOUNT, component: this.componentIdentifier() })
    }
    componentDidUpdate(prevInstance, reason) {}
    componentWillUpdate(nextInstance, reason) {}
    componentWillRehydrate() {}
    componentDidRehydrate() {}
    componentWillReset() {}
    componentDidReset() {}

    constructor(dispatch, classOptions = {}) {
        this.props = { dispatch }
        this.classOptions = classOptions;
    }

    reference(forceRegenerate = false) {
        if(!this.hasOwnProperty('__@@_data_component_reference') || forceRegenerate) {
            this['__@@_data_component_reference'] = new Proxy({}, {
                target: this,
                get: (receiver, name) => name === 'targetComponent' ? this : this[name]
            })
        }
        return this['__@@_data_component_reference'];
    }

    // An identifier used to scope actions related to this class.
    // Thus all components sharing an id will also share data.  By
    // default the class name is used as the identifier, but an alternate
    // identifier can be provided as "id" in the class options.  This is
    // done so that multiple mounted instances of the same class can
    // operate independent of one another.
    componentIdentifier() {
        return this.classOptions.id || this.constructor.DATA_COMPONENT
    }

    applyData(data) {
        Object.keys(data).forEach(key => this[key] = data[key]);
    }

    get lastReducedDataState() {
        return [...Object.keys(this.classReducers()), 'updated_at'].reduce((data, key) => {
            if(!isComponentProxy(this[key])) {
                data[key] = this[key];
            }
            return data;
        }, {});
    }

    get lastDataState() {
        return [...Object.keys(this.classReducers()), 'updated_at'].reduce((data, key) => {
            data[key] = this[key];
            return data;
        }, {});
    }

    reduce(action) {
        const newData = _coreReducer(this, action);

        if(newData[UPDATED_FLAG]) {
            delete newData[UPDATED_FLAG]
            const newInstance = new this.constructor(this.props.dispatch, this.classOptions);
            newInstance.applyData(newData);
            return newInstance;
        }

        return this;
    }

    syncReferences(componentStore, regenerate) {
        let updated = false;
        const reducers = Object.keys(this.classReducers());
        const updates = {};
        for(let i = 0; i < reducers.length; i++) {
            const reducer = reducers[i];
            if(isComponentProxy(this[reducer])) {
                const proxied = this[reducer].targetComponent;
                const canonical = componentStore[proxied.componentIdentifier()];
                if(proxied !== canonical) {
                    updates[reducer] = canonical.reference(true);
                    updated = true;
                }
            }
        }
        if(updated) {
            if(regenerate) {
                const newInstance = new this.constructor(this.props.dispatch, this.classOptions);
                newInstance.isMounted = this.isMounted || false;
                newInstance.applyData({...this.lastDataState, ...updates });
                componentStore[this.componentIdentifier()] = newInstance;
            } else {
                this.applyData(updates);
                updated = false;
            }
        }
        console.groupEnd();
        return updated;
    }

    classReducers() {
        return resolveReducers(this.annotated_reducers, this);
    }

    classActions() {
        return resolveReducers(this.annotated_actions, this);
    }

    registerReducer(id, method) {
        if (!this.hasOwnProperty(REDUCERS)) this[REDUCERS] = {}
        this[REDUCERS][id] = method.name
    }

    registerAction(id, method) {
        if (!this.hasOwnProperty(ACTIONS)) this[ACTIONS] = {}
        this[ACTIONS][id] = method.name
    }

    get annotated_reducers() {
        return allAnnotatedReducers(this, this);
    }

    get annotated_actions() {
        return allAnnotatedActions(this, this);
    }
}
