// callEventChain
// This method is used to call a method on an instance, as defined on each
// of its superclasses, in reverse inheritance order (base then derived).  This
// prevents necessary event handlers defined in ancestors from being overridden
// and obscured in descendants, without requiring the descendant to call
// super.eventHandler(...) at every turn.
export default function callEventChain(thisArg, object, method, ...args) {
    if (typeof object.__proto__[method] !== 'undefined') {
        callEventChain(thisArg, object.__proto__, method, ...args);
        if(object.__proto__[method] !== object.__proto__.__proto__[method]) {
            object.__proto__[method].bind(thisArg)(...args);
        }
    }
}

