const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const sleepSeconds = (s: number) => sleep(s * 1000)

const getRandom = (min = 0, max = 1) => (Math.random() * (max - min)) + min

const getRandomInt = (min = 0, max = 1) => Math.floor((Math.random() * (max - min + 1)) + min)

const compareArrays = (a1: any[], a2: any[]) => {
    if (!(Array.isArray(a1) && Array.isArray(a2)) || (a1.length !== a2.length)) {
        return false
    }
    const s1 = a1.sort()
    const s2 = a2.sort()
    for (let i = 0; i < a1.length; ++i) {
        if (s1[i] !== s2[i]) {
            return false
        }
    }
    return true
}

function getRandomItemsInSet<T>(n: number, set: T[]): T[] {
    if (n >= set.length) {
        return [...set]
    }

    const res = []
    const workingSet = [...set]

    while (res.length < n) {
        const i = getRandomInt(0, workingSet.length - 1)
        res.push(workingSet[i])
        workingSet.splice(i, 1)
    }

    return res
}

const difference = (a: any[], b: any[]) => {
    const s = new Set(b)
    return a.filter(x => !s.has(x))
}

function indexOfMaxes(arr: any[]): [number[], number] {
    if (arr.length === 0) {
        return [[-1], -1]
    }

    var max = arr[0]
    var maxIndexes = [0]

    for (var i = 1; i < arr.length; i++) {
        if(arr[i] === max) {
            maxIndexes.push(i)
        } else if (arr[i] > max) {
            maxIndexes = [i]
            max = arr[i]
        }
    }

    return [maxIndexes, max]
}

function getMsTimestamp() {
    return new Date().getTime()
}

function initMap<K, V>(keys: any[], value: V): Map<K, V> {
    const result = new Map<K, V>()

    keys.forEach((key: K) => result.set(key, value))

    return result
}

function round(value: number, precision: number) {
    var multiplier = Math.pow(10, precision || 0)
    return Math.round(value * multiplier) / multiplier
}

function areSetsEqual<T>(a: Set<T>, b: Set<T>) {
    return a.size === b.size && [...a].every(value => b.has(value))
}

function sigmoid(x: number, k: number, l: number) {
    return round(1 / (1 + Math.exp(-k*(x - l))), 1)
}

export {
    sleep,
    sleepSeconds,
    getRandom,
    getRandomInt,
    compareArrays,
    getRandomItemsInSet,
    indexOfMaxes,
    getMsTimestamp,
    areSetsEqual,
    difference,
    initMap,
    sigmoid
}

