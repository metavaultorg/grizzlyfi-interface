import { useMemo, useState, useEffect } from "react";
import { gql, ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { chain, sumBy, sortBy, maxBy, minBy } from "lodash";



const subgraphUrl = process.env.RAZZLE_SUBGRAPH_URL;
const DEFAULT_GROUP_PERIOD = 86400;


export const NOW_TS = parseInt(Date.now() / 1000);
export const FROM_DATE_TS = NOW_TS - NOW_TS % 86400 - DEFAULT_GROUP_PERIOD * 30; // 15 day before
export const FIRST_DATE_TS = parseInt(+new Date(2022, 5, 1) / 1000);
// hourly  daily weekly total

function getChainSubgraph(chainName) {
    return "sdcrypt0/metavault-mvx-subgraph";
}
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
export function useGraph(querySource, { subgraph = null, subgraphUrl = null, chainName = "polygon" } = {}) {
    const query = gql(querySource);

    if (!subgraphUrl) {
        if (!subgraph) {
            subgraph = getChainSubgraph(chainName);
        }
        subgraphUrl = `https://api.thegraph.com/subgraphs/name/${subgraph}`;
    }

    const client = new ApolloClient({
        link: new HttpLink({ uri: subgraphUrl, fetch }),
        cache: new InMemoryCache(),
    });
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
                console.warn("Subgraph request failed error: %s subgraphUrl: %s", ex.message, subgraphUrl);
                setError(ex);
                setLoading(false);
            });
    }, [querySource, setData, setError, setLoading]);

    return [data, loading, error];
}



export function useMvlpData({ from = FROM_DATE_TS, to = NOW_TS, period = "daily",chainName = "polygon" } = {}) {
    console.log(from, to, 123456)

    const query = `{
    mvlpStats(
      first: 1000
      orderBy: timestamp
      orderDirection: desc
      where: {period: ${period}, timestamp_gte: ${from}, timestamp_lte: ${to}}
    ) {
      timestamp
      aumInUsdm
      mvlpSupply
      distributedUsd
      distributedEth
    }
  }`;
    let [data, loading, error] = useGraph(query, { chainName, subgraphUrl });

    let cumulativeDistributedUsdPerMvlp = 0;
    let cumulativeDistributedEthPerMvlp = 0;
    const mvlpChartData = useMemo(() => {
        if (!data || (data && data.mvlpStats.length === 0)) {
            return null;
        }

        const getTimestamp = (item) => item.timestamp;

        let prevMvlpSupply;
        let prevAum;

        let ret = sortBy(data.mvlpStats, (item) => item.timestamp)
            .filter((item) => item.timestamp % 86400 === 0)
            .reduce((memo, item) => {
                const last = memo[memo.length - 1];

                const aum = Number(item.aumInUsdm) / 1e18;
                const mvlpSupply = Number(item.mvlpSupply) / 1e18;

                const distributedUsd = Number(item.distributedUsd) / 1e30;
                const distributedUsdPerMvlp = distributedUsd / mvlpSupply || 0;
                cumulativeDistributedUsdPerMvlp += distributedUsdPerMvlp;

                const distributedEth = Number(item.distributedEth) / 1e18;
                const distributedEthPerMvlp = distributedEth / mvlpSupply || 0;
                cumulativeDistributedEthPerMvlp += distributedEthPerMvlp;

                const mvlpPrice = aum / mvlpSupply;
                const timestamp = parseInt(item.timestamp);

                const newItem = {
                    timestamp,
                    aum,
                    mvlpSupply,
                    mvlpPrice,
                    cumulativeDistributedEthPerMvlp,
                    cumulativeDistributedUsdPerMvlp,
                    distributedUsdPerMvlp,
                    distributedEthPerMvlp,
                };

                if (last && last.timestamp === timestamp) {
                    memo[memo.length - 1] = newItem;
                } else {
                    memo.push(newItem);
                }

                return memo;
            }, [])
            .map((item) => {
                let { mvlpSupply, aum } = item;
                if (!mvlpSupply) {
                    mvlpSupply = prevMvlpSupply;
                }
                if (!aum) {
                    aum = prevAum;
                }
                item.mvlpSupplyChange = prevMvlpSupply ? ((mvlpSupply - prevMvlpSupply) / prevMvlpSupply) * 100 : 0;
                if (item.mvlpSupplyChange > 1000) item.mvlpSupplyChange = 0;
                item.aumChange = prevAum ? ((aum - prevAum) / prevAum) * 100 : 0;
                if (item.aumChange > 1000) item.aumChange = 0;
                prevMvlpSupply = mvlpSupply;
                prevAum = aum;
                return item;
            });

        ret = fillNa(ret);
        return ret;
    }, [data]);

    return [mvlpChartData, loading, error];
}


