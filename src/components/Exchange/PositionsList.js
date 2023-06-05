import React, { useState } from "react";
import cx from "classnames";

import Tooltip from "../Tooltip/Tooltip";
import PositionSeller from "./PositionSeller";
import PositionEditor from "./PositionEditor";
import OrdersToa from "./OrdersToa";

import { ImSpinner2 } from "react-icons/im";
import IconNoPosition from "../../assets/icons/no-open-position.png";
import longImg from "../../assets/icons/icon-long.svg";
import shortImg from "../../assets/icons/icon-short.svg";
import { getImageUrl } from "../../cloudinary/getImageUrl";

import {
  helperToast,
  bigNumberify,
  getLiquidationPrice,
  getUsd,
  getLeverage,
  formatAmount,
  getOrderError,
  USD_DECIMALS,
  USD_DISPLAY_DECIMALS,
  FUNDING_RATE_PRECISION,
  SWAP,
  LONG,
  SHORT,
  INCREASE,
  DECREASE,
  BASIS_POINTS_DIVISOR,
  expandDecimals,
} from "../../Helpers";
import PositionShare from "./PositionShare";
import PositionDropdown from "./PositionDropdown";
import AddTrailingStopEditor from "./AddTrailingStopEditor";
import { BigNumber } from "ethers";

const getOrdersForPosition = (account, position, orders, nativeTokenAddress, trailingStopOrders) => {
  if (!orders || orders.length === 0) {
    return [];
  }
  /* eslint-disable array-callback-return */
  return orders
    .filter((order) => {
      if (order.type === SWAP) {
        return false;
      }
      const hasMatchingIndexToken =
        order.indexToken === nativeTokenAddress
          ? position.indexToken.isNative
          : order.indexToken === position.indexToken.address;
      const hasMatchingCollateralToken =
        order.collateralToken === nativeTokenAddress
          ? position.collateralToken.isNative
          : order.collateralToken === position.collateralToken.address;
      if (order.isLong === position.isLong && hasMatchingIndexToken && hasMatchingCollateralToken) {
        return true;
      }
    })
    .map((order) => {
      if (order.orderType && order.orderType.toNumber() === 3 && trailingStopOrders) {
        const trailingStopOrder = trailingStopOrders.filter((o) => o.orderIndex === order.index);
        if (trailingStopOrder.length > 0) {
          const trailingStopRefPrice = bigNumberify(trailingStopOrder[0].referencePrice).mul(expandDecimals(1, 24));
          order.triggerPrice = order.isLong
            ? trailingStopRefPrice
                .mul(BASIS_POINTS_DIVISOR - order.trailingStopPercentage.toNumber())
                .div(BASIS_POINTS_DIVISOR)
            : trailingStopRefPrice
                .mul(BASIS_POINTS_DIVISOR + order.trailingStopPercentage.toNumber())
                .div(BASIS_POINTS_DIVISOR);
        }
      }

      if (order.orderType && order.orderType.toNumber() > 0) {
        order.sizeDelta = position.size;
      }

      order.error = getOrderError(account, order, undefined, position);
      if (order.type === DECREASE && order.sizeDelta.gt(position.size)) {
        order.error = "Order size is bigger than position, will only be executable if position increases";
      }
      return order;
    });
};

export default function PositionsList(props) {
  const {
    pendingPositions,
    setPendingPositions,
    positions,
    positionsDataIsLoading,
    positionsMap,
    infoTokens,
    active,
    account,
    library,
    pendingTxns,
    setPendingTxns,
    setListSection,
    flagOrdersEnabled,
    savedIsPnlInLeverage,
    chainId,
    nativeTokenAddress,
    orders,
    setIsWaitingForPluginApproval,
    approveOrderBook,
    approveOrderBookSwap,
    isPluginApproving,
    isWaitingForPluginApproval,
    orderBookApproved,
    orderBookSwapApproved,
    positionRouterApproved,
    isWaitingForPositionRouterApproval,
    isPositionRouterApproving,
    approvePositionRouter,
    showPnlAfterFees,
    setMarket,
    minExecutionFee,
    minExecutionFeeUSD,
    minExecutionFeeErrorMessage,
    usdmSupply,
    totalTokenWeights,
    trailingStopOrders,
  } = props;

  const [positionToEditKey, setPositionToEditKey] = useState(undefined);
  const [positionToSellKey, setPositionToSellKey] = useState(undefined);
  const [positionToShare, setPositionToShare] = useState(null);
  const [isPositionEditorVisible, setIsPositionEditorVisible] = useState(undefined);
  const [isAddTrailingStopVisible, setIsAddTrailingStopVisible] = useState(undefined);
  const [isPositionSellerVisible, setIsPositionSellerVisible] = useState(undefined);
  const [collateralTokenAddress, setCollateralTokenAddress] = useState(undefined);
  const [isPositionShareModalOpen, setIsPositionShareModalOpen] = useState(false);
  const [ordersToaOpen, setOrdersToaOpen] = useState(false);
  const [isHigherSlippageAllowed, setIsHigherSlippageAllowed] = useState(false);

  const editPosition = (position) => {
    setCollateralTokenAddress(position.collateralToken.address);
    setPositionToEditKey(position.key);
    setIsPositionEditorVisible(true);
  };

  const addTrailingStop = (position) => {
    setCollateralTokenAddress(position.collateralToken.address);
    setPositionToEditKey(position.key);
    setIsAddTrailingStopVisible(true);
  };

  const sellPosition = (position) => {
    setPositionToSellKey(position.key);
    setIsPositionSellerVisible(true);
    setIsHigherSlippageAllowed(false);
  };

  const onPositionClick = (position) => {
    helperToast.success(`${position.isLong ? "Long" : "Short"} ${position.indexToken.symbol} market selected`);
    setMarket(position.isLong ? LONG : SHORT, position.indexToken.address);
  };

  return (
    <div className="PositionsList">
    <AddTrailingStopEditor
      pendingPositions={pendingPositions}
      setPendingPositions={setPendingPositions}
      positionsMap={positionsMap}
      positionKey={positionToEditKey}
      isVisible={isAddTrailingStopVisible}
      setIsVisible={setIsAddTrailingStopVisible}
      infoTokens={infoTokens}
      active={active}
      account={account}
      library={library}
      collateralTokenAddress={collateralTokenAddress}
      pendingTxns={pendingTxns}
      setPendingTxns={setPendingTxns}
      getUsd={getUsd}
      getLeverage={getLeverage}
      savedIsPnlInLeverage={savedIsPnlInLeverage}
      positionRouterApproved={positionRouterApproved}
      isPositionRouterApproving={isPositionRouterApproving}
      isWaitingForPositionRouterApproval={isWaitingForPositionRouterApproval}
      approvePositionRouter={approvePositionRouter}
      chainId={chainId}
      minExecutionFee={minExecutionFee}
      minExecutionFeeUSD={minExecutionFeeUSD}
      minExecutionFeeErrorMessage={minExecutionFeeErrorMessage}
    />
      <PositionEditor
        pendingPositions={pendingPositions}
        setPendingPositions={setPendingPositions}
        positionsMap={positionsMap}
        positionKey={positionToEditKey}
        isVisible={isPositionEditorVisible}
        setIsVisible={setIsPositionEditorVisible}
        infoTokens={infoTokens}
        active={active}
        account={account}
        library={library}
        collateralTokenAddress={collateralTokenAddress}
        pendingTxns={pendingTxns}
        setPendingTxns={setPendingTxns}
        getUsd={getUsd}
        getLeverage={getLeverage}
        savedIsPnlInLeverage={savedIsPnlInLeverage}
        positionRouterApproved={positionRouterApproved}
        isPositionRouterApproving={isPositionRouterApproving}
        isWaitingForPositionRouterApproval={isWaitingForPositionRouterApproval}
        approvePositionRouter={approvePositionRouter}
        chainId={chainId}
        minExecutionFee={minExecutionFee}
        minExecutionFeeUSD={minExecutionFeeUSD}
        minExecutionFeeErrorMessage={minExecutionFeeErrorMessage}
      />
      {ordersToaOpen && (
        <OrdersToa
          setIsVisible={setOrdersToaOpen}
          approveOrderBook={approveOrderBook}
          approveOrderBookSwap={approveOrderBookSwap}
          isPluginApproving={isPluginApproving}
          isSwap={false}
        />
      )}
      {isPositionShareModalOpen && (
        <PositionShare
          setIsPositionShareModalOpen={setIsPositionShareModalOpen}
          isPositionShareModalOpen={isPositionShareModalOpen}
          positionToShare={positionToShare}
          chainId={chainId}
          account={account}
        />
      )}
      {ordersToaOpen && (
        <OrdersToa
          setIsVisible={setOrdersToaOpen}
          approveOrderBook={approveOrderBook}
          approveOrderBookSwap={approveOrderBookSwap}
          isPluginApproving={isPluginApproving}
          isSwap={false}
        />
      )}
      {isPositionSellerVisible && (
        <PositionSeller
          pendingPositions={pendingPositions}
          setPendingPositions={setPendingPositions}
          setIsWaitingForPluginApproval={setIsWaitingForPluginApproval}
          approveOrderBook={approveOrderBook}
          approveOrderBookSwap={approveOrderBookSwap}
          isPluginApproving={isPluginApproving}
          isWaitingForPluginApproval={isWaitingForPluginApproval}
          orderBookApproved={orderBookApproved}
          orderBookSwapApproved={orderBookSwapApproved}
          positionsMap={positionsMap}
          positionKey={positionToSellKey}
          isVisible={isPositionSellerVisible}
          setIsVisible={setIsPositionSellerVisible}
          infoTokens={infoTokens}
          active={active}
          account={account}
          orders={orders}
          library={library}
          pendingTxns={pendingTxns}
          setPendingTxns={setPendingTxns}
          flagOrdersEnabled={flagOrdersEnabled}
          savedIsPnlInLeverage={savedIsPnlInLeverage}
          chainId={chainId}
          nativeTokenAddress={nativeTokenAddress}
          setOrdersToaOpen={setOrdersToaOpen}
          positionRouterApproved={positionRouterApproved}
          isPositionRouterApproving={isPositionRouterApproving}
          isWaitingForPositionRouterApproval={isWaitingForPositionRouterApproval}
          approvePositionRouter={approvePositionRouter}
          isHigherSlippageAllowed={isHigherSlippageAllowed}
          setIsHigherSlippageAllowed={setIsHigherSlippageAllowed}
          minExecutionFee={minExecutionFee}
          minExecutionFeeUSD={minExecutionFeeUSD}
          minExecutionFeeErrorMessage={minExecutionFeeErrorMessage}
          usdgSupply={usdmSupply}
          totalTokenWeights={totalTokenWeights}
        />
      )}
      {positions && (
        <div className="Exchange-list small">
          <div>
            {positions.length === 0 && positionsDataIsLoading && (
              <div className="Exchange-empty-positions-list-note position-query">Loading...</div>
            )}
            {positions.length === 0 && !positionsDataIsLoading && (
              <div className="Exchange-empty-positions-list-note position-query" style={{background: 'none'}}>
                <span>No open positions</span>
                <img src={IconNoPosition} alt=""/>
              </div>
            )}
            {positions.map((position) => {
              const positionOrders = getOrdersForPosition(account, position, orders, nativeTokenAddress, trailingStopOrders);
              const hasTrailingStopOrder = !!positionOrders.find((order) => order.orderType && order.orderType.eq(BigNumber.from("3")));
              const liquidationPrice = getLiquidationPrice(position);
              const hasPositionProfit = position[showPnlAfterFees ? "hasProfitAfterFees" : "hasProfit"];
              const positionDelta =
                position[showPnlAfterFees ? "pendingDeltaAfterFees" : "pendingDelta"] || bigNumberify(0);
              let borrowFeeText;
              if (position.collateralToken && position.collateralToken.fundingRate) {
                const borrowFeeRate = position.collateralToken.fundingRate
                  .mul(position.size)
                  .mul(24)
                  .div(FUNDING_RATE_PRECISION);
                borrowFeeText = `Borrow Fee / Day: $${formatAmount(borrowFeeRate, USD_DECIMALS, USD_DISPLAY_DECIMALS)}`;
              }

              return (
                <div key={position.key} className="App-card">
                  <div className="App-card-title">
                    <span className="Exchange-list-title">{position.indexToken.symbol}</span>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">Leverage</div>
                      <div className="Exchange-list-info-label">
                        <img src={position.isLong ? longImg : shortImg} alt="" />
                        {position.leverage && (
                          <span className="font-number">{formatAmount(position.leverage, 4, 2, true)}x&nbsp;</span>
                        )}
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Size</div>
                      <div className="font-number">${formatAmount(position.size, USD_DECIMALS, 2, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Collateral</div>
                      <div>
                        <Tooltip
                          handle={`$${formatAmount(
                            position.collateralAfterFee,
                            USD_DECIMALS,
                            USD_DISPLAY_DECIMALS,
                            true
                          )}`}
                          position="right-bottom"
                          handleClassName={cx("plain", "font-number", { negative: position.hasLowCollateral })}
                          renderContent={() => {
                            return (
                              <>
                                {position.hasLowCollateral && (
                                  <div>
                                    WARNING: This position has a low amount of collateral after deducting borrowing
                                    fees, deposit more collateral to reduce the position's liquidation risk.
                                    <br />
                                    <br />
                                  </div>
                                )}
                                Initial Collateral: $
                                {formatAmount(position.collateral, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                                <br />
                                Borrow Fee: $
                                {formatAmount(position.fundingFee, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                                {borrowFeeText && <div>{borrowFeeText}</div>}
                                <br />
                                Use the "Edit" button to deposit or withdraw collateral.
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">PnL</div>
                      <div>
                        <span
                          className={cx("Exchange-list-info-label", "font-number", {
                            positive: hasPositionProfit && positionDelta.gt(0),
                            negative: !hasPositionProfit && positionDelta.gt(0),
                            muted: positionDelta.eq(0),
                          })}
                        >
                          {position.deltaStr} ({position.deltaPercentageStr})
                        </span>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Net Value</div>
                      <div>
                        <Tooltip
                          handle={`$${formatAmount(position.netValue, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}`}
                          position="right-bottom"
                          handleClassName="plain font-number"
                          renderContent={() => {
                            return (
                              <>
                                Net Value:{" "}
                                {showPnlAfterFees
                                  ? "Initial Collateral - Fees + PnL"
                                  : "Initial Collateral - Borrow Fee + PnL"}
                                <br />
                                <br />
                                Initial Collateral: $
                                {formatAmount(position.collateral, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                                <br />
                                PnL: {position.deltaBeforeFeesStr}
                                <br />
                                Borrow Fee: $
                                {formatAmount(position.fundingFee, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                                <br />
                                Open + Close fee: $
                                {formatAmount(position.positionFee, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                                <br />
                                PnL After Fees: {position.deltaAfterFeesStr} ({position.deltaAfterFeesPercentageStr})
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Orders</div>
                      <div>
                        {positionOrders.length === 0 && "None"}
                        {positionOrders.map((order) => {
                          const orderText = () => (
                            <>
                              {order.triggerAboveThreshold ? ">" : "<"}{" "}
                              {formatAmount(order.triggerPrice, 30, order.indexToken.displayDecimals, true)}:
                              {order.type === INCREASE ? " +" : " -"}${formatAmount(order.sizeDelta, 30, 2, true)}
                            </>
                          );
                          if (order.error) {
                            return (
                              <div key={`${order.isLong}-${order.type}-${order.index}`} className="Position-list-order">
                                <Tooltip
                                  className="order-error"
                                  handle={orderText()}
                                  position="right-bottom"
                                  handleClassName="plain font-number"
                                  renderContent={() => <span className="negative">{order.error}</span>}
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div key={`${order.isLong}-${order.type}-${order.index}`} className="Position-list-order">
                                {orderText()}
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">Mkt. Price</div>
                      <div className="font-number">
                        ${formatAmount(position.markPrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Entry Price</div>
                      <div className="font-number">
                        ${formatAmount(position.averagePrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Liq. Price</div>
                      <div className="font-number">
                        ${formatAmount(liquidationPrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}
                      </div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-options">
                    <button
                      className="App-button-option App-card-option"
                      disabled={position.size.eq(0)}
                      onClick={() => sellPosition(position)}
                    >
                      Close
                    </button>
                    <button
                      className="App-button-option App-card-option"
                      disabled={position.size.eq(0)}
                      onClick={() => editPosition(position)}
                    >
                      Edit
                    </button>
                    {!hasTrailingStopOrder && position.leverage &&
                    <button
                      className="App-button-option App-card-option"
                      disabled={position.size.eq(0)}
                      onClick={() => addTrailingStop(position)}
                    >
                      Add Trailing Stop
                    </button>
                    }
                    <button
                      className="App-button-option App-card-option"
                      onClick={() => {
                        setPositionToShare(position);
                        setIsPositionShareModalOpen(true);
                      }}
                      disabled={position.size.eq(0)}
                    >
                      Share
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <table className="Exchange-list large table-normalizer">
        <tbody>
          <tr className="Exchange-list-header">
            <th>Position</th>
            <th>Net Value</th>
            <th>Size</th>
            <th>Collateral</th>
            <th>Mkt. Price</th>
            <th>Entry Price</th>
            <th>Liq. Price</th>
            <th></th>
            <th></th>
          </tr>
          {positions.length === 0 && positionsDataIsLoading && (
            <tr style={{background: "none"}}>
              <td colSpan="15">
                <div className="Exchange-empty-positions-list-note">Loading...</div>
              </td>
            </tr>
          )}
          {positions.length === 0 && !positionsDataIsLoading && (
            <tr style={{background: "none"}}>
              <td colSpan="15">
                <div className="Exchange-empty-positions-list-note">
                  <span>No open positions</span>
                  <img src={IconNoPosition} alt=""/>
                </div>
              </td>
            </tr>
          )}
          {positions.map((position) => {
            const liquidationPrice = getLiquidationPrice(position) || bigNumberify(0);
            const positionOrders = getOrdersForPosition(account, position, orders, nativeTokenAddress, trailingStopOrders);
            const hasOrderError = !!positionOrders.find((order) => order.error);
            const hasTrailingStopOrder = !!positionOrders.find((order) => order.orderType && order.orderType.eq(BigNumber.from("3")));
            const hasPositionProfit = position[showPnlAfterFees ? "hasProfitAfterFees" : "hasProfit"];
            const positionDelta =
              position[showPnlAfterFees ? "pendingDeltaAfterFees" : "pendingDelta"] || bigNumberify(0);
            let borrowFeeText;
            if (position.collateralToken && position.collateralToken.fundingRate) {
              const borrowFeeRate = position.collateralToken.fundingRate
                .mul(position.size)
                .mul(24)
                .div(FUNDING_RATE_PRECISION);
              borrowFeeText = `Borrow Fee / Day: $${formatAmount(borrowFeeRate, USD_DECIMALS, USD_DISPLAY_DECIMALS)}`;
            }

            var tokenImage = null;

            try {
              tokenImage = getImageUrl({
                path: `coins/${position.indexToken.symbol.toLowerCase()}`,
              });
            } catch (error) {
              console.error(error);
            }

            return (
              <tr key={position.key}>
                <td className="clickable" onClick={() => onPositionClick(position)}>
                  <div className="Exchange-list-asset">
                      <img
                          style={{ objectFit: "contain" }}
                          src={tokenImage || tokenImage.default}
                          alt={position.indexToken.symbol}
                          width={32}
                          height={32}
                        />
                    <div>
                      <div className="Exchange-list-title">
                        {position.indexToken.symbol}
                        {position.hasPendingChanges && <ImSpinner2 className="spin position-loading-icon" />}
                      </div>
                      <div className="Exchange-list-info-label">
                        <img src={position.isLong? longImg: shortImg} alt=""/>
                        {position.leverage && (
                          <span className="font-number">{formatAmount(position.leverage, 4, 2, true)}x&nbsp;</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    {!position.netValue && "Opening..."}
                    {position.netValue && (
                      <Tooltip
                        handle={`$${formatAmount(position.netValue, USD_DECIMALS, 2, true)}`}
                        position="center-bottom"
                        handleClassName="plain font-number"
                        renderContent={() => {
                          return (
                            <>
                              Net Value:{" "}
                              {showPnlAfterFees
                                ? "Initial Collateral - Fees + PnL"
                                : "Initial Collateral - Borrow Fee + PnL"}
                              <br />
                              <br />
                              Initial Collateral: $
                              {formatAmount(position.collateral, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                              <br />
                              PnL: {position.deltaBeforeFeesStr}
                              <br />
                              Borrow Fee: ${formatAmount(position.fundingFee, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                              <br />
                              Open + Close fee: $
                              {formatAmount(position.positionFee, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                              <br />
                              <br />
                              PnL After Fees: {position.deltaAfterFeesStr} ({position.deltaAfterFeesPercentageStr})
                            </>
                          );
                        }}
                      />
                    )}
                  </div>
                  {position.deltaStr && (
                    <div
                      className={cx("Exchange-list-info-label","font-number", {
                        positive: hasPositionProfit && positionDelta.gt(0),
                        negative: !hasPositionProfit && positionDelta.gt(0),
                        muted: positionDelta.eq(0),
                      })}
                    >
                      {position.deltaStr} ({position.deltaPercentageStr})
                    </div>
                  )}
                </td>
                <td>
                  <div className="font-number">${formatAmount(position.size, USD_DECIMALS, 2, true)}</div>
                  {positionOrders.length > 0 && (
                    <div onClick={() => setListSection && setListSection("Orders")}>
                      <Tooltip
                        handle={`Orders (${positionOrders.length})`}
                        position="left-bottom"
                        handleClassName={cx(
                          ["Exchange-list-info-label", "Exchange-position-list-orders", "plain", "clickable"],
                          { muted: !hasOrderError, negative: hasOrderError }
                        )}
                        renderContent={() => {
                          return (
                            <>
                              <strong>Active Orders</strong>
                              {positionOrders.map((order) => {
                                return (
                                  <div
                                    key={`${order.isLong}-${order.type}-${order.index}`}
                                    className="Position-list-order"
                                  >
                                    {order.triggerAboveThreshold ? ">" : "<"}{" "}
                                    {formatAmount(order.triggerPrice, 30, order.indexToken.displayDecimals, true)}:
                                    {order.type === INCREASE ? " +" : " -"}${formatAmount(order.sizeDelta, 30, 2, true)}
                                    {order.error && (
                                      <>
                                        , <span className="negative">{order.error}</span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          );
                        }}
                      />
                    </div>
                  )}
                </td>
                <td>
                  <Tooltip
                    handle={`$${formatAmount(position.collateralAfterFee, USD_DECIMALS, 2, true)}`}
                    position="left-bottom"
                    handleClassName={cx("plain","font-number", { negative: position.hasLowCollateral })}
                    renderContent={() => {
                      return (
                        <>
                          {position.hasLowCollateral && (
                            <div>
                              WARNING: This position has a low amount of collateral after deducting borrowing fees,
                              deposit more collateral to reduce the position's liquidation risk.
                              <br />
                              <br />
                            </div>
                          )}
                          Initial Collateral: $
                          {formatAmount(position.collateral, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                          <br />
                          Borrow Fee: ${formatAmount(position.fundingFee, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                          {borrowFeeText && <div>{borrowFeeText}</div>}
                          <br />
                          Use the "Edit" button to deposit or withdraw collateral.
                        </>
                      );
                    }}
                  />
                </td>
                <td className="clickable" onClick={() => onPositionClick(position)}>
                  <Tooltip
                    handle={`$${formatAmount(
                      position.markPrice,
                      USD_DECIMALS,
                      position.indexToken.displayDecimals,
                      true
                    )}`}
                    position="left-bottom"
                    handleClassName="plain clickable font-number"
                    renderContent={() => {
                      return (
                        <>
                          Click on a row to select the position's market, then use the swap box to increase your
                          position size if needed.
                          <br />
                          <br />
                          Use the "Close" button to reduce your position size, or to set stop-loss / take-profit orders.
                        </>
                      );
                    }}
                  />
                </td>
                <td className="clickable font-number" onClick={() => onPositionClick(position)}>
                  ${formatAmount(position.averagePrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}
                </td>
                <td className="clickable font-number" onClick={() => onPositionClick(position)}>
                  ${formatAmount(liquidationPrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}
                </td>

                <td>
                  <button
                    className="Exchange-list-action"
                    onClick={() => sellPosition(position)}
                    disabled={position.size.eq(0)}
                  >
                    Close
                  </button>
                </td>
                <td>
                  <PositionDropdown
                    handleEditCollateral={() => {
                      editPosition(position);
                    }}
                    handleAddTrailingStop={() => {
                      addTrailingStop(position);
                    }}
                    handleShare={() => {
                      setPositionToShare(position);
                      setIsPositionShareModalOpen(true);
                    }}
                    handleMarketSelect={() => {
                      onPositionClick(position);
                    }}
                    hasTrailingStopOrder={hasTrailingStopOrder}
                    position={position}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
