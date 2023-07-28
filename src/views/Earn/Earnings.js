import React, { useMemo, useRef, useState } from 'react'
import EarningsCard from './EarningsCard'
import { getImageUrl } from "../../cloudinary/getImageUrl";
import GHNYIcon from './icon-ghny-black.svg'
import useWeb3Onboard from '../../hooks/useWeb3Onboard';
import useSWR from 'swr';
import { getContract } from '../../config/contracts';
import { PLACEHOLDER_ACCOUNT, USD_DECIMALS, bigNumberify, expandDecimals, fetcher, formatAmount } from '../../Helpers';
import FeeGllTracker from "../../abis/FeeGllTracker.json";
import Reader from "../../abis/Reader.json";
import RewardRouter from "../../abis/RewardRouterBSC.json";
import { useCoingeckoCurrentPrice } from '../../hooks/useCoingeckoPrices';
import { callContract, useInfoTokens } from '../../Api';
import { getTokens } from '../../data/Tokens';
import { ethers } from 'ethers';
import ClaimButtonOpBSC from '../../components/ClaimButton/ClaimButtonBSC';
import ItemCard from '../../components/ItemCard/ItemCard';
import IconClaim from "../../assets/icons/icon-claim-reward.svg";

export default function Earnings({ setPendingTxns, renderType: viewType }) {
  const { active, library, account, chainId } = useWeb3Onboard();
  const tokens = getTokens(chainId);
  const feeGllTrackerAddress = getContract(chainId, "FeeGllTracker");
  const readerAddress = getContract(chainId, "Reader");
  const rewardRouterAddress = getContract(chainId, "RewardRouter");

  const [isClaiming, setIsClaiming] = useState(false);

  const { data: claimableAll } = useSWR(
    [`Stake:claimableAll:${active}`, chainId, feeGllTrackerAddress, "claimableAll", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, FeeGllTracker, []),
    }
  );
  const tokenAddresses = tokens.map((token) => token.address);
  const { data: tokenBalances } = useSWR(
    [`GllSwap:getTokenBalances:${active}`, chainId, readerAddress, "getTokenBalances", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, Reader, [tokenAddresses]),
    }
  );
  const { infoTokens } = useInfoTokens(library, chainId, active, tokenBalances, undefined);

  const ghnyPrice = useCoingeckoCurrentPrice("GHNY")
  let totalApr = useRef(bigNumberify(0));
  let totalRewardsInUsd = useRef(bigNumberify(0));

  const rewardTokens = useMemo(() => {
    if (!Array.isArray(claimableAll) || claimableAll.length !== 2) return [];
    const [claimableTokens, claimableRewards] = claimableAll
    const result = [];
    for (let i = 0; i < claimableTokens.length; i++) {
      const reward = claimableRewards[i];
      if (claimableTokens[i] === getContract(chainId, "GHNY")) {
        const rewardInUsd = ghnyPrice.mul(reward).div(expandDecimals(1, 18))
        totalRewardsInUsd.current = totalRewardsInUsd.current.add(rewardInUsd);
        // totalApr.current = totalRewardsInUsd.current.mul
        result.push({ token: { address: claimableTokens[i], symbol: "GHNY", displayDecimals: 4 }, reward, rewardInUsd });
      } else {
        const token = infoTokens[claimableTokens[i]];
        if (token) {
          const rewardInUsd = token.maxPrice && token.maxPrice.mul(reward).div(expandDecimals(1, token.decimals))
          result.push({ token, reward, rewardInUsd });
        }
      }
    }
    return result;
  }, [claimableAll, chainId, ghnyPrice, infoTokens])

  let isClaimable = (rewardToken) => {
    return rewardToken && rewardToken.reward && rewardToken.reward.gt(0)
  };

  let isClaimableAll = (rewardTokens) => {
    return rewardTokens && Array.isArray(rewardTokens) && rewardTokens.some(r => r.reward && r.reward.gt(0));
  };

  const claimAll = () => {

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());

    setIsClaiming(true);
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        true,
        false
      ],
      {
        sentMsg: "Claim All submitted!",
        failMsg: "Claim All failed.",
        successMsg: "Claim All completed!",
        setPendingTxns,
      }
    )
      .then(async (res) => {

      })
      .finally(() => {
        setIsClaiming(false);
      });
  };

  return (
    viewType && viewType === "Dashboard" ? (
      <ItemCard
        style={{ width: "-webkit-fill-available" }}
        label="Claimable Rewards"
        value={"$" + formatAmount(totalRewardsInUsd.current, USD_DECIMALS, 2, true)}
        icon={IconClaim}
        buttonEle={
          <button className={"btn-secondary"} style={{ width: 75, height: 32 }} disabled={!active || !isClaimableAll(rewardTokens)} onClick={claimAll}>
            Claim All{isClaiming && '...'}
          </button >
        }
      />
    )
      :
      (
        <div className='Earings'>
          <div className='Earings-left'>
            <h3>Your Earnings</h3>
            <p>Claim your Rewards</p>
          </div>
          <div className='Earings-right'>
            <div className='cards'>
              {rewardTokens && rewardTokens.map((rewardToken) => (
                <EarningsCard
                  disabled={!active || !isClaimable(rewardToken)}
                  key={rewardToken.token.symbol}
                  icon={rewardToken.token.symbol === "GHNY" ? GHNYIcon : getImageUrl({ path: `coins/${rewardToken.token.symbol}` })}
                  tokenName={rewardToken.token.symbol}
                  tokenValue={formatAmount(rewardToken.reward, rewardToken.token.decimals, rewardToken.token.displayDecimals, true)}
                  UsdValue={formatAmount(rewardToken.rewardInUsd, USD_DECIMALS, 2, true)}
                  action={<ClaimButtonOpBSC token={rewardToken.token.address} />}
                />
              ))}

              <button className={"btn-secondary claim-all-btn"} style={{ height: 56, }} disabled={!active || !isClaimableAll(rewardTokens)} onClick={claimAll}>
                Claim All{isClaiming && '...'}
              </button >
            </div>
          </div>
        </div>
      )
  )
}
