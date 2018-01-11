import getIn from "../../../src/util/getIn";

describe('getIn', () => {

    it('accepts an undefined object', () => {
        expect(getIn(undefined, [])).toBeUndefined()
    })

    it('finds a nested item', () => {
        const obj = { a: { b: { c: 'YAY!' } } };
        expect(getIn(obj, ['a', 'b', 'c'])).toEqual('YAY!');
    })

    it('returns undefined when a key is not found', () => {
        const obj = { a: { b: { c: 'YAY!' } } };
        expect(getIn(obj, ['a', 'd', 'x'])).toBeUndefined();
    })

    it('returns undefined if a key is unexpectedly not an object', () => {
        const obj = { a: { b: { c: 'YAY!' } } };
        expect(getIn(obj, ['a', 'b', 'c', 'd'])).toBeUndefined();
    })

    it('returns original object if path is empty', () => {
        const obj = { a: { b: { c: 'YAY!' } } };
        expect(getIn(obj, [])).toEqual(obj);
    })
})