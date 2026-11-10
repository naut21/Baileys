export const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
export const isPlainObjectArray = (value) => Array.isArray(value) && value.every(isPlainObject);
export const isStringArray = (value) => Array.isArray(value) && value.every(item => typeof item === 'string');
export function assertString(value, label) {
    if (typeof value !== 'string') {
        throw new TypeError(`${label} must be a string`);
    }
}
export function assertPlainObject(value, label) {
    if (!isPlainObject(value)) {
        throw new TypeError(`${label} must be a plain object`);
    }
}
//# sourceMappingURL=validation.js.map