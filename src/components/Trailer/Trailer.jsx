import React, { useEffect, useRef, useState } from "react";
import Slider, { SliderTooltip } from "rc-slider";

import "./Trailer.css";
import Radio from "../Radio/Radio";
import Checkbox from "../Checkbox/Checkbox";
import { bigNumberify, expandDecimals, formatAmount, USD_DECIMALS, USD_DISPLAY_DECIMALS ,parseValue} from "../../Helpers";
import { BigNumber, ethers } from "ethers";
import { isNumber } from "lodash";

const stopLossRadioEnum = {
  stopLoss: "Stop Loss",
  trailingStop: "Trailing Stop",
};

export const sliderHandle = (props) => {
  const { value, dragging, index, ...restProps } = props;
  return (
    <SliderTooltip
      prefixCls="rc-slider-tooltip"
      overlay={`${parseFloat(value).toFixed(2)}%`}
      visible={dragging}
      placement="top"
      key={index}
    >
      <Slider.Handle value={value} {...restProps} />
    </SliderTooltip>
  );
};

const stopLossPrices = {
  0: "None",
  10: "-10%",
  25: "-25%",
  50: "-50%",
  75: "-75%",
};

export const trailingStopPrices = {
  0: "None",
  2: "2%",
  4: "4%",
  6: "6%",
  8: "8%",
  10: "10%",
};

const takeProfitPrices = {
  0: "None",
  25: "25%",
  50: "50%",
  75: "75%",
  100: "100%",
  125: "125%",
};

export default function Trailer(props) {
  const {
    leverageOption,
    tokenPriceInUsd,
    isLong,
    setTakeProfitPrice,
    setIsStopLoss,
    setStopLossPrice,
    setTrailingStopPerc,
    tokenInfo,
    isTrailingEnabled,
    setIsTrailingEnabled
  } = props;
  const formattedTokenPriceInUsd = formatAmount(tokenPriceInUsd, USD_DECIMALS, tokenInfo.displayDecimals, true);
  const [stopLossMark, setStopLossMark] = useState(0);
  const [trailingStopMark, setTrailingStopMark] = useState(0);
  const [takeProfitMark, setTakeProfitMark] = useState(0);
  const [takeProfitInput, setTakeProfitInput] = useState("");

  const [stopLossRadio, setStopLossRadio] = useState(stopLossRadioEnum.stopLoss);

  const isStopLoss = stopLossRadio === stopLossRadioEnum.stopLoss;
  const BIGNUMBER_ZERO = BigNumber.from("0");

  // Stop Loss Price
  let stopLossPriceLabel = BIGNUMBER_ZERO;
  if (tokenPriceInUsd) {
    const leverageMultiplier = isStopLoss ? leverageOption : 1;
    const percentage = stopLossRadio === stopLossRadioEnum.stopLoss ? stopLossMark : trailingStopMark;
    const priceDiff = tokenPriceInUsd.mul(Math.round(percentage * 100)).div(10000 * leverageMultiplier);
    stopLossPriceLabel = isLong ? tokenPriceInUsd.sub(priceDiff) : tokenPriceInUsd.add(priceDiff);
  }

  //Take Profit
  let takeProfitPriceLabel = BIGNUMBER_ZERO;
  if (tokenPriceInUsd) {
    const priceDiff = tokenPriceInUsd.mul(Math.round(takeProfitMark * 100)).div(10000 * leverageOption);
    takeProfitPriceLabel = takeProfitInput ? parseValue(takeProfitInput,30): isLong ? tokenPriceInUsd.add(priceDiff) : tokenPriceInUsd.sub(priceDiff);
  }

  useEffect(() => {
    setStopLossPrice(isStopLoss && isTrailingEnabled && stopLossMark ? stopLossPriceLabel : BIGNUMBER_ZERO);
  }, [isStopLoss, isTrailingEnabled, stopLossMark]);

  useEffect(() => {
    setTakeProfitPrice(
      isTrailingEnabled &&  (takeProfitInput || takeProfitMark) ? takeProfitPriceLabel : BIGNUMBER_ZERO
    );
  }, [takeProfitInput, takeProfitMark, isTrailingEnabled]);

  useEffect(() => {
    setTrailingStopPerc(!isStopLoss && isTrailingEnabled && trailingStopMark ? trailingStopMark : 0);
  }, [isStopLoss, trailingStopMark, isTrailingEnabled]);

  useEffect(() => {
    setIsStopLoss(isStopLoss);
  }, [isStopLoss]);

  return (
    <div className="Exchange-leverage-box">
      <div className="divider"></div>
      <div className="Exchange-leverage-slider-settings">
        <Checkbox isChecked={isTrailingEnabled} setIsChecked={setIsTrailingEnabled}>
          <span className="muted">Pro Trading</span>
        </Checkbox>
      </div>
      {isTrailingEnabled && (
        <>
          <div className="trailing-box">
            <div className="trailing-header">
              <Radio
                options={[stopLossRadioEnum.stopLoss, stopLossRadioEnum.trailingStop]}
                option={stopLossRadio}
                setOption={setStopLossRadio}
              ></Radio>
              <div style={{ color: "red" }}>
                ({formatAmount(stopLossPriceLabel, USD_DECIMALS, tokenInfo.displayDecimals, true)}$)
              </div>
            </div>
            <div className="Exchange-leverage-slider App-slider negative">
              {stopLossRadio === stopLossRadioEnum.stopLoss ? (
                <Slider
                  min={0}
                  max={75}
                  step={0.2}
                  marks={stopLossPrices}
                  handle={sliderHandle}
                  onChange={(value) => {
                    setStopLossMark(value);
                  }}
                  value={stopLossMark}
                  defaultValue={stopLossMark}
                />
              ) : (
                <Slider
                  min={0}
                  max={Object.keys(trailingStopPrices)[Object.keys(trailingStopPrices).length-1]}
                  step={0.1}
                  marks={trailingStopPrices}
                  handle={sliderHandle}
                  onChange={(value) => {
                    setTrailingStopMark(value);
                  }}
                  value={trailingStopMark}
                  defaultValue={trailingStopMark}
                />
              )}
            </div>
          </div>
          <div className="divider"></div>

          <div className="trailing-box">
            <div className="trailing-header">
              <div style={{ display: "flex" }}>
                Take Profit{" "}
                <p style={{ color: "green", marginLeft: "3px" }}>
                  (
                  {takeProfitPriceLabel.gt(0)
                    ? formatAmount(takeProfitPriceLabel, USD_DECIMALS, tokenInfo.displayDecimals, true)
                    : "..."}
                  )$
                </p>
              </div>
              <input
                className="take-profit-input"
                type="number"
                min={0}
                inputMode={"decimal"}
                placeholder="price"
                style={isNaN(takeProfitInput) ? { color: "red" } : {}}
                value={takeProfitInput}
                onChange={(e) => {
                  setTakeProfitInput(e.target.value);
                }}
              />
            </div>
            <div className="Exchange-leverage-slider App-slider negative">
              <Slider
                min={0}
                max={125}
                step={1}
                marks={takeProfitPrices}
                handle={sliderHandle}
                onChange={(value) => {
                  setTakeProfitMark(value);
                  setTakeProfitInput("");
                }}
                value={takeProfitMark}
                defaultValue={takeProfitMark}
              />
            </div>
          </div>
          <div className="divider"></div>
        </>
      )}
    </div>
  );
}
