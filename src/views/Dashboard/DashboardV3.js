import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import TooltipComponent from "../../components/Tooltip/Tooltip";
import tokensBigIcon from "../../assets/icons/tokenIcon.png";
import hexToRgba from "hex-to-rgba";
import { ethers } from "ethers";
import statsIcon from "../../assets/icons/statsIcon.png";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import cx from "classnames";
import { getWhitelistedTokens, getTokenBySymbol } from "../../data/Tokens";
import { getFeeHistory } from "../../data/Fees";
import Token from "../../abis/Token.json";

import {
    fetcher,
    formatAmount,
    formatKeyAmount,
    expandDecimals,
    bigNumberify,
    numberWithCommas,
    formatDate,
    getServerUrl,
    getChainName,
    useChainId,
    USD_DECIMALS,
    MVXMVLP_DISPLAY_DECIMALS,
    MVX_DECIMALS,
    MVLP_DECIMALS,
    BASIS_POINTS_DIVISOR,
    POLYGON,
    getTotalVolumeSum,
    MVLPPOOLCOLORS,
    getPageTitle,
    getProcessedData,
    getBalanceAndSupplyData,
    PLACEHOLDER_ACCOUNT,
    getDepositBalanceData,
    getStakingData,
    getVestingData,
} from "../../Helpers";
import {
    useTotalMvxInLiquidity,
    useMvxPrice,
    useTotalMvxStaked,
    useTotalMvxSupply,
    useInfoTokens,
    useMvdMvxTreasuryHoldings,
    useMvdMvlpTreasuryHoldings,
    useMvxMultisigHoldings,
    useMvxReserveTimelockHoldings,
    useMvxTeamVestingHoldings,
    useProtocolOwnLiquidity,
    useVestingContractHoldings,
} from "../../Api";
import { getContract } from "../../Addresses";
import RewardReader from "../../abis/RewardReader.json";
import Vault from "../../abis/Vault.json";
import Reader from "../../abis/Reader.json";
import MvlpManager from "../../abis/MvlpManager.json";
import Footer from "../../Footer";

import "./DashboardV3.css";

import AssetDropdown from "./AssetDropdown";
import SEO from "../../components/Common/SEO";

import { useTotalVolume, useHourlyVolume, useTotalFees } from "../../Api";
import ItemCard from '../../components/ItemCard/ItemCard'
import DemoIcon from "../../assets/icons/ReferralCodeIcon";
import IconPercentage from '../../assets/icons/icon-percentage.svg'
import IconMoney from '../../assets/icons/icon-investments-money.svg'
import IconClaim from '../../assets/icons/icon-claim-reward.svg'
import InnerCard from '../../components/Common/InnerCard'
import IconLong from '../../assets/icons/icon-long.svg'
import IconShort from '../../assets/icons/icon-short.svg'
import IconToken from '../../assets/icons/honey-token.svg'
import LiquidityPng from '../../assets/liquidity.png'
import IconDown from '../../assets/icons/icon-down.svg'
import Lottie from "lottie-react";
import animationData from './animation_1.json'
const { AddressZero } = ethers.constants;

const tokenPairMarketList = [
    { name: 'BTC/USD', symbol: 'BTC', lastPrice: '$456', change: '1.54', high: '34', low: '13', volume: '123', volumeUsd: '56' },
    { name: 'ETH/USD', symbol: 'ETH', lastPrice: '$456', change: '1.62', high: '34', low: '13', volume: '123', volumeUsd: '56' },
    { name: 'DAI/USD', symbol: 'DAI', lastPrice: '$456', change: '-2.52', high: '34', low: '13', volume: '123', volumeUsd: '56' },
    { name: 'USDT/USD', symbol: 'USDT', lastPrice: '$456', change: '1.62', high: '34', low: '13', volume: '123', volumeUsd: '56' },
]
const positionList = [
    { symbol: 'ETH', isLong: true, levarage: '15.4', marketPrice: '0.9611', change: '-8.05', entryPrice: '0.96', liqPrice: '1.05', colleteral: '10.43', pnl: '-804', },
    { symbol: 'BTC', isLong: false, levarage: '15.4', marketPrice: '0.9611', change: '41.5', entryPrice: '0.96', liqPrice: '1.05', colleteral: '10.43', pnl: '104.41', }
]


