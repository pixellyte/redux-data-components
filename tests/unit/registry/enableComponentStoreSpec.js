import enableComponentStore from "../../../src/registry/enableComponentStore";
import * as ActionType from "../../../lib/constants/actionTypes";
import DataComponent from "../../../src/components/DataComponent";

class TestComponent extends DataComponent {
}

describe('enableComponentStore', () => {

    function setup() {
        const dispatch = jasmine.createSpy('mainDispatch');
        const store = { dispatch }

        const componentStoreActions = [];

        const middlewareSpy = jasmine.createSpy('mockMiddleware')
            .and.callFake(next => action => {
                componentStoreActions.push(action);
                return next(action);
            });

        const mockMiddleware = store => middlewareSpy;

        enableComponentStore(store, mockMiddleware);

        return {
            dispatch,
            store,
            middlewareSpy,
            mockMiddleware,
            componentStoreActions
        };
    }

    it('should augment an existing store', () => {
        const { store, dispatch } = setup();
        expect(typeof store.dispatch).toEqual('function');
        expect(dispatch).not.toEqual(store.dispatch);
    })

    it('should probe main store for data components', () => {
        const { dispatch, componentStoreActions } = setup();
        expect(dispatch).toHaveBeenCalledWith({
            type: ActionType.DATA_COMPONENT_PROBE,
            methods: {
                get: jasmine.anything(),
                put: jasmine.anything(),
                reference: jasmine.anything(),
                register: jasmine.anything(),
                reflection: jasmine.anything(),
                rehydrate: jasmine.anything(),
                defer: jasmine.anything()
            }
        });
        expect(componentStoreActions).toEqual([]);
    })

    it('should pass most messages to both main and component stores', () => {
        const { dispatch, store, middlewareSpy, componentStoreActions } = setup();
        store.dispatch({ type: 'TEST' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'TEST' });
        expect(middlewareSpy).toHaveBeenCalled();
        expect(componentStoreActions).toEqual([{ type: 'TEST' }]);
    })

    it('should not pass persist/* actions to component registry', () => {
        const { store, dispatch, componentStoreActions } = setup();
        store.dispatch({ type: 'persist/PERSIST' });
        store.dispatch({ type: 'persist/REHYDRATE' });
        store.dispatch({ type: 'persist/SOMEOTHERTHING' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'persist/PERSIST' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'persist/REHYDRATE' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'persist/SOMEOTHERTHING' });
        expect(componentStoreActions).toEqual([]);
    })

    it('should not pass DATA_COMPONENT_UPDATE to componentStore via store.dispatch', () => {
        const { store, dispatch, componentStoreActions } = setup();
        store.dispatch({ type: ActionType.DATA_COMPONENT_UPDATE });
        expect(dispatch).toHaveBeenCalledWith({ type: ActionType.DATA_COMPONENT_UPDATE });
        expect(componentStoreActions).toEqual([]);
    })

    describe('component registration', () => {

        describe('register', () => {

            it('should register a component with the component store', () => {
                const { store, dispatch, componentStoreActions } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                expect(componentStoreActions).toEqual([
                    {
                        type: ActionType.DATA_COMPONENT_REGISTER,
                        id: 'component-id', componentClass: TestComponent,
                        classOptions: {}, store
                    }
                ])
            })

        })

        describe('get', () => {

            it('should return the specified component from the store', () => {
                const { dispatch } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                const retrieved = probeAction.methods.get('component-id');
                expect(retrieved instanceof TestComponent).toBeTruthy();
                expect(retrieved.data).toEqual(null);
            })

        })

        describe('put', () => {

            it('should update the specified component in the store', () => {
                const { dispatch } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                const newComponent = new TestComponent(dispatch, {});
                newComponent.data = "UPDATED";
                probeAction.methods.put('component-id', newComponent);
                const retrieved = probeAction.methods.get('component-id');
                expect(retrieved.data).toEqual("UPDATED");
            })

        })

        describe('reference', () => {

            it('should return a proxy to the specified component', () => {
                const { dispatch } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                const newComponent = new TestComponent(dispatch, {});
                newComponent.data = "UPDATED";
                probeAction.methods.put('component-id', newComponent);
                const reference = probeAction.methods.reference('component-id');
                // Test whether this is a proxy to a component.
                expect(reference['__@@_data_component_reference']).toEqual(reference);
                expect(reference.data).toEqual("UPDATED");
            })

            it('should return the same reference multiple times if the object did not change', () => {
                const { dispatch } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                const newComponent = new TestComponent(dispatch, {});
                newComponent.data = "UPDATED";
                probeAction.methods.put('component-id', newComponent);
                const referenceA = probeAction.methods.reference('component-id');
                const referenceB = probeAction.methods.reference('component-id');
                // NOTE: expect(referenceA).toEqual(referenceB) is not a valid test here.
                //       The combination of anonymous proxies and the way objects are
                //       serialized for comparison means ALL references will appear equal
                //       if tested in the usual way.  Object identity comparison still
                //       works though.
                expect(referenceA === referenceB).toEqual(true);
            })

            it('should return a new reference if the object did change', () => {
                const { dispatch } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                const referenceA = probeAction.methods.reference('component-id');
                const newComponent = new TestComponent(dispatch, {});
                newComponent.data = "UPDATED";
                probeAction.methods.put('component-id', newComponent);
                const referenceB = probeAction.methods.reference('component-id');
                expect(referenceA === referenceB).toEqual(false);
            })

            it('should return a new reference if force flag is set', () => {
                const { dispatch } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                const newComponent = new TestComponent(dispatch, {});
                newComponent.data = "UPDATED";
                probeAction.methods.put('component-id', newComponent);
                const referenceA = probeAction.methods.reference('component-id');
                const referenceB = probeAction.methods.reference('component-id', true);
                expect(referenceA === referenceB).toEqual(false);
            })
        })

        describe('reflection', () => {

            it('should reflect component data', () => {
                const { dispatch } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                const newComponent = new TestComponent(dispatch, {});
                newComponent.data = "UPDATED";
                newComponent.updated_at = 12345;
                probeAction.methods.put('component-id', newComponent);
                expect(probeAction.methods.reflection()).toEqual({
                    'component-id': { data: 'UPDATED', updated_at: 12345 }
                })
            })

        })

        describe('rehydrate', () => {

            it('should dispatch state updates', (done) => {
                const { dispatch } = setup();
                const probeAction = dispatch.calls.all()
                    .filter(i => i.args[0].type === ActionType.DATA_COMPONENT_PROBE)[0].args[0];
                probeAction.methods.register('component-id', TestComponent, {});
                const newComponent = new TestComponent(dispatch, {});
                newComponent.data = "UPDATED";
                newComponent.updated_at = 12345;
                probeAction.methods.put('component-id', newComponent);

                const p = probeAction.methods.rehydrate();
                expect(p instanceof Promise).toEqual(true);
                Promise.resolve(p).then(() => {
                    expect(dispatch).toHaveBeenCalledWith({
                        type: ActionType.DATA_COMPONENT_REFLECTOR_REHYDRATED,
                        rehydrate: jasmine.anything()
                    })
                }).then(() => {
                    expect(dispatch).toHaveBeenCalledWith({
                        type: ActionType.DATA_COMPONENT_REFRESH_PROXIES
                    })
                }).then(done);
            })

        })

    })
});