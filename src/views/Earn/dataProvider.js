import { useMemo, useState, useEffect } from "react";
import { gql, ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { sortBy ,chain, sumBy } from "lodash";
import { DEFAULT_CHAIN_ID } from "../../config/chains";
import { getCoreGraphClient, getPriceGraphClient, getReferralsGraphClient } from "../../config/subgraph";



const DEFAULT_GROUP_PERIOD = 86400;

const MOVING_AVERAGE_DAYS = 7;
const MOVING_AVERAGE_PERIOD = 86400 * MOVING_AVERAGE_DAYS;

export const NOW_TS = parseInt(Date.now() / 1000);
export const FROM_DATE_TS = NOW_TS - NOW_TS % 86400 - DEFAULT_GROUP_PERIOD * 30; // 15 day before
export const FIRST_DATE_TS = parseInt(+new Date(2022, 5, 1) / 1000);
// hourly  daily weekly total

function fillNa(arr, keys) {
    const prevValues = {};
    if (!keys && arr.length > 0) {
        keys = Object.keys(arr[0]);
        delete keys.timestamp;
        delete keys.id;
    }
    for (const el of arr) {
        for (const key of keys) {
            if (!el[key]) {
                if (prevValues[key]) {
                    el[key] = prevValues[key];
                }
            } else {
                prevValues[key] = el[key];
            }
        }
    }
    return arr;
}
export function useGraph(querySource, { chainId = DEFAULT_CHAIN_ID, subgraph = "core"} = {}) {
    const query = gql(querySource);

    const client = subgraph === "core" ? getCoreGraphClient(chainId) : subgraph === "price" ? getPriceGraphClient(chainId) : getReferralsGraphClient(chainId)
    const [data, setData] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
    }, [querySource, setLoading]);

    useEffect(() => {
        client
            .query({ query })
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch((ex) => {
                console.warn("Subgraph request failed error: %s subgraphUrl: %s", ex.message, subgraph);
                setError(ex);
                setLoading(false);
            });
    }, [querySource, setData, setError, setLoading, client]);

    return [data, loading, error];
}



export function useGllData({ from = FROM_DATE_TS, to = NOW_TS, period = "daily", chainId = DEFAULT_CHAIN_ID } = {}) {
    const query = `{
    gllStats(
      first: 1000
      orderBy: timestamp
      orderDirection: desc
      where: {period: ${period}, timestamp_gte: ${from}, timestamp_lte: ${to}}
    ) {
      timestamp
      aumInUsdg
      gllSupply
      distributedUsd
      distributedEth
    }
  }`;
    let [data, loading, error] = useGraph(query, { chainId });

    let cumulativeDistributedUsdPerGll = 0;
    let cumulativeDistributedEthPerGll = 0;
    const gllChartData = useMemo(() => {
        if (!data || (data && data.gllStats.length === 0)) {
            return null;
        }

        const getTimestamp = (item) => item.timestamp;

        let prevGllSupply;
        let prevAum;

        let ret = sortBy(data.gllStats, (item) => item.timestamp)
            .filter((item) => item.timestamp % 86400 === 0)
            .reduce((memo, item) => {
                const last = memo[memo.length - 1];

                const aum = Number(item.aumInUsdg) / 1e18;
                const gllSupply = Number(item.gllSupply) / 1e18;

                const distributedUsd = Number(item.distributedUsd) / 1e30;
                const distributedUsdPerGll = distributedUsd / gllSupply || 0;
                cumulativeDistributedUsdPerGll += distributedUsdPerGll;

                const distributedEth = Number(item.distributedEth) / 1e18;
                const distributedEthPerGll = distributedEth / gllSupply || 0;
                cumulativeDistributedEthPerGll += distributedEthPerGll;

                const gllPrice = aum / gllSupply;
                const timestamp = parseInt(item.timestamp);

                const newItem = {
                    timestamp,
                    aum,
                    gllSupply,
                    gllPrice,
                    cumulativeDistributedEthPerGll,
                    cumulativeDistributedUsdPerGll,
                    distributedUsdPerGll,
                    distributedEthPerGll,
                };

                if (last && last.timestamp === timestamp) {
                    memo[memo.length - 1] = newItem;
                } else {
                    memo.push(newItem);
                }

                return memo;
            }, [])
            .map((item) => {
                let { gllSupply, aum } = item;
                if (!gllSupply) {
                    gllSupply = prevGllSupply;
                }
                if (!aum) {
                    aum = prevAum;
                }
                item.gllSupplyChange = prevGllSupply ? ((gllSupply - prevGllSupply) / prevGllSupply) * 100 : 0;
                if (item.gllSupplyChange > 1000) item.gllSupplyChange = 0;
                item.aumChange = prevAum ? ((aum - prevAum) / prevAum) * 100 : 0;
                if (item.aumChange > 1000) item.aumChange = 0;
                prevGllSupply = gllSupply;
                prevAum = aum;
                return item;
            });

        ret = fillNa(ret);
        return ret;
    }, [data]);

    return [gllChartData, loading, error];
}

