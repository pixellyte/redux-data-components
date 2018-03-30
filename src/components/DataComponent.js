import * as ActionType from '../constants/actionTypes'
import { Action, Reducer } from '../decorators/index'
import BaseDataComponent from "./BaseDataComponent";

export default class DataComponent extends BaseDataComponent {

    defaultState() {
        return null;
    }

    @Reducer('data')
    reduceData(previousData = this.defaultState(), action) {
        switch(action.type) {
            case 'persist/REHYDRATE':
                return this.rehydrateItem(action.payload, 'data') || previousData;
            default:
                return previousData;
        }
    }

    // Reset all data to defaults by running undefined through reducers.
    @Action
    reset() {
        this.props.dispatch({
            type: ActionType.DATA_COMPONENT_RESET,
            component: this.componentIdentifier()
        });
    }

}
