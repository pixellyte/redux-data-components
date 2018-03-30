
export function Action(target, name, descriptor) {
    target.registerAction(name, descriptor.value);
    return descriptor;
}

export function Reducer(propname, defaultState = null) {
    return (target, name, descriptor) => {
        target.registerReducer(propname, descriptor.value);
        return descriptor;
    }
}