export function useFastPrice({ token, from = FROM_DATE_TS, to = NOW_TS, chainId = DEFAULT_CHAIN_ID } = {}) {
    const timestampProp = "timestamp";
    const tokenLowerCase = token.toLowerCase();
    const query = `{
        fastPrices(
            first: 1000
            orderBy: timestamp
            orderDirection: desc
            where: {period: hourly, token:"${tokenLowerCase}",timestamp_gte: ${from}, timestamp_lte: ${to}}
          ) {
            period
            timestamp
            token
            value
          }
    }`;
    const [graphData, loading, error] = useGraph(query, { chainId, subgraph: "price" });

    const data = useMemo(() => {
        if (!graphData) {
            return null;
        }

        const ret = {};
        sortBy(graphData.fastPrices, timestampProp).map((item) => {
            const timestamp = item[timestampProp];
            ret[timestamp] = item;
        });
        return ret;

    }, [graphData])
    return [data, loading, error];
}

export function useHourlyVolumeByToken({ token, from = FROM_DATE_TS, to = NOW_TS, chainId = DEFAULT_CHAIN_ID } = {}) {
    const PROPS = "margin liquidation swap mint burn".split(" ");
    // const PROPS = "margin".split(" ");
    const timestampProp = "timestamp";
    const query = `{
        hourlyVolumeByTokens(
        first: 1000,
        orderBy: timestamp,
        orderDirection: desc
        where: { tokenA: "${token}", timestamp_gte: ${from}, timestamp_lte: ${to} }
      ) {
        timestamp
        ${PROPS.join("\n")}
      }
    }`;
    const [graphData, loading, error] = useGraph(query, { chainId });
    const [prices] = useFastPrice({ token, from, to, chainId });
    const data = useMemo(() => {
        if (!graphData || !prices) {
            return null;
        }

        let ret = sortBy(graphData.hourlyVolumeByTokens, timestampProp).map((item) => {
            const ret = { timestamp: item[timestampProp] };
            let all = 0;
            PROPS.forEach((prop) => {
                ret[prop] = item[prop] / 1e30;
                all += ret[prop];
            });
            ret.all = all;
            const price = prices[ret.timestamp] ? prices[ret.timestamp].value / 1e30 : 0
            ret.allAmount = ret.all > 0 ? ret.all / price : 0;
            return ret;
        });
        return ret;
    }, [PROPS, graphData, prices]);

    let total = {};
    if (data && data.length) {
        total["volumeUsd"] = data.reduce((accumulator, item) => accumulator += item.all, 0);
        total["volume"] = (prices && Object.keys(prices).length !== 0) ? data.reduce((accumulator, item) => accumulator += item.allAmount, 0) : "-";
    }
    return [data, total, loading, error];
}

export function useFeesData({ from = FROM_DATE_TS, to = NOW_TS, period = "daily", chainId = DEFAULT_CHAIN_ID } = {}) {
    const PROPS = "margin liquidation swap mint burn".split(" ");
    const feesQuery = `{
      feeStats(
        first: 1000
        orderBy: id
        orderDirection: desc
        where: { period: ${period}, timestamp_gte: ${from}, timestamp_lte: ${to} }
      ) {
        id
        margin
        marginAndLiquidation
        swap
        mint
        burn
        timestamp
      }
    }`;

    let [feesData, loading, error] = useGraph(feesQuery, { chainId });

    const feesChartData = useMemo(() => {
        if (!feesData || (feesData && feesData.feeStats.length === 0)) {
            return null;
        }

        let chartData = sortBy(feesData.feeStats, "id").map((item) => {
            const ret = { timestamp: item.timestamp || item.id };

            PROPS.forEach((prop) => {
                if (item[prop]) {
                    ret[prop] = item[prop] / 1e30;
                }
            });

            ret.liquidation = item.marginAndLiquidation / 1e30 - item.margin / 1e30;
            ret.all = PROPS.reduce((memo, prop) => memo + ret[prop], 0);
            return ret;
        });

        let cumulative = 0;
        const cumulativeByTs = {};
        return chain(chartData)
            .groupBy((item) => item.timestamp)
            .map((values, timestamp) => {
                const all = sumBy(values, "all");
                cumulative += all;

                let movingAverageAll;
                const movingAverageTs = Number(timestamp) - MOVING_AVERAGE_PERIOD;
                if (movingAverageTs in cumulativeByTs) {
                    movingAverageAll = (cumulative - cumulativeByTs[movingAverageTs]) / MOVING_AVERAGE_DAYS;
                }

                const ret = {
                    timestamp: Number(timestamp),
                    all,
                    cumulative,
                    movingAverageAll,
                };
                PROPS.forEach((prop) => {
                    ret[prop] = sumBy(values, prop);
                });
                cumulativeByTs[timestamp] = cumulative;
                return ret;
            })
            .value()
            .filter((item) => item.timestamp >= from);
    }, [feesData]);

    return [feesChartData, loading, error];
}

export function useTotalPaidOutToGLLStakers({ from = FROM_DATE_TS, to = NOW_TS, period = "daily", chainId = DEFAULT_CHAIN_ID } = {}) {
    const [totalFeesData, totalFeesLoading] = useFeesData({ from, to, period, chainId });
    const [totalPayout, totalPayoutDelta] = useMemo(() => {
        if (!totalFeesData) {
            return [];
        }
        const total = totalFeesData[totalFeesData.length - 1]?.cumulative;
        const delta = (total - totalFeesData[totalFeesData.length - 2]?.cumulative);
        return [total * 0.5, delta * 0.5];
    }, [totalFeesData]);

    return [totalPayout, totalPayoutDelta, totalFeesLoading]
}
