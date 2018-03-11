export default function isComponentProxy(item) {
    return (
        item instanceof Object
        && item['__@@_data_component_reference'] === item
    );
}