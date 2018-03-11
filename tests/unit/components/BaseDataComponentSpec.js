import * as ActionType from '../../../src/constants/actionTypes';
import BaseDataComponent from "../../../src/components/BaseDataComponent";
import { Reducer } from '../../../src/decorators';

describe('BaseDataComponent', () => {

    class BaseComponent extends BaseDataComponent {
        defaultState() { return 0; }
        @Reducer('data')
        dataReducer(state = 0, action) {
            return state;
        }
    }

    class DerivedComponent extends BaseComponent {
        classReducers() {
            return {
                ...super.classReducers(),
                mine: (state = 'foo', action) => state
            };
        }
    }

    class SideEffectComponent extends BaseDataComponent {
        @Reducer('data')
        reduceData() {
            this.side_effect = "BAD DEVELOPER!  NO COOKIE FOR YOU!";
            return 0;
        }
    }

    function setup() {
        const dispatchSpy = jasmine.createSpy('dispatch');
        const bootstrapBase = new BaseComponent(dispatchSpy, {})
        const initialBase = bootstrapBase.reduce({});
        const bootstrapDerived = new DerivedComponent(dispatchSpy, {});
        const initialDerived = bootstrapDerived.reduce({});
        DerivedComponent.DATA_COMPONENT = 'default-component-id';
        return { bootstrapBase, bootstrapDerived, initialBase, initialDerived, dispatchSpy };
    }

    describe('componentIdentifier', () => {
        it('defaults to static DATA_COMPONENT value', () => {
            const { initialBase, initialDerived } = setup();
            expect(initialBase.componentIdentifier()).toBeUndefined();
            expect(initialDerived.componentIdentifier()).toEqual('default-component-id');
        })

        it('allows override using classOptions', () => {
            const { dispatchSpy } = setup();
            const instance = new DerivedComponent(dispatchSpy, { id: 'TEST' })
            expect(instance.componentIdentifier()).toEqual('TEST');
        })
    })

    describe('applyData', () => {
        it('sets instance keys', () => {
            const { initialBase } = setup();
            initialBase.applyData({ test: 'data', other: 123 });
            expect(initialBase.test).toEqual('data');
            expect(initialBase.other).toEqual(123);
        })
    })

    describe('classReducers', () => {
        it('provides extensible class reducers', () => {
            const { initialDerived } = setup();
            expect(Object.keys(initialDerived.classReducers())).toEqual(['data', 'mine']);
            expect(initialDerived.mine).toEqual('foo');
        })
    })

    describe('reduce', () => {

        it('runs all class reducers', () => {
            const { initialDerived } = setup();
            const dataReducer = jasmine.createSpy('dataReducer').and.returnValue("DATA");
            const myReducer = jasmine.createSpy('myReducer').and.returnValue("MINE");
            initialDerived.classReducers = () => ({
                data: dataReducer,
                mine: myReducer
            });
            const result = initialDerived.reduce({ type: 'TEST' });
            expect(dataReducer).toHaveBeenCalledWith(0, { type: 'TEST' });
            expect(myReducer).toHaveBeenCalledWith('foo', { type: 'TEST' });
            expect(result.data).toEqual("DATA");
            expect(result.mine).toEqual("MINE");
        })

        it('does not create a new instance if no data changed', () => {
            const { initialDerived } = setup();
            initialDerived.classReducers = () => ({
                data: _ => _,
                mine: _ => _
            });
            const result = initialDerived.reduce({ type: 'TEST' });
            expect(result).toEqual(initialDerived);
        })

        it('creates a new object if data changed', () => {
            const { initialDerived } = setup();
            initialDerived.classReducers = () => ({
                data: _ => "NEW VALUE",
                mine: _ => _
            });
            const result = initialDerived.reduce({ type: 'TEST' });
            expect(result).not.toEqual(initialDerived);
        })

        it('processes a DATA_COMPONENT_RESET action as reinitialization', () => {
            const {initialDerived} = setup();
            const dataReducer = jasmine.createSpy('dataReducer');
            const myReducer = jasmine.createSpy('myReducer');
            initialDerived.classReducers = () => ({
                data: dataReducer,
                mine: myReducer
            });
            initialDerived.reduce({
                type: ActionType.DATA_COMPONENT_RESET,
                component: 'default-component-id'
            });
            expect(dataReducer).toHaveBeenCalledWith(undefined, {});
            expect(myReducer).toHaveBeenCalledWith(undefined, {});
        })

        it('rejects reducers with attempted side-effects', () => {
            const bootstrapSideEffect = new SideEffectComponent();
            try {
                bootstrapSideEffect.reduce({});
                fail('did not throw an error');
            } catch(e) {
                expect(e.message).toEqual('Illegal side-effect in reducer for data in SideEffectComponent.  Do not modify "this" in a reducer.');
            }
        })

        it('sets updated_at property on normal reduce', () => {
            const { initialBase } = setup();
            initialBase.updated_at = 123;
            initialBase.classReducers = () => ({
                data: _ => "NEW VALUE"
            });
            const newBase = initialBase.reduce({ type: 'TEST' });
            expect(newBase.updated_at).not.toEqual(initialBase.updated_at);
        })

        it('retains updated_at property on rehydrate', () => {
            const { initialBase } = setup();
            initialBase.updated_at = 123;
            const newBase = initialBase.reduce({
                type: 'persist/REHYDRATE',
                payload: { BaseComponent: { data: 7, updated_at: 456 } }
            });
            expect(newBase.data).toEqual(7);
            expect(newBase.updated_at).toEqual(456);
        })
    })

})