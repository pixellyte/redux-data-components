import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import GameMode from "./GameMode";
import GameBoard from "./GameBoard";

const persistConfig = {
    key: 'root',
    storage
};

export default persistCombineReducers(persistConfig, {
    mode: GameMode,
    board: GameBoard
});