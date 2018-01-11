import DataComponent from './DataComponent'

const componentCombineReducers = (reducers, { base = DataComponent } = {}) => {
    if (!(base === DataComponent || base.prototype instanceof DataComponent)) {
        throw new TypeError("Base class for componentCombineReducers must be a DataComponent.");
    }
    class dynamicClass extends base {
        classReducers() {
            return {
                ...super.classReducers(),
                ...reducers
            }
        }
    }
    return dynamicClass
}

export default componentCombineReducers;