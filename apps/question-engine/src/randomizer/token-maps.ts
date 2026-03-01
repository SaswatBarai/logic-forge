/**
 * Semantic pools for randomizing challenge content.
 * Defeats LLM pattern inference by changing context from "finding max contiguous sum"
 * to "calculating highest sequential voltage rating" or "largest contiguous shipment weight".
 */

export interface TokenSynonymPool {
    [key: string]: string[];
}

export const TOKEN_POOLS: TokenSynonymPool = {
    // Generic arrays / lists
    COLLECTION: [
        "dataPoints", "readings", "measurements", "inventory",
        "payloads", "metrics", "frequencies", "shipments",
        "ledgers", "transactions", "packets", "signals"
    ],

    // Generic loop iterators or elements
    ITEM: [
        "reading", "node", "packet", "metric", "signal",
        "entry", "segment", "record", "datapoint", "batch"
    ],

    // Generic processing functions
    PROCESS: [
        "evaluate", "processData", "analyzeSequence", "computeMetric",
        "calculateSequence", "validateStream", "parsePayload"
    ],

    // Specific context: e-commerce (e.g. for Knapsack)
    ECOMMERCE_VARS: [
        "cartWeight", "maxCapacity", "productValues", "itemWeights",
        "discountFactor", "basketTotal", "shippingLimit"
    ],

    // Specific context: IoT / Hardware (e.g. for algorithms)
    IOT_VARS: [
        "sensorLimit", "voltageArray", "bandwidthCap", "thermalReadings",
        "pingLatency", "transmissionRate", "bufferSize"
    ],

    // Fallbacks
    GENERIC_VARIABLES: [
        "alpha", "beta", "gamma", "delta", "epsilon", "zeta",
        "theta", "iota", "kappa", "lambda", "mu", "nu"
    ],

    GENERIC_FUNCTIONS: [
        "execute", "run", "performTask", "doWork", "compute", "resolve"
    ]
};
