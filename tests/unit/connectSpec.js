import connect from '../../src/connect'

describe('connect', () => {

    class MockComponent {
        constructor() { this.data = "REDUCED"; }
        reduce(i, a, o) { this.classOptions = o; return this; }
    }

    class MockErrorComponent {
        reduce() { throw new Error('MOCK FAILURE') }
    }

    it('generates an instance if none provided', () => {
        const reducer = connect(MockComponent);
        const newInstance = reducer(undefined, {});
        expect(newInstance.data).toEqual('REDUCED');
    })

    it('optionally takes a classOptions param', () => {
        const options = { test: 'options' };
        const reducer = connect(MockComponent)(options);
        const newInstance = reducer(undefined, {});
        expect(newInstance.data).toEqual('REDUCED');
        expect(newInstance.classOptions).toEqual(options);
    })

    it('propagates errors', () => {
        const reducer = connect(MockErrorComponent);
        try {
            reducer(undefined, {});
            fail('Reducer did not throw exception');
        } catch(e) {
            expect(e.message).toEqual('MOCK FAILURE');
        }
    })

    describe('minification support', () => {

        it('accepts original syntax, with a warning', () => {
            spyOn(console, 'warn')
            const reducer = connect(MockComponent);
            expect(console.warn).toHaveBeenCalled();
            expect(MockComponent.DATA_COMPONENT).toEqual("MockComponent");
        })

        it('accepts new syntax, without a warning', () => {
            spyOn(console, 'warn')
            const reducer = connect('default-component-id', MockComponent);
            expect(console.warn).not.toHaveBeenCalled();
            expect(MockComponent.DATA_COMPONENT).toEqual("default-component-id");
        })

    })
})