import AsyncFetchComponent from '../../src/AsyncFetchComponent';
import * as ActionType from "../../lib/constants/actionTypes";

describe('AsyncFetchComponent', () => {

    class TestFetchComponent extends AsyncFetchComponent {
        defaultState() {
            return "NOTHING YET!";
        }

        fetch() {
            return "RESULT!";
        }
    }

    class ErrorFetchComponent extends AsyncFetchComponent {
        fetch() {
            throw new Error('NO RESULT FOR YOU!');
        }
    }

    function makeComponent() {
        let component = new TestFetchComponent();
        component = component.reduce(component, {});
        return component;
    }

    function setup() {
        const dispatchSpy = jasmine.createSpy('dispatch');
        const component = makeComponent();
        let errorComponent = new ErrorFetchComponent();
        errorComponent = errorComponent.reduce(errorComponent, {});
        component.props = { dispatch: dispatchSpy };
        errorComponent.props = { dispatch: dispatchSpy };
        spyOn(component, 'fetch').and.callThrough();
        return {component, dispatchSpy, errorComponent};
    }

    it('should have initial state', () => {
        const {component} = setup();
        expect(component.error).toBeNull();
        expect(component.state).toEqual('STALE');
        expect(component.data).toEqual('NOTHING YET!');
    })

    describe('receiving unknown action type', () => {

        it('should ignore the action', () => {
            const { component } = setup();
            component.data = 'A';
            component.state = 'B';
            component.error = 'C';
            const newComponent = component.reduce(component, { type: 'UNKNOWN' })
            expect(newComponent.data).toEqual('A');
            expect(newComponent.state).toEqual('B');
            expect(newComponent.error).toEqual('C');
        })

    })

    describe('receiving DATA_COMPONENT_REQUEST', () => {
        it('should ignore mistargeted actions', () => {
            const { component } = setup();
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_REQUEST,
                component: 'SomeOtherComponent'
            })
            expect(newComponent.data).toEqual('NOTHING YET!');
            expect(newComponent.state).toEqual('STALE');
            expect(newComponent.error).toBeNull();
        })

        it('should update the state', () => {
            const { component } = setup();
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_REQUEST,
                component: 'TestFetchComponent'
            })
            expect(newComponent.data).toEqual('NOTHING YET!');
            expect(newComponent.state).toEqual('REQUESTED');
            expect(newComponent.error).toBeNull();
        })
    })

    describe('receiving DATA_COMPONENT_LOADING', () => {
        it('should ignore mistargeted actions', () => {
            const { component } = setup();
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_LOADING,
                component: 'SomeOtherComponent'
            })
            expect(newComponent.data).toEqual('NOTHING YET!');
            expect(newComponent.state).toEqual('STALE');
            expect(newComponent.error).toBeNull();
        })

        it('should update the state', () => {
            const { component } = setup();
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_LOADING,
                component: 'TestFetchComponent'
            })
            expect(newComponent.data).toEqual('NOTHING YET!');
            expect(newComponent.state).toEqual('LOADING');
            expect(newComponent.error).toBeNull();
        })
    })

    describe('receiving DATA_COMPONENT_RESPONSE', () => {
        it('should ignore mistargeted actions', () => {
            const { component } = setup();
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_RESPONSE,
                component: 'SomeOtherComponent',
                data: "HERE IS YOUR DATA!"
            })
            expect(newComponent.data).toEqual('NOTHING YET!');
            expect(newComponent.state).toEqual('STALE');
            expect(newComponent.error).toBeNull();
        })

        it('should update the state', () => {
            const { component } = setup();
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_RESPONSE,
                component: 'TestFetchComponent',
                data: "HERE IS YOUR DATA!"
            })
            expect(newComponent.data).toEqual('HERE IS YOUR DATA!');
            expect(newComponent.state).toEqual('FRESH');
            expect(newComponent.error).toBeNull();
        })
    })

    describe('receiving DATA_COMPONENT_INVALIDATE', () => {
        it('should ignore mistargeted actions', () => {
            const { component } = setup();
            component.data = 'PREVIOUS DATA!';
            component.state = 'FRESH';
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_INVALIDATE,
                component: 'SomeOtherComponent'
            })
            expect(newComponent.data).toEqual('PREVIOUS DATA!');
            expect(newComponent.state).toEqual('FRESH');
            expect(newComponent.error).toBeNull();
        })

        it('should update the state', () => {
            const { component } = setup();
            component.data = 'PREVIOUS DATA!';
            component.state = 'FRESH';
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_INVALIDATE,
                component: 'TestFetchComponent'
            })
            expect(newComponent.data).toEqual('PREVIOUS DATA!');
            expect(newComponent.state).toEqual('STALE');
            expect(newComponent.error).toBeNull();
        })

        it('should honor a reset flag', () => {
            const { component } = setup();
            component.data = 'PREVIOUS DATA!';
            component.state = 'FRESH';
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_INVALIDATE,
                component: 'TestFetchComponent',
                reset: true
            })
            expect(newComponent.data).toEqual('NOTHING YET!');
            expect(newComponent.state).toEqual('STALE');
            expect(newComponent.error).toBeNull();
        })

    })

    describe('receiving DATA_COMPONENT_ERROR', () => {
        it('should ignore mistargeted actions', () => {
            const { component } = setup();
            component.data = 'PREVIOUS DATA!';
            component.state = 'STALE';
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_ERROR,
                component: 'SomeOtherComponent',
                error: 'SOMETHING WENT WRONG'
            })
            expect(newComponent.data).toEqual('PREVIOUS DATA!');
            expect(newComponent.state).toEqual('STALE');
            expect(newComponent.error).toBeNull();
        })

        it('should update the state', () => {
            const { component } = setup();
            component.data = 'PREVIOUS DATA!';
            component.state = 'STALE';
            const newComponent = component.reduce(component, {
                type: ActionType.DATA_COMPONENT_ERROR,
                component: 'TestFetchComponent',
                error: 'SOMETHING WENT WRONG'
            })
            expect(newComponent.data).toEqual('PREVIOUS DATA!');
            expect(newComponent.state).toEqual('ERROR');
            expect(newComponent.error).toEqual('SOMETHING WENT WRONG');
        })
    })

    describe('action', () => {

        describe('request', () => {
            it('should dispatch DATA_COMPONENT_REQUEST', () => {
                const { component, dispatchSpy } = setup();
                component.request();
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_REQUEST,
                    component: 'TestFetchComponent'
                })
            })
        })

        describe('invalidate', () => {
            it('should dispatch DATA_COMPONENT_INVALIDATE', () => {
                const { component, dispatchSpy } = setup();
                component.invalidate();
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_INVALIDATE,
                    component: 'TestFetchComponent',
                    reset: false
                })
            })

            it('should should set reset flag if requested', () => {
                const { component, dispatchSpy } = setup();
                component.invalidate(true);
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_INVALIDATE,
                    component: 'TestFetchComponent',
                    reset: true
                })
            })
        })

        describe('forceReload', () => {
            it('should dispatch DATA_COMPONENT_INVALIDATE and DATA_COMPONENT_REQUEST', () => {
                const { component, dispatchSpy } = setup();
                component.forceReload();
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_INVALIDATE,
                    component: 'TestFetchComponent'
                })
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_REQUEST,
                    component: 'TestFetchComponent'
                })
            })
        })

    })

    describe('lifecycle methods', () => {

        describe('componentWillUpdate', () => {

            it('should disable load after state change triggered', () => {

                const current = makeComponent();
                const next = makeComponent();

                current.state = 'REQUESTED';
                next.state = 'LOADING';
                current.doDataLoad = _ => "LOADING";

                expect(current.doDataLoad()).toEqual('LOADING');
                current.componentWillUpdate(next);
                expect(current.doDataLoad()).not.toEqual('LOADING');

            })

        })

        describe('componentDidUpdate', () => {

            describe('when state is REQUESTED', () => {

                it('should load if previous state was ERROR', () => {
                    const current = makeComponent();
                    const previous = makeComponent();
                    current.doDataLoad = jasmine.createSpy('doDataLoad');
                    current.state = 'REQUESTED';
                    previous.state = 'ERROR';
                    current.componentDidUpdate(previous);
                    expect(current.doDataLoad).toHaveBeenCalled();
                })

                it('should load if previous state was STALE', () => {
                    const current = makeComponent();
                    const previous = makeComponent();
                    current.doDataLoad = jasmine.createSpy('doDataLoad');
                    current.state = 'REQUESTED';
                    previous.state = 'STALE';
                    current.componentDidUpdate(previous);
                    expect(current.doDataLoad).toHaveBeenCalled();
                })

                it('should not load when transitioning from any other state', () => {
                    const current = makeComponent();
                    const previous = makeComponent();
                    current.doDataLoad = jasmine.createSpy('doDataLoad');
                    current.state = 'REQUESTED';
                    previous.state = 'REQUESTED';
                    current.componentDidUpdate(previous);
                    previous.state = 'LOADING';
                    current.componentDidUpdate(previous);
                    previous.state = 'FRESH';
                    current.componentDidUpdate(previous);
                    expect(current.doDataLoad).not.toHaveBeenCalled();
                })

            })

        })

    })

    describe('doDataLoad', () => {

        it('should dispatch response on success', (done) => {
            const { component, dispatchSpy } = setup();
            Promise.resolve().then(() => {
                component.doDataLoad();
            }).then(() => {
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_LOADING,
                    component: 'TestFetchComponent'
                });
            }).then(() => {
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_RESPONSE,
                    component: 'TestFetchComponent',
                    data: 'RESULT!'
                })
            }).then(done)
        })

        it('should dispatch error on failure', (done) => {
            const { errorComponent, dispatchSpy } = setup();
            Promise.resolve().then(() => {
                errorComponent.doDataLoad();
            }).then(() => {
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_LOADING,
                    component: 'ErrorFetchComponent'
                });
            }).then(() => {
                expect(dispatchSpy).toHaveBeenCalledWith({
                    type: ActionType.DATA_COMPONENT_ERROR,
                    component: 'ErrorFetchComponent',
                    error: new Error('NO RESULT FOR YOU!')
                })
            }).then(done)
        })

    })

})
