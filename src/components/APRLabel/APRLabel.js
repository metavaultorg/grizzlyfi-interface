import React from "react";

import useSWR from "swr";

import {
  PLACEHOLDER_ACCOUNT,
  fetcher,
  formatKeyAmount,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getProcessedData,
  getStakingData,
} from "../../Helpers";

import GllManager from "../../abis/GllManager.json";
import Reader from "../../abis/Reader.json";
import RewardReader from "../../abis/RewardReader.json";
import Vault from "../../abis/Vault.json";

import { useInfoTokens } from "../../Api";

import useWeb3Onboard from "../../hooks/useWeb3Onboard";
import { getContract, opBNB } from "../../config/contracts";

export default function APRLabel({ chainId, label, usePercentage = true, tokenDecimals = 2, displayDecimals = 2 }) {
  let { active, library, account } = useWeb3Onboard();

  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const readerAddress = getContract(chainId, "Reader");

  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  const gllAddress = getContract(chainId, "GLL");

  const feeGllTrackerAddress = getContract(chainId, "FeeGllTracker");

  const gllManagerAddress = getContract(chainId, "GllManager");

  const walletTokens = [gllAddress];
  const depositTokens = [gllAddress];
  const rewardTrackersForDepositBalances = [feeGllTrackerAddress];
  const rewardTrackersForStakingInfo = [feeGllTrackerAddress];

  const { data: walletBalances } = useSWR(
    [
      `StakeV2:walletBalances:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(undefined, Reader, [walletTokens]),
    }
  );

  const { data: depositBalances } = useSWR(
    [
      `StakeV2:depositBalances:${active}`,
      chainId,
      rewardReaderAddress,
      "getDepositBalances",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(undefined, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
    }
  );

  const { data: stakingInfo } = useSWR(
    chainId === opBNB && [`StakeV2:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(undefined, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const { data: aums } = useSWR([`StakeV2:getAums:${active}`, chainId, gllManagerAddress, "getAums"], {
    fetcher: fetcher(undefined, GllManager),
  });

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: fetcher(undefined, Vault),
    }
  );

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  const { balanceData, supplyData } = getBalanceAndSupplyData(walletBalances);
  const depositBalanceData = getDepositBalanceData(depositBalances);
  const stakingData = getStakingData(stakingInfo);

  const processedData = getProcessedData(
    balanceData,
    supplyData,
    depositBalanceData,
    stakingData,
    aum,
    nativeTokenPrice
  );

  return (
    <>{`${formatKeyAmount(processedData, label, tokenDecimals, displayDecimals, true)}${usePercentage ? "%" : ""}`}</>
  );
}
