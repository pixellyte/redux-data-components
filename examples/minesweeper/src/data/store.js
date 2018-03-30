import {applyMiddleware, createStore} from 'redux'
import rootReducer from './rootReducer'
import { createLogger } from 'redux-logger';
import { enableComponentStore } from 'redux-data-components'

const applicationLoggerMiddleware = createLogger({
    titleFormatter: (action, time, took) => `MINESWEEPER: action @ ${time} ${action.type} (in ${took.toFixed(2)} ms)`,
    diff: true
})

const componentLoggerMiddleware = createLogger({
    titleFormatter: (action, time, took) => `DATA COMPONENTS: action @ ${time} ${action.type} (in ${took.toFixed(2)} ms)`,
    diff: true
})


const middleware = applyMiddleware(applicationLoggerMiddleware);

export default enableComponentStore(createStore(rootReducer, {}, middleware), componentLoggerMiddleware);
