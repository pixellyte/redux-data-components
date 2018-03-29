export default function isComponentProxy(item) {
    return (
        item instanceof Object
            && !item.hasOwnProperty('targetComponent')
            && typeof item.targetComponent !== 'undefined'
    );
}