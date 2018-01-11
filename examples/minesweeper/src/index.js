import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/lib/integration/react';
import registerServiceWorker from './registerServiceWorker';
import store from './data/store'

const persistor = persistStore(store)

ReactDOM.render(
    <PersistGate persistor={persistor}>
        <Provider store={store}>
            <App/>
        </Provider>
    </PersistGate>
    , document.getElementById('root'));
registerServiceWorker();
