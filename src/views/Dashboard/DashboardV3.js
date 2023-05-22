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



const tokenPairMarketList = [
    { name: 'BTC/USD', lastPrice: '$456', change: '12', high: '34', low: '13', volume: '123', volumeUsd: '56' },
    { name: 'ETH/USD', lastPrice: '$456', change: '12', high: '34', low: '13', volume: '123', volumeUsd: '56' },
    { name: 'BNB/USD', lastPrice: '$456', change: '12', high: '34', low: '13', volume: '123', volumeUsd: '56' },
    { name: 'USDT/USD', lastPrice: '$456', change: '12', high: '34', low: '13', volume: '123', volumeUsd: '56' },
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
            <div className="section section-total-info">
                <div className="total-info">
                    <div className="info-label">Total Trading Volume</div>
                    <div className="info-number">$123456</div>
                    <div className="info-change">12.4%($113.4) <span>24h</span></div>
                </div>
                <div className="total-info">
                    <div className="info-label">Paid out to GLL Stakers</div>
                    <div className="info-number">$123456</div>
                    <div className="info-change">12.4%($113.4) <span>24h</span></div>
                </div>
                <div className="total-info">
                    <div className="info-label">Assets Under Management</div>
                    <div className="info-number">$1232</div>
                    <div className="info-change">12.4%($113.4) <span>24h</span></div>
                </div>

            </div>

            <div className="section section-investments">
                <div className="section-header">
                    <h1>No investment Yet</h1>
                    <p>dadasfagdsgdfgfvxcvxvxvxv </p>
                </div>
                
                <div style={{display: 'grid',gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',gap:12}}>
                    <div className="invest-card">
                        <img />
                        <h1>Start Trading</h1>
                        <p>sdashdhasdhadhadkjasdas</p>
                        <Link to="/" className="btn-primary ">
                            Trade Now
                        </Link>
                    </div>
                    <div className="invest-card">
                        <img />
                        <h1>Earn real yield</h1>
                        <p>sdashdhasdhadhadkjasdas</p>
                        <Link to="/" className="btn-primary ">
                            Invest Now
                        </Link>
                    </div>
                </div>
            </div>
            <div className="section section-investments">
                <div className="section-header">
                    <h1>Your Investments </h1>
                </div>
                <div className="grid-cols-3">
                    <ItemCard label='Total PnL' value='$92.21' icon={<DemoIcon />} />
                    <ItemCard label='Your GLL deposit' value='$92.21' icon={<DemoIcon />} />
                    <ItemCard label='Claimable' value='$92.21' icon={<DemoIcon />} buttonEle={<button
                        className="card-btn  "
                    >
                        Claim
                    </button>} />
                </div>
                <div className="card">
                    <h3>Your Opened Positions</h3>
                    <table style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                        <thead>
                            <tr style={{ background: '#212121' }}>
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
                                                        width={40}
                                                        height={51}
                                                    />
                                                </div>
                                                <div>
                                                    <div>{position.symbol}</div>
                                                    <div>{position.isLong ? "Long" : "Short"}-{position.levarage}x</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{position.marketPrice}</td>
                                        <td><span className={cx({
                                            positive: position.change > 0,
                                            negative: position.change < 0,
                                            muted: position.change === 0, })}>{position.change}%</span></td>
                                        <td>${position.entryPrice}/${position.liqPrice}</td>
                                        <td>${position.colleteral}</td>
                                        <td><span className={cx({
                                            positive: position.change > 0,
                                            negative: position.change < 0,
                                            muted: position.change === 0,
                                        })}>{position.pnl}</span></td>
                                        <td><button
                                            className="card-btn"
                                        >
                                            Trade
                                        </button></td>
                                    </tr>
                                )
                            }
                                
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="card">
                    <h3>Your GLL Vault</h3>
                    <table style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                        <thead>
                            <tr style={{ background: '#212121' }}>
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
                                                        width={40}
                                                        height={51}
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
                                            className="card-btn"
                                        >
                                            Claim
                                        </button></td>
                                    </tr>
                                )
                            }

                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="section section-markets">
                <div className="section-header">
                    <h1>Markets</h1>
                    <p>dadasfagdsgdfgfvxcvxvxvxv </p>
                </div>
                <div className="table-card">
                    <table style={{ width: '100%', textAlign: 'left', borderSpacing:'0px 10px' }} cellspacing="0" cellpadding="0">
                        <thead>
                            <tr style={{ background:'#212121'}}>
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
                            {tokenPairMarketList.map((pairItem, index) =>
                                <tr
                                    key={index}

                                >
                                    <td>{pairItem.name}</td>
                                    <td>{pairItem.lastPrice}</td>
                                    <td>{pairItem.change}</td>
                                    <td>{pairItem.high}</td>
                                    <td>{pairItem.low}</td>
                                    <td>{pairItem.volume}</td>
                                    <td>{pairItem.volumeUsd}</td>

                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            <div className=" section leverage-liquidity-container">
                <div className="section-header" >
                    <h1>Markets</h1>
                    <p>dadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxvdadasfagdsgdfgfvxcvxvxvxv </p>
                </div>
                <div className="grid-cols-4">
                    <ItemCard label='Price of GLL' value='$92.21' icon={<DemoIcon />} />
                    <ItemCard label='Assets in GLL' value='$92.21' icon={<DemoIcon />} />
                    <ItemCard label='GLL APY' value='$92.21' icon={<DemoIcon />} />
                    <ItemCard label='GLL 24h Rewards' value='$92.21' icon={<DemoIcon />} />
                </div>
                <div style={{ maxWidth: 500, margin: 'auto', marginTop: 80, }}>
                    <Link to="/" className="btn-primary " >
                        Invest Now
                    </Link>
                </div>
            </div>
        </div>
    </SEO>
}