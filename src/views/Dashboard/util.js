export function sortArr(arr, key, isAsc) {
    let result = arr.sort(function add(a, b) {
        if (isAsc) {
            return a[key] - b[key]
        } else { //desc
            return b[key] - a[key]
        }
    })
    // console.log(result);w
    return result
}