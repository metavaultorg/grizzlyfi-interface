import cx from "classnames";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { getImageUrl } from "../../cloudinary/getImageUrl";

import { getContract } from "../../config/contracts";
import { callContract } from "../../Api";
import {
  GLL_DECIMALS,
  GLL_DISPLAY_DECIMALS,
  PLACEHOLDER_ACCOUNT,
  USD_DECIMALS,
  fetcher,
  bigNumberify,
  formatAmount,
  formatKeyAmount,
  formatNumber,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getPageTitle,
  getProcessedData,
  getStakingData,
  today,
  useChainId,
  yesterday,
} from "../../Helpers";
import GllManager from "../../abis/GllManager.json";
import Reader from "../../abis/Reader.json";
import RewardReader from "../../abis/RewardReader.json";
import Vault from "../../abis/Vault.json";

import "./DashboardV3.css";

import SEO from "../../components/Common/SEO";

import { useHourlyVolume, useTotalVolume } from "../../Api";
import IconClaim from "../../assets/icons/icon-claim-reward.svg";
import IconMoney from "../../assets/icons/icon-investments-money.svg";
import IconPercentage from "../../assets/icons/icon-percentage.svg";
import InnerCard from "../../components/Common/InnerCard";
import ItemCard from "../../components/ItemCard/ItemCard";

import { ethers } from "ethers";
import Lottie from "lottie-react";
import GrizzlyFaucet from "../../abis/GrizzlyFaucet.json";
import DownChartArrow from "../../assets/icons/down-chart-arrow.svg";
import IconToken from "../../assets/icons/honey-token.svg";
import IconDown from "../../assets/icons/icon-down.svg";
import UpChartArrow from "../../assets/icons/up-chart-arrow.svg";
import APRLabel from "../../components/APRLabel/APRLabel";
import AUMLabel from "../../components/AUMLabel/AUMLabel";
import TextBadge from "../../components/Common/TextBadge";
import { getTokenBySymbol, getWhitelistedTokens } from "../../data/Tokens";
import { useTokenPairMarketData } from "../../hooks/useCoingeckoPrices";
import useWeb3Onboard from "../../hooks/useWeb3Onboard";
import { useGllData } from "../../views/Earn/dataProvider";
import MarketTable from "./MarketTable";
import OpenedPositions from "./OpenedPositions";
import animationData from "./animation_1.json";
import { useInfoTokens } from "../../Api";
import { getPositionQuery, getPositions } from "../Exchange/Exchange";
import ClaimButton from "../../components/ClaimButton/ClaimButton";
import { opBNB } from "../../config/chains";

const claimTypes = [
  { id: "eth", iconPath: "coins/eth", token: "ETH" },
  { id: "btc", iconPath: "coins/btc", token: "BTC" },
  { id: "usdc", iconPath: "coins/usdc", token: "USDC" },
  { id: "usdt", iconPath: "coins/usdt", token: "USDT" },
];

export default function DashboardV3(props) {
  const { connectWallet, savedShowPnlAfterFees, savedIsPnlInLeverage } = props;
  const { active, library, account } = useWeb3Onboard();
  const { chainId } = useChainId();

  const [selectedClaimToken, setSelectedClaimToken] = useState(claimTypes[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenPairMarketList = useTokenPairMarketData();

  const totalVolumeSum = useTotalVolume();
  const volumeInfo = useHourlyVolume();

  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const readerAddress = getContract(chainId, "Reader");
  const gllManagerAddress = getContract(chainId, "GllManager");

  const gllAddress = getContract(chainId, "GLL");

  const { data: aums } = useSWR([`Dashboard:getAums:${active}`, chainId, gllManagerAddress, "getAums"], {
    fetcher: fetcher(library, GllManager),
  });

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const feeGllTrackerAddress = getContract(chainId, "FeeGllTracker");

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
      fetcher: fetcher(library, Reader, [walletTokens]),
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
      fetcher: fetcher(library, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
    }
  );
  const { data: stakingInfo } = useSWR(
    [`StakeV2:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: fetcher(library, Vault),
    }
  );

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

  const totalParams = { from: yesterday(), to: today() };
  const [totalGllData] = useGllData(totalParams);
  const [totalAum, totalAumDelta, totalAumDeltaPercentage] = useMemo(() => {
    if (!totalGllData) {
      return [];
    }
    const total = totalGllData[totalGllData.length - 1]?.aum;
    const delta = total - totalGllData[totalGllData.length - 2]?.aum;
    const percentage = (Math.abs(delta) / total) * 100;
    return [total, delta, percentage];
  }, [totalGllData]);

  const poolShare = ( processedData && processedData.gllBalanceUsd && processedData.gllSupplyUsd) ? processedData.gllBalanceUsd.mul(10000).div(processedData.gllSupplyUsd).toNumber()/100 : 0;
  const vaultList = [
    {
      symbol: "GLL",
      apy: `${formatKeyAmount(processedData, "gllAprTotal", 2, 2, true)}%`,
      locked: `${formatKeyAmount(processedData, "gllSupplyUsd", USD_DECIMALS, 2, true)}`,
      invest: `${formatKeyAmount(processedData, "gllBalance", GLL_DECIMALS, 2, true)}`,
      poolShare: `${poolShare}%`,
      profit: `$${formatKeyAmount(processedData, "totalGllRewardsUsd", USD_DECIMALS, 2, true)}`,
    },
  ];

  function requestToken() {
    const token = getTokenBySymbol(chainId, selectedClaimToken.token);
    const faucetAddress = getContract(chainId, "GrizzlyFaucet");
    const contract = new ethers.Contract(faucetAddress, GrizzlyFaucet.abi, library.getSigner());
    setIsSubmitting(true);
    callContract(chainId, contract, "requestToken", [token.address], {
      sentMsg: "Claiming...",
      failMsg: "Claim failed.",
      successMsg: `Claim Succeed!`,
      // setPendingTxns,
    })
      .then(async () => {})
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  const [pendingPositions, setPendingPositions] = useState({});
  const [updatedPositions, setUpdatedPositions] = useState({});
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const positionQuery = getPositionQuery(whitelistedTokens, nativeTokenAddress);
  const { data: positionData, error: positionDataError } = useSWR(
    active && [active, chainId, readerAddress, "getPositions", vaultAddress, account],
    {
      fetcher: fetcher(library, Reader, [
        positionQuery.collateralTokens,
        positionQuery.indexTokens,
        positionQuery.isLong,
      ]),
    }
  );
  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);
  const { positions, positionsMap } = getPositions(
    chainId,
    positionQuery,
    positionData,
    infoTokens,
    savedIsPnlInLeverage,
    savedShowPnlAfterFees,
    account,
    pendingPositions,
    updatedPositions
  );

  const totalPnl = useMemo(() => {
    const positionsPnl = positions.reduce(
      (accumulator, position) => {
        const hasPositionProfit = position[savedShowPnlAfterFees ? "hasProfitAfterFees" : "hasProfit"];
        const positionDelta = position[savedShowPnlAfterFees ? "pendingDeltaAfterFees" : "pendingDelta"] || bigNumberify(0);
        return hasPositionProfit ? accumulator.add(positionDelta) : accumulator.sub(positionDelta);
      }, bigNumberify(0));

    return positionsPnl;
  }, [positions])

  return (
    <SEO title={getPageTitle("Dashboard")}>
      <div className="default-container DashboardV2 page-layout">
        <div className="faucet">
          <div style={{ fontSize: 20, fontWeight: 600, color: "#afafaf" }}>
            <span style={{ color: "#fff" }}>GrizzlyFi</span>
            &nbsp; is live on&nbsp;
            <a
              href="https://opbnb.bnbchain.org"
              target="_blank"
              rel="noreferrer"
              style={{ fontWeight: "bold", color: "#fff", textDecoration: "none" }}
            >
              opBNB Testnet.
            </a>
            &nbsp; Get your Testnet token via faucet
          </div>
          <div className="faucet-right">
            <div>
              {claimTypes.map((item) => (
                <div
                  style={{
                    display: "inline-flex",
                    marginRight: 8,
                  }}
                >
                  <img
                    style={{
                      objectFit: "none",
                      cursor: "pointer",
                      opacity: selectedClaimToken.id === item.id ? "1" : "0.4",
                      border: selectedClaimToken.id === item.id ? "solid 2px #fff" : "none",
                      borderRadius: 14,
                      boxShadow: selectedClaimToken.id === item.id ? "0 0 0 3px rgba(255, 255, 255, 0.2)" : "none",
                    }}
                    src={getImageUrl({ path: item.iconPath })}
                    alt={""}
                    width={40}
                    height={40}
                    onClick={() => setSelectedClaimToken(item)}
                  />
                </div>
              ))}
            </div>
            {active ? (
              <button disabled={isSubmitting || !active} className="claim-btn" onClick={requestToken}>
                Claim&nbsp;{selectedClaimToken.token}
              </button>
            ) : (
              <button className="claim-btn" onClick={connectWallet}>
                Connect
              </button>
            )}
          </div>
        </div>
        <div className="section-total-info">
          <div className="total-info">
            <div className="label">Total Trading Volume</div>
            <div>
              <h1>${formatAmount(totalVolumeSum, USD_DECIMALS, 0, true)}</h1>
              <div
                className={cx("info-change", {
                  positive: volumeInfo > 0,
                  negative: volumeInfo < 0,
                  muted: volumeInfo === 0,
                })}
              >
                <img src={volumeInfo > 0 ? UpChartArrow : DownChartArrow} alt="icon" />
                {((volumeInfo / totalVolumeSum) * 100).toFixed(2)}% (${formatAmount(volumeInfo, USD_DECIMALS, 0, true)})
                <span>24h</span>
              </div>
            </div>
          </div>
          <div className="total-info">
            <div className="label">Paid out to GLL Stakers</div>
            <div>
              <h1 className="font-number">${formatAmount(totalVolumeSum, USD_DECIMALS, 0, true)}</h1>
              <div
                className={cx(
                  "info-change",
                  {
                    positive: volumeInfo > 0,
                    negative: volumeInfo < 0,
                    muted: volumeInfo === 0,
                  },
                  "font-number"
                )}
              >
                <img src={volumeInfo > 0 ? UpChartArrow : DownChartArrow} alt="icon" />
                {((volumeInfo / totalVolumeSum) * 100).toFixed(2)}% (${formatAmount(volumeInfo, USD_DECIMALS, 0, true)})
                <span>24h</span>
              </div>
            </div>
          </div>
          <div className="total-info">
            <div className="label">Assets Under Management</div>
            <div>
              <h1 className="font-number">
                <AUMLabel />
              </h1>
              <div
                className={cx(
                  "info-change",
                  {
                    positive: totalAumDelta > 0,
                    negative: totalAumDelta < 0,
                    muted: totalAumDelta === 0,
                  },
                  "font-number"
                )}
              >
                <img src={totalAumDelta > 0 ? UpChartArrow : DownChartArrow} alt="icon" />
                {formatNumber(totalAumDeltaPercentage, 2, false, false)}% ($
                {formatNumber(Math.abs(totalAumDelta), 2, true, false)})<span>24h</span>
              </div>
            </div>
          </div>
        </div>

        {(!processedData.gllBalanceUsd || processedData.gllBalanceUsd.eq(0) ) && (positions.length === 0) && (
          <div className="section section-noinvestments">
            <div className="section-header">
              <h1>No Investment Yet</h1>
              <p className="text-description" style={{ margin: "16px auto 56px", maxWidth: 658 }}>
                On Grizzly Trade you can earn in two ways. Outperform the market by trading or go with the market and
                provide liquidity to traders.
              </p>
            </div>

            <div className="DashboardV3-cards">
              <div className="invest-card">
                <img
                  src={getImageUrl({
                    path: `start-trading`,
                    format: "png",
                  })}
                  alt=""
                />
                <h1>Start Trading</h1>
                <p className="text-description">
                  Experience purely decentralized trading on Grizzly. Trade your favorite bluechip Cryptocurrencies
                  instantly with up to 50x leverage
                </p>
                <div className="w-full" style={{ maxWidth: 512 }}>
                  <Link to="" className="btn-primary ">
                    Trade Now
                  </Link>
                </div>
              </div>
              <div className="invest-card">
                <img
                  src={getImageUrl({
                    path: `earn-real-yield`,
                    format: "png",
                  })}
                  alt=""
                />
                <h1>Earn Real Yield</h1>
                <p className="text-description">
                  Get to earn real yield in BTC, ETH and other bluechip currencies by providing the liquidity others can
                  use to trade.
                </p>
                <div className="w-full" style={{ maxWidth: 512 }}>
                  <Link to="/earn" className="btn-primary ">
                    Invest Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        {((processedData.gllBalanceUsd && processedData.gllBalanceUsd.gt(0)) || (positions.length > 0)) &&
        <div className="section section-investments">
          <div className="section-header">
            <h1>Your Investments </h1>
          </div>
          <div className="info-card-section" style={{ margin: "40px auto", maxWidth: 952 }}>
            <ItemCard
              label="Total PnL"
                value={<span
                  className={cx({
                    positive: totalPnl.gt(0),
                    negative: totalPnl.lt(0),
                    muted: totalPnl.eq(0),
                  })}
                >${formatAmount(totalPnl, USD_DECIMALS, 2, true)}</span>}
              icon={IconPercentage}
            />
            <ItemCard
              label="Your GLL deposit"
              value={`$${formatKeyAmount(processedData, "gllBalanceUsd", USD_DECIMALS, 2, true)}`}
              icon={IconMoney}
            />
            <ItemCard
              style={{ width: "-webkit-fill-available" }}
              label="Claimable Rewards (BNB)"
              value={
                <APRLabel
                  usePercentage={false}
                  tokenDecimals={18}
                  chainId={opBNB}
                  label="feeGllTrackerRewards"
                  key="BSC"
                />
              }
              icon={IconClaim}
              buttonEle={
                <ClaimButton></ClaimButton>
              }
            />
          </div>
          <InnerCard title="Your Opened Positions">
            <OpenedPositions
              positions={positions}
              tokenPairMarketList={tokenPairMarketList}
              savedShowPnlAfterFees={savedShowPnlAfterFees}
              savedIsPnlInLeverage={savedIsPnlInLeverage}
            />
          </InnerCard>
          <InnerCard title="Your GLL Vault" style={{ marginTop: 8 }}>
            <div className="list-table">
              <table
                className="table-bordered"
                style={{ width: "100%", textAlign: "left", borderSpacing: "0px 10px" }}
                cellSpacing="0"
                cellPadding="0"
              >
                <thead>
                  <tr>
                    <th></th>
                    <th>APY {/* <img src={IconDown} alt="change" style={{ marginBottom: '-4px' }} /> */}</th>
                    <th>Locked in GLL</th>
                    <th>Your Investment</th>
                    <th>Pool Share</th>
                    <th>Profit</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {vaultList.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td>
                          <div className="App-card-title-info">
                            <div
                              className="App-card-title-info-icon"
                              style={{
                                border: "solid 1px rgba(255, 255, 255, 0.2)",
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                borderRadius: 10,
                                width: 34,
                                height: 34,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <img
                                style={{ objectFit: "contain" }}
                                src={IconToken}
                                alt={item.symbol}
                                width={18}
                                height={18}
                              />
                            </div>
                            <div>{item.symbol}</div>
                          </div>
                        </td>
                        <td className="font-number">{item.apy}</td>
                        <td className="font-number">{item.locked}</td>
                        <td className="font-number">{item.invest}</td>
                        <td className="font-number">{item.poolShare}</td>
                        <td>
                          <span
                            className={cx(
                              {
                                positive: item.profit > 0,
                                negative: item.profit < 0,
                                muted: item.profit === 0,
                              },
                              "font-number"
                            )}
                          >
                            {item.profit}
                          </span>
                        </td>
                        <td>
                          <ClaimButton></ClaimButton>
                        </td>
                      </tr>
                    )}

                                )}
                            </tbody>
                        </table></div>
                    <div className="token-grid" style={{ gridTemplateColumns: '1fr' }}>
                        {vaultList.map((item, index) => {

                            return (
                                <div className="App-card" key={index}>
                                    <div className="App-card-title">
                                        <div style={{ display: "flex", alignItems: 'center', gap: 16 }}>
                                            <img
                                                style={{ objectFit: "contain" }}
                                                src={IconToken}
                                                alt={item.symbol}
                                                width={32}
                                                height={32}
                                            />
                                            <span>{item.symbol}</span>
                                        </div>
                                    </div>
                                    <div className="App-card-divider"></div>
                                    <div className="App-card-content">
                                        <div className="App-card-row">
                                            <div className="label">APY <img src={IconDown} alt="change" style={{ marginBottom: '-4px' }} /></div>
                                            <div className="font-number">
                                                {item.apy}
                                            </div>
                                        </div>
                                        <div className="App-card-row">
                                            <div className="label">Locked in GLL</div>
                                            <div className="font-number">
                                                {item.locked}
                                            </div>
                                        </div>
                                        <div className="App-card-row">
                                            <div className="label">Your Investment</div>
                                            <div className="font-number">
                                                {item.invest}
                                            </div>
                                        </div>
                                        <div className="App-card-row">
                                            <div className="label">Pool Share</div>
                                            <div className="font-number">
                                                {item.poolShare}
                                            </div>
                                        </div>
                                        <div className="App-card-row">
                                            <div className="label">Profit</div>
                                            <div>
                                                <span className={cx({
                                                    positive: item.profit > 0,
                                                    negative: item.profit < 0,
                                                    muted: item.profit === 0,
                                                }, "font-number")}>{item.profit}%</span>
                                            </div>
                                        </div>
                                        <div className="App-card-row"><button
                                            className="btn-secondary w-full "

                                        >
                                            Claim
                                        </button></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </InnerCard>

            </div>
            }

        <div className=" section-markets">
          <div className="section-header">
            <h1>Markets</h1>
            <p className="text-description" style={{ marginTop: 16 }}>
              Start leverage trading with Grizzly Pairs and earn up to 50x.{" "}
            </p>
          </div>
          <MarketTable />
        </div>

        <div className=" section leverage-liquidity-container">
          <div style={{ textAlign: "center" }}>
            {/* <img src={LiquidityPng} alt="liquidity" /> */}
            <Lottie animationData={animationData} loop={true} style={{ height: 445 }} />
          </div>
          <div className="section-header">
            <h1>
              Grizzly Leverage Liquidity{" "}
              <TextBadge text="Active" bgColor={"rgba(121,255,171,0.1)"} textColor="#79ffab" />
            </h1>
            <p className="text-description" style={{ marginTop: 16, marginBottom: 48 }}>
              The Grizzly Leverage Liquidity tokens (GLL) is the counterparty to everyone trading with leverage. Deposit
              your favourite cryptocurrency and earn a solid yield which comes from the trading fees paid on Grizzly
              Trade. Earn like an exchange.{" "}
            </p>
          </div>
          <div className="grid-cols-4 item-card-group">
            <ItemCard
              label="Price of GLL"
              value={`$${formatKeyAmount(processedData, "gllPrice", USD_DECIMALS, GLL_DISPLAY_DECIMALS, true)}`}
              icon={IconToken}
            />
            <ItemCard
              label="Assets in GLL"
              value={`$${formatKeyAmount(processedData, "gllSupplyUsd", USD_DECIMALS, 2, true)}`}
              icon={IconMoney}
            />
            <ItemCard
              label="GLL APY"
              value={`${formatKeyAmount(processedData, "gllAprTotal", 2, 2, true)}%`}
              icon={IconPercentage}
            />
            <ItemCard label="GLL 24h Rewards" value="$..." icon={IconClaim} />
          </div>
          <div style={{ maxWidth: 500, margin: "auto", marginTop: 80, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                zIndex: "-1",
                left: 17,
                width: "90%",
                height: 48,
                background: "#f2c75c",
                opacity: "0.6",
                filter: "blur(41px)",
              }}
            ></div>
            <Link to="/earn" className="btn-primary ">
              Invest More
            </Link>
          </div>
        </div>
      </div>
    </SEO>
  );
}
