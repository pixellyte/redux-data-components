import middleware from '../../src/middleware';
import {DataComponent} from '../../src';

describe('middleware', () => {

    class TestComponent extends DataComponent {
        componentIdentifier() {
            return 'testComponent'
        }

        defaultState() {
            return 0;
        }

        componentDidMount() {
        }

        componentWillUpdate() {
        }

        componentWillRehydrate() {
        }

        componentWillReset() {
        }

        componentDidUpdate() {
        }

        componentDidRehydrate() {
        }

        componentDidReset() {
        }
    }
    TestComponent.DATA_COMPONENT = 'TestComponent';

    function setup() {
        const mock = new TestComponent();
        const store = {
            getState: _ => {
                component: mock
            }, dispatch: _ => _
        };
        const updated = new TestComponent();
        const getStateSpy = spyOn(store, 'getState');
        getStateSpy.and.returnValue({component: mock});

        const callOrder = [];

        const baseMountSpy = spyOn(mock.__proto__.__proto__, 'componentDidMount')
            .and.callFake(() => callOrder.push('base.componentDidMount'));
        const baseWillUpdateSpy = spyOn(mock.__proto__.__proto__, 'componentWillUpdate')
            .and.callFake(() => callOrder.push('base.componentWillUpdate'));
        const baseWillRehydrateSpy = spyOn(mock.__proto__.__proto__, 'componentWillRehydrate')
            .and.callFake(() => callOrder.push('base.componentWillRehydrate'));
        const baseWillResetSpy = spyOn(mock.__proto__.__proto__, 'componentWillReset')
            .and.callFake(() => callOrder.push('base.componentWillReset'));
        const baseDidUpdateSpy = spyOn(mock.__proto__.__proto__, 'componentDidUpdate')
            .and.callFake(() => callOrder.push('base.componentDidUpdate'));
        const baseDidRehydrateSpy = spyOn(mock.__proto__.__proto__, 'componentDidRehydrate')
            .and.callFake(() => callOrder.push('base.componentDidRehydrate'));
        const baseDidResetSpy = spyOn(mock.__proto__.__proto__, 'componentDidReset')
            .and.callFake(() => callOrder.push('base.componentDidReset'));

        const childMountSpy = spyOn(mock.__proto__, 'componentDidMount')
            .and.callFake(() => callOrder.push('child.componentDidMount'));
        const childWillUpdateSpy = spyOn(mock.__proto__, 'componentWillUpdate')
            .and.callFake(() => callOrder.push('child.componentWillUpdate'));
        const childWillRehydrateSpy = spyOn(mock.__proto__, 'componentWillRehydrate')
            .and.callFake(() => callOrder.push('child.componentWillRehydrate'));
        const childWillResetSpy = spyOn(mock.__proto__, 'componentWillReset')
            .and.callFake(() => callOrder.push('child.componentWillReset'));
        const childDidUpdateSpy = spyOn(mock.__proto__, 'componentDidUpdate')
            .and.callFake(() => callOrder.push('child.componentDidUpdate'));
        const childDidRehydrateSpy = spyOn(mock.__proto__, 'componentDidRehydrate')
            .and.callFake(() => callOrder.push('child.componentDidRehydrate'));
        const childDidResetSpy = spyOn(mock.__proto__, 'componentDidReset')
            .and.callFake(() => callOrder.push('child.componentDidReset'));

        return {
            store,
            mock,
            updated,
            callOrder,
            getStateSpy,
            baseMountSpy,
            baseWillUpdateSpy,
            baseWillRehydrateSpy,
            baseWillResetSpy,
            baseDidUpdateSpy,
            baseDidRehydrateSpy,
            baseDidResetSpy,
            childMountSpy,
            childWillUpdateSpy,
            childWillRehydrateSpy,
            childWillResetSpy,
            childDidUpdateSpy,
            childDidRehydrateSpy,
            childDidResetSpy
        };
    }

    it('passes args to next', () => {
        const {store} = setup();
        const nextArgs = [];
        const next = (...args) => nextArgs.push(args);
        const action = {type: 'TEST'};
        middleware(store)(next)(action);
        expect(nextArgs[0]).toEqual([action]);
    })

    it('adds dispatch and path props', () => {
        const { store, mock } = setup();
        middleware(store)(_ => _)({ type: 'TEST' });
        expect(mock.props).toEqual({ dispatch: store.dispatch, path: ['component'] })
    })

    it('calls mount handler chain', (done) => {
        const {store, baseMountSpy, childMountSpy, callOrder} = setup();
        middleware(store)(_ => _)({type: 'TEST'});
        expect(baseMountSpy).toHaveBeenCalled();
        expect(childMountSpy).toHaveBeenCalled();
        expect(callOrder).toEqual(['base.componentDidMount', 'child.componentDidMount']);
        done();
    })

    it('calls update handler chain when component changes', (done) => {
        const { store, getStateSpy, mock, updated, callOrder, baseWillUpdateSpy,
            baseDidUpdateSpy, childWillUpdateSpy, childDidUpdateSpy } = setup();
        getStateSpy.and.returnValues({ component: mock }, { component: updated });
        middleware(store)(_ => _)({ type: 'TEST' });
        Promise.resolve()
            .then(() => {
                expect(baseWillUpdateSpy).toHaveBeenCalledWith(updated, 'UPDATE');
                expect(childWillUpdateSpy).toHaveBeenCalledWith(updated, 'UPDATE');
                expect(baseDidUpdateSpy).toHaveBeenCalledWith(mock, 'UPDATE');
                expect(childDidUpdateSpy).toHaveBeenCalledWith(mock, 'UPDATE');
                expect(callOrder).toEqual([
                    'base.componentDidMount',
                    'child.componentDidMount',
                    'base.componentWillUpdate',
                    'child.componentWillUpdate',
                    'base.componentDidUpdate',
                    'child.componentDidUpdate'
                ])
            })
            .then(done)
    })

    it('calls correct handler chains for rehydrate', (done) => {
        const { store, getStateSpy, mock, updated, callOrder, baseWillUpdateSpy,
            baseDidUpdateSpy, childWillUpdateSpy, childDidUpdateSpy } = setup();
        getStateSpy.and.returnValues({ component: mock }, { component: updated });
        middleware(store)(_ => _)({ type: 'persist/REHYDRATE' });
        Promise.resolve()
            .then(() => {
                expect(baseWillUpdateSpy).toHaveBeenCalledWith(updated, 'REHYDRATE');
                expect(childWillUpdateSpy).toHaveBeenCalledWith(updated, 'REHYDRATE');
                expect(baseDidUpdateSpy).toHaveBeenCalledWith(mock, 'REHYDRATE');
                expect(childDidUpdateSpy).toHaveBeenCalledWith(mock, 'REHYDRATE');
                expect(callOrder).toEqual([
                    'base.componentDidMount',
                    'child.componentDidMount',
                    'base.componentWillRehydrate',
                    'child.componentWillRehydrate',
                    'base.componentWillUpdate',
                    'child.componentWillUpdate',
                    'base.componentDidRehydrate',
                    'child.componentDidRehydrate',
                    'base.componentDidUpdate',
                    'child.componentDidUpdate'
                ])
            })
            .then(done)
    })

    it('calls correct handler chains for reset', (done) => {
        const { store, getStateSpy, mock, updated, callOrder, baseWillUpdateSpy,
            baseDidUpdateSpy, childWillUpdateSpy, childDidUpdateSpy } = setup();
        getStateSpy.and.returnValues({ component: mock }, { component: updated });
        middleware(store)(_ => _)({ type: '@@__DATA_COMPONENT_RESET' });
        Promise.resolve()
            .then(() => {
                expect(baseWillUpdateSpy).toHaveBeenCalledWith(updated, 'RESET');
                expect(childWillUpdateSpy).toHaveBeenCalledWith(updated, 'RESET');
                expect(baseDidUpdateSpy).toHaveBeenCalledWith(mock, 'RESET');
                expect(childDidUpdateSpy).toHaveBeenCalledWith(mock, 'RESET');
                expect(callOrder).toEqual([
                    'base.componentDidMount',
                    'child.componentDidMount',
                    'base.componentWillReset',
                    'child.componentWillReset',
                    'base.componentWillUpdate',
                    'child.componentWillUpdate',
                    'base.componentDidReset',
                    'child.componentDidReset',
                    'base.componentDidUpdate',
                    'child.componentDidUpdate'
                ])
            })
            .then(done)
    })
})