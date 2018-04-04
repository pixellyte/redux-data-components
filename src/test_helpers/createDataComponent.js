import * as ActionTypes from "../../lib/constants/actionTypes";

// Creates a reference not backed by a component store for unit test purposes.
export default function createDataComponent(component, dispatch, initial_props = {}) {
    let instance = null;
    return component(undefined, {
        type: ActionTypes.DATA_COMPONENT_PROBE,
        methods: {
            get: () => instance,
            reference: (id) => instance.reference(),
            register: (id, componentClass, options, getter) => {
                instance = new componentClass(dispatch, options);
                instance = instance.reduce({});
                instance.applyData(initial_props);
            },
            put: (id, newInstance) => instance = newInstance
        }
    })
}