export default function DashboardV3() {

    const { active, library, account } = useWeb3React();
    const { chainId } = useChainId();

    const totalVolumeSum = useTotalVolume();
    const volumeInfo = useHourlyVolume();

    const whitelistedTokens = getWhitelistedTokens(chainId);
    const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);
    const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);

    const vaultAddress = getContract(chainId, "Vault");
    const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
    const readerAddress = getContract(chainId, "Reader");
    const mvlpManagerAddress = getContract(chainId, "MvlpManager");

    const mvxAddress = getContract(chainId, "MVX");
    const mvlpAddress = getContract(chainId, "MVLP");
    const usdmAddress = getContract(chainId, "USDM");
    const tokensForSupplyQuery = [mvxAddress, mvlpAddress, usdmAddress];

    const { data: aums } = useSWR([`Dashboard:getAums:${active}`, chainId, mvlpManagerAddress, "getAums"], {
        fetcher: fetcher(library, MvlpManager),
    });

    const { data: totalSupplies } = useSWR(
        [`Dashboard:totalSupplies:${active}`, chainId, readerAddress, "getTokenBalancesWithSupplies", AddressZero],
        {
            fetcher: fetcher(library, Reader, [tokensForSupplyQuery]),
        }
    );

    const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);
    const { mvxPrice } = useMvxPrice({ polygon: chainId === POLYGON ? library : undefined }, active, infoTokens);

    let { polygon: polygonStakedMvx, total: totalStakedMvx } = useTotalMvxStaked();

    let aum;
    if (aums && aums.length > 0) {
        aum = aums[0].add(aums[1]).div(2);
    }

    let mvlpPrice;
    let mvlpSupply;
    let mvlpMarketCap;
    if (aum && totalSupplies && totalSupplies[3]) {
        mvlpSupply = totalSupplies[3];
        mvlpPrice =
            aum && aum.gt(0) && mvlpSupply.gt(0)
                ? aum.mul(expandDecimals(1, MVLP_DECIMALS)).div(mvlpSupply)
                : expandDecimals(1, USD_DECIMALS);
        mvlpMarketCap = mvlpPrice.mul(mvlpSupply).div(expandDecimals(1, MVLP_DECIMALS));
    }

    let tvl;
    if (mvlpMarketCap && mvxPrice && totalStakedMvx) {
        tvl = mvlpMarketCap.add(mvxPrice.mul(totalStakedMvx).div(expandDecimals(1, MVX_DECIMALS)));
    }

    const rewardReaderAddress = getContract(chainId, "RewardReader");
    const esMvxAddress = getContract(chainId, "ES_MVX");
    const stakedMvxTrackerAddress = getContract(chainId, "StakedMvxTracker");
    const bonusMvxTrackerAddress = getContract(chainId, "BonusMvxTracker");
    const bnMvxAddress = getContract(chainId, "BN_MVX");
    const feeMvxTrackerAddress = getContract(chainId, "FeeMvxTracker");
    const feeMvlpTrackerAddress = getContract(chainId, "FeeMvlpTracker");
    const stakedMvlpTrackerAddress = getContract(chainId, "StakedMvlpTracker");

    const mvxVesterAddress = getContract(chainId, "MvxVester");
    const mvlpVesterAddress = getContract(chainId, "MvlpVester");

    const vesterAddresses = [mvxVesterAddress, mvlpVesterAddress];
    const walletTokens = [mvxAddress, esMvxAddress, mvlpAddress, stakedMvxTrackerAddress];
    const depositTokens = [
        mvxAddress,
        esMvxAddress,
        stakedMvxTrackerAddress,
        bonusMvxTrackerAddress,
        bnMvxAddress,
        mvlpAddress,
    ];
    const rewardTrackersForDepositBalances = [
        stakedMvxTrackerAddress,
        stakedMvxTrackerAddress,
        bonusMvxTrackerAddress,
        feeMvxTrackerAddress,
        feeMvxTrackerAddress,
        feeMvlpTrackerAddress,
    ];


    const rewardTrackersForStakingInfo = [
        stakedMvxTrackerAddress,
        bonusMvxTrackerAddress,
        feeMvxTrackerAddress,
        stakedMvlpTrackerAddress,
        feeMvlpTrackerAddress,
    ];

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
    const { data: stakedMvxSupply } = useSWR(
        [`StakeV2:stakedMvxSupply:${active}`, chainId, mvxAddress, "balanceOf", stakedMvxTrackerAddress],
        {
            fetcher: fetcher(library, Token),
        }
    );
    const { data: nativeTokenPrice } = useSWR(
        [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
        {
            fetcher: fetcher(library, Vault),
        }
    );
    const { data: vestingInfo } = useSWR(
        [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, Reader, [vesterAddresses]),
        }
    );

    let { total: mvxSupply } = useTotalMvxSupply();

    const { balanceData, supplyData } = getBalanceAndSupplyData(walletBalances);
    const depositBalanceData = getDepositBalanceData(depositBalances);
    const stakingData = getStakingData(stakingInfo);
    const vestingData = getVestingData(vestingInfo);

    const processedData = getProcessedData(
        balanceData,
        supplyData,
        depositBalanceData,
        stakingData,
        vestingData,
        aum,
        nativeTokenPrice,
        stakedMvxSupply,
        mvxPrice,
        mvxSupply
    );


    const vaultList = [
        { symbol: 'GLL', apy: `${formatKeyAmount(processedData, "mvlpAprTotal", 2, 2, true)}%`, locked: '104.41', invest: `${formatKeyAmount(processedData, "mvlpBalance", MVLP_DECIMALS, 2, true)}`, poolShare: '0.96%', profit: `$${formatKeyAmount(processedData, "totalMvlpRewardsUsd", USD_DECIMALS, 2, true)}`, },

    ]

    return <SEO title={getPageTitle("Dashboard")}>
        <div className="default-container DashboardV2 page-layout">
            <div className="section-total-info">
                <div className="total-info">
                    <div className="label">Total Trading Volume</div>
                    <div>
                        <h1>${formatAmount(totalVolumeSum, USD_DECIMALS, 0, true)}</h1>
                        <div className="info-change positive">
                        {(volumeInfo / totalVolumeSum * 100).toFixed(2)}%(${formatAmount(volumeInfo, USD_DECIMALS, 0, true)})
                        <span style={{ opacity: '0.5', marginLeft: 4 }}>24h</span>
                        </div>
                    </div>
                </div>
                <div className="total-info">
                    <div className="label">Paid out to GLL Stakers</div>
                    <div>
                        <h1>$123456</h1>
                        <div className="info-change positive">12.4%($113.4) <span style={{ opacity: '0.5', marginLeft: 4 }}>24h</span></div>
                    </div>
                    
                </div>
                <div className="total-info">
                    <div className="label">Assets Under Management</div>
                    <div>
                        <h1>${formatAmount(tvl, USD_DECIMALS, 0, true)}</h1>
                        <div className="info-change negative">12.4%(-$113.4) <span style={{ opacity: '0.5', marginLeft: 4 }}>24h</span></div>
                    </div>
                    
                </div>

            </div>

            {!(processedData.mvlpBalanceUsd > 0) &&
                <div className="section section-noinvestments">
                    <div className="section-header">
                        <h1>No investment Yet</h1>
                        <p className="text-description" style={{ margin:'16px auto 56px',maxWidth:658, }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas varius tortor nibh, sit amet tempor nibh finibus et. Aenean eu enim justo. Vestibulum aliquam hendrerit molestie. Mauris </p>
                    </div>

                    <div className="DashboardV3-cards">
                        <div className="invest-card">
                            <img />
                            <h1>Start Trading</h1>
                            <p className="text-description">Experience purely decentralized trading on Grizzly. Trade your favorite bluechip Cryptocurrencies instantly with up to 100x leverage</p>
                            <div className="w-full" style={{ maxWidth: 512 }}>
                                <Link to="" className="btn-primary ">
                                    Trade Now
                                </Link>
                            </div>
                        </div>
                        <div className="invest-card">
                            <img />
                            <h1>Earn real yield</h1>
                            <p className="text-description">Get to earn real yield in BTC, ETH and other bluechip
                                currencies by providing the liquidity others can use to trade.
                            </p>
                            <div className="w-full" style={{ maxWidth: 512 }}>
                                <Link to="" className="btn-primary ">
                                    Invest Now
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>}
            {(processedData.mvlpBalanceUsd > 0) &&
                <div className="section section-investments">
                    <div className="section-header">
                        <h1>Your Investments </h1>
                    </div>
                    <div className="info-card-section" style={{ margin: '40px auto',maxWidth:952 }}>
                        <ItemCard  label='Total PnL'  value={`$${formatKeyAmount(processedData, "totalMvlpRewardsUsd", USD_DECIMALS, 2, true)}`} icon={IconPercentage} />
                        <ItemCard  label='Your GLL deposit' value={`$${formatKeyAmount(processedData, "mvlpBalanceUsd", USD_DECIMALS, 2, true)}`} icon={IconMoney} />
                        <ItemCard style={{ width: '-webkit-fill-available', }} label='Claimable' value='$92.21' icon={IconClaim} buttonEle={<button
                                className="btn-secondary "
                                style={{ width: 75, height: 32 }}
                            >
                                Claim
                            </button>}
                            />
                    </div>
                    <InnerCard title='Your Opened Positions'>
                        <div className="list-table">
                            <table className="table-bordered" style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                                <thead>
                                    <tr>
                                        <th>Position</th>
                                        <th>Mkt.Price</th>
                                        <th>24h Change <img src={IconDown} alt="change" style={{ marginBottom: '-4px' }} /></th>
                                        <th>Entry Price/Liq Price</th>
                                        <th>Collateral</th>
                                        <th>PnL</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positionList.map((position, index) => {
                                        var tokenImage = null;

                                        try {
                                            tokenImage = getImageUrl({
                                                path: `coins/others/${position.symbol.toLowerCase()}-original`,
                                            });
                                        } catch (error) {
                                            console.error(error);
                                        }
                                        return (
                                            <tr
                                                key={index}

                                            >
                                                <td>
                                                    <div className="App-card-title-info">
                                                        <div className="App-card-title-info-icon">
                                                            <img
                                                                style={{ objectFit: "contain" }}
                                                                src={tokenImage || tokenImage.default}
                                                                alt={position.symbol}
                                                                width={32}
                                                                height={32}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 18, fontWeight: 600 }}>{position.symbol}</div>
                                                            <div>
                                                                <img src={position.isLong ? IconLong : IconShort} alt="icon" />

                                                                <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>{position.levarage}x</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{position.marketPrice}</td>
                                                <td><span className={cx({
                                                    positive: position.change > 0,
                                                    negative: position.change < 0,
                                                    muted: position.change === 0,
                                                })}>{position.change}%</span></td>
                                                <td>${position.entryPrice}/${position.liqPrice}</td>
                                                <td>${position.colleteral}</td>
                                                <td><span className={cx({
                                                    positive: position.change > 0,
                                                    negative: position.change < 0,
                                                    muted: position.change === 0,
                                                })}>{position.pnl}</span></td>
                                                <td><button
                                                    className="table-trade-btn"
                                                >
                                                    Trade
                                                </button></td>
                                            </tr>
                                        )
                                    }

                                    )}
                                </tbody>
                            </table></div>
                        <div className="token-grid">
                            {positionList.map((position, index) => { 
                                var tokenImage = null;

                                try {
                                    tokenImage = getImageUrl({
                                        path: `coins/others/${position.symbol.toLowerCase()}-original`,
                                    });
                                } catch (error) {
                                    console.error(error);
                                }
                                return (
                                    <div className="App-card" key={index}>
                                        <div className="App-card-title">
                                            <div style={{ display: "flex", alignItems: 'center', gap: 16 }}>
                                                <img
                                                    style={{ objectFit: "contain" }}
                                                    src={tokenImage || tokenImage.default}
                                                    alt={position.symbol}
                                                    width={32}
                                                    height={32}
                                                />
                                                <span>{position.symbol}</span>
                                            </div>
                                        </div>
                                        <div className="App-card-divider"></div>
                                        <div className="App-card-content">
                                            <div className="App-card-row">
                                                <div className="label">Leverage</div>
                                                <div>
                                                    <img src={position.isLong ? IconLong : IconShort} alt="icon" />

                                                    <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>{position.levarage}x</span>
                                                </div>
                                            </div>
                                            <div className="App-card-row">
                                                <div className="label">Mkt.Price</div>
                                                <div>
                                                    {position.marketPrice}
                                                </div>
                                            </div>
                                            <div className="App-card-row">
                                                <div className="label">24h Change <img src={IconDown} alt="change" style={{ marginBottom: '-4px' }} /></div>
                                                <div>
                                                    <span className={cx({
                                                        positive: position.change > 0,
                                                        negative: position.change < 0,
                                                        muted: position.change === 0,
                                                    })}>{position.change}%</span>
                                                </div>
                                            </div>
                                            <div className="App-card-row">
                                                <div className="label">Entry Price/Liq Price</div>
                                                <div>
                                                    ${position.entryPrice}/${position.liqPrice}
                                                </div>
                                            </div>
                                            <div className="App-card-row">
                                                <div className="label">Collateral</div>
                                                <div>
                                                    ${position.colleteral}
                                                </div>
                                            </div>
                                            <div className="App-card-row">
                                                <div className="label">PnL</div>
                                                <div>
                                                    <span className={cx({
                                                        positive: position.change > 0,
                                                        negative: position.change < 0,
                                                        muted: position.change === 0,
                                                    })}>{position.pnl}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        </InnerCard>
                    <InnerCard title='Your GLL Vault' style={{ marginTop: 8 }}>
                    <div className="list-table">
                        <table className="table-bordered" style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                            <thead>
                                <tr >
                                    <th></th>
                                    <th>APY <img src={IconDown} alt="change" style={{ marginBottom: '-4px' }} /></th>
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
                                        <tr
                                            key={index}

                                        >
                                            <td>
                                                <div className="App-card-title-info">
                                                    <div className="App-card-title-info-icon"
                                                        style={{
                                                            border: 'solid 1px rgba(255, 255, 255, 0.2)',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                            borderRadius: 10,
                                                            width: 34,
                                                            height: 34,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
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
                                            <td>{item.apy}</td>
                                            <td>{item.locked}</td>
                                            <td>{item.invest}</td>
                                            <td>{item.poolShare}</td>
                                            <td>
                                                <span className={cx({
                                                    positive: item.profit > 0,
                                                    negative: item.profit < 0,
                                                    muted: item.profit === 0,
                                                })}>{item.profit}%</span>
                                            </td>

                                            <td><button
                                                className="btn-secondary "

                                            >
                                                Claim
                                            </button></td>
                                        </tr>
                                    )
                                }

                                )}
                            </tbody>
                        </table></div>
                    <div className="token-grid" style={{ gridTemplateColumns: '1fr'}}>
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
                                            <div>
                                                {item.apy}
                                            </div>
                                        </div>
                                        <div className="App-card-row">
                                            <div className="label">Locked in GLL</div>
                                            <div>
                                                {item.locked}
                                            </div>
                                        </div>
                                        <div className="App-card-row">
                                            <div className="label">Your Investment</div>
                                            <div>
                                                {item.invest}
                                            </div>
                                        </div>
                                        <div className="App-card-row">
                                            <div className="label">Pool Share</div>
                                            <div>
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
                                                })}>{item.profit}%</span>
                                            </div>
                                        </div>
                                        
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
                    <p className="text-description" style={{ marginTop: 16 }}>Start leverage trading with Grizzly Pairs and earn up to 100x. </p>
                </div>
                <div className="market-card list-table">
                    <table style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                        <thead>
                            <tr>
                                <th>Pair</th>
                                <th>Last Price <img src={IconDown} alt="change" style={{ marginBottom: '-4px' }} /></th>
                                <th>24h Change</th>
                                <th>24h High</th>
                                <th>24h Low</th>
                                <th>24h Volume</th>
                                <th>24h Volume(USD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokenPairMarketList.map((pairItem, index) => {
                                var tokenImage = null;

                                try {
                                    tokenImage = getImageUrl({
                                        path: `coins/others/${pairItem.symbol.toLowerCase()}-original`,
                                    });
                                } catch (error) {
                                    console.error(error);
                                }
                                return (

                                    <tr
                                        key={index}

                                    >
                                        <td>
                                            <div style={{ display: "flex", alignItems: 'center', gap: 16 }}>
                                                <img
                                                    style={{ objectFit: "contain" }}
                                                    src={tokenImage || tokenImage.default}
                                                    alt={pairItem.symbol}
                                                    width={32}
                                                    height={32}
                                                />
                                                <span>{pairItem.name}</span>
                                            </div>
                                        </td>
                                        <td className={cx({
                                            positive: pairItem.change > 0,
                                            negative: pairItem.change < 0,
                                            muted: pairItem.change === 0,
                                        })}>{pairItem.lastPrice}</td>
                                        <td className={cx({
                                            positive: pairItem.change > 0,
                                            negative: pairItem.change < 0,
                                            muted: pairItem.change === 0,
                                        })}>{pairItem.change}%</td>
                                        <td>{pairItem.high}</td>
                                        <td>{pairItem.low}</td>
                                        <td>{pairItem.volume}</td>
                                        <td>{pairItem.volumeUsd}</td>

                                    </tr>


                                )
                            }

                            )}
                        </tbody>
                    </table>
                </div>
                <div className="token-grid">
                    {tokenPairMarketList.map((pairItem, index) => { 
                        var tokenImage = null;

                        try {
                            tokenImage = getImageUrl({
                                path: `coins/others/${pairItem.symbol.toLowerCase()}-original`,
                            });
                        } catch (error) {
                            console.error(error);
                        }
                        return (
                            <div className="App-card" key={pairItem.name}>
                                <div className="App-card-title">
                                    <div style={{ display: "flex", alignItems: 'center', gap: 16 }}>
                                        <img
                                            style={{ objectFit: "contain" }}
                                            src={tokenImage || tokenImage.default}
                                            alt={pairItem.symbol}
                                            width={32}
                                            height={32}
                                        />
                                        <span>{pairItem.name}</span>
                                    </div>
                                </div>
                                <div className="App-card-divider"></div>
                                <div className="App-card-content">
                                    <div className="App-card-row">
                                        <div className="label">Last Price <img src={IconDown} alt="change" style={{ marginBottom: '-4px' }} /></div>
                                        <div className={cx({
                                            positive: pairItem.change > 0,
                                            negative: pairItem.change < 0,
                                            muted: pairItem.change === 0,
                                        })}>
                                            {pairItem.lastPrice}
                                        </div>
                                    </div>
                                    <div className="App-card-row">
                                        <div className="label">24h Change</div>
                                        <div className={cx({
                                            positive: pairItem.change > 0,
                                            negative: pairItem.change < 0,
                                            muted: pairItem.change === 0,
                                        })}>{pairItem.change}%</div>
                                    </div>
                                    <div className="App-card-row">
                                        <div className="label">24h High</div>
                                        <div>{pairItem.high}</div>
                                    </div>
                                    <div className="App-card-row">
                                        <div className="label">24h Low</div>
                                        <div>{pairItem.low}</div>
                                    </div>
                                    <div className="App-card-row">
                                        <div className="label">24h Volume</div>
                                        <div>{pairItem.volume}</div>
                                    </div>
                                    <div className="App-card-row">
                                        <div className="label">24h Volume(USD)</div>
                                        <div>{pairItem.volumeUsd}</div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            <div className=" section leverage-liquidity-container">
                <div style={{ textAlign: 'center' }}>
                    {/* <img src={LiquidityPng} alt="liquidity" /> */}
                    <Lottie animationData={animationData} loop={true} style={{height:445}} />
                </div>
                <div className="section-header" >
                    <h1>Grizzly Leverage Liquidity</h1>
                    <p className="text-description" style={{ marginTop: 16, marginBottom: 48 }}>The Grizzly Leverage Liquidity tokens (GLL) is the counterparty to everyone trading with leverage. Deposit your favourite cryptocurrency and earn a solid yield which comes from the trading fees paid on Grizzly Trade. Earn like an exchange. </p>
                </div>
                <div className="grid-cols-4 item-card-group">
                    <ItemCard label='Price of GLL' value={`$${formatKeyAmount(processedData, "mvlpPrice", USD_DECIMALS, MVXMVLP_DISPLAY_DECIMALS, true)}`} icon={IconToken} />
                    <ItemCard label='Assets in GLL' value={`$${formatKeyAmount(processedData, "mvlpSupplyUsd", USD_DECIMALS, 2, true)}`} icon={IconMoney} />
                    <ItemCard label='GLL APY' value={`${formatKeyAmount(processedData, "mvlpAprTotal", 2, 2, true)}%`} icon={IconPercentage} />
                    <ItemCard label='GLL 24h Rewards' value='$521' icon={IconClaim} />
                </div>
                <div style={{ maxWidth: 500, margin: 'auto', marginTop: 80, position: 'relative' }}>
                    <div style={{ position: 'absolute', zIndex: '-1', left: 17, width: '90%', height: 48, background: '#f2c75c', opacity: '0.6', filter: 'blur(41px)' }}></div>
                    <Link to="" className="btn-primary " >
                        Invest Now
                    </Link>
                </div>
            </div>
        </div>
    </SEO>
}