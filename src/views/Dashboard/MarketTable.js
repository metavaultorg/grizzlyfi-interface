import React, { useEffect, useState } from "react";
import { sortArr } from './util'
import IconDown from '../../assets/icons/icon-down.svg'
import cx from "classnames";
import { useTokenPairMarketData } from '../../hooks/useCoingeckoPrices';
import { getImageUrl } from "../../cloudinary/getImageUrl";


export default function MarketTable() {
    const [sorter, setSorter] = useState({ sortBy: 'change', isAsc: true })
    const tokenPairMarketList = useTokenPairMarketData();



    function SortTh({ value, title, }) {
        return <th
            className="sortCol"
            onClick={() => { setSorter({ sortBy: value, isAsc: !sorter.isAsc }) }}
        >{title} {sorter.sortBy === value && <img src={IconDown} className={cx({ sortUp: sorter.isAsc }, 'sortIcon')} alt="" />}
        </th>

    }
    return (
        <>
        <div className="market-card list-table">
            <table style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                <thead>
                    <tr>
                        <th>Pair</th>
                        <SortTh value='lastPrice' title='Last Price ' />
                        <SortTh value='change' title='24h Change' />
                        <SortTh value='high' title='24h High' />
                        <SortTh value='low' title='24h Low' />
                        <SortTh value='volume' title='24h Volume' />
                        <SortTh value='volumeUsd' title='24h Volume(USD)' />
                    </tr>
                </thead>
                <tbody>
                    {sortArr(tokenPairMarketList, sorter.sortBy, sorter.isAsc).map((pairItem, index) => {
                        var tokenImage = null;

                        try {
                            tokenImage = getImageUrl({
                                path: `coins/${pairItem.symbol.toLowerCase()}`,
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
                                }, "font-number")}>${pairItem.lastPrice}</td>
                                <td className={cx({
                                    positive: pairItem.change > 0,
                                    negative: pairItem.change < 0,
                                    muted: pairItem.change === 0,
                                }, "font-number")}>{pairItem.change}%</td>
                                <td className="font-number">${pairItem.high}</td>
                                <td className="font-number">${pairItem.low}</td>
                                <td className="font-number">{pairItem.volume}</td>
                                <td className="font-number">${pairItem.volumeUsd}</td>

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
                                path: `coins/${pairItem.symbol.toLowerCase()}`,
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
                                            ${pairItem.lastPrice}
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
                                        <div>${pairItem.high}</div>
                                    </div>
                                    <div className="App-card-row">
                                        <div className="label">24h Low</div>
                                        <div>${pairItem.low}</div>
                                    </div>
                                    <div className="App-card-row">
                                        <div className="label">24h Volume</div>
                                        <div>{pairItem.volume}</div>
                                    </div>
                                    <div className="App-card-row">
                                        <div className="label">24h Volume(USD)</div>
                                        <div>${pairItem.volumeUsd}</div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
        </>
    )
}