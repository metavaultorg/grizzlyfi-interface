import { useMemo, useState, useEffect } from "react";
import { limitDecimals, formatNumber, fetcher, expandDecimals } from "../Helpers";
import { getTokenBySymbol } from "../data/Tokens";
import useSWR from "swr";
import axios from "axios";
import { useHourlyVolumeByToken } from "../views/Earn/dataProvider"
import { CHAIN_ID } from "../config/chains";
import { BSC, getContract } from "../config/contracts";

export const FIRST_DATE_TS = parseInt(+new Date(2022, 5, 1) / 1000);
export const NOW_TS = parseInt(new Date().getTime() / 1000);

const defaultFetcher = (url) => axios.get(url).then((res) => res.data);

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
const coins = {
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
    BNB: "binancecoin",
    GHNY: "grizzly-honey"
};
const coinsDefaultPrices = {
    BTC: 27000,
    ETH: 1800,
    MATIC: 0.8,
    WBTC: 27000,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    BNB: 250,
    GHNY: 9,
};
export function useCoingeckoCurrentPrice(symbol) {
    const _symbol = coins[symbol]
    const _defaultPrice = coinsDefaultPrices[symbol]

    const platform = "binance-smart-chain";
    const address = getContract(BSC,symbol).toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${address}&vs_currencies=usd`;
    const { data: res, error } = useSWR(
        [url, address],
        {
            fetcher: defaultFetcher,
            refreshInterval: 100000
        }
    );

    const data = useMemo(() => {
        if (!res || res === undefined || res.length === 0) {
            return expandDecimals(_defaultPrice * 1e6, 24);
        }
        return expandDecimals(Number(res[address].usd) * 1e6, 24);

    }, [res]);

    return data;
}

const rangeFetcher = (url) => {
    const nowTs = parseInt(new Date().getTime() / 1000);
    const onPoint = nowTs - (nowTs % 300);
    const from = onPoint - 86400;
    const to = onPoint;
    
    const newUrl = url + `&from=${from}&to=${to}`;
    return axios.get(newUrl).then((res) => res.data);
};

export function useMarketVolume(chainId, symbol) {

    const ON_HOUR = NOW_TS - (NOW_TS % 300);
    const from = ON_HOUR - 86400;
    const to = ON_HOUR;

    const token = getTokenBySymbol(chainId??CHAIN_ID, symbol).address;
    const [, total, , ,] = useHourlyVolumeByToken({ token, from, to, chainId: chainId });

    const data = useMemo(() => {

        const displayDecimals = getTokenBySymbol(chainId??CHAIN_ID, symbol).displayDecimals || 2;
        return {
            symbol: symbol,
            volume: formatNumber(total && total["volume"] ? total["volume"] : 0, displayDecimals, true, false),
            volumeUsd: formatNumber(total && total["volumeUsd"] ? total["volumeUsd"] : 0, displayDecimals, true, false),
        };
    }, [symbol, total]);

    return [data, null, null];
}

export function useTokenPairMarketData(chainId) {
    
    const [btcPrices] = useMarketVolume(chainId, "BTC");
    const [ethPrices] = useMarketVolume(chainId, "ETH");
    const [bnbPrices] = useMarketVolume(chainId, "BNB");

    const data = useMemo(() => {
        const ret = [];
        if (bnbPrices) ret.push(bnbPrices);
        if (ethPrices) ret.push(ethPrices);
        if (btcPrices) ret.push(btcPrices);
        return ret;
    }, [bnbPrices, ethPrices, btcPrices])
    return data;
}

export function useTokenPriceByPlatform() {
    const platform = "binance-smart-chain";
    const address = "0xa045e37a0d1dd3a45fefb8803d22457abc0a728a";
    const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${address}&vs_currencies=usd`;

    const { data: res, error } = useSWR(
        [url, address],
        {
            fetcher: defaultFetcher,
            refreshInterval: 100000
        }
    );

    const data = useMemo(() => {
        if (!res || res === undefined || res.length === 0) {
            return null;
        }

        return res[address].usd

    }, [res]);

    return data;
}
