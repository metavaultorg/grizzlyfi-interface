import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { sortArr } from './util'
import IconDown from '../../assets/icons/icon-down.svg'
import cx from "classnames";
import { getPositionQuery, getPositions } from "../Exchange/Exchange";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import {
    formatAmount,
    bigNumberify,
    fetcher,
    useChainId,
    USD_DECIMALS,
    getLiquidationPrice,
    USD_DISPLAY_DECIMALS
} from "../../Helpers";
import { getWhitelistedTokens, getTokenBySymbol } from "../../data/Tokens";
import { getContract } from "../../Addresses";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import Reader from "../../abis/Reader.json";
import { useInfoTokens, } from "../../Api";
import IconLong from '../../assets/icons/icon-long.svg'
import IconShort from '../../assets/icons/icon-short.svg'
import { ImSpinner2 } from "react-icons/im";

export default function OpenedPositions(props) {
    const history = useHistory();
    const { savedIsPnlInLeverage, savedShowPnlAfterFees, tokenPairMarketList } = props;
    const [sorter, setSorter] = useState({ sortBy: 'change', isAsc: true })
    const [pendingPositions, setPendingPositions] = useState({});
    const [updatedPositions, setUpdatedPositions] = useState({});
    const { chainId } = useChainId();
    const { active, library, account } = useWeb3React();
    const whitelistedTokens = getWhitelistedTokens(chainId);
    const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);
    const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
    const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
    const positionQuery = getPositionQuery(whitelistedTokens, nativeTokenAddress);
    const readerAddress = getContract(chainId, "Reader");
    const vaultAddress = getContract(chainId, "Vault");
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

    function SortTh({ value, title, }) {
        return <th
            className="sortCol"
            onClick={() => { setSorter({ sortBy: value, isAsc: !sorter.isAsc }) }}
        >{title} {sorter.sortBy === value && <img src={IconDown} className={cx({ sortUp: sorter.isAsc }, 'sortIcon')} alt="" />}
        </th>

    }
    return (
        <>
            <div className="list-table">
                <table className="table-bordered" style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
                    <thead>
                        <tr>
                            <th>Position</th>
                            <SortTh value={'markPrice'} title={'Mkt.Price'} />
                            <SortTh value={'change'} title={'24h Change'} />
                            <th>Entry Price/Liq Price</th>
                            <SortTh value={'collateralAfterFee'} title={'Collateral'} />
                            <SortTh value={'deltaBeforeFeesStr'} title={'PnL'} />
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.length > 0 && sortArr(positions, sorter.sortBy, sorter.isAsc).map((position, index) => {
                            const liquidationPrice = getLiquidationPrice(position) || bigNumberify(0);
                            const hasPositionProfit = position[savedShowPnlAfterFees ? "hasProfitAfterFees" : "hasProfit"];
                            const positionDelta = position[savedShowPnlAfterFees ? "pendingDeltaAfterFees" : "pendingDelta"] || bigNumberify(0);
                            var tokenImage = null;
                            const marketToken = tokenPairMarketList.find((token) => token.symbol === position.indexToken.symbol);
                            try {
                                tokenImage = getImageUrl({
                                    path: `coins/${position.indexToken.symbol.toLowerCase()}`,
                                });
                            } catch (error) {
                                console.error(error);
                            }
                            return (
                                <tr key={index} >
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
                                                <div style={{ fontSize: 18, fontWeight: 600 }}>{position.indexToken.symbol}</div>
                                                <div style={{ display: "flex" }}>
                                                    <img src={position.isLong ? IconLong : IconShort} alt="icon" />
                                                    {position.leverage && (
                                                        <span className="font-number" style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>{formatAmount(position.leverage, 4, 2, true)}x&nbsp;</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="font-number">${formatAmount(
                                        position.markPrice,
                                        USD_DECIMALS,
                                        position.indexToken.displayDecimals,
                                        true
                                    )}</td>
                                    <td><span className={cx({
                                        positive: position.change > 0,
                                        negative: position.change < 0,
                                        muted: position.change === 0,
                                    })}>{marketToken ? marketToken.change + "%" : "-"}</span></td>
                                    <td className="font-number">
                                        ${formatAmount(position.averagePrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}/
                                        <span className="negative font-number" >${formatAmount(liquidationPrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}</span>
                                    </td>
                                    <td className="font-number">${formatAmount(
                                        position.collateralAfterFee,
                                        USD_DECIMALS,
                                        USD_DISPLAY_DECIMALS,
                                        true
                                    )}</td>
                                    <td><span className={cx({
                                        positive: hasPositionProfit && positionDelta.gt(0),
                                        negative: !hasPositionProfit && positionDelta.gt(0),
                                        muted: positionDelta.eq(0),
                                    }, "font-number")}>{position.deltaStr} ({position.deltaPercentageStr})</span></td>
                                    <td><button
                                        className="table-trade-btn"
                                        onClick={() => history.push('/trade')}
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
                {positions.map((position, index) => {
                    const liquidationPrice = getLiquidationPrice(position) || bigNumberify(0);
                    const marketToken = tokenPairMarketList.find((token) => token.symbol === position.indexToken.symbol);
                    const hasPositionProfit = position[savedShowPnlAfterFees ? "hasProfitAfterFees" : "hasProfit"];
                    const positionDelta = position[savedShowPnlAfterFees ? "pendingDeltaAfterFees" : "pendingDelta"] || bigNumberify(0);
                    var tokenImage = null;

                    try {
                        tokenImage = getImageUrl({
                            path: `coins/${position.indexToken.symbol.toLowerCase()}`,
                        });
                    } catch (error) {
                        console.error(error);
                    }
                    return (
                        <div className="App-card" key={index}>
                            <div className={`App-card-title ${position.isLong ? "background-long" : "background-short"}`}>
                                <div className="Exchange-list-asset">
                                    <img
                                        style={{ objectFit: "contain" }}
                                        src={tokenImage || tokenImage.default}
                                        alt={position.indexToken.symbol}
                                        width={32}
                                        height={32}
                                    />
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <div className="Exchange-list-title">
                                            {position.indexToken.symbol}
                                            {position.hasPendingChanges && <ImSpinner2 className="spin position-loading-icon" />}
                                        </div>
                                        <div className="Exchange-list-info-label">
                                            <img src={position.isLong ? IconLong : IconShort} alt="" />
                                            {position.leverage && (
                                                <span className="font-number">{formatAmount(position.leverage, 4, 2, true)}x&nbsp;</span>
                                            )}
                                        </div>
                                    </div>
                                </div></div>
                            <div className="App-card-divider"></div>
                            <div className="App-card-content">
                                {/* <div className="App-card-row">
                                  <div className="label">Leverage</div>
                                  <div style={{ display: "flex", alignItems: 'center', gap: 4 }}>
                                      <img src={position.isLong ? IconLong : IconShort} alt="icon" />

                                      {position.leverage && (
                                          <span className="font-number" style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>{formatAmount(position.leverage, 4, 2, true)}x&nbsp;</span>
                                      )}
                                  </div>
                              </div> */}
                                <div className="App-card-row">
                                    <div className="label">Mkt.Price</div>
                                    <div className="font-number">
                                        ${formatAmount(
                                            position.markPrice,
                                            USD_DECIMALS,
                                            position.indexToken.displayDecimals,
                                            true
                                        )}
                                    </div>
                                </div>
                                <div className="App-card-row">
                                    <div className="label">24h Change <img src={IconDown} alt="change" style={{ marginBottom: '-4px' }} /></div>
                                    <div className="font-number">
                                        <span className={cx({
                                            positive: position.change > 0,
                                            negative: position.change < 0,
                                            muted: position.change === 0,
                                        })}>{marketToken ? marketToken.change + "%" : "-"}</span>
                                    </div>
                                </div>
                                <div className="App-card-row">
                                    <div className="label">Entry Price/Liq Price</div>
                                    <div className="font-number">
                                        ${formatAmount(position.averagePrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}/
                                        ${formatAmount(liquidationPrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}
                                    </div>
                                </div>
                                <div className="App-card-row">
                                    <div className="label">Collateral</div>
                                    <div className="font-number">
                                        ${formatAmount(
                                            position.collateralAfterFee,
                                            USD_DECIMALS,
                                            USD_DISPLAY_DECIMALS,
                                            true
                                        )}
                                    </div>
                                </div>
                                <div className="App-card-row">
                                    <div className="label">PnL</div>
                                    <div>
                                        <span className={cx({
                                            positive: hasPositionProfit && positionDelta.gt(0),
                                            negative: !hasPositionProfit && positionDelta.gt(0),
                                            muted: positionDelta.eq(0),
                                        }, "font-number")}>{position.deltaStr} ({position.deltaPercentageStr})</span>
                                    </div>
                                </div>
                                <div className="App-card-row">
                                    <button
                                        className="table-trade-btn w-full"
                                        onClick={() => history.push('/trade')}
                                    >
                                        Trade
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}
