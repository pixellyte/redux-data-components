import * as ActionType from './constants/actionTypes'
import getIn from "./util/getIn";
import ReducerContext from "./ReducerContext";

export default class DataComponent {
    componentDidMount() {}
    componentDidUpdate(prevInstance, reason) {}
    componentWillUpdate(nextInstance, reason) {}
    componentWillRehydrate() {}
    componentDidRehydrate() {}
    componentWillReset() {}
    componentDidReset() {}

    // An identifier used to scope actions related to this class.
    // Thus all components sharing an id will also share data.  By
    // default the class name is used as the identifier, but an alternate
    // identifier can be provided as "id" in the class options.  This is
    // done so that multiple mounted instances of the same class can
    // operate independent of one another.
    componentIdentifier() {
        return this.classOptions.id || this.constructor.name
    }

    applyData(data) {
        Object.keys(data).forEach(key => this[key] = data[key]);
    }

    defaultState() {
        return null;
    }

    reduce(previous, action, classOptions = {}) {
        let updated = false;
        const reducers = this.classReducers();
        const context = new ReducerContext(this, classOptions);
        const fingerprint = context.fingerprint();
        const reduction = this._getReductionResult && this._getReductionResult();
        let newData;

        if(reduction !== undefined) {
            newData = reduction;
            updated = (newData !== 0);
        } else {
            newData = Object.keys(reducers).reduce((result, key) => {
                const reducer = reducers[key].bind(context);
                const previousDataItem = getIn(previous, [key]);
                let newDataItem = previousDataItem;
                if(action.type === ActionType.DATA_COMPONENT_RESET && context.isTargetFor(action)) {
                    newDataItem = reducer(undefined, {});
                } else {
                    newDataItem = reducer(previousDataItem, action);
                }
                if(fingerprint !== context.fingerprint()) {
                    throw new Error(`Illegal side-effect in reducer for ${key} in ${this.constructor.name}.  Do not modify "this" in a reducer.`);
                }
                result[key] = newDataItem;
                if (Object.keys(context).length)
                    if(newDataItem !== previousDataItem) {
                        updated = true
                    }
                return result;
            }, {});
            this._setReductionResult && this._setReductionResult(updated ? newData : 0);
        }

        if((previous && updated) || action.type === 'persist/REHYDRATE') {
            const newInstance = new this.constructor(classOptions);
            newInstance.classOptions = classOptions;
            newInstance.props = previous.props;
            newInstance.applyData(newData);
            newInstance.updated_at = (new Date()).getTime();
            if(action.type === 'persist/REHYDRATE' && previous.updated_at) {
                newInstance.updated_at = context.rehydrateItem(action.payload, 'updated_at');
            }
            return newInstance;
        } else {
            return this;
        }
    }

    classReducers() {
        return {
            data: this.reduceData
        }
    }

    reduceData(previousData = this.defaultState(), action) {
        switch(action.type) {
            case 'persist/REHYDRATE':
                return this.rehydrateItem(action.payload, 'data') || previousData;
            default:
                return previousData;
        }
    }

    // Reset all data to defaults by running undefined through reducers.
    reset() {
        this.props.dispatch({
            type: ActionType.DATA_COMPONENT_RESET,
            component: this.componentIdentifier()
        });
    }
}
