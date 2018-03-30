import ReducerContext from '../../../src/registry/ReducerContext';

describe('ReducerContext', () => {

    function mockComponent() {
        class MockProto {
            myMethod() { return 'my-method-result'; }
        }
        class MockComponent extends MockProto {
            constructor() {
                super();
                this.classOptions = { some: 'class', options: 'here' };
            }
            componentIdentifier() { return 'my-component-name' }
            myMethod() { return `SUPER: ${super.myMethod()}`; }
        }
        return new MockComponent();
    }

    it('wraps a component', () => {
        const mock = mockComponent();
        const context = new ReducerContext(mock, mock.classOptions);
        expect(context.id).toEqual('my-component-name');
        expect(context.classOptions).toEqual({ some: 'class', options: 'here' });
        expect(context.myMethod()).toEqual('SUPER: my-method-result');
    })

    it('infers an empty structures for undefined elements', () => {
        const context = new ReducerContext({
            componentIdentifier: () => 'id'
        });
        expect(context.classOptions).toEqual({})
    })

    it('uses JSON representation as a fingerprint', () => {
        const mock = mockComponent();
        const context = new ReducerContext(mock, mock.classOptions);
        expect(context.fingerprint())
            .toEqual(
                '{"id":"my-component-name","classOptions":{"some":"class","options":"here"}}'
            )
    })

    describe('isTargetFor method', () => {

        it('recognizes matching actions', () => {
            const mock = mockComponent();
            const context = new ReducerContext(mock, mock.classOptions);
            expect(context.isTargetFor({ component: 'my-component-name' })).toBeTruthy();
        })

        it('ignores non-matching actions', () => {
            const mock = mockComponent();
            const context = new ReducerContext(mock, mock.classOptions);
            expect(context.isTargetFor({ component: 'other-component-name' })).toBeFalsy();
        })

        it('does not match actions without component id', () => {
            const mock = mockComponent();
            const context = new ReducerContext(mock, mock.classOptions);
            expect(context.isTargetFor({ })).toBeFalsy();
        })
    })

    describe('rehydrateItem method', () => {

        it('pulls items from rehydrate payload based on item', () => {
            const mock = mockComponent();
            const context = new ReducerContext(mock, mock.classOptions);
            expect(context.rehydrateItem({ data: 'WOOT' }, 'data')).toEqual('WOOT');
        })

    })
})