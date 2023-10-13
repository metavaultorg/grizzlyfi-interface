import { useMemo } from "react";
import useSWR from "swr";
import FeeGllTracker from "../abis/FeeGllTracker.json";
import Reader from "../abis/Reader.json";
import { useInfoTokens } from "../Api";
import { getContract } from "../config/contracts";
import { getTokens } from "../data/Tokens";
import { bigNumberify, expandDecimals, fetcher, PLACEHOLDER_ACCOUNT } from "../Helpers";
import useWeb3Onboard from "../hooks/useWeb3Onboard";
import { useCoingeckoCurrentPrice } from "./useCoingeckoPrices";

export default function useReward() {
  const { active, library, account, chainId } = useWeb3Onboard();
  const tokens = getTokens(chainId);
  const feeGllTrackerAddress = getContract(chainId, "FeeGllTracker");
  const readerAddress = getContract(chainId, "Reader");
  const tokenAddresses = tokens.map((token) => token.address);

  const { data: tokenBalances } = useSWR(
    [`GllSwap:getTokenBalances:${active}`, chainId, readerAddress, "getTokenBalances", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, Reader, [tokenAddresses]),
      refreshInterval: 1000,
    }
  );

  const { infoTokens } = useInfoTokens(library, chainId, active, tokenBalances, undefined);

  const { data: claimableAll } = useSWR(
    [`Stake:claimableAll:${active}`, chainId, feeGllTrackerAddress, "claimableAll", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, FeeGllTracker, []),
    }
  );

  const ghnyPrice = useCoingeckoCurrentPrice("GHNY");
  //    let totalApr = useRef(bigNumberify(0));
  let totalRewardsInUsd = bigNumberify(0);

  const rewardTokens = useMemo(() => {
    if (!Array.isArray(claimableAll) || claimableAll.length !== 2) return [];
    const [claimableTokens, claimableRewards] = claimableAll;
    const result = [];
    for (let i = 0; i < claimableTokens.length; i++) {
      const reward = claimableRewards[i];
      if (claimableTokens[i] === getContract(chainId, "GHNY")) {
        const rewardInUsd = ghnyPrice.mul(reward).div(expandDecimals(1, 18));
        totalRewardsInUsd = totalRewardsInUsd.add(rewardInUsd);
        // totalApr.current = totalRewardsInUsd.current.mul
        result.push({
          token: { address: claimableTokens[i], symbol: "GHNY", displayDecimals: 4 },
          reward,
          rewardInUsd,
        });
      } else {
        const token = infoTokens[claimableTokens[i]];
        if (token) {
          const rewardInUsd = token.maxPrice ? token.maxPrice.mul(reward).div(expandDecimals(1, token.decimals)) : bigNumberify(0);
          totalRewardsInUsd = totalRewardsInUsd.add(rewardInUsd);
          result.push({ token, reward, rewardInUsd });
        }
      }
    }
    return result;
  }, [claimableAll, chainId, ghnyPrice, infoTokens]);

  return { rewardTokens, totalRewardsInUsd };
}
