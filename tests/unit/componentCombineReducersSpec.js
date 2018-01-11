import componentCombineReducers from '../../src/componentCombineReducers';
import DataComponent from "../../src/DataComponent";

describe('componentCombineReducers', () => {

    it('derives from DataComponent by default', () => {
        const combined = componentCombineReducers({});
        expect(combined.__proto__).toEqual(DataComponent);
    })

    it('accepts an alternate base class', () => {
        class Derived extends DataComponent {
        }
        const combined = componentCombineReducers({}, {base: Derived});
        expect(combined.__proto__).toEqual(Derived);
    })

    it('rejects non-DataComponent base classes', () => {
        class Invalid {}
        try {
            componentCombineReducers({}, {base: Invalid});
            fail('componentCombineReducers accepted an invalid base class');
        } catch(e) {
            expect(e.message).toEqual('Base class for componentCombineReducers must be a DataComponent.');
        }
    })

    it('aggregates reducers', () => {
        const combined = componentCombineReducers({ foo: (state,action) => "Foo" });
        const instance = new combined();
        expect(Object.keys(instance.classReducers())).toEqual(['data', 'foo']);
    })

})