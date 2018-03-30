import componentRegistry, {DEFAULT_COMPONENT_REGISTRY_STATE} from "../../../src/registry/componentRegistry";
import * as ActionType from "../../../lib/constants/actionTypes";

class ComponentOne {
    syncReferences() { return false; }
    reduce(action) {
        if(action.type === 'REDUCE_ONE') this.data = 'I REDUCED!';
        else this.data = "ComponentOne";
        return this;
    }
}

class ComponentTwo {
    syncReferences() { return false; }
    reduce(action) {
        this.data = "ComponentTwo";
        return this;
    }
}

describe('componentRegistry', () => {

    describe('unknown action', () => {

        it('has a default state', () => {
            expect(componentRegistry(undefined, {})).toEqual(
                DEFAULT_COMPONENT_REGISTRY_STATE
            );
        })

        it('ignores unknown actions', () => {
            expect(componentRegistry(
                DEFAULT_COMPONENT_REGISTRY_STATE,
                {type: 'UNKNOWN'}
            )).toEqual(DEFAULT_COMPONENT_REGISTRY_STATE);
        })

    })

    describe('receiving DATA_COMPONENT_REGISTER', () => {

        it('accrues reducers and state', () => {

            const registry = componentRegistry(undefined, {});

            const oneComponent = componentRegistry(registry, {
                type: ActionType.DATA_COMPONENT_REGISTER,
                id: 'ComponentOne',
                componentClass: ComponentOne,
                classOptions: {},
                store: {dispatch: _ => _}
            });

            expect(Object.keys(oneComponent.reducers)).toEqual(['ComponentOne']);
            expect(oneComponent.reducers.ComponentOne(undefined, {}).data).toEqual('ComponentOne');
            expect(oneComponent.combinedReducers(undefined, {}).ComponentOne.data).toEqual('ComponentOne');
            expect(oneComponent.state.ComponentOne.data).toEqual('ComponentOne');

            const twoComponents = componentRegistry(oneComponent, {
                type: ActionType.DATA_COMPONENT_REGISTER,
                id: 'ComponentTwo',
                componentClass: ComponentTwo,
                classOptions: {},
                store: {dispatch: _ => _}
            });

            expect(Object.keys(twoComponents.reducers)).toEqual(['ComponentOne', 'ComponentTwo']);
            expect(twoComponents.reducers.ComponentTwo(undefined, {}).data).toEqual('ComponentTwo');
            const reduction = twoComponents.combinedReducers(undefined, {});
            expect(reduction.ComponentOne.data).toEqual('ComponentOne');
            expect(reduction.ComponentTwo.data).toEqual('ComponentTwo');
            expect(twoComponents.state.ComponentOne.data).toEqual('ComponentOne');
            expect(twoComponents.state.ComponentTwo.data).toEqual('ComponentTwo');
        })

    })

    describe('receiving DATA_COMPONENT_UPDATE', () => {

        it('updates the specified component reducer', () => {
            const registry = componentRegistry(undefined, {});
            const oneComponent = componentRegistry(registry, {
                type: ActionType.DATA_COMPONENT_REGISTER,
                id: 'ComponentOne',
                componentClass: ComponentOne,
                classOptions: {},
                store: {dispatch: _ => _}
            });
            spyOn(oneComponent, 'combinedReducers');
            const updatedComponent = new ComponentOne();
            updatedComponent.data = 'UpdatedComponentOne';
            const updated = componentRegistry(oneComponent, {
                type: ActionType.DATA_COMPONENT_UPDATE,
                id: 'ComponentOne',
                component: updatedComponent
            });
            expect(oneComponent.combinedReducers).not.toHaveBeenCalled();
            expect(updated.state.ComponentOne.data).toEqual('UpdatedComponentOne');
        })

    })

    describe('receiving unspecified action', () => {

        it('updates the state using accrued reducers', () => {
            const registry = componentRegistry(undefined, {});
            const oneComponent = componentRegistry(registry, {
                type: ActionType.DATA_COMPONENT_REGISTER,
                id: 'ComponentOne',
                componentClass: ComponentOne,
                classOptions: {},
                store: {dispatch: _ => _}
            });

            const updated = componentRegistry(oneComponent, {
                type: 'REDUCE_ONE'
            });

            expect(updated.reducers).toEqual(oneComponent.reducers);
            expect(updated.combinedReducers).toEqual(oneComponent.combinedReducers);
            expect(updated.state.ComponentOne.data).toEqual('I REDUCED!');

        })

    })

})