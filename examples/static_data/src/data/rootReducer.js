import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import PanelData from "./PanelData";

const persistConfig = {
    key: 'root',
    storage
};

export default persistCombineReducers(persistConfig, {
    shared: PanelData,
    a: PanelData({ id: 'a' }),
    b: PanelData({ id: 'b' }),
    c: PanelData({ id: 'c' }),
    d: PanelData({ id: 'd' }),
    e: PanelData({ id: 'e' }),
    f: PanelData({ id: 'f' }),
    g: PanelData({ id: 'g' }),
    h: PanelData({ id: 'h' }),
    i: PanelData({ id: 'i' }),
    j: PanelData({ id: 'j' }),
    k: PanelData({ id: 'k' }),
    l: PanelData({ id: 'l' })
});