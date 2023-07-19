import React, { useCallback, useState, useMemo } from "react";
import cx from "classnames";
import {
  USD_DECIMALS,
  USD_DISPLAY_DECIMALS,
  PRECISION,
  BASIS_POINTS_DIVISOR,
  LIMIT,
  MIN_PROFIT_TIME,
  INCREASE,
  expandDecimals,
  getExchangeRate,
  getProfitPrice,
  getTimeRemaining,
  formatAmount,
  useLocalStorageSerializeKey,
  getExchangeRateDisplay,
  DEFAULT_SLIPPAGE_AMOUNT,
  DEFAULT_HIGHER_SLIPPAGE_AMOUNT,
  formatDateTime,
  calculatePositionDelta,
  STOP,
  getTokenInfo,
  useLocalStorageByChainId,
} from "../../Helpers";


import { BsArrowRight } from "react-icons/bs";
import Modal from "../Modal/Modal";
import Tooltip from "../Tooltip/Tooltip";
import Checkbox from "../Checkbox/Checkbox";
import ExchangeInfoRow from "./ExchangeInfoRow";
import { getNativeToken, getToken, getTokens, getWrappedToken } from "../../data/Tokens";

import "./ConfirmationBox.css";
import TokenSelector from "./TokenSelector";
import { getSwapLimits, getTokenAmount } from "./PositionSeller";
import IconNext from '../../assets/icons/icon-next-left.svg'
import { getContract } from "../../config/contracts";
import { CLOSE_POSITION_RECEIVE_TOKEN_KEY, SLIPPAGE_BPS_KEY } from "../../config/localStorage";
import { getConstant } from "../../config/chains";

const HIGH_SPREAD_THRESHOLD = expandDecimals(1, USD_DECIMALS).div(100); // 1%;

function getSpread(fromTokenInfo, toTokenInfo, isLong, nativeTokenAddress) {
  if (fromTokenInfo && fromTokenInfo.maxPrice && toTokenInfo && toTokenInfo.minPrice) {
    const fromDiff = fromTokenInfo.maxPrice.sub(fromTokenInfo.minPrice).div(2);
    const fromSpread = fromDiff.mul(PRECISION).div(fromTokenInfo.maxPrice.add(fromTokenInfo.minPrice).div(2));
    const toDiff = toTokenInfo.maxPrice.sub(toTokenInfo.minPrice).div(2);
    const toSpread = toDiff.mul(PRECISION).div(toTokenInfo.maxPrice.add(toTokenInfo.minPrice).div(2));

    let value = fromSpread.add(toSpread);

    const fromTokenAddress = fromTokenInfo.isNative ? nativeTokenAddress : fromTokenInfo.address;
    const toTokenAddress = toTokenInfo.isNative ? nativeTokenAddress : toTokenInfo.address;

    if (isLong && fromTokenAddress === toTokenAddress) {
      value = fromSpread;
    }

    return {
      value,
      isHigh: value.gt(HIGH_SPREAD_THRESHOLD),
    };
  }
}

export default function ConfirmationBox(props) {
  const {
    fromToken,
    fromTokenInfo,
    toToken,
    toTokenInfo,
    isSwap,
    isLong,
    isMarketOrder,
    orderOption,
    isShort,
    toAmount,
    fromAmount,
    isHigherSlippageAllowed,
    setIsHigherSlippageAllowed,
    onConfirmationClick,
    setIsConfirming,
    shortCollateralAddress,
    hasExistingPosition,
    leverage,
    existingPosition,
    existingLiquidationPrice,
    displayLiquidationPrice,
    shortCollateralToken,
    isPendingConfirmation,
    triggerPriceUsd,
    triggerRatio,
    fees,
    feesUsd,
    isSubmitting,
    fromUsdMin,
    toUsdMax,
    nextAveragePrice,
    collateralTokenAddress,
    infoTokens,
    feeBps,
    chainId,
    orders,
    isStopLoss,
    stopLossPrice,
    takeProfitPrice,
    trailingStopPerc,
    receiveToken,
    setReceiveToken,
    minExecutionFee,
    trailingStopFeeUsd,
    renderFeesTooltip,
    renderTrailingStopFeeTooltip,
    renderStopLossFeeTooltip,
    renderTakeProfitFeeTooltip,
    renderStopLossTakeProfitFeeTooltip
  } = props;

  
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const allowReceiveTokenChange = !hasExistingPosition && ((stopLossPrice && stopLossPrice.gt(0)) || (takeProfitPrice && takeProfitPrice.gt(0)) || trailingStopPerc > 0)
  let receiveAmount = fromAmount.mul(1000000).mul(1000000);
  let notEnoughReceiveTokenLiquidity;
  let convertedReceiveAmount;
  let swapTokenInfo = getTokenInfo(infoTokens, collateralTokenAddress);;
  const toTokens = getTokens(chainId);
  let collateralToken = getToken(chainId, collateralTokenAddress);
  const [savedRecieveTokenAddress, setSavedRecieveTokenAddress] = useLocalStorageByChainId(
    chainId,
    `${CLOSE_POSITION_RECEIVE_TOKEN_KEY}-${swapTokenInfo.symbol}-${isLong ? "long" : "short"}`
  );
  const [swapToken, setSwapToken] = useState(() =>
    savedRecieveTokenAddress ? toTokens.find((token) => token.address === savedRecieveTokenAddress) : undefined
  );


  if(allowReceiveTokenChange){
    let _receiveToken = swapToken ? 
    orderOption===STOP && isLong && collateralToken.symbol==="MATIC" && swapToken.symbol==="MATIC" ? getTokenInfo(infoTokens, nativeTokenAddress): swapToken : 
    orderOption===STOP && isLong && collateralToken.symbol==="MATIC" ? getTokenInfo(infoTokens, nativeTokenAddress): collateralToken;

    
    convertedReceiveAmount = getTokenAmount(receiveAmount, _receiveToken.address, false, infoTokens);
    notEnoughReceiveTokenLiquidity = swapTokenInfo.availableAmount.lt(convertedReceiveAmount);
    setReceiveToken(_receiveToken)
  }

  const [savedSlippageAmount] = useLocalStorageSerializeKey([chainId, SLIPPAGE_BPS_KEY], DEFAULT_SLIPPAGE_AMOUNT);
  const [isProfitWarningAccepted, setIsProfitWarningAccepted] = useState(false);

  let minOut;
  let fromTokenUsd;
  let toTokenUsd;

  let collateralAfterFees = fromUsdMin;
  if (feesUsd) {
    collateralAfterFees = fromUsdMin.sub(feesUsd);
  }

  if (isSwap) {
    minOut = toAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

    fromTokenUsd = fromTokenInfo
      ? formatAmount(fromTokenInfo.minPrice, USD_DECIMALS, fromTokenInfo.displayDecimals, true)
      : 0;
    toTokenUsd = toTokenInfo ? formatAmount(toTokenInfo.maxPrice, USD_DECIMALS, toTokenInfo.displayDecimals, true) : 0;
  }

  const getTitle = () => {
    if (!isMarketOrder) {
      return "Confirm Limit Order";
    }
    if (isSwap) {
      return "Confirm Swap";
    }
    return isLong ? "Confirm Long" : "Confirm Short";
  };
  const title = getTitle();

  const existingOrder = useMemo(() => {
    const wrappedToken = getWrappedToken(chainId);
    for (const order of orders) {
      if (order.type !== INCREASE) continue;
      const sameToken =
        order.indexToken === wrappedToken.address ? toToken.isNative : order.indexToken === toToken.address;
      if (order.isLong === isLong && sameToken) {
        return order;
      }
    }
  }, [orders, chainId, isLong, toToken.address, toToken.isNative]);

  const getError = () => {
    if (!isSwap && hasExistingPosition && !isMarketOrder) {
      const { delta, hasProfit } = calculatePositionDelta(triggerPriceUsd, existingPosition);
      if (hasProfit && delta.eq(0)) {
        return "Invalid price, see warning";
      }
    }
    if (isMarketOrder && hasPendingProfit && !isProfitWarningAccepted) {
      return "Forfeit profit not checked";
    }
    return false;
  };

  const getPrimaryText = () => {
    if (!isPendingConfirmation) {
      const error = getError();
      if (error) {
        return error;
      }

      if (isSwap) {
        return title;
      }
      const action = isMarketOrder ? (isLong ? "Confirm Long" : "Confirm Short") : "Create Order";

      if (
        isMarketOrder &&
        MIN_PROFIT_TIME > 0 &&
        hasExistingPosition &&
        existingPosition.delta.eq(0) &&
        existingPosition.pendingDelta.gt(0)
      ) {
        return isLong ? `Forfeit profit and ${action}` : `Forfeit profit and Short`;
      }

      return isMarketOrder && MIN_PROFIT_TIME > 0 ? `Accept minimum and ${action}` : action;
    }

    if (!isMarketOrder) {
      return "Creating Order...";
    }
    if (isSwap) {
      return "Swapping...";
    }
    if (isLong) {
      return "Longing...";
    }
    return "Shorting...";
  };

  const isPrimaryEnabled = () => {
    if (getError()) {
      return false;
    }
    return !isPendingConfirmation && !isSubmitting;
  };

  const spread = getSpread(fromTokenInfo, toTokenInfo, isLong, nativeTokenAddress);
  // it's meaningless for limit/stop orders to show spread based on current prices
  const showSpread = isMarketOrder && !!spread;

  let allowedSlippage = savedSlippageAmount;
  if (isHigherSlippageAllowed) {
    allowedSlippage = DEFAULT_HIGHER_SLIPPAGE_AMOUNT;
  }

  const renderSpreadWarning = useCallback(() => {
    if (!isMarketOrder) {
      return null;
    }

    if (spread && spread.isHigh) {
      return (
        <div className="Confirmation-box-warning">
          The spread is &gt; 1%, please ensure the trade details are acceptable before comfirming
        </div>
      );
    }
  }, [isMarketOrder, spread]);

  const renderFeeWarning = useCallback(() => {
    if (orderOption === LIMIT || !feeBps || feeBps <= 50) {
      return null;
    }

    if (isSwap) {
      return (
        <div className="Confirmation-box-warning">
          Fees are high to swap from {fromToken.symbol} to {toToken.symbol}.
        </div>
      );
    }

    if (!collateralTokenAddress) {
      return null;
    }

    const collateralToken = getToken(chainId, collateralTokenAddress);
    return (
      <div className="Confirmation-box-warning">
        Fees are high to swap from {fromToken.symbol} to {collateralToken.symbol}. <br />
        {collateralToken.symbol} is needed for collateral.
      </div>
    );
  }, [feeBps, isSwap, collateralTokenAddress, chainId, fromToken.symbol, toToken.symbol, orderOption]);

  const hasPendingProfit =
    MIN_PROFIT_TIME > 0 && existingPosition && existingPosition.delta.eq(0) && existingPosition.pendingDelta.gt(0);

  const renderMinProfitWarning = useCallback(() => {
    if (MIN_PROFIT_TIME === 0) {
      return null;
    }
    if (!isSwap) {
      if (hasExistingPosition) {
        const minProfitExpiration = existingPosition.lastIncreasedTime + MIN_PROFIT_TIME;
        if (isMarketOrder && existingPosition.delta.eq(0) && existingPosition.pendingDelta.gt(0)) {
          const profitPrice = getProfitPrice(existingPosition.markPrice, existingPosition);
          return (
            <div className="Confirmation-box-warning">
              Increasing this position at the current price will forfeit a&nbsp;
              <a href="https://docs.grizzly.fi/v/eng/product/grizzly-trade" target="_blank" rel="noopener noreferrer">
                pending profit
              </a>{" "}
              of {existingPosition.deltaStr}.<br />
              <br />
              Profit price: {existingPosition.isLong ? ">" : "<"} $
              {formatAmount(profitPrice, USD_DECIMALS, existingPosition.indexToken.displayDecimals, true)}. This rule
              only applies for the next {getTimeRemaining(minProfitExpiration)}, until{" "}
              {formatDateTime(minProfitExpiration)}.
            </div>
          );
        }
        if (!isMarketOrder) {
          const { delta, hasProfit } = calculatePositionDelta(triggerPriceUsd, existingPosition);
          if (hasProfit && delta.eq(0)) {
            const profitPrice = getProfitPrice(existingPosition.markPrice, existingPosition);
            return (
              <div className="Confirmation-box-warning">
                This order will forfeit a&nbsp;
                <a href="https://docs.grizzly.fi/v/eng/product/grizzly-trade" target="_blank" rel="noopener noreferrer">
                  profit
                </a>{" "}
                of {existingPosition.deltaStr}.<br />
                Profit price: {existingPosition.isLong ? ">" : "<"} $
                {formatAmount(profitPrice, USD_DECIMALS, existingPosition.indexToken.displayDecimals, true)}. This rule
                only applies for the next {getTimeRemaining(minProfitExpiration)}, until{" "}
                {formatDateTime(minProfitExpiration)}.
              </div>
            );
          }
        }
      }

      return (
        <div className="Confirmation-box-warning">
          A minimum price change of&nbsp;
          <a href="https://docs.grizzly.fi/v/eng/product/grizzly-trade" target="_blank" rel="noopener noreferrer">
            1.5%
          </a>{" "}
          is required for a position to be in profit. This only applies for the first {MIN_PROFIT_TIME / 60 / 60} hours
          after increasing a position.
        </div>
      );
    }
  }, [isSwap, hasExistingPosition, existingPosition, isMarketOrder, triggerPriceUsd]);

  const renderExistingOrderWarning = useCallback(() => {
    if (isSwap || !existingOrder) {
      return;
    }
    const indexToken = getToken(chainId, existingOrder.indexToken);
    const sizeInToken = formatAmount(
      existingOrder.sizeDelta.mul(PRECISION).div(existingOrder.triggerPrice),
      USD_DECIMALS,
      4,
      true
    );
    return (
      <div className="Confirmation-box-warning">
        You have an active Limit Order to Increase {existingOrder.isLong ? "Long" : "Short"} {sizeInToken}{" "}
        {indexToken.symbol} (${formatAmount(existingOrder.sizeDelta, USD_DECIMALS, 2, true)}) at price $
        {formatAmount(existingOrder.triggerPrice, USD_DECIMALS, existingOrder.indexToken.displayDecimals, true)}
      </div>
    );
  }, [existingOrder, isSwap, chainId]);

  const renderMain = useCallback(() => {

    if (isSwap) {
        return (
            <div className="Confirmation-box-top">
                <div className="Confirmation-box-top-label"><span>Pay</span><span>Receive</span></div>
                <div className="Confirmation-box-top-token-row">
                    <div className="Confirmation-box-top-token-box">
                        <span className="token font-number">
                            {formatAmount(fromAmount, fromToken.decimals, 4, true)} {fromToken.symbol}
                        </span>
                        <span className="usd font-number">
                            ${formatAmount(fromUsdMin, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                        </span>
                    </div>
                    <div className="Swap-next-container">
                        <div className="Swap-next">
                            <img src={IconNext} alt="" width={16} style={{ marginBottom: "-8px", opacity: "0.3" }} />
                            <img src={IconNext} alt="" width={16} />
                        </div>
                    </div>
                    <div className="Confirmation-box-top-token-box">
                        <span className={cx("token font-number", isLong ? "positive" : isShort? "negative":"")}>
                            {formatAmount(toAmount, toToken.decimals, 4, true)} {toToken.symbol}
                        </span>
                        <span className="usd font-number">
                            ${formatAmount(toUsdMax, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                        </span>
                    </div>
                </div>

            </div>
        )
    }

    return (
      <div className="Confirmation-box-top">
        <div className="Confirmation-box-top-label"><span>Pay</span><span>{isLong ? "Long" : "Short"}</span></div>
        <div className="Confirmation-box-top-token-row">
          <div className="Confirmation-box-top-token-box">
            <span className="token font-number">
              {formatAmount(fromAmount, fromToken.decimals, 4, true)} {fromToken.symbol}
            </span>
            <span className="usd font-number">
              ${formatAmount(fromUsdMin, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
            </span>
          </div>
          <div className="Swap-next-container">
            <div className="Swap-next">
              <img src={IconNext} alt="" width={16} style={{ marginBottom: "-8px", opacity: "0.3" }} />
              <img src={IconNext} alt="" width={16} />
            </div>
          </div>
          <div className="Confirmation-box-top-token-box">
            <span className={cx("token font-number", isLong ? "positive" : isShort? "negative":"")}>
              {formatAmount(toAmount, toToken.decimals, 4, true)} {toToken.symbol}
            </span>
            <span className="usd font-number">
              ${formatAmount(toUsdMax, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
            </span>
          </div>
        </div>
      </div>
    );
  }, [isSwap, fromAmount, fromToken, toToken, fromUsdMin, toUsdMax, isLong, toAmount]);

  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");

  const renderAvailableLiquidity = useCallback(() => {
    let availableLiquidity;
    const riskThresholdBps = 5000;
    let isLiquidityRisk;
    const token = isSwap || isLong ? toTokenInfo : shortCollateralToken;

    if (!token || !token.poolAmount || !token.availableAmount) {
      return null;
    }

    if (isSwap) {
      const poolWithoutBuffer = token.poolAmount.sub(token.bufferAmount);
      availableLiquidity = token.availableAmount.gt(poolWithoutBuffer) ? poolWithoutBuffer : token.availableAmount;
      isLiquidityRisk = availableLiquidity.mul(riskThresholdBps).div(BASIS_POINTS_DIVISOR).lt(toAmount);
    } else {
      if (isShort) {
        availableLiquidity = token.availableAmount;

        let adjustedMaxGlobalShortSize;

        if (toTokenInfo.maxAvailableShort && toTokenInfo.maxAvailableShort.gt(0)) {
          adjustedMaxGlobalShortSize = toTokenInfo.maxAvailableShort
            .mul(expandDecimals(1, token.decimals))
            .div(expandDecimals(1, USD_DECIMALS));
        }

        if (adjustedMaxGlobalShortSize && adjustedMaxGlobalShortSize.lt(token.availableAmount)) {
          availableLiquidity = adjustedMaxGlobalShortSize;
        }

        const sizeTokens = toUsdMax.mul(expandDecimals(1, token.decimals)).div(token.minPrice);
        isLiquidityRisk = availableLiquidity.mul(riskThresholdBps).div(BASIS_POINTS_DIVISOR).lt(sizeTokens);
      } else {
        availableLiquidity = token.availableAmount;
        isLiquidityRisk = availableLiquidity.mul(riskThresholdBps).div(BASIS_POINTS_DIVISOR).lt(toAmount);
      }
    }

    if (!availableLiquidity) {
      return null;
    }

    return (
      <ExchangeInfoRow label="Available Liquidity">
        <Tooltip
          position="right-bottom"
          handleClassName={cx(isLiquidityRisk ? "negative" : null, "font-number")}
          handle={
            <>
              {formatAmount(availableLiquidity, token.decimals, token.isStable ? 0 : 2, true)} {token.symbol}
            </>
          }
          renderContent={() =>
            isLiquidityRisk
              ? "There may not be sufficient liquidity to execute your order when the price conditions are met"
              : "The order will only execute if the price conditions are met and there is sufficient liquidity"
          }
        />
      </ExchangeInfoRow>
    );
  }, [toTokenInfo, shortCollateralToken, isShort, isLong, isSwap, toAmount, toUsdMax]);

  const renderMarginSection = useCallback(() => {
    return (
      <>
        <div className="Confirmation-box-info">
          {renderMain()}
          {renderFeeWarning()}
          {renderMinProfitWarning()}
          {renderExistingOrderWarning()}

          {/* section seperator */}
          <div style={{height:8}} />
          <div className="Confirmation-box-info-box">
          {hasPendingProfit && isMarketOrder && (
            <div className="PositionEditor-accept-profit-warning">
              <Checkbox isChecked={isProfitWarningAccepted} setIsChecked={setIsProfitWarningAccepted}>
                <span className="muted">Forfeit profit</span>
              </Checkbox>
            </div>
          )}
          {orderOption === LIMIT && renderAvailableLiquidity()}
          {isShort && (
            <ExchangeInfoRow label="Collateral In">{getToken(chainId, shortCollateralAddress).symbol}</ExchangeInfoRow>
          )}
          {isLong && <ExchangeInfoRow label="Collateral In" value={toTokenInfo.symbol} />}
          <ExchangeInfoRow label="Leverage">
            {hasExistingPosition && toAmount && toAmount.gt(0) && (
              <div className="inline-block muted">
                {formatAmount(existingPosition.leverage, 4, 2)}x
                <BsArrowRight className="transition-arrow" />
              </div>
            )}
            {toAmount && leverage && leverage.gt(0) && `${formatAmount(leverage, 4, 2)}x`}
            {!toAmount && leverage && leverage.gt(0) && `-`}
            {leverage && leverage.eq(0) && `-`}
          </ExchangeInfoRow>
          <ExchangeInfoRow label="Liq. Price">
            {hasExistingPosition && toAmount && toAmount.gt(0) && (
              <div className="inline-block muted">
                $
                {formatAmount(
                  existingLiquidationPrice,
                  USD_DECIMALS,
                  toTokenInfo ? toTokenInfo.displayDecimals : 2,
                  true
                )}
                <BsArrowRight className="transition-arrow" />
              </div>
            )}
            {toAmount &&
              displayLiquidationPrice &&
              `$${formatAmount(displayLiquidationPrice, USD_DECIMALS, toTokenInfo.displayDecimals, true)}`}
            {!toAmount && displayLiquidationPrice && `-`}
            {!displayLiquidationPrice && `-`}
          </ExchangeInfoRow>
          <ExchangeInfoRow label="Fees">
              {renderFeesTooltip()}
          </ExchangeInfoRow>
          {trailingStopPerc > 0 && trailingStopFeeUsd &&
            <ExchangeInfoRow label="Trailing Stop Fee">
              {renderTrailingStopFeeTooltip()}
            </ExchangeInfoRow>
          }
          {stopLossPrice && stopLossPrice.gt(0) && !(takeProfitPrice && takeProfitPrice.gt(0)) &&
            <ExchangeInfoRow label="Stop Loss Fee">
              {renderStopLossFeeTooltip()}
            </ExchangeInfoRow>
          }
          {takeProfitPrice && takeProfitPrice.gt(0) && !(stopLossPrice && stopLossPrice.gt(0)) &&
            <ExchangeInfoRow label="Take Profit Fee">
              {renderTakeProfitFeeTooltip()}
            </ExchangeInfoRow>
          }
          {takeProfitPrice && takeProfitPrice.gt(0) && stopLossPrice && stopLossPrice.gt(0) &&
            <ExchangeInfoRow label="Stop Loss/Take Profit Fee">
              {renderStopLossTakeProfitFeeTooltip()}
            </ExchangeInfoRow>
          }
          <ExchangeInfoRow label="Collateral">
            <Tooltip
              handle={`$${formatAmount(collateralAfterFees, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}`}
              handleClassName="font-number"
              position="right-bottom"
              renderContent={() => {
                return (
                  <>
                    Your position's collateral after deducting fees.
                    <br />
                    <br />
                    Pay amount: ${formatAmount(fromUsdMin, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                    <br />
                    Fees: ${formatAmount(feesUsd, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}
                    <br />
                  </>
                );
              }}
            />
          </ExchangeInfoRow>
          </div>
          {/* section seperator */}
          <div style={{height:8}} />
          <div className="Confirmation-box-info-box">
          {showSpread && (
            <ExchangeInfoRow label="Spread" isWarning={spread.isHigh} isTop={false}>
              {formatAmount(spread.value.mul(100), USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}%
            </ExchangeInfoRow>
          )}
          {isMarketOrder && (
            <ExchangeInfoRow label="Entry Price">
              {hasExistingPosition && toAmount && toAmount.gt(0) && (
                <div className="inline-block muted">
                  $
                  {formatAmount(
                    existingPosition.averagePrice,
                    USD_DECIMALS,
                    existingPosition.indexToken.displayDecimals,
                    true
                  )}
                  <BsArrowRight className="transition-arrow" />
                </div>
              )}
              {nextAveragePrice && `$${formatAmount(nextAveragePrice, USD_DECIMALS, toToken.displayDecimals, true)}`}
              {!nextAveragePrice && `-`}
            </ExchangeInfoRow>
          )}
          {!isMarketOrder && (
            <ExchangeInfoRow label="Limit Price" isTop={false}>
              ${formatAmount(triggerPriceUsd, USD_DECIMALS, toToken ? toToken.displayDecimals : 2, true)}
            </ExchangeInfoRow>
          )}
          <ExchangeInfoRow label="Borrow Fee">
            {isLong && toTokenInfo && formatAmount(toTokenInfo.fundingRate, 4, 4)}
            {isShort && shortCollateralToken && formatAmount(shortCollateralToken.fundingRate, 4, 4)}
            {((isLong && toTokenInfo && toTokenInfo.fundingRate) ||
              (isShort && shortCollateralToken && shortCollateralToken.fundingRate)) &&
              "% / 1h"}
          </ExchangeInfoRow>
          <ExchangeInfoRow label="Allowed Slippage">
            <Tooltip
              handle={`${formatAmount(allowedSlippage, 2, 2)}%`}
              handleClassName="font-number"
              position="right-top"
              renderContent={() => {
                return (
                  <>
                    You can change this in the settings menu on the top right of the page.
                    <br />
                    <br />
                    Note that a low allowed slippage, e.g. less than 0.5%, may result in failed orders if prices are
                    volatile.
                  </>
                );
              }}
            />
          </ExchangeInfoRow>
          {isMarketOrder && (
            <div className="PositionEditor-allow-higher-slippage">
              <Checkbox isChecked={isHigherSlippageAllowed} setIsChecked={setIsHigherSlippageAllowed}>
                <span className="muted">Allow up to 1% slippage</span>
              </Checkbox>
            </div>
          )}

          {/* RECEIVE TOKEN */}
          {allowReceiveTokenChange && (
            <div className="Exchange-info-row PositionSeller-receive-row">
              <div className="Exchange-info-label">Receive</div>

              {!allowReceiveTokenChange && receiveToken && (
                <div className="align-right font-number PositionSelector-selected-receive-token">
                  {formatAmount(convertedReceiveAmount, receiveToken.decimals, 4, true)}&nbsp;{receiveToken.symbol} ($
                  {formatAmount(receiveAmount, USD_DECIMALS, 2, true)})
                </div>
              )}

              {allowReceiveTokenChange && receiveToken && (
                <div className="align-right font-number">
                  <TokenSelector
                    // Scroll lock lead to side effects
                    // if it applied on modal inside another modal
                    disableBodyScrollLock={true}
                    className={cx("PositionSeller-token-selector", { warning: notEnoughReceiveTokenLiquidity })}
                    label={"Receive"}
                    showBalances={false}
                    chainId={chainId}
                    tokenAddress={receiveToken.address}
                    onSelectToken={(token) => {
                      setSwapToken(token);
                      setSavedRecieveTokenAddress(token.address);
                    }}
                    tokens={toTokens}
                    getTokenState={(tokenOptionInfo) => {
                      const convertedTokenAmount = getTokenAmount(
                        receiveAmount,
                        tokenOptionInfo.address,
                        false,
                        infoTokens
                      );

                      if (tokenOptionInfo.availableAmount.lt(convertedTokenAmount)) {
                        const { maxIn, maxOut, maxInUsd, maxOutUsd } = getSwapLimits(
                          infoTokens,
                          collateralTokenAddress,
                          tokenOptionInfo.address
                        );

                        const collateralInfo = getTokenInfo(infoTokens, collateralTokenAddress);

                        return {
                          disabled: true,
                          message: (
                            <div>
                              Insufficient Available Liquidity to swap to {tokenOptionInfo.symbol}
                              <br />
                              <br />
                              Max {collateralInfo.symbol} in: {formatAmount(maxIn, collateralInfo.decimals, 2, true)}{" "}
                              {collateralInfo.symbol}
                              <br />
                              (${formatAmount(maxInUsd, USD_DECIMALS, 2, true)})
                              <br />
                              <br />
                              Max {tokenOptionInfo.symbol} out:{" "}
                              {formatAmount(maxOut, tokenOptionInfo.decimals, 2, true)} {tokenOptionInfo.symbol}
                              <br />
                              (${formatAmount(maxOutUsd, USD_DECIMALS, 2, true)})
                            </div>
                          ),
                        };
                      }
                    }}
                    infoTokens={infoTokens}
                    showTokenImgInDropdown={true}
                    selectedTokenLabel={
                      <span className="PositionSelector-selected-receive-token">
                        
                        {receiveToken.symbol}
                      </span>
                    }
                  />
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </>
    );
  }, [
    renderMain,
    renderMinProfitWarning,
    shortCollateralAddress,
    isShort,
    isLong,
    toTokenInfo,
    nextAveragePrice,
    toAmount,
    hasExistingPosition,
    existingPosition,
    isMarketOrder,
    triggerPriceUsd,
    showSpread,
    spread,
    displayLiquidationPrice,
    existingLiquidationPrice,
    feesUsd,
    leverage,
    shortCollateralToken,
    renderExistingOrderWarning,
    chainId,
    renderFeeWarning,
    hasPendingProfit,
    isProfitWarningAccepted,
    renderAvailableLiquidity,
    orderOption,
    fromUsdMin,
    collateralAfterFees,
    isHigherSlippageAllowed,
    setIsHigherSlippageAllowed,
    allowedSlippage,
  ]);

  const renderSwapSection = useCallback(() => {
    return (
      <>
        <div className="Confirmation-box-info">
          {renderMain()}
          {renderFeeWarning()}
          {renderSpreadWarning()}

          <div style={{height:8}} />
          <div className="Confirmation-box-info-box">
          {orderOption === LIMIT && renderAvailableLiquidity()}
          <ExchangeInfoRow label="Min. Receive">
            {formatAmount(minOut, toTokenInfo.decimals, 4, true)} {toTokenInfo.symbol}
          </ExchangeInfoRow>
          <ExchangeInfoRow label="Price">
            {getExchangeRateDisplay(getExchangeRate(fromTokenInfo, toTokenInfo), fromTokenInfo, toTokenInfo)}
          </ExchangeInfoRow>
          {!isMarketOrder && (
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Limit Price</div>
              <div className="align-right font-number">{getExchangeRateDisplay(triggerRatio, fromTokenInfo, toTokenInfo)}</div>
            </div>
          )}
          {showSpread && (
            <ExchangeInfoRow label="Spread" isWarning={spread.isHigh}>
              {formatAmount(spread.value.mul(100), USD_DECIMALS, 2, true)}%
            </ExchangeInfoRow>
          )}
          <div className="Exchange-info-row">
            <div className="Exchange-info-label">Fees</div>
            <div className="align-right font-nubmer">
              {renderFeesTooltip()}
            </div>
          </div>
          {fromTokenUsd && (
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">{fromTokenInfo.symbol} Price</div>
              <div className="align-right font-number">{fromTokenUsd} USD</div>
            </div>
          )}
          {toTokenUsd && (
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">{toTokenInfo.symbol} Price</div>
              <div className="align-right font-number">{toTokenUsd} USD</div>
            </div>
          )}
         </div>
        </div>
      </>
    );
  }, [
    renderMain,
    renderSpreadWarning,
    fromTokenInfo,
    toTokenInfo,
    orderOption,
    showSpread,
    spread,
    feesUsd,
    feeBps,
    fromTokenUsd,
    toTokenUsd,
    triggerRatio,
    fees,
    isMarketOrder,
    minOut,
    renderFeeWarning,
    renderAvailableLiquidity,
  ]);

  return (
    <div className="Confirmation-box">
      <Modal isVisible={true} setIsVisible={() => setIsConfirming(false)} label={title}>
        {isSwap && renderSwapSection()}
        {!isSwap && renderMarginSection()}
        <div style={{ marginTop: 40 }} className="Confirmation-box-row">
          <button
            style={{ }}
            onClick={onConfirmationClick}
            className={cx("App-cta Confirmation-box-button text-uppercase", isLong?"positive":isShort?"negative":"")}
            disabled={!isPrimaryEnabled()}
          >
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}
