import getIn from "../util/getIn";

export default class ReducerContext {
    constructor(component, classOptions) {
        component.classOptions = classOptions;
        this.id = component.componentIdentifier();
        this.classOptions = {...component.classOptions};
        this.constructor.prototype.__proto__ = component.__proto__; // Makes super work in reducers.
    }

    isTargetFor(action) {
        return this.id === action.component;
    }

    rehydrateItem(payload, item) {
        return getIn(payload, [item]);
    }

    fingerprint() {
        return JSON.stringify({...this});
    }
}