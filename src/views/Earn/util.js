const axios = require("axios").default;
export const TRADEABLE_TOKENS_POLYGON = [
    {
        name: "Bitcoin",
        symbol: "BTC",
        decimals: 18,
        address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
        displayDecimals: 2
    },
    {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        displayDecimals: 2
    },
    {
        name: "Chainlink",
        symbol: "LINK",
        decimals: 18,
        address: "0xb0897686c545045afc77cf20ec7a532e3120e0f1",
        displayDecimals: 3
    },
    {
        name: "Uniswap",
        symbol: "UNI",
        decimals: 18,
        address: "0xb33eaad8d922b1083446dc23f610c2567fb5180f",
        displayDecimals: 3
    },
    {
        name: "AAVE",
        symbol: "AAVE",
        decimals: 18,
        address: "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
        displayDecimals: 3
    },
    {
        name: "Matic",
        symbol: "MATIC",
        decimals: 18,
        address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        displayDecimals: 4
    },
] ;
export function strictGet(map, key) {
    const match = map.get(key);
    if (match) {
        return match;
    }

    throw new Error(`${groupByMapMany.name}() is missing key: ${key}`);
}
export function groupByMapMany(
    list,
    getKey
) {
    const map = list.reduce((previous, currentItem) => {
        const group = getKey(currentItem);
        if (!previous[group]) previous[group] = [];
        previous[group].push(currentItem);
        return previous;
    }, {});
    return map;
}
export function groupByMap(
    list,
    getKey
) {
    const map = new Map ();
    list.forEach((item) => {
        const key = getKey(item);

        if (map.get(key)) {
            // console.warn(`${groupByMap.name}() is overwriting property: ${key}`);
        }

        map.set(key, item);
    });

    return map;
}
export const TRADEABLE_TOKEN_ADDRESS_MAP = groupByMap(
    TRADEABLE_TOKENS_POLYGON,
    (token) => token.address
);
export const intervalInMsMap = {
    MS: 1,
    MS1000: 1000,
    SEC60: 60000,
    MIN5: 300000,
    MIN15: 900000,
    MIN30: 1800000,
    MIN60: 3600000,
    HR2: 7200000,
    HR4: 14400000,
    HR8: 28800000,
    HR24: 86400000,
    DAY3: 259200000,
    DAY7: 604800000,
    MONTH: 2628000000,
    MONTH2: 5256000000,
    MONTH6: 15552000000,
    YEAR: 31536000000,
    YEAR5: 157680000000,
}
const intervampMap = {
    [intervalInMsMap.SEC60]: "1m",
    [intervalInMsMap.MIN5]: "5m",
    [intervalInMsMap.MIN15]: "15m",
    [intervalInMsMap.MIN60]: "1h",
    [intervalInMsMap.HR2]: "2h",
    [intervalInMsMap.HR4]: "4h",
    [intervalInMsMap.HR8]: "8h",
    [intervalInMsMap.HR24]: "1d",
    [intervalInMsMap.DAY3]: "3d",
    [intervalInMsMap.DAY7]: "1w",
};
// https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
export async function fetchHistoricKline(
    symbol,
    params
) {
    const interval = intervampMap[params.interval];
    const queryParams = new URLSearchParams({
        symbol: symbol + (params.compareWith ?? "USDT"),
        interval,
        limit: String(params.limit),
    });

    if (params.startTime) {
        queryParams.set("startTime", String(params.startTime));
    }

    if (params.endTime) {
        queryParams.set("endTime", String(params.endTime));
    }

    try {
        const res = await axios.get(
            `https://api.binance.com/api/v3/klines?${queryParams.toString()}`
        );
        const kLineData= res.data;
        const klineBars = kLineData.map(([time, open, high, low, close]) => {
            return {
                low: Number(low),
                close: Number(close),
                open: Number(open),
                time: (time / 1000) | 0,
                high: Number(high),
            };
        });
        return klineBars;
    } catch (error) {
        console.log(error);
    }

}