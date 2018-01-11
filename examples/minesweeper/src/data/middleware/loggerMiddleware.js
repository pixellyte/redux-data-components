export default function loggerMiddleware({getState}) {
    return next => action => {
        debug('Dispatching action: ', action)
        try {
            let nextAction = next(action)
            debug('State after dispatching: ', getState())
            return nextAction
        } catch (error) {
            console.error('an error occurred in a reducer', error);
        }
    }
}

function debug(message, object) {
    if (console.debug) console.debug(message, object);
    else console.log(message, JSON.stringify(object));
}