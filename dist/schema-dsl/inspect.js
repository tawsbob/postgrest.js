export function inspect(node) {
    return JSON.stringify(node, replacer, 2);
}
function replacer(_key, value) {
    if (value === undefined) {
        return undefined;
    }
    return value;
}
