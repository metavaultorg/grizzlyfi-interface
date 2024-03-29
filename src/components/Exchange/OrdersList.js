import React, { useState, useEffect, useCallback } from "react";

import {
  SWAP,
  INCREASE,
  DECREASE,
  DECREASE_ORDER_TYPES,
  USD_DECIMALS,
  formatAmount,
  TRIGGER_PREFIX_ABOVE,
  TRIGGER_PREFIX_BELOW,
  getExchangeRateDisplay,
  getTokenInfo,
  getExchangeRate,
  getPositionKey,
  isAddressZero,
  BASIS_POINTS_DIVISOR,
  bigNumberify,
  expandDecimals,
} from "../../Helpers.js";
import { cancelSwapOrder, cancelIncreaseOrder, cancelDecreaseOrder } from "../../Api";

import Tooltip from "../Tooltip/Tooltip";
import OrderEditor from "./OrderEditor";

import "./OrdersList.css";
import IconNoPosition from "../../assets/icons/no-open-position.png";
import { getContract } from "../../config/contracts.js";

function getPositionForOrder(account, order, positionsMap) {
  const key = getPositionKey(account, order.collateralToken, order.indexToken, order.isLong);
  const position = positionsMap[key];
  return position && position.size && position.size.gt(0) ? position : null;
}

export default function OrdersList(props) {
  const {
    account,
    library,
    setPendingTxns,
    pendingTxns,
    infoTokens,
    positionsMap,
    totalTokenWeights,
    usdgSupply,
    orders,
    hideActions,
    chainId,
  } = props;

  const [editingOrder, setEditingOrder] = useState(null);

  const onCancelClick = useCallback(
    (order) => {
      let func;
      if (order.type === SWAP) {
        func = cancelSwapOrder;
      } else if (order.type === INCREASE) {
        func = cancelIncreaseOrder;
      } else if (order.type === DECREASE) {
        func = cancelDecreaseOrder;
      }

      return func(chainId, library, order.index, {
        successMsg: "Order cancelled.",
        failMsg: "Cancel failed.",
        sentMsg: "Cancel submitted.",
        pendingTxns,
        setPendingTxns,
      });
    },
    [library, pendingTxns, setPendingTxns, chainId]
  );

  const onEditClick = useCallback(
    (order) => {
      setEditingOrder(order);
    },
    [setEditingOrder]
  );

  const renderHead = useCallback(() => {
    return (
      <tr className="Exchange-list-header">
        <th>
          <div>Type</div>
        </th>
        <th>
          <div>Order</div>
        </th>
        <th>
          <div>Price</div>
        </th>
        <th>
          <div>Mkt. Price</div>
        </th>
        <th colSpan="2"></th>
      </tr>
    );
  }, []);

  const renderEmptyRow = useCallback(() => {
    if (orders && orders.length) {
      return null;
    }

    return (
      <tr style={{background: "none"}}>
              <td colSpan="15">
                <div className="Exchange-empty-positions-list-note">
                  <span>No open orders</span>
                  <img src={IconNoPosition} alt=""/>
                </div>
              </td>
            </tr>
    );
  }, [orders]);

  const renderActions = useCallback(
    (order) => {
      return (
        <>
          <td>
            <button className="Exchange-list-action" onClick={() => onEditClick(order)}>
              Edit
            </button>
          </td>
          <td>
            <button className="Exchange-list-action" onClick={() => onCancelClick(order)}>
              Cancel
            </button>
          </td>
        </>
      );
    },
    [onEditClick, onCancelClick]
  );

  const renderLargeList = useCallback(() => {
    if (!orders || !orders.length) {
      return null;
    }
    return orders.map((order) => {
      if (order.type === SWAP) {
        const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
        const fromTokenInfo = getTokenInfo(infoTokens, order.path[0], true, nativeTokenAddress);
        const toTokenInfo = getTokenInfo(
          infoTokens,
          order.path[order.path.length - 1],
          order.shouldUnwrap,
          nativeTokenAddress
        );

        const markExchangeRate = getExchangeRate(fromTokenInfo, toTokenInfo);

        return (
          <tr className="Exchange-list-item" key={`${order.type}-${order.index}`}>
            <td className="Exchange-list-item-type">Limit</td>
            <td>
              Swap{" "}
              {formatAmount(
                order.amountIn,
                fromTokenInfo.decimals,
                fromTokenInfo.isStable || fromTokenInfo.isUsdg ? 2 : 4,
                true
              )}{" "}
              {fromTokenInfo.symbol} for{" "}
              {formatAmount(
                order.minOut,
                toTokenInfo.decimals,
                toTokenInfo.isStable || toTokenInfo.isUsdg ? 2 : 4,
                true
              )}{" "}
              {toTokenInfo.symbol}
            </td>
            <td>
              <Tooltip
                handle={getExchangeRateDisplay(order.triggerRatio, fromTokenInfo, toTokenInfo)}
                handleClassName="font-number"
                renderContent={() => `
                  You will receive at least ${formatAmount(
                    order.minOut,
                    toTokenInfo.decimals,
                    toTokenInfo.isStable || toTokenInfo.isUsdg ? 2 : 4,
                    true
                  )} ${
                  toTokenInfo.symbol
                } if this order is executed. The execution price may vary depending on swap fees at the time the order is executed.
                `}
              />
            </td>
            <td className="font-number">{getExchangeRateDisplay(markExchangeRate, fromTokenInfo, toTokenInfo, true)}</td>
            {!hideActions && renderActions(order)}
          </tr>
        );
      }

      const indexToken = getTokenInfo(infoTokens, order.indexToken);
      const maximisePrice = (order.type === INCREASE && order.isLong) || (order.type === DECREASE && !order.isLong);
      const markPrice = maximisePrice ? indexToken.contractMaxPrice : indexToken.contractMinPrice;
      let triggerPricePrefix = order.triggerAboveThreshold ? TRIGGER_PREFIX_ABOVE : TRIGGER_PREFIX_BELOW;
      const indexTokenSymbol = indexToken.isWrapped ? indexToken.baseSymbol : indexToken.symbol;

      let error;
      let receive = "";
      let orderType = "";
      let byWord = "by";
      let orderSizeDelta = order.sizeDelta;
      let orderTriggerPrice = order.triggerPrice;
      let trailingStopRefPrice = bigNumberify(0);
      let trailingStopRefPriceTimestamp;
      let trailingStopContent;
      if (order.type === DECREASE) {
        const positionForOrder = getPositionForOrder(account, order, positionsMap);
        if (!positionForOrder) {
          error = "No open position, order cannot be executed";
        } else if (positionForOrder.size.lt(order.sizeDelta)) {
          error = "Order size exceeds position size, order cannot be executed";
        }
        if (!isAddressZero(order.receiveToken)) {
          const receiveToken = getTokenInfo(infoTokens, order.receiveToken);
          const receiveTokenSymbol = receiveToken.isWrapped ? receiveToken.baseSymbol : receiveToken.symbol;
          receive = " -> " + receiveTokenSymbol;
        }
        if (order.orderType && order.orderType > 0) {
          orderType = DECREASE_ORDER_TYPES[order.orderType];
          if (positionForOrder) {
            orderSizeDelta = positionForOrder.size;
          }
          byWord = ",size=";
        }
      }

      return (
        <tr className="Exchange-list-item" key={`${order.isLong}-${order.type}-${order.index}`}>
          <td className="Exchange-list-item-type">
            {order.type === INCREASE ? "Limit" : "Trigger"} {orderType}
          </td>
          <td>
            {order.type === INCREASE ? "Increase" : order.orderType && order.orderType > 0 ? "Close" : "Decrease"} {indexTokenSymbol}{" "}
            {order.isLong ? "Long" : "Short"}
            &nbsp;{byWord} ${formatAmount(orderSizeDelta, USD_DECIMALS, 2, true)} {receive}
            {error && <div className="Exchange-list-item-error">{error}</div>}
          </td>
          <td className="font-number">
            {triggerPricePrefix}
            {trailingStopRefPrice.gt(0) && (
              <>
                $
                <Tooltip
                  handle={formatAmount(orderTriggerPrice, USD_DECIMALS, indexToken.displayDecimals, true)}
                  position="right-bottom"
                  renderContent={() => {
                    return <>{trailingStopContent}</>;
                  }}
                />
              </>
            )}
            {trailingStopRefPrice.eq(0) && (
              <>${formatAmount(orderTriggerPrice, USD_DECIMALS, indexToken.displayDecimals, true)}</>
            )}
          </td>
          <td>
            <Tooltip
              handle={formatAmount(markPrice, USD_DECIMALS, indexToken.displayDecimals, true)}
              position="right-bottom"
              handleClassName="font-number"
              renderContent={() => {
                return (
                  <>
                    The price that the order can be executed at may differ slightly from the chart price as market
                    orders can change the price while limit orders cannot.
                  </>
                );
              }}
            />
          </td>
          {!hideActions && renderActions(order)}
        </tr>
      );
    });
  }, [orders, renderActions, infoTokens, positionsMap, hideActions, chainId, account]);

  const renderSmallList = useCallback(() => {
    if (!orders || !orders.length) {
      return null;
    }

    return orders.map((order) => {
      if (order.type === SWAP) {
        const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
        const fromTokenInfo = getTokenInfo(infoTokens, order.path[0], true, nativeTokenAddress);
        const toTokenInfo = getTokenInfo(
          infoTokens,
          order.path[order.path.length - 1],
          order.shouldUnwrap,
          nativeTokenAddress
        );
        const markExchangeRate = getExchangeRate(fromTokenInfo, toTokenInfo);

        return (
          <div key={`${order.type}-${order.index}`} className="App-card">
            <div className="App-card-title-small">
              Swap {formatAmount(order.amountIn, fromTokenInfo.decimals, fromTokenInfo.isStable ? 2 : 4, true)}{" "}
              {fromTokenInfo.symbol} for{" "}
              {formatAmount(order.minOut, toTokenInfo.decimals, toTokenInfo.isStable ? 2 : 4, true)}{" "}
              {toTokenInfo.symbol}
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Price</div>
                <div>
                  <Tooltip
                    position="right-bottom"
                    handle={getExchangeRateDisplay(order.triggerRatio, fromTokenInfo, toTokenInfo)}
                    handleClassName="font-number"
                    renderContent={() => `
                    You will receive at least ${formatAmount(
                      order.minOut,
                      toTokenInfo.decimals,
                      toTokenInfo.isStable || toTokenInfo.isUsdg ? 2 : 4,
                      true
                    )} ${
                      toTokenInfo.symbol
                    } if this order is executed. The exact execution price may vary depending on fees at the time the order is executed.
                  `}
                  />
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Mkt. Price</div>
                <div className="font-number">{getExchangeRateDisplay(markExchangeRate, fromTokenInfo, toTokenInfo)}</div>
              </div>
              {!hideActions && (
                <>
                  <div className="App-card-divider"></div>
                  <div className="App-card-options">
                    <button className="App-button-option App-card-option" onClick={() => onEditClick(order)}>
                      Edit
                    </button>
                    <button className="App-button-option App-card-option" onClick={() => onCancelClick(order)}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }

      const indexToken = getTokenInfo(infoTokens, order.indexToken);
      const maximisePrice = (order.type === INCREASE && order.isLong) || (order.type === DECREASE && !order.isLong);
      const markPrice = maximisePrice ? indexToken.contractMaxPrice : indexToken.contractMinPrice;
      let triggerPricePrefix = order.triggerAboveThreshold ? TRIGGER_PREFIX_ABOVE : TRIGGER_PREFIX_BELOW;
      const indexTokenSymbol = indexToken.isWrapped ? indexToken.baseSymbol : indexToken.symbol;

      let error;
      let receive = "";
      let orderType = "";
      let byWord = "by";
      let orderSizeDelta = order.sizeDelta;
      let orderTriggerPrice = order.triggerPrice;
      let trailingStopRefPrice = bigNumberify(0);
      let trailingStopRefPriceTimestamp;
      let trailingStopContent;
      if (order.type === DECREASE) {
        const positionForOrder = getPositionForOrder(account, order, positionsMap);
        if (!positionForOrder) {
          error = "No open position, order cannot be executed";
        } else if (positionForOrder.size.lt(order.sizeDelta)) {
          error = "Order size exceeds position size, order cannot be executed";
        }
        if (!isAddressZero(order.receiveToken)) {
          const receiveToken = getTokenInfo(infoTokens, order.receiveToken);
          const receiveTokenSymbol = receiveToken.isWrapped ? receiveToken.baseSymbol : receiveToken.symbol;
          receive = " -> " + receiveTokenSymbol;
        }
        if (order.orderType && order.orderType > 0) {
          orderType = DECREASE_ORDER_TYPES[order.orderType];
          if (positionForOrder) {
            orderSizeDelta = positionForOrder.size;
          }
          byWord = ",size=";
        }
      }

      return (
        <div key={`${order.isLong}-${order.type}-${order.index}`} className="App-card">
          <div style={{ padding: 15.5 }} className="App-card-title-small">
            {order.type === INCREASE ? "Increase" : "Decrease"} {indexTokenSymbol} {order.isLong ? "Long" : "Short"}
            &nbsp;by ${formatAmount(order.sizeDelta, USD_DECIMALS, 2, true)}
            {error && <div className="Exchange-list-item-error">{error}</div>}
          </div>
          <div className="App-card-divider"></div>
          <div style={{ padding: 15.5 }} className="App-card-content">
            <div className="App-card-row">
              <div className="label">Type</div>
              <div>
                {order.type === INCREASE ? "Limit" : "Trigger"} {orderType}
              </div>
            </div>
            <div className="App-card-row">
              <div className="label">Order</div>
              <div>
                {order.type === INCREASE ? "Increase" : order.orderType && order.orderType > 0 ? "Close" : "Decrease"} {indexTokenSymbol}{" "}
                {order.isLong ? "Long" : "Short"}
                &nbsp;{byWord} ${formatAmount(orderSizeDelta, USD_DECIMALS, 2, true)} {receive}
                {error && <div className="Exchange-list-item-error">{error}</div>}
              </div>
            </div>
            <div className="App-card-row">
              <div className="label">Price</div>
              <div className="font-number">
              {triggerPricePrefix}
              {trailingStopRefPrice.gt(0) && (
                <>
                  $
                  <Tooltip
                    handle={formatAmount(orderTriggerPrice, USD_DECIMALS, indexToken.displayDecimals, true)}
                    position="right-bottom"
                    handleClassName="font-number"
                    renderContent={() => {
                      return <>{trailingStopContent}</>;
                    }}
                  />
                </>
              )}
              {trailingStopRefPrice.eq(0) && (
                <>${formatAmount(orderTriggerPrice, USD_DECIMALS, indexToken.displayDecimals, true)}</>
              )}
              </div>
            </div>
            <div className="App-card-row">
              <div className="label">Mkt. Price</div>
              <div>
                <Tooltip
                  handle={formatAmount(markPrice, USD_DECIMALS, indexToken.displayDecimals, true)}
                  position="right-bottom"
                  handleClassName="font-number"
                  renderContent={() => {
                    return (
                      <>
                        The price that the order can be executed at may differ slightly from the chart price as market
                        orders can change the price while limit orders cannot.
                      </>
                    );
                  }}
                />
              </div>
            </div>
            {!hideActions && (
              <>
                <div className="App-card-divider"></div>
                <div style={{ marginBottom: 0, marginTop: 15.5 }} className="App-card-options">
                  <button
                    style={{ margin: 0, marginBottom: 6.2 }}
                    className="App-button-option App-card-option"
                    onClick={() => onEditClick(order)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ margin: 0 }}
                    className="App-button-option App-card-option"
                    onClick={() => onCancelClick(order)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      );
    });
  }, [orders, onEditClick, onCancelClick, infoTokens, positionsMap, hideActions, chainId, account]);

  return (
    <React.Fragment>
      <table className="Exchange-list Orders table-normalizer large">
        <tbody>
          {renderHead()}
          {renderEmptyRow()}
          {renderLargeList()}
        </tbody>
      </table>
      <div className="Exchange-list Orders small">
        {(!orders || orders.length === 0) && (
          <div className="Exchange-empty-positions-list-note p-3" style={{ background: "none" }}>
            <span>No open orders</span>
            <img src={IconNoPosition} alt=""/>
          </div>
        )}
        {renderSmallList()}
      </div>
      {editingOrder && (
        <OrderEditor
          account={account}
          order={editingOrder}
          setEditingOrder={setEditingOrder}
          infoTokens={infoTokens}
          pendingTxns={pendingTxns}
          setPendingTxns={setPendingTxns}
          getPositionForOrder={getPositionForOrder}
          positionsMap={positionsMap}
          library={library}
          totalTokenWeights={totalTokenWeights}
          usdgSupply={usdgSupply}
        />
      )}
    </React.Fragment>
  );
}
