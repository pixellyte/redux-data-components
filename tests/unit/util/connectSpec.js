import connect from '../../../src/util/connect'
import * as ActionType from "../../../lib/constants/actionTypes";

describe('connect', () => {

    class MockComponent {
        constructor(dispatch, classOptions) { this.classOptions = classOptions; this.data = "REDUCED"; }
        reduce(action) { return this; }
    }

    class MockErrorComponent {
        reduce() { throw new Error('MOCK FAILURE') }
    }

    function setup(connectedComponent) {
        const registerSpy = jasmine.createSpy("register");
        const getSpy = jasmine.createSpy("get");
        const putSpy = jasmine.createSpy("put");
        const referenceSpy = jasmine.createSpy("reference").and.returnValue({
            targetComponent: {
                reduce: () => "REFERENCE"
            }
        });
        const probeAction = {
            type: ActionType.DATA_COMPONENT_PROBE,
            methods: { register: registerSpy, get: getSpy, put: putSpy, reference: referenceSpy }
        }
        return { registerSpy, getSpy, putSpy, referenceSpy, probeAction };
    }

    it('optionally takes a classOptions param', () => {
        const options = { test: 'options' };
        const reducer = connect(MockComponent)(options);
        const { probeAction, registerSpy, getSpy, putSpy } = setup(reducer);
        reducer(null, probeAction);
        expect(registerSpy).toHaveBeenCalledWith('MockComponent', MockComponent, options, getSpy);
        expect(putSpy).toHaveBeenCalledWith('MockComponent', 'REFERENCE');
    })

    it('propagates errors', () => {
        const reducer = connect(MockErrorComponent);
        try {
            reducer(undefined, {});
            const { probeAction, registerSpy } = setup(reducer);
            registerSpy.and.throwError(new Error('MOCK FAILURE'));
            reducer(null, probeAction);
            fail('Reducer did not throw exception');
        } catch(e) {
            expect(e.message).toEqual('MOCK FAILURE');
        }
    })

    describe('minification support', () => {

        it('accepts original syntax, with a warning', () => {
            spyOn(console, 'warn')
            const connectedComponent = connect(MockComponent);
            const { probeAction } = setup(connectedComponent);
            expect(console.warn).toHaveBeenCalled();
            connectedComponent(null, probeAction);
            expect(MockComponent.DATA_COMPONENT).toEqual("MockComponent");
        })

        it('accepts new syntax, without a warning', () => {
            spyOn(console, 'warn')
            const connectedComponent = connect('default-component-id', MockComponent);
            const { probeAction } = setup(connectedComponent);
            expect(console.warn).not.toHaveBeenCalled();
            connectedComponent(null, probeAction);
            expect(MockComponent.DATA_COMPONENT).toEqual("default-component-id");
        })

    })
})