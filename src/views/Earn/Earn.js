import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import useSWR from "swr";
import { BSC, getContract, opBNB } from "../../config/contracts";
import { useAllTokensPerInterval, useInfoTokens } from "../../Api";
import {
  BASIS_POINTS_DIVISOR,
  GLL_DECIMALS,
  PLACEHOLDER_ACCOUNT,
  SECONDS_PER_YEAR,
  USDG_DECIMALS,
  USD_DECIMALS,
  bigNumberify,
  expandDecimals,
  fetcher,
  formatAmount,
  formatKeyAmount,
  getStakingData,
  getTokenInfo,
  getTotalApr,
  useChainId,
} from "../../Helpers";
import Vault from "../../abis/Vault.json";
import IconClaim from "../../assets/icons/icon-claim-reward.svg";
import IconMoney from "../../assets/icons/icon-investments-money.svg";
import IconPercentage from "../../assets/icons/icon-percentage.svg";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import APRLabel from "../../components/APRLabel/APRLabel";
import AUMLabel from "../../components/AUMLabel/AUMLabel";
import TextBadge from "../../components/Common/TextBadge";
import ItemCard from "../../components/ItemCard/ItemCard";
import TooltipComponent from "../../components/Tooltip/Tooltip";
import { getTokens, getWhitelistedTokens } from "../../data/Tokens";
import useWeb3Onboard from "../../hooks/useWeb3Onboard";
import AssetDropdown from "../Dashboard/AssetDropdown";
import "../Exchange/Exchange.css";
import ChartPrice from "./ChartPrice";
import "./Earn.css";
import GllSwapBox from "./GllSwapBox";
import ClaimButtonOpBNB from "../../components/ClaimButton/ClaimButtonOpBNB";
import Earnings from './Earnings'
import { useCoingeckoCurrentPrice } from "../../hooks/useCoingeckoPrices";
import RewardReader from "../../abis/RewardReader.json";
import Reader from "../../abis/Reader.json";
import GllManager from "../../abis/GllManager.json";
import RewardTracker from "../../abis/RewardTracker.json";
import { ethers } from "ethers";

export default function Earn(props) {
  const history = useHistory();
  const [isBuying, setIsBuying] = useState(true);
  const { active, library, account } = useWeb3Onboard();
  const { chainId } = useChainId();
  const gllManagerAddress = getContract(chainId, "GllManager");
  const readerAddress = getContract(chainId, "Reader");
  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const feeGllTrackerAddress = getContract(chainId, "FeeGllTracker");
  const vaultAddress = getContract(chainId, "Vault");
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
  const usdgAddress = getContract(chainId, "USDG");
  const tokensForBalanceAndSupplyQuery = [feeGllTrackerAddress, usdgAddress];
  const { AddressZero } = ethers.constants;
  
  const tokens = getTokens(chainId);
  const tokenAddresses = tokens.map((token) => token.address);
  const { data: tokenBalances } = useSWR([active, chainId, readerAddress, "getTokenBalances", account], {
    fetcher: fetcher(library, Reader, [tokenAddresses]),
  });
  const { infoTokens } = useInfoTokens(library, chainId, active, tokenBalances, undefined, undefined);

  const { data: balancesAndSupplies } = useSWR(
    [
      `Earn:getTokenBalancesWithSupplies:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, Reader, [tokensForBalanceAndSupplyQuery]),
    }
  );


  const { data: totalTokenWeights } = useSWR(
    [`Earn:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: fetcher(library, Vault),
    }
  );

  let adjustedUsdgSupply = bigNumberify(0);

  for (let i = 0; i < tokenList.length; i++) {
    const token = tokenList[i];
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo && tokenInfo.usdgAmount) {
      adjustedUsdgSupply = adjustedUsdgSupply.add(tokenInfo.usdgAmount);
    }
  }

  const getWeightText = (tokenInfo) => {
    if (
      !tokenInfo.weight ||
      !tokenInfo.usdgAmount ||
      !adjustedUsdgSupply ||
      adjustedUsdgSupply.eq(0) ||
      !totalTokenWeights
    ) {
      return "...";
    }

    const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
    const targetWeightBps = tokenInfo.weight.mul(BASIS_POINTS_DIVISOR).div(totalTokenWeights);

    const weightText = `${formatAmount(currentWeightBps, 2, 2, false)}% / ${formatAmount(
      targetWeightBps,
      2,
      2,
      false
    )}%`;

    return (
      <TooltipComponent
        handle={weightText}
        position="right-bottom"
        handleClassName="font-number"
        renderContent={() => {
          return (
            <>
              Current Weight: {formatAmount(currentWeightBps, 2, 2, false)}%<br />
              Target Weight: {formatAmount(targetWeightBps, 2, 2, false)}%<br />
              <br />
              {currentWeightBps.lt(targetWeightBps) && (
                <div>
                  {tokenInfo.symbol} is below its target weight.
                  {/* <br />
                  <br />
                  Get lower fees to{" "}
                  <Link to="/buy_gll" target="_blank" rel="noopener noreferrer">
                    + liq.
                  </Link>{" "}
                  with {tokenInfo.symbol},&nbsp; and to{" "}
                  <Link to="/trade" target="_blank" rel="noopener noreferrer">
                    swap
                  </Link>{" "}
                  {tokenInfo.symbol} for other tokens. */}
                </div>
              )}
              {currentWeightBps.gt(targetWeightBps) && (
                <div>
                  {tokenInfo.symbol} is above its target weight.
                  {/* <br />
                  <br />
                  Get lower fees to{" "}
                  <Link to="/trade" target="_blank" rel="noopener noreferrer">
                    swap
                  </Link>{" "}
                  tokens for {tokenInfo.symbol}. */}
                </div>
              )}
              {/* <br />
              <div>
                <a href="https://docs.grizzly.fi/v/eng/product/grizzly-trade" target="_blank" rel="noopener noreferrer">
                  More Info
                </a>
              </div> */}
            </>
          );
        }}
      />
    );
  };
  // @ts-ignore
  const nativeToken = getTokenInfo(infoTokens, AddressZero);

  const ghnyPrice = useCoingeckoCurrentPrice("GHNY")
  const [allTokensPerInterval,] = useAllTokensPerInterval(library, chainId)
  const gllSupply = balancesAndSupplies ? balancesAndSupplies[1] : bigNumberify(0);

  const { data: aums } = useSWR([`Earn:getAums:${active}`, chainId, gllManagerAddress, "getAums"], {
    fetcher: fetcher(library, GllManager),
  });
  const { data: gllBalance } = useSWR(
    [`Earn:gllBalance:${active}`, chainId, feeGllTrackerAddress, "stakedAmounts", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, RewardTracker),
    }
  );
  let aum;
  if (aums && aums.length > 0) {
    aum = isBuying ? aums[0] : aums[1];
  }
  const gllPrice =
    aum && aum.gt(0) && gllSupply.gt(0)
      ? aum.mul(expandDecimals(1, GLL_DECIMALS)).div(gllSupply)
      : expandDecimals(1, USD_DECIMALS);
  let gllBalanceUsd;
  if (gllBalance) {
    gllBalanceUsd = gllBalance.mul(gllPrice).div(expandDecimals(1, GLL_DECIMALS));
  }
  const gllSupplyUsd = gllSupply.mul(gllPrice).div(expandDecimals(1, GLL_DECIMALS));
  const rewardTrackersForStakingInfo = [feeGllTrackerAddress];
  const { data: stakingInfo } = useSWR(
    chainId === opBNB && [`Earn:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  let [totalApr, tokensApr] = getTotalApr(allTokensPerInterval, ghnyPrice, infoTokens, gllSupply, gllPrice, chainId, stakingInfo, gllSupplyUsd, nativeToken)

  useEffect(() => {
    const hash = history.location.hash.replace("#", "");
    const buying = hash === "redeem" ? false : true;
    setIsBuying(buying);
  }, [history.location.hash]);

  return (
    <div className="Earn  page-layout">
      <div className="section-header" style={{ maxWidth: 1006, margin: "0 auto" }}>
        <h1>
          Grizzly Leverage Liquidity
          <TextBadge text="Low Risk" bgColor={"rgba(158,206,255,0.1)"} textColor="#9eceff" />
        </h1>
        <p className="text-description" style={{ marginTop: 16, marginBottom: 48 }}>
          The Grizzly Leverage Liquidity tokens (GLL) is the counterparty to everyone trading with leverage. Deposit
          your favourite cryptocurrency and earn a solid yield which comes from the trading fees paid on Grizzly Trade.
          Earn like an exchange.{" "}
        </p>
      </div>
      <div className="Earn-content">
        <div className="Earn-left">
          <div className="info-card-section" style={{ maxWidth: 912 }}>
            <ItemCard
              // style={{ minWidth: 218 }}
              label="APR"
              value={tokensApr && tokensApr.length > 0 ?
                <TooltipComponent
                  handle={<label style={{ fontSize: "24px" }}>${totalApr}</label>}
                  position="right-bottom"
                  handleClassName="font-number"
                  renderContent={() => {
                    return (
                      <>
                        {tokensApr.map((t) => (
                          <div key={t.symbol}>
                            {t.symbol} APR: {t.apr}%
                          </div>
                        ))
                        }
                      </>
                    );
                  }}
                />
                :
                <>${totalApr}</>
              }
              icon={IconPercentage}
            />
            <ItemCard /* style={{ minWidth: 298 }} */ label="Assets Under Management" value={<AUMLabel />} icon={IconMoney} />
            <ItemCard
              // style={{ width: "-webkit-fill-available", minWidth: 320 }}
              label="Claimable Rewards"
              value={
                <APRLabel
                  usePercentage={false}
                  tokenDecimals={18}
                  chainId={chainId}
                  label="feeGllTrackerRewards"
                />
              }
              icon={IconClaim}
              buttonEle={
                <ClaimButtonOpBNB></ClaimButtonOpBNB>
              }
            />
          </div>
          <ChartPrice gllPrice={gllPrice} />
        </div>
        <div className="Earn-right">
          <div className="Exchange-swap-box">
            <GllSwapBox {...props} isBuying={isBuying} setIsBuying={setIsBuying} getWeightText={getWeightText} gllPrice={gllPrice} infoTokens={infoTokens} gllBalance={gllBalance} />
          </div>
        </div>
      </div>
      {chainId === BSC && <Earnings {...props} />}

      <div className="earn-statistics">
        <div className="inner-card-title">GLL Statistics</div>
        <div className="list-table">
          <table
            style={{ width: "100%", textAlign: "left", borderSpacing: "0px 10px" }}
            cellSpacing="0"
            cellPadding="0"
          >
            <thead>
              <tr>
                <th>Asset</th>
                <th>Amount</th>
                <th>Value</th>
                <th>Utilization</th>
                <th>Weight/Target</th>
              </tr>
            </thead>
            <tbody>
              {tokenList.map((token, index) => {
                const tokenInfo = infoTokens[token.address];
                let utilization = bigNumberify(0);
                if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                  utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                }
                const maxUsdgAmount = tokenInfo.maxUsdgAmount;

                var tokenImage = null;

                try {
                  tokenImage = getImageUrl({
                    path: `coins/${token.symbol.toLowerCase()}`,
                  });
                } catch (error) {
                  console.error(error);
                }
                return (
                  <tr key={index} style={{ background: "rgba(255,255,255,0.05)" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <img
                          style={{ objectFit: "contain" }}
                          src={tokenImage}
                          alt={token.symbol}
                          width={32}
                          height={32}
                        />
                        <span>{token.name}</span>
                        <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                      </div>
                    </td>
                    <td className="font-number">
                      {formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)}
                    </td>
                    <td>
                      <TooltipComponent
                        handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                        position="right-bottom"
                        handleClassName="font-number"
                        renderContent={() => {
                          return (
                            <>
                              Pool Amount: {formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)}{" "}
                              {token.symbol}
                              <br />
                              <br />
                              Target Min Amount:{" "}
                                  {formatKeyAmount(tokenInfo, "bufferAmount", token.decimals, 2, true)} {token.symbol}
                                  <br />
                                  <br />
                              Max {tokenInfo.symbol} Capacity: ${formatAmount(maxUsdgAmount, 18, 0, true)}
                            </>
                          );
                        }}
                      />
                    </td>
                    <td className="font-number">{formatAmount(utilization, 2, 2, false)}%</td>
                    <td>{getWeightText(tokenInfo)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="token-grid">
          {tokenList.map((token, index) => {
            const tokenInfo = infoTokens[token.address];
            let utilization = bigNumberify(0);
            if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
              utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
            }
            const maxUsdgAmount = tokenInfo.maxUsdgAmount;

            var tokenImage = null;

            try {
              tokenImage = getImageUrl({
                path: `coins/${token.symbol.toLowerCase()}`,
              });
            } catch (error) {
              console.error(error);
            }
            return (
              <div className="App-card" key={token.name}>
                <div className="App-card-title">
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <img
                      style={{ objectFit: "contain" }}
                      src={tokenImage}
                      alt={token.symbol}
                      width={32}
                      height={32}
                    />
                    <span>{token.name}</span>
                    <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                  </div>
                </div>
                <div className="App-card-divider"></div>
                <div className="App-card-content">
                  <div className="App-card-row">
                    <div className="label">Amount </div>
                    <div className="font-number">
                      {formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)}
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label">Value </div>
                    <div>
                      <TooltipComponent
                        handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                        position="right-bottom"
                        handleClassName="font-number"
                        renderContent={() => {
                          return (
                            <>
                              Pool Amount: {formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)}{" "}
                              {token.symbol}
                              <br />
                              <br />
                              Max {tokenInfo.symbol} Capacity: ${formatAmount(maxUsdgAmount, 18, 0, true)}
                            </>
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label">Utilization </div>
                    <div className="font-number">{formatAmount(utilization, 2, 2, false)}%</div>
                  </div>
                  <div className="App-card-row">
                    <div className="label">Weight/Target </div>
                    <div className="font-number">{getWeightText(tokenInfo)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
