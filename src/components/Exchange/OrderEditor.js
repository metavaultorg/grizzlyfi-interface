import React, { useState, useMemo } from "react";
import { BsArrowRight } from "react-icons/bs";
import Slider from "rc-slider";

import {
  PRECISION,
  USD_DECIMALS,
  SWAP,
  TRIGGER_PREFIX_ABOVE,
  TRIGGER_PREFIX_BELOW,
  MIN_PROFIT_TIME,
  DECREASE,
  INCREASE,
  useChainId,
  getTokenInfo,
  isTriggerRatioInverted,
  bigNumberify,
  formatAmountFree,
  parseValue,
  getNextToAmount,
  getExchangeRate,
  formatAmount,
  getExchangeRateDisplay,
  calculatePositionDelta,
  getLiquidationPrice,
  formatDateTime,
  getDeltaStr,
  getProfitPrice,
  getTimeRemaining,
} from "../../Helpers";
import { updateSwapOrder, updateIncreaseOrder, updateDecreaseOrder } from "../../Api";
import Modal from "../Modal/Modal";
import ExchangeInfoRow from "./ExchangeInfoRow";
import { sliderHandle, trailingStopPrices } from "../Trailer/Trailer";
import { BigNumber } from "ethers";
import "./OrderEditor.css";
import AutosizeInput from 'react-input-autosize';
import { getContract } from "../../config/contracts";

export default function OrderEditor(props) {
  const {
    account,
    order,
    setEditingOrder,
    infoTokens,
    pendingTxns,
    setPendingTxns,
    library,
    totalTokenWeights,
    usdgSupply,
    getPositionForOrder,
    positionsMap,
  } = props;

  const { chainId } = useChainId();

  const position = order.type !== SWAP ? getPositionForOrder(account, order, positionsMap) : null;
  const liquidationPrice = order.type === DECREASE && position ? getLiquidationPrice(chainId,position) : null;
  const tokenPriceInUsd = position ? position.isLong ? position.indexToken.maxPrice : position.indexToken.minPrice : null;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTrailingStop = order.type === DECREASE && order.orderType && order.orderType.toNumber() === 3;

  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const fromTokenInfo = order.type === SWAP ? getTokenInfo(infoTokens, order.path[0], true, nativeTokenAddress) : null;
  const toTokenInfo =
    order.type === SWAP
      ? getTokenInfo(infoTokens, order.path[order.path.length - 1], order.shouldUnwrap, nativeTokenAddress)
      : null;

  const triggerRatioInverted = useMemo(() => {
    if (order.type !== SWAP) {
      return null;
    }

    return isTriggerRatioInverted(fromTokenInfo, toTokenInfo);
  }, [toTokenInfo, fromTokenInfo, order.type]);

  let initialRatio = 0;
  if (order.triggerRatio) {
    initialRatio = triggerRatioInverted ? PRECISION.mul(PRECISION).div(order.triggerRatio) : order.triggerRatio;
  }
  const [triggerRatioValue, setTriggerRatioValue] = useState(formatAmountFree(initialRatio, USD_DECIMALS, 6));

  const [triggerPriceValue, setTriggerPriceValue] = useState(formatAmountFree(order.triggerPrice, USD_DECIMALS, 4));
  const triggerPrice = useMemo(() => {
    return triggerPriceValue ? parseValue(triggerPriceValue, USD_DECIMALS) : 0;
  }, [triggerPriceValue]);

  const [trailingStopPercentageValue, setTrailingStopPercentageValue] = useState(
    isTrailingStop ? order.trailingStopPercentage / 100 : 0
  );
  const trailingStopPercentage = useMemo(() => {
    return trailingStopPercentageValue ? trailingStopPercentageValue : 0;
  }, [trailingStopPercentageValue]);

  let trailingStopPriceLabel = BigNumber.from("0");
  if (tokenPriceInUsd) {
    const priceDiff = tokenPriceInUsd
      .mul(Math.round(trailingStopPercentageValue * 100))
      .div(position.leverage.toNumber());
    trailingStopPriceLabel = position.isLong ? tokenPriceInUsd.add(priceDiff) : tokenPriceInUsd.sub(priceDiff);
  }

  const triggerRatio = useMemo(() => {
    if (!triggerRatioValue) {
      return bigNumberify(0);
    }
    let ratio = parseValue(triggerRatioValue, USD_DECIMALS);
    if (triggerRatioInverted) {
      ratio = PRECISION.mul(PRECISION).div(ratio);
    }
    return ratio;
  }, [triggerRatioValue, triggerRatioInverted]);

  const indexTokenMarkPrice = useMemo(() => {
    if (order.type === SWAP) {
      return;
    }
    const toTokenInfo = getTokenInfo(infoTokens, order.indexToken);
    return order.isLong ? toTokenInfo.maxPrice : toTokenInfo.minPrice;
  }, [infoTokens, order]);

  let toAmount;
  if (order.type === SWAP) {
    const { amount } = getNextToAmount(
      chainId,
      order.amountIn,
      order.path[0],
      order.path[order.path.length - 1],
      infoTokens,
      undefined,
      triggerRatio,
      usdgSupply,
      totalTokenWeights
    );
    toAmount = amount;
  }

  const onClickPrimary = () => {
    setIsSubmitting(true);

    let func;
    let params;

    if (order.type === SWAP) {
      func = updateSwapOrder;
      params = [chainId, library, order.index, toAmount, triggerRatio, order.triggerAboveThreshold];
    } else if (order.type === DECREASE) {
      func = updateDecreaseOrder;
      params = [
        chainId,
        library,
        order.index,
        order.collateralDelta,
        order.sizeDelta,
        triggerPrice,
        order.triggerAboveThreshold,
        bigNumberify(Math.round(trailingStopPercentage * 100)),
      ];
    } else if (order.type === INCREASE) {
      func = updateIncreaseOrder;
      params = [chainId, library, order.index, order.sizeDelta, triggerPrice, order.triggerAboveThreshold];
    }

    params.push({
      successMsg: "Order updated!",
      failMsg: "Order update failed.",
      sentMsg: "Order update submitted!",
      pendingTxns,
      setPendingTxns,
    });

    return func(...params)
      .then(() => {
        setEditingOrder(null);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const onTriggerRatioChange = (evt) => {
    setTriggerRatioValue(evt.target.value || "");
  };

  const onTriggerPriceChange = (evt) => {
    setTriggerPriceValue(evt.target.value || "");
  };

  const onTrailingStopPercentageChange = (evt) => {
    setTrailingStopPercentageValue(evt.target.value || "");
  };

  const getError = () => {
    if (isTrailingStop) {
      if (!trailingStopPercentage || trailingStopPercentage === 0) {
        return "Enter Trailing Stop Percentage";
      }
      if (trailingStopPercentage > 20) {
        return "Percentage above 20%";
      }
    } else {
      if ((!triggerRatio || triggerRatio.eq(0)) && (!triggerPrice || triggerPrice.eq(0))) {
        return "Enter Price";
      }
      if (order.type === SWAP && triggerRatio.eq(order.triggerRatio)) {
        return "Enter new Price";
      }
      if (order.type !== SWAP && triggerPrice.eq(order.triggerPrice)) {
        return "Enter new Price";
      }
      if (position) {
        if (order.type === DECREASE) {
          if (position.isLong && triggerPrice.lte(liquidationPrice)) {
            return "Price below Liq. Price";
          }
          if (!position.isLong && triggerPrice.gte(liquidationPrice)) {
            return "Price above Liq. Price";
          }
        }

        const { delta, hasProfit } = calculatePositionDelta(triggerPrice, position);
        if (hasProfit && delta.eq(0)) {
          return "Invalid price, see warning";
        }
      }

      if (order.type !== SWAP && indexTokenMarkPrice) {
        if (order.triggerAboveThreshold && indexTokenMarkPrice.gt(triggerPrice)) {
          return "Price below Mkt. Price";
        }
        if (!order.triggerAboveThreshold && indexTokenMarkPrice.lt(triggerPrice)) {
          return "Price above Mkt. Price";
        }
      }

      if (order.type === SWAP) {
        const currentRate = getExchangeRate(fromTokenInfo, toTokenInfo);
        if (currentRate && !currentRate.gte(triggerRatio)) {
          return `Price is ${triggerRatioInverted ? "below" : "above"} Mkt. Price`;
        }
      }
    }
  };

  const renderMinProfitWarning = () => {
    if (MIN_PROFIT_TIME === 0 || order.type === SWAP || !position || !triggerPrice || triggerPrice.eq(0)) {
      return null;
    }

    const { delta, pendingDelta, pendingDeltaPercentage, hasProfit } = calculatePositionDelta(triggerPrice, position);
    if (hasProfit && delta.eq(0)) {
      const { deltaStr } = getDeltaStr({
        delta: pendingDelta,
        deltaPercentage: pendingDeltaPercentage,
        hasProfit,
      });
      const profitPrice = getProfitPrice(triggerPrice, position);
      const minProfitExpiration = position.lastIncreasedTime + MIN_PROFIT_TIME;
      return (
        <div className="Confirmation-box-warning">
          This order will forfeit a&nbsp;
          <a href="https://docs.grizzly.fi/v/eng/product/grizzly-trade" target="_blank" rel="noopener noreferrer">
            profit
          </a>{" "}
          of {deltaStr}. <br />
          Profit price: {position.isLong ? ">" : "<"} $
          {formatAmount(profitPrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}. This rule only applies
          for the next {getTimeRemaining(minProfitExpiration)}, until {formatDateTime(minProfitExpiration)}.
        </div>
      );
    }
  };

  const isPrimaryEnabled = () => {
    if (isSubmitting) {
      return false;
    }
    const error = getError();
    if (error) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }

    if (isSubmitting) {
      return "Updating Order...";
    }
    return "Update Order";
  };

  if (order.type !== SWAP) {
    const triggerPricePrefix = order.triggerAboveThreshold ? TRIGGER_PREFIX_ABOVE : TRIGGER_PREFIX_BELOW;
    return (
      <div className="PositionEditor">
        <Modal
          isVisible={true}
          className="OrderEditor"
          setIsVisible={() => setEditingOrder(null)}
          label="Edit order"
        >
          {renderMinProfitWarning()}
          <div style={{ height: 32 }}></div>
          {isTrailingStop ? (
            <div>
              <div className="trailing-header">
                <span className="positive font-number trailing-percentage">
                  {trailingStopPriceLabel.gt(0) ? trailingStopPercentageValue + "%" : "..."}
                </span>
                <span className="font-number trailing-price">
                  {trailingStopPriceLabel.gt(0)
                    ? "$" +
                    formatAmount(trailingStopPriceLabel, USD_DECIMALS, position.indexToken.displayDecimals, true)
                    : "..."}
                </span>
              </div>
              <div className="trailing-box">
                <div className="Exchange-leverage-slider App-slider negative">
                  <Slider
                    min={0}
                    max={Object.keys(trailingStopPrices)[Object.keys(trailingStopPrices).length - 1]}
                    step={0.1}
                    marks={trailingStopPrices}
                    handle={sliderHandle}
                    onChange={(value) => {
                      setTrailingStopPercentageValue(value);
                    }}
                    value={trailingStopPercentageValue}
                    defaultValue={trailingStopPercentageValue}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{}}>
              <div className="Exchange-swap-section">
                <div className="vcenter">
                  <AutosizeInput
                    type="number"
                    min="0"
                    placeholder="0.00"
                    className="Exchange-swap-input font-number"
                    value={triggerPriceValue}
                    onChange={onTriggerPriceChange}
                  />
                  <span className="Exchange-swap-input">USD</span>
                </div>
                <div
                  className="align-right clickable max"
                  onClick={() => {
                    setTriggerPriceValue(
                      formatAmountFree(position.markPrice, USD_DECIMALS, position.indexToken.displayDecimals)
                    );
                  }}
                >
                  Mark &nbsp; <span className="font-number">{formatAmount(position.markPrice, USD_DECIMALS, position.indexToken.displayDecimals, true)}</span>
                </div>
              </div>
            </div>
          )}

          {!isTrailingStop && (
            <ExchangeInfoRow label="Price">
              {triggerPrice && !triggerPrice.eq(order.triggerPrice) ? (
                <>
                  <span className="muted font-number">
                    {triggerPricePrefix}{" "}
                    {formatAmount(order.triggerPrice, USD_DECIMALS, order.indexToken.displayDecimals, true)}
                  </span>
                  &nbsp;
                  <BsArrowRight />
                  &nbsp;
                  {triggerPricePrefix}{" "}
                  {formatAmount(triggerPrice, USD_DECIMALS, order.indexToken.displayDecimals, true)}
                </>
              ) : (
                <span className="font-number">
                  {triggerPricePrefix}{" "}
                  {formatAmount(order.triggerPrice, USD_DECIMALS, order.indexToken.displayDecimals, true)}
                </span>
              )}
            </ExchangeInfoRow>
          )}
          {!isTrailingStop && liquidationPrice && (
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Liq. Price</div>
              <div className="align-right font-number">{`$${formatAmount(
                liquidationPrice,
                USD_DECIMALS,
                order.indexToken.displayDecimals,
                true
              )}`}</div>
            </div>
          )}
          <div className="Exchange-swap-button-container">
            <button
              className="App-cta Exchange-swap-button Exchange-list-modal-button"
              onClick={onClickPrimary}
              disabled={!isPrimaryEnabled()}
            >
              {getPrimaryText()}
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  // SWAP content
  return (
    <Modal
      isVisible={true}
      className="Exchange-list-modal"
      setIsVisible={() => setEditingOrder(null)}
      label="Edit order"
    >
      <div className="Exchange-swap-section">
        <div className="Exchange-swap-section-top">
          <div className="muted">Price</div>
          {fromTokenInfo && toTokenInfo && (
            <div
              className="muted align-right clickable"
              onClick={() => {
                setTriggerRatioValue(
                  formatAmountFree(getExchangeRate(fromTokenInfo, toTokenInfo, triggerRatioInverted), USD_DECIMALS, 10)
                );
              }}
            >
              Mkt. Price:{" "}
              {formatAmount(getExchangeRate(fromTokenInfo, toTokenInfo, triggerRatioInverted), USD_DECIMALS, 2)}
            </div>
          )}
        </div>
        <div className="Exchange-swap-section-bottom">
          <div className="Exchange-swap-input-container">
            <input
              type="number"
              min="0"
              placeholder="0.0"
              className="Exchange-swap-input"
              value={triggerRatioValue}
              onChange={onTriggerRatioChange}
            />
          </div>
          {(() => {
            if (!toTokenInfo) return;
            if (!fromTokenInfo) return;
            const [tokenA, tokenB] = triggerRatioInverted ? [toTokenInfo, fromTokenInfo] : [fromTokenInfo, toTokenInfo];
            return (
              <div className="PositionEditor-token-symbol">
                {tokenA.symbol}&nbsp;/&nbsp;{tokenB.symbol}
              </div>
            );
          })()}
        </div>
      </div>
      <ExchangeInfoRow label="Minimum received">
        {triggerRatio && !triggerRatio.eq(order.triggerRatio) ? (
          <>
            <span className="muted">{formatAmount(order.minOut, toTokenInfo.decimals, 4, true)}</span>
            &nbsp;
            <BsArrowRight />
            &nbsp;
            {formatAmount(toAmount, toTokenInfo.decimals, 4, true)}
          </>
        ) : (
          formatAmount(order.minOut, toTokenInfo.decimals, 4, true)
        )}
        &nbsp;{toTokenInfo.symbol}
      </ExchangeInfoRow>
      <ExchangeInfoRow label="Price">
        {triggerRatio && !triggerRatio.eq(0) && !triggerRatio.eq(order.triggerRatio) ? (
          <>
            <span className="muted">
              {getExchangeRateDisplay(order.triggerRatio, fromTokenInfo, toTokenInfo, {
                omitSymbols: !triggerRatio || !triggerRatio.eq(order.triggerRatio),
              })}
            </span>
            &nbsp;
            <BsArrowRight />
            &nbsp;
            {getExchangeRateDisplay(triggerRatio, fromTokenInfo, toTokenInfo)}
          </>
        ) : (
          getExchangeRateDisplay(order.triggerRatio, fromTokenInfo, toTokenInfo, {
            omitSymbols: !triggerRatio || !triggerRatio.eq(order.triggerRatio),
          })
        )}
      </ExchangeInfoRow>
      {fromTokenInfo && (
        <div className="Exchange-info-row">
          <div className="Exchange-info-label">{fromTokenInfo.symbol} price</div>
          <div className="align-right font-number">
            {formatAmount(fromTokenInfo.minPrice, USD_DECIMALS, fromTokenInfo.displayDecimals, true)} USD
          </div>
        </div>
      )}
      {toTokenInfo && (
        <div className="Exchange-info-row">
          <div className="Exchange-info-label">{toTokenInfo.symbol} price</div>
          <div className="align-right font-number">
            {formatAmount(toTokenInfo.maxPrice, USD_DECIMALS, toTokenInfo.displayDecimals, true)} USD
          </div>
        </div>
      )}
      <div className="Exchange-swap-button-container">
        <button
          className="App-cta Exchange-swap-button Exchange-list-modal-button"
          onClick={onClickPrimary}
          disabled={!isPrimaryEnabled()}
        >
          {getPrimaryText()}
        </button>
      </div>
    </Modal>
  );
}
