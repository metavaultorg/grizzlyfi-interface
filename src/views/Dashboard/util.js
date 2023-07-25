export function sortArr(arr, key, isAsc) {
    let result = arr.sort(function add(a, b) {
        if (isAsc) {
            return parseFloat(a[key]) - parseFloat(b[key])
        } else { //desc
            return parseFloat(b[key]) - parseFloat(a[key])
        }
    })
    return result
}