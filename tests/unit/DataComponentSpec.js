import DataComponent from '../../src/DataComponent'
import * as ActionType from '../../src/constants/actionTypes'

describe('DataComponent', () => {

    class DerivedComponent extends DataComponent {
        defaultState() { return 0; }
        classReducers() {
            return {
                ...super.classReducers(),
                mine: (state = 'foo', action) => state
            };
        }
    }

    class SideEffectComponent extends DataComponent {
        reduceData() {
            this.side_effect = "BAD DEVELOPER!  NO COOKIE FOR YOU!";
            return 0;
        }
    }

    function setup() {
        const dispatchSpy = jasmine.createSpy('dispatch');
        const bootstrapBase = new DataComponent()
        const initialBase = bootstrapBase.reduce(bootstrapBase, {});
        const bootstrapDerived = new DerivedComponent();
        const initialDerived = bootstrapDerived.reduce(bootstrapDerived, {});
        initialBase.props = { dispatch: dispatchSpy };
        initialDerived.props = { dispatch: dispatchSpy };
        return { bootstrapBase, bootstrapDerived, initialBase, initialDerived, dispatchSpy };
    }

    describe('construction', () => {
        it('can bootstrap an initial instance', () => {
            const { initialBase } = setup();
            expect(initialBase.data).toEqual(initialBase.defaultState());
        })
    })

    describe('componentIdentifier', () => {
        it('defaults to component name', () => {
            const { initialBase, initialDerived } = setup();
            expect(initialBase.componentIdentifier()).toEqual('DataComponent');
            expect(initialDerived.componentIdentifier()).toEqual('DerivedComponent');
        })

        it('allows override using classOptions', () => {
            const { bootstrapBase } = setup();
            const instance = bootstrapBase.reduce(bootstrapBase, {}, { id: 'TEST' });
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

    describe('defaultState', () => {
        it('has heritable default state', () => {
            const { initialBase, initialDerived } = setup();
            expect(initialBase.data).toEqual(null);
            expect(initialDerived.data).toEqual(0);
        })
    })

    describe('classReducers', () => {
        it('provides extensible class reducers', () => {
            const { initialBase, initialDerived } = setup();
            expect(Object.keys(initialBase.classReducers())).toEqual(['data']);
            expect(Object.keys(initialDerived.classReducers())).toEqual(['data', 'mine']);
            expect(initialDerived.mine).toEqual('foo');
        })
    })

    describe('reset', () => {
        it('dispatches a reset action', () => {
            const { initialBase, dispatchSpy } = setup();
            initialBase.reset();
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: ActionType.DATA_COMPONENT_RESET,
                component: 'DataComponent'
            });
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
            const result = initialDerived.reduce(initialDerived, { type: 'TEST' });
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
            const result = initialDerived.reduce(initialDerived, { type: 'TEST' });
            expect(result).toEqual(initialDerived);
        })

        it('creates a new object if data changed', () => {
            const { initialDerived } = setup();
            initialDerived.classReducers = () => ({
                data: _ => "NEW VALUE",
                mine: _ => _
            });
            const result = initialDerived.reduce(initialDerived, { type: 'TEST' });
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
            initialDerived.reduce(initialDerived, {
                type: ActionType.DATA_COMPONENT_RESET,
                component: 'DerivedComponent'
            });
            expect(dataReducer).toHaveBeenCalledWith(undefined, {});
            expect(myReducer).toHaveBeenCalledWith(undefined, {});
        })

        it('rejects reducers with attempted side-effects', () => {
            const bootstrapSideEffect = new SideEffectComponent();
            try {
                bootstrapSideEffect.reduce(bootstrapSideEffect, {});
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
            const newBase = initialBase.reduce(initialBase, { type: 'TEST' });
            expect(newBase.updated_at).not.toEqual(initialBase.updated_at);
        })

        it('retains updated_at property on rehydrate', () => {
            const { initialBase } = setup();
            initialBase.updated_at = 123;
            initialBase.props.path = ['base'];
            const newBase = initialBase.reduce(initialBase, {
                type: 'persist/REHYDRATE',
                payload: { base: { data: 7, updated_at: 456 } }
            });
            expect(newBase.data).toEqual(7);
            expect(newBase.updated_at).toEqual(456);
        })
    })

})