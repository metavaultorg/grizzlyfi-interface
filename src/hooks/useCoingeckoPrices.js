import { useMemo, useState, useEffect } from "react";
import { limitDecimals, CHAIN_ID } from "../Helpers";
import { getTokenBySymbol } from "../data/Tokens";
import useSWR from "swr";

export const FIRST_DATE_TS = parseInt(+new Date(2022, 5, 1) / 1000);
export const NOW_TS = parseInt(new Date().getTime() / 1000);

const defaultFetcher = (url) => fetch(url).then((res) => res.json());

export function useRequest(url, defaultValue, fetcher = defaultFetcher) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();
    const [data, setData] = useState(defaultValue);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const data = await fetcher(url);
                setData(data);
            } catch (ex) {
                console.error(ex);
                setError(ex);
            }
            setLoading(false);
        }
        fetchData();
    }, [fetcher, url]);

    return [data, loading, error];
}
export function useCoingeckoPrices(symbol) {
    // token ids https://api.coingecko.com/api/v3/coins
    const _symbol = {
        BTC: "bitcoin",
        ETH: "ethereum",
        LINK: "chainlink",
        UNI: "uniswap",
        MATIC: "matic-network",
        WBTC: "wrapped-bitcoin",
        AAVE: "aave",
        USDC: "usd-coin",
        USDT: "tether",
        DAI: "dai",
        BUSD: "binance-usd",
        STMATIC: "lido-staked-matic",
    }[symbol];

    const from = NOW_TS - 86400;
    const to = NOW_TS;

    const url = `https://api.coingecko.com/api/v3/coins/${_symbol}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;

    const [res, loading, error] = useRequest(url);

    const data = useMemo(() => {
        if (!res || res === undefined || res.length === 0) {
            return null;
        }
        if (!res.prices) {
            return null;
        }
        const firstPrice = res.prices[0][1];
        const lastPrice = res.prices[res.prices.length - 1][1];

        const prices = res.prices.map((item) => item[1])

        const high_24h = prices.reduce((previous, current) => Math.max(previous, current))
        const low_24h = prices.reduce((previous, current) => Math.min(previous, current))

        const volumeUsd = res.total_volumes.reduce((accumulator, currentValue) => accumulator + currentValue[1], 0);

        const volume = res.total_volumes.map((v, index) => {
            return v[1] / res.prices[index][1];
        }).reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        const displayDecimals = getTokenBySymbol(CHAIN_ID, symbol).displayDecimals || 2;
        return {
            name: symbol.concat("/USD"),
            symbol: symbol,
            lastPrice: limitDecimals(lastPrice, displayDecimals),
            change: limitDecimals((lastPrice - firstPrice) / firstPrice * 100, 2),
            high: limitDecimals(high_24h, displayDecimals),
            low: limitDecimals(low_24h, displayDecimals),
            volume: limitDecimals(volume, 2),
            volumeUsd: limitDecimals(volumeUsd, 2),
        };
    }, [res, symbol]);
    

    return [data, null, error];
}

export function useTokenPairMarketData() {
    const [btcPrices] = useCoingeckoPrices("BTC");
    const [ethPrices] = useCoingeckoPrices("ETH");
    const [daiPrices] = useCoingeckoPrices("DAI");
    const [busdPrices] = useCoingeckoPrices("BUSD");

    const data = useMemo(() => {
        if (!btcPrices || !ethPrices || !daiPrices || !busdPrices) {
            return [];
        }
        return [btcPrices, ethPrices, daiPrices, busdPrices];
    }, [btcPrices, busdPrices, daiPrices, ethPrices])
    return data;
}