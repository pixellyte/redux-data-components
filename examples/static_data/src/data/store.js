import { createStore, applyMiddleware } from 'redux';
import { dataComponentMiddleware } from 'redux-data-components';
import rootReducer from './rootReducer';
import loggerMiddleware from './middleware/loggerMiddleware';

const middleware = applyMiddleware(loggerMiddleware, dataComponentMiddleware);
export default createStore(rootReducer, {}, middleware);