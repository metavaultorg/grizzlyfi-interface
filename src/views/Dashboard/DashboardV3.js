import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import cx from "classnames";

import Token from "../../abis/Token.json";

import {
    fetcher,
    formatAmount,
    formatNumber,
    formatKeyAmount,
    useChainId,
    USD_DECIMALS,
    MVXMVLP_DISPLAY_DECIMALS,
    MVLP_DECIMALS,
    POLYGON,
    getPageTitle,
    getProcessedData,
    getBalanceAndSupplyData,
    PLACEHOLDER_ACCOUNT,
    getDepositBalanceData,
    getStakingData,
    getVestingData,
    yesterday,
    today,
} from "../../Helpers";
import {
    useMvxPrice,
    useTotalMvxSupply,
    useInfoTokens,
} from "../../Api";
import { getContract } from "../../Addresses";
import RewardReader from "../../abis/RewardReader.json";
import Vault from "../../abis/Vault.json";
import Reader from "../../abis/Reader.json";
import MvlpManager from "../../abis/MvlpManager.json";

import "./DashboardV3.css";

import SEO from "../../components/Common/SEO";

import { useTotalVolume, useHourlyVolume } from "../../Api";
import ItemCard from '../../components/ItemCard/ItemCard'
import IconPercentage from '../../assets/icons/icon-percentage.svg'
import IconMoney from '../../assets/icons/icon-investments-money.svg'
import IconClaim from '../../assets/icons/icon-claim-reward.svg'
import InnerCard from '../../components/Common/InnerCard'

import IconToken from '../../assets/icons/honey-token.svg'
import IconDown from '../../assets/icons/icon-down.svg'
import Lottie from "lottie-react";
import animationData from './animation_1.json'
import TextBadge from '../../components/Common/TextBadge'
import DownChartArrow from '../../assets/icons/down-chart-arrow.svg'
import UpChartArrow from '../../assets/icons/up-chart-arrow.svg'
import { useTokenPairMarketData } from '../../hooks/useCoingeckoPrices';
import MarketTable from "./MarketTable";
import OpenedPositions from "./OpenedPositions";
import AUMLabel from "../../components/AUMLabel/AUMLabel";
import { useMvlpData } from "../../views/Earn/dataProvider";

export default function DashboardV3(props) {

    
    const { active, library, account } = useWeb3React();
    const { chainId } = useChainId();

    

    const tokenPairMarketList = useTokenPairMarketData();


    const totalVolumeSum = useTotalVolume();
    const volumeInfo = useHourlyVolume();

    

    const vaultAddress = getContract(chainId, "Vault");
    const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
    const readerAddress = getContract(chainId, "Reader");
    const mvlpManagerAddress = getContract(chainId, "MvlpManager");

    const mvxAddress = getContract(chainId, "MVX");
    const mvlpAddress = getContract(chainId, "MVLP");

    const { data: aums } = useSWR([`Dashboard:getAums:${active}`, chainId, mvlpManagerAddress, "getAums"], {
        fetcher: fetcher(library, MvlpManager),
    });

    const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);
    const { mvxPrice } = useMvxPrice({ polygon: chainId === POLYGON ? library : undefined }, active, infoTokens);

    let aum;
    if (aums && aums.length > 0) {
        aum = aums[0].add(aums[1]).div(2);
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

    const totalParams = { from: yesterday(), to: today() } 
    const [totalMvlpData, ] = useMvlpData(totalParams);
    const [totalAum, totalAumDelta, totalAumDeltaPercentage] = useMemo(() => {
        if (!totalMvlpData) {
          return [];
        }
        const total = totalMvlpData[totalMvlpData.length - 1]?.aum;
        const delta = total - totalMvlpData[totalMvlpData.length - 2]?.aum;
        const percentage = Math.abs(delta)/total *100;
        return [total, delta, percentage];
      }, [totalMvlpData]);

    

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
                        <div className={cx('info-change', {
                            positive: volumeInfo > 0,
                            negative: volumeInfo < 0,
                            muted: volumeInfo === 0,
                        })}>
                            <img src={volumeInfo > 0 ? UpChartArrow : DownChartArrow} alt="icon" />
                            {(volumeInfo / totalVolumeSum * 100).toFixed(2)}%
                            (${formatAmount(volumeInfo, USD_DECIMALS, 0, true)})
                            <span style={{ opacity: '0.5', }}>24h</span>
                        </div>
                    </div>
                </div>
                <div className="total-info">
                    <div className="label">Paid out to GLL Stakers</div>
                    <div>
                        <h1 className="font-number">${formatAmount(totalVolumeSum, USD_DECIMALS, 0, true)}</h1>
                        <div className={cx('info-change', {
                            positive: volumeInfo > 0,
                            negative: volumeInfo < 0,
                            muted: volumeInfo === 0,
                        }, "font-number")}>
                            <img src={volumeInfo > 0 ? UpChartArrow : DownChartArrow} alt="icon" />
                            {(volumeInfo / totalVolumeSum * 100).toFixed(2)}%
                            (${formatAmount(volumeInfo, USD_DECIMALS, 0, true)})
                            <span style={{ opacity: '0.5', }}>24h</span>
                        </div>
                    </div>

                </div>
                <div className="total-info">
                    <div className="label">Assets Under Management</div>
                    <div>
                        <h1 className="font-number"><AUMLabel /></h1>
                        <div className={cx('info-change', {
                            positive: totalAumDelta > 0,
                            negative: totalAumDelta < 0,
                            muted: totalAumDelta === 0,
                        }, "font-number")}>
                            <img src={totalAumDelta > 0 ? UpChartArrow : DownChartArrow} alt="icon" />
                            {formatNumber(totalAumDeltaPercentage, 2, false, false)}%
                            (${formatNumber(Math.abs(totalAumDelta), 2, true, false)})
                            <span style={{ opacity: '0.5', }}>24h</span>
                        </div>
                    </div>

                </div>

            </div>

            {!(processedData.mvlpBalanceUsd > 0) &&
                <div className="section section-noinvestments">
                    <div className="section-header">
                        <h1>No investment Yet</h1>
                        <p className="text-description" style={{ margin: '16px auto 56px', maxWidth: 658, }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas varius tortor nibh, sit amet tempor nibh finibus et. Aenean eu enim justo. Vestibulum aliquam hendrerit molestie. Mauris </p>
                    </div>

                    <div className="DashboardV3-cards">
                        <div className="invest-card">
                            <img src={getImageUrl({
                                path: `start-trading`,
                                format: 'png'
                            })} alt="" />
                            <h1>Start Trading</h1>
                            <p className="text-description">Experience purely decentralized trading on Grizzly. Trade your favorite bluechip Cryptocurrencies instantly with up to 50x leverage</p>
                            <div className="w-full" style={{ maxWidth: 512 }}>
                                <Link to="" className="btn-primary ">
                                    Trade Now
                                </Link>
                            </div>
                        </div>
                        <div className="invest-card">
                            <img src={getImageUrl({
                                path: `earn-real-yield`,
                                format:'png'
                            })} alt="" />
                            <h1>Earn Real Yield</h1>
                            <p className="text-description">Get to earn real yield in BTC, ETH and other bluechip
                                currencies by providing the liquidity others can use to trade.
                            </p>
                            <div className="w-full" style={{ maxWidth: 512 }}>
                                <Link to="/earn" className="btn-primary ">
                                    Invest Now
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>}
            {/* {(processedData.mvlpBalanceUsd > 0) && */}
            <div className="section section-investments">
                <div className="section-header">
                    <h1>Your Investments </h1>
                </div>
                <div className="info-card-section" style={{ margin: '40px auto', maxWidth: 952 }}>
                    <ItemCard label='Total PnL' value={`$${formatKeyAmount(processedData, "totalMvlpRewardsUsd", USD_DECIMALS, 2, true)}`} icon={IconPercentage} />
                    <ItemCard label='Your GLL deposit' value={`$${formatKeyAmount(processedData, "mvlpBalanceUsd", USD_DECIMALS, 2, true)}`} icon={IconMoney} />
                    <ItemCard style={{ width: '-webkit-fill-available', }} label='Claimable' value='$92.21' icon={IconClaim} buttonEle={<button
                        className="btn-secondary "
                        style={{ width: 75, height: 32 }}
                    >
                        Claim
                    </button>}
                    />
                </div>
                <InnerCard title='Your Opened Positions'>
                    <OpenedPositions tokenPairMarketList={tokenPairMarketList} />
                </InnerCard>
                <InnerCard title='Your GLL Vault' style={{ marginTop: 8 }}>
                    <div className="list-table">
                        <table className="table-bordered" style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                            <thead>
                                <tr >
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
                                            <td className="font-number">{item.apy}</td>
                                            <td className="font-number">{item.locked}</td>
                                            <td className="font-number">{item.invest}</td>
                                            <td className="font-number">{item.poolShare}</td>
                                            <td>
                                                <span className={cx({
                                                    positive: item.profit > 0,
                                                    negative: item.profit < 0,
                                                    muted: item.profit === 0,
                                                }, "font-number")}>{item.profit}%</span>
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
            {/* } */}

            <div className=" section-markets">
                <div className="section-header">
                    <h1>Markets</h1>
                    <p className="text-description" style={{ marginTop: 16 }}>Start leverage trading with Grizzly Pairs and earn up to 50x. </p>
                </div>
                <MarketTable />

            </div>

            <div className=" section leverage-liquidity-container">
                <div style={{ textAlign: 'center' }}>
                    {/* <img src={LiquidityPng} alt="liquidity" /> */}
                    <Lottie animationData={animationData} loop={true} style={{ height: 445 }} />
                </div>
                <div className="section-header" >
                    <h1>Grizzly Leverage Liquidity <TextBadge text='Active' bgColor={'rgba(121,255,171,0.1)'} textColor='#79ffab' /></h1>
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
                    <Link to="/earn" className="btn-primary " >
                        Invest More
                    </Link>
                </div>
            </div>
        </div>
    </SEO>
}