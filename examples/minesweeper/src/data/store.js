import { createStore, applyMiddleware } from 'redux'
import rootReducer from './rootReducer'
import loggerMiddleware from './middleware/loggerMiddleware'
import { dataComponentMiddleware } from 'redux-data-components'

const middleware = applyMiddleware(loggerMiddleware, dataComponentMiddleware);

export default createStore(rootReducer, {}, middleware);
