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
const vaultList = [
    { symbol: 'ETH',  apy: '15.4', locked: '104.41', invest: '21221', poolShare: '0.96%', profit: '521.52',},

]

export default function DashboardV3() { 
    return <SEO title={getPageTitle("Dashboard")}>
        <div className="default-container DashboardV2 page-layout">
            <div className=" section-total-info">
                <div className="total-info">
                    <div className="label">Total Trading Volume</div>
                    <h1>$123456</h1>
                    <div className="info-change positive">12.4%($113.4) <span style={{ opacity: '0.5', marginLeft:4}}>24h</span></div>
                </div>
                <div className="total-info">
                    <div className="label">Paid out to GLL Stakers</div>
                    <h1>$123456</h1>
                    <div className="info-change positive">12.4%($113.4) <span style={{ opacity: '0.5', marginLeft: 4 }}>24h</span></div>
                </div>
                <div className="total-info">
                    <div className="label">Assets Under Management</div>
                    <h1>$1232</h1>
                    <div className="info-change negative">12.4%(-$113.4) <span style={{ opacity: '0.5', marginLeft: 4 }}>24h</span></div>
                </div>

            </div>

            <div className="section section-noinvestments">
                <div className="section-header">
                    <h1>No investment Yet</h1>
                    <p className="text-description" style={{ marginTop: 16 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas varius tortor nibh, sit amet tempor nibh finibus et. Aenean eu enim justo. Vestibulum aliquam hendrerit molestie. Mauris </p>
                </div>
                
                <div style={{display: 'grid',gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',gap:12,marginTop:56}}>
                    <div className="invest-card">
                        <img />
                        <h1>Start Trading</h1>
                        <p className="text-description">Experience purely decentralized trading on Grizzly. Trade your favorite bluechip Cryptocurrencies instantly with up to 100x leverage</p>
                        <div className="w-full" style={{maxWidth:512}}>
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
            </div>
            <div className="section section-investments">
                <div className="section-header">
                    <h1>Your Investments </h1>
                </div>
                <div className="grid-cols-7" style={{ margin:'40px 200px'}}>
                    <ItemCard className='col-span-2'  label='Total PnL' value='$92.21' icon={IconPercentage}  />
                    <ItemCard className='col-span-2'  label='Your GLL deposit' value='$92.21' icon={IconMoney}  />
                    <ItemCard className='col-span-3'  label='Claimable' value='$92.21' icon={IconClaim} buttonEle={<button
                        className="btn-secondary "
                        style={{width:75,height:32}}
                    >
                        Claim
                    </button>}
                    />
                </div>
                <InnerCard title='Your Opened Positions'>
                    <table className="table-bordered" style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                        <thead>
                            <tr>
                                <th>Position</th>
                                <th>Mkt.Price</th>
                                <th>24h Change</th>
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
                                                    <div style={{fontSize:18,fontWeight:600}}>{position.symbol}</div>
                                                    <div>
                                                        <img src={position.isLong ? IconLong : IconShort} alt="icon" />
                                                        
                                                        <span style={{fontSize:14,fontWeight:500,marginLeft:4}}>{position.levarage}x</span>
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
                    </table>
                </InnerCard>
                <InnerCard title='Your GLL Vault' style={{marginTop:8}}>
                    <table className="table-bordered" style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                        <thead>
                            <tr >
                                <th></th>
                                <th>APY</th>
                                <th>Locked in GLL</th>
                                <th>Your Investment</th>
                                <th>Pool Share</th>
                                <th>Profit</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {vaultList.map((item, index) => {
                                var tokenImage = null;

                                try {
                                    tokenImage = getImageUrl({
                                        path: `coins/others/${item.symbol.toLowerCase()}-original`,
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
                                                        alt={item.symbol}
                                                        width={32}
                                                        height={32}
                                                    />
                                                </div>
                                                <div>{item.symbol}</div>
                                            </div>
                                        </td>
                                        <td>{item.apy}</td>
                                        <td>{item.locked}</td>
                                        <td>{item.invest}</td>
                                        <td>{item.poolShare}</td>
                                        <td>{item.profit}</td>
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
                    </table>
                </InnerCard>
                
            </div>

            <div className=" section-markets">
                <div className="section-header">
                    <h1>Markets</h1>
                    <p className="text-description" style={{marginTop:16}}>Start leverage trading with Grizzly Pairs and earn up to 100x. </p>
                </div>
                <div className="market-card">
                    <table style={{ width: '100%', textAlign: 'left', borderSpacing:'0px 10px' }} cellspacing="0" cellpadding="0">
                        <thead>
                            <tr>
                                <th>Pair</th>
                                <th>Last Price</th>
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
                                            <div style={{display:"flex",alignItems:'center',gap:16}}>
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

            </div>

            <div className=" section leverage-liquidity-container">
                <div style={{textAlign:'center'}}>
                    <img src={LiquidityPng} alt="liquidity" />
                </div>
                <div className="section-header" >
                    <h1>Grizzly Leverage Liquidity</h1>
                    <p className="text-description" style={{marginTop:16,marginBottom:48}}>The Grizzly Leverage Liquidity tokens (GLL) is the counterparty to everyone trading with leverage. Deposit your favourite cryptocurrency and earn a solid yield which comes from the trading fees paid on Grizzly Trade. Earn like an exchange. </p>
                </div>
                <div className="grid-cols-4">
                    <ItemCard label='Price of GLL' value='$92.21' icon={IconToken} />
                    <ItemCard label='Assets in GLL' value='$8921' icon={IconMoney} />
                    <ItemCard label='GLL APY' value='52.22%' icon={IconPercentage} />
                    <ItemCard label='GLL 24h Rewards' value='$521' icon={IconClaim} />
                </div>
                <div style={{ maxWidth: 500, margin: 'auto', marginTop: 80,position:'relative' }}>
                    <div style={{ position: 'absolute',zIndex:'-1', left:17,width:'90%', height: 48, background:'#f2c75c',opacity:'0.6',filter:'blur(41px)'}}></div>
                    <Link to="" className="btn-primary " >
                        Invest Now
                    </Link>
                </div>
            </div>
        </div>
    </SEO>
}