import { strategies } from "./assignment"

const getStrategies = (version: string) => ({
    assignment: strategies[version],
})

export { getStrategies }