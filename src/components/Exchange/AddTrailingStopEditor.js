import React, { useEffect, useState } from "react";
import cx from "classnames";
import useSWR from "swr";
import { BigNumber, ethers } from "ethers";
import { BsArrowRight } from "react-icons/bs";

import {
  USD_DECIMALS,
  USD_DISPLAY_DECIMALS,
  BASIS_POINTS_DIVISOR,
  DEPOSIT_FEE,
  DUST_BNB,
  helperToast,
  formatAmount,
  bigNumberify,
  usePrevious,
  formatAmountFree,
  fetcher,
  parseValue,
  expandDecimals,
  shouldRaiseGasError,
  getTokenInfo,
  getLiquidationPrice,
  approveTokens,
  TRAILING_STOP_FEE,
} from "../../Helpers";
import { getContract } from "../../Addresses";
import Tab from "../Tab/Tab";
import Modal from "../Modal/Modal";
import { callContract, createDecreaseOrder } from "../../Api";

import OrderBook from "../../abis/OrderBook.json";
import Token from "../../abis/Token.json";
import Slider from "rc-slider";
import { sliderHandle, trailingStopPrices } from "../Trailer/Trailer";
import Tooltip from "../Tooltip/Tooltip";
import TokenSelector from "./TokenSelector";
import { getTokenAmount } from "./PositionSeller";
import { getNativeToken, getTokens } from "../../data/Tokens";
import { getConstant } from "../../Constants";

const { AddressZero } = ethers.constants;

export default function AddTrailingStopEditor(props) {
  const {
    pendingPositions,
    setPendingPositions,
    positionsMap,
    positionKey,
    isVisible,
    setIsVisible,
    infoTokens,
    active,
    account,
    library,
    collateralTokenAddress,
    pendingTxns,
    setPendingTxns,
    getUsd,
    getLeverage,
    savedIsPnlInLeverage,
    chainId,
  } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trailingStopMark, setTrailingStopMark] = useState(0);
  const [receiveToken, setReceiveToken] = useState();
  const toTokens = getTokens(chainId);

  const BIGNUMBER_ZERO = BigNumber.from("0");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const position = positionsMap && positionKey ? positionsMap[positionKey] : undefined;
  const prevIsVisible = usePrevious(isVisible);

  let title;
  let trailingStopFeeUsd;
  let tokenPriceInUsd;
  let trailingStopPriceLabel = BIGNUMBER_ZERO;
  if (position) {
    title = `Add Trailing Stop`;
    trailingStopFeeUsd = position.size.mul(TRAILING_STOP_FEE).div(BASIS_POINTS_DIVISOR);
    tokenPriceInUsd = position.isLong ? position.indexToken.maxPrice : position.indexToken.minPrice;
  }

  if (tokenPriceInUsd) {
    const priceDiff = tokenPriceInUsd.mul(Math.round(trailingStopMark * 100)).div(position.leverage.toNumber());
    trailingStopPriceLabel = position.isLong ? tokenPriceInUsd.add(priceDiff) : tokenPriceInUsd.sub(priceDiff);
  }

  // Receive Token
  let notEnoughReceiveTokenLiquidity;

  useEffect(() => {
    if (!receiveToken && position && infoTokens && nativeTokenAddress) {
      let _receiveToken =
        position.isLong && position.collateralToken.symbol === "BNB"
          ? getTokenInfo(infoTokens, nativeTokenAddress)
          : position.collateralToken;
      setReceiveToken(_receiveToken);
    }
  }, [position, infoTokens, nativeTokenAddress, receiveToken]);

  const getError = () => {};

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }
    if (trailingStopMark === 0) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    if (isSubmitting) return "Adding...";
    return "Add";
  };

  const resetForm = () => {
    setTrailingStopMark(0);
  };

  useEffect(() => {
    if (prevIsVisible !== isVisible) {
      resetForm();
    }
  }, [prevIsVisible, isVisible]);

  const addTrailingStopTx = async () => {
    const tokenAddress0 = collateralTokenAddress === AddressZero ? nativeTokenAddress : collateralTokenAddress;
    const path = [tokenAddress0];

    const isUnwrap = receiveToken.address === AddressZero;
    const isSwap = receiveToken.address !== tokenAddress0;

    if (isSwap) {
      if (isUnwrap && tokenAddress0 !== nativeTokenAddress) {
        path.push(nativeTokenAddress);
      } else if (!isUnwrap) {
        path.push(receiveToken.address);
      }
    }

    const withdrawETH = isUnwrap;

    const indexTokenAddress =
      position.indexToken.address === AddressZero ? nativeTokenAddress : position.indexToken.address;

    setIsSubmitting(true)
    createDecreaseOrder(
      chainId,
      library,
      indexTokenAddress,
      0, // sizeDelta
      path,
      0, //collateralDelta
      position.isLong,
      0,
      false,
      0, // _minOut
      withdrawETH, // _withdrawETH
      Math.round(trailingStopMark * 100),
    ).then(() => {
      setIsVisible(false);
    })
    .finally(() => {
      setIsSubmitting(false)
    });


  };

  const onClickPrimary = () => {
    addTrailingStopTx();
    return;
  };

  return (
    <div className="PositionEditor AddTrailingStopEditor">
      {position && (
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
          <div style={{ marginTop: "32px" }}>
            <div className="">
              <div className="trailing-box">
                <div className="trailing-header">
                  <span className="positive font-number trailing-percentage">
                    {trailingStopPriceLabel.gt(0) ? trailingStopMark + "%" : "..."}
                  </span>
                  <span className="font-number trailing-price">
                    {trailingStopPriceLabel.gt(0)
                      ? "$" +
                        formatAmount(trailingStopPriceLabel, USD_DECIMALS, position.indexToken.displayDecimals, true)
                      : "..."}
                  </span>
                </div>
                <div className="Exchange-leverage-slider App-slider negative">
                  <Slider
                    min={0}
                    max={Object.keys(trailingStopPrices)[Object.keys(trailingStopPrices).length - 1]}
                    step={0.1}
                    marks={trailingStopPrices}
                    handle={sliderHandle}
                    onChange={(value) => {
                      setTrailingStopMark(value);
                    }}
                    value={trailingStopMark}
                    defaultValue={trailingStopMark}
                  />
                </div>
              </div>
              <div className="trailing-info-box">
                <div className="Exchange-info-row">
                  <div className="Exchange-info-label">Size</div>
                  <div className="align-right font-number">${formatAmount(position.size, USD_DECIMALS, 2, true)}</div>
                </div>
                <div className="Exchange-info-row">
                  <div className="Exchange-info-label">Trailing Stop Fee</div>
                  <div className="align-right font-number">
                    {!trailingStopFeeUsd && "-"}
                    {trailingStopFeeUsd && (
                      <Tooltip
                        handle={`$${formatAmount(trailingStopFeeUsd, USD_DECIMALS, USD_DISPLAY_DECIMALS, true)}`}
                        position="right-bottom"
                        renderContent={() => {
                          return (
                            <div>
                              Only in case of TS position closing a fee of 0.5% based on the position size will be
                              deducted.
                            </div>
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              {/* RECEIVE TOKEN */}
              <div className="trailing-info-box">
                <div className="Exchange-info-row">
                <div className="Exchange-info-label">Receive</div>
                  {receiveToken && (
                    <div className="align-right">
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
                          setReceiveToken(token);
                        }}
                        tokens={toTokens}
                        getTokenState={(tokenOptionInfo) => {}}
                        infoTokens={infoTokens}
                        showTokenImgInDropdown={true}
                        selectedTokenLabel={
                          <span className="PositionSelector-selected-receive-token">{receiveToken.symbol}</span>
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="Exchange-info-row">
                  <div className="Exchange-info-label">Execution Fee</div>
                  <div className="align-right font-number">
                    {formatAmount(getConstant(chainId, "TRAILING_STOP_EXECUTION_GAS_FEE"), 18, 2)}{" "}
                    {getNativeToken(chainId).symbol}
                  </div>
                </div>
              </div>
            </div>
            <div className="Exchange-swap-button-container">
              <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
                {getPrimaryText()}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
