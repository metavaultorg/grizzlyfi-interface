import React, { useMemo, useRef, useState } from 'react'
import EarningsCard from './EarningsCard'
import { getImageUrl } from "../../cloudinary/getImageUrl";
import GHNYIcon from './icon-ghny-black.svg'
import useWeb3Onboard from '../../hooks/useWeb3Onboard';
import { getContract } from '../../config/contracts';
import { PLACEHOLDER_ACCOUNT, USD_DECIMALS, bigNumberify, expandDecimals, fetcher, formatAmount } from '../../Helpers';
import RewardRouter from "../../abis/RewardRouterBSC.json";
import { callContract, useInfoTokens } from '../../Api';
import { ethers } from 'ethers';
import ClaimButtonOpBSC from '../../components/ClaimButton/ClaimButtonBSC';
import ItemCard from '../../components/ItemCard/ItemCard';
import IconClaim from "../../assets/icons/icon-claim-reward.svg";
import useReward from "../../hooks/useReward";


export default function Earnings({ setPendingTxns, renderType: viewType }) {
  const { active, library, account, chainId } = useWeb3Onboard();
  const rewardRouterAddress = getContract(chainId, "RewardRouter");
  const [isClaiming, setIsClaiming] = useState(false);
  const {rewardTokens, totalRewardsInUsd} = useReward();

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
    viewType && (viewType === "Dashboard" || viewType === "Earn") ? (
      <ItemCard
        style={{ width: "-webkit-fill-available" }}
        label="Claimable Rewards"
        value={"$" + formatAmount(totalRewardsInUsd, USD_DECIMALS, 2, true)}
        icon={IconClaim}
        buttonEle={
          viewType === "Dashboard" && (
          <button className={"btn-secondary"} style={{ width: 75, height: 32 }} disabled={!active || !isClaimableAll(rewardTokens)} onClick={claimAll}>
            Claim All{isClaiming && '...'}
          </button >)
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
