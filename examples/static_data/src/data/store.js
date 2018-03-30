import {applyMiddleware, createStore} from 'redux';
import { enableComponentStore } from 'redux-data-components';
import rootReducer from './rootReducer';
import { createLogger } from 'redux-logger';

const applicationLoggerMiddleware = createLogger({
    titleFormatter: (action, time, took) => `STATIC DATA: action @ ${time} ${action.type} (in ${took.toFixed(2)} ms)`,
    diff: true
})

const componentLoggerMiddleware = createLogger({
    titleFormatter: (action, time, took) => `DATA COMPONENTS: action @ ${time} ${action.type} (in ${took.toFixed(2)} ms)`,
    diff: true
})


const middleware = applyMiddleware(applicationLoggerMiddleware);//, dataComponentMiddleware);
export default enableComponentStore(createStore(rootReducer, {}, middleware), componentLoggerMiddleware);