// helper.ts

/**
 * Utility function to zip multiple arrays.
 * Similar to 'zip()' function in Python.
 * @template T, U
 * @param {T[]} array1 - The first array.
 * @param {U[]} array2 - The second array.
 * @returns {[T, U][]} The zipped array.
 */
export const zip = <T, U>(array1: T[], array2: U[]): [T, U][] => {
    const length = Math.min(array1.length, array2.length);
    const result: [T, U][] = [];
    for (let i = 0; i < length; i++) {
        result.push([array1[i], array2[i]]);
    }
    return result;
};
