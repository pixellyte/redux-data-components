import DataComponent from '../../../src/components/DataComponent'
import * as ActionType from '../../../src/constants/actionTypes'

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
        const bootstrapBase = new DataComponent();
        const initialBase = bootstrapBase.reduce({});
        const bootstrapDerived = new DerivedComponent();
        const initialDerived = bootstrapDerived.reduce({});
        DerivedComponent.DATA_COMPONENT = 'default-component-id';
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
            const { initialDerived, dispatchSpy } = setup();
            initialDerived.reset();
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: ActionType.DATA_COMPONENT_RESET,
                component: 'default-component-id'
            });
        })
    })

})