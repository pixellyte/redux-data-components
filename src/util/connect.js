import * as ActionType from "../constants/actionTypes";

function createConnect() {
    let getter;
    let reference;

    return (defaultComponentId, reducerClass) => {
        if(typeof reducerClass === 'undefined' && typeof defaultComponentId !== 'string') {
            console.warn(
`Single-argument connect(Component) is deprecated and may not work correctly when minified.  Please convert to
 connect("defaultComponentId", Component) for production code.  Suggest connect("MyComponent", MyComponent) for
 consistency with existing behavior.`
            );
            reducerClass = defaultComponentId;
            defaultComponentId = reducerClass.name;
        }

        function probeReducer(oldInstance = null, action, classOptions) {
            const componentId = classOptions.id || defaultComponentId;
            switch (action.type) {
                case ActionType.DATA_COMPONENT_PROBE:
                    reducerClass.DATA_COMPONENT = defaultComponentId;
                    getter = action.methods.get;
                    reference = action.methods.reference;
                    action.methods.register(componentId, reducerClass, classOptions, getter);
                    const componentReference = reference(componentId);
                    const component = componentReference.targetComponent;
                    const probed = component.reduce(action);
                    if(component !== probed) {
                        action.methods.put(componentId, probed);
                    }
                    return componentReference;
                case 'persist/REHYDRATE':
                case ActionType.DATA_COMPONENT_REHYDRATE:
                    // It is necessary to regenerate the component reference on rehydration to thwart redux-persist's
                    // auto-merge of results.
                    return reference(componentId, true);
                default:
                    return reference ? reference(componentId) : null;
            }
        }

        function connectBase(...args) {
            // USAGE OPTION:
            // You may mount the reducer directly:
            //     my_reducer: ReducerClass
            // Or you may provide an options object that is supplied to every instance of the reducer:
            //     my_reducer: ReducerClass({ my_option: "VALUE" })
            // Either works.
            if (args.length === 2) {
                const [oldInstance, action] = args;
                return probeReducer(oldInstance, action, {});
            } else {
                return (oldInstance, action) => {
                    return probeReducer(oldInstance, action, args[0]);
                }
            }
        }

        return connectBase;
    }
}

export default createConnect();
