function createConnect() {
    return (reducerClass) => {
        reducerClass.DATA_COMPONENT = reducerClass.name;

        // Only generate a new instance if the class reducer returns updated data.
        function instanceReducer(oldInstance, action, classOptions) {
            try {
                oldInstance = oldInstance || new reducerClass(classOptions);
                return oldInstance.reduce(oldInstance, action, classOptions);
            } catch(e) {
                console.error(e);
                throw e;
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
                return instanceReducer(oldInstance, action, {});
            } else {
                return (oldInstance, action) => {
                    return instanceReducer(oldInstance, action, args[0]);
                }
            }
        }

        return connectBase;
    }
}

export default createConnect();