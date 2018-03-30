import lifecycleMiddleware from "../../../src/registry/lifecycleMiddleware";
import BaseDataComponent from "../../../src/components/BaseDataComponent";
import * as ActionTypes from "../../../lib/constants/actionTypes";

class TestComponent extends BaseDataComponent {
    componentWillUpdate() {
    }

    componentDidUpdate() {
    }

    componentWillReset() {
    }

    componentDidReset() {
    }

    componentWillRehydrate() {
    }

    componentDidRehydrate() {
    }
}

TestComponent.DATA_COMPONENT = 'TestComponent';

describe('lifecycleMiddleware', () => {

    function setup() {
        const dispatch = _ => _;
        const original = new TestComponent(dispatch, {});
        const updated = new TestComponent(dispatch, {});
        const getStateSpy = jasmine.createSpy('getState').and.returnValues(
            {state: {component: original}},
            {state: {component: updated}}
        );
        const store = {
            getState: getStateSpy,
            dispatch
        };

        const callOrder = [];
        const record = (handlerName) => () => callOrder.push(handlerName);
        const eventHandlerSpy = (obj, id, handler) => {
            const eventName = `${id}.${handler}`;
            const spy = jasmine.createSpy(eventName).and.callFake(record(eventName));
            obj[handler] = spy;
            return {[handler]: spy};
        }

        const originalBase = original.__proto__.__proto__;
        const originalChild = original.__proto__;

        const spies = {
            base: {
                ...eventHandlerSpy(originalBase, 'BaseDataComponent', 'componentWillUpdate'),
                ...eventHandlerSpy(originalBase, 'BaseDataComponent', 'componentDidUpdate'),
                ...eventHandlerSpy(originalBase, 'BaseDataComponent', 'componentWillReset'),
                ...eventHandlerSpy(originalBase, 'BaseDataComponent', 'componentDidReset'),
                ...eventHandlerSpy(originalBase, 'BaseDataComponent', 'componentWillRehydrate'),
                ...eventHandlerSpy(originalBase, 'BaseDataComponent', 'componentDidRehydrate')
            },
            child: {
                ...eventHandlerSpy(originalChild, 'TestComponent', 'componentWillUpdate'),
                ...eventHandlerSpy(originalChild, 'TestComponent', 'componentDidUpdate'),
                ...eventHandlerSpy(originalChild, 'TestComponent', 'componentWillReset'),
                ...eventHandlerSpy(originalChild, 'TestComponent', 'componentDidReset'),
                ...eventHandlerSpy(originalChild, 'TestComponent', 'componentWillRehydrate'),
                ...eventHandlerSpy(originalChild, 'TestComponent', 'componentDidRehydrate')
            }
        }

        return {store, getStateSpy, callOrder, spies, original, updated};
    }

    it('passes args to next', () => {
        const {store} = setup();
        const nextArgs = [];
        const next = (...args) => nextArgs.push(args);
        const action = {type: 'TEST'};
        lifecycleMiddleware(store)(next)(action);
        expect(nextArgs[0]).toEqual([action]);
    })

    it('generates no events if the action produces no changes', () => {
        const { store, getStateSpy, original, spies, callOrder } = setup();
        getStateSpy.and.returnValue(original);
        const next = (..._) => _;
        const action = {type: 'TEST'};
        spyOn(Promise, 'resolve');
        lifecycleMiddleware(store)(next)(action);
        expect(Promise.resolve).not.toHaveBeenCalled();
        for(const key in spies.base) {
            expect(spies.base[key]).not.toHaveBeenCalled();
            expect(spies.child[key]).not.toHaveBeenCalled();
            expect(spies.base[key]).not.toHaveBeenCalled();
            expect(spies.child[key]).not.toHaveBeenCalled();
        }
        expect(callOrder).toEqual([]);
    })

    it('handles update events', (done) => {
        const {store, callOrder, spies, original, updated} = setup();
        const next = (..._) => _;
        const action = {type: 'TEST'};
        Promise.resolve(lifecycleMiddleware(store)(next)(action))
            .then(() => {
                expect(spies.base.componentWillUpdate).toHaveBeenCalledWith(updated, 'UPDATE');
                expect(spies.child.componentWillUpdate).toHaveBeenCalledWith(updated, 'UPDATE');
            })
            .then(() => {
                expect(spies.base.componentDidUpdate).toHaveBeenCalledWith(original, 'UPDATE');
                expect(spies.child.componentDidUpdate).toHaveBeenCalledWith(original, 'UPDATE');
            })
            .then(() => {
                expect(callOrder).toEqual([
                    'BaseDataComponent.componentWillUpdate',
                    'TestComponent.componentWillUpdate',
                    'BaseDataComponent.componentDidUpdate',
                    'TestComponent.componentDidUpdate'
                ]);
            })
            .then(done);
    })

    it('handles reset events', (done) => {
        const {store, callOrder, spies, original, updated} = setup();
        const next = (..._) => _;
        const action = {type: ActionTypes.DATA_COMPONENT_RESET};
        Promise.resolve(lifecycleMiddleware(store)(next)(action))
            .then(() => {
                expect(spies.base.componentWillUpdate).toHaveBeenCalledWith(updated, 'RESET');
                expect(spies.child.componentWillUpdate).toHaveBeenCalledWith(updated, 'RESET');
                expect(spies.base.componentWillReset).toHaveBeenCalled();
                expect(spies.child.componentWillReset).toHaveBeenCalled();
            })
            .then(() => {
                expect(spies.base.componentDidUpdate).toHaveBeenCalledWith(original, 'RESET');
                expect(spies.child.componentDidUpdate).toHaveBeenCalledWith(original, 'RESET');
                expect(spies.base.componentDidReset).toHaveBeenCalled();
                expect(spies.child.componentDidReset).toHaveBeenCalled();
            })
            .then(() => {
                expect(callOrder).toEqual([
                    'BaseDataComponent.componentWillUpdate',
                    'TestComponent.componentWillUpdate',
                    'BaseDataComponent.componentWillReset',
                    'TestComponent.componentWillReset',
                    'BaseDataComponent.componentDidUpdate',
                    'TestComponent.componentDidUpdate',
                    'BaseDataComponent.componentDidReset',
                    'TestComponent.componentDidReset'
                ]);
            })
            .then(done);
    })

    it('handles rehydrate events', (done) => {
        const {store, callOrder, spies, original, updated} = setup();
        const next = (..._) => _;
        const action = {type: 'persist/REHYDRATE'};
        Promise.resolve(lifecycleMiddleware(store)(next)(action))
            .then(() => {
                expect(spies.base.componentWillUpdate).toHaveBeenCalledWith(updated, 'REHYDRATE');
                expect(spies.child.componentWillUpdate).toHaveBeenCalledWith(updated, 'REHYDRATE');
                expect(spies.base.componentWillRehydrate).toHaveBeenCalled();
                expect(spies.child.componentWillRehydrate).toHaveBeenCalled();
            })
            .then(() => {
                expect(spies.base.componentDidUpdate).toHaveBeenCalledWith(original, 'REHYDRATE');
                expect(spies.child.componentDidUpdate).toHaveBeenCalledWith(original, 'REHYDRATE');
                expect(spies.base.componentDidRehydrate).toHaveBeenCalled();
                expect(spies.child.componentDidRehydrate).toHaveBeenCalled();
            })
            .then(() => {
                expect(callOrder).toEqual([
                    'BaseDataComponent.componentWillUpdate',
                    'TestComponent.componentWillUpdate',
                    'BaseDataComponent.componentWillRehydrate',
                    'TestComponent.componentWillRehydrate',
                    'BaseDataComponent.componentDidUpdate',
                    'TestComponent.componentDidUpdate',
                    'BaseDataComponent.componentDidRehydrate',
                    'TestComponent.componentDidRehydrate'
                ]);
            })
            .then(done);
    })
})