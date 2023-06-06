import React from "react";
import cx from "classnames";

import "./BuyInputSection.css";

export default function BuyInputSection(props) {
  const {
    topLeftLabel,
    topRightLabel,
    onClickTopRightLabel,
    inputValue,
    onInputValueChange,
    onClickMax,
    showMaxButton,
    staticInput,
    balance,
    tokenBalance,
    showBorder,
  } = props;

  return (
    <div className={`Exchange-swap-section buy-input ${showBorder ? "border" : "noborder"}`}>
      <div style={{position: "relative",display:"flex",justifyContent:"space-between",width: "100%"}}>
        <div className="Exchange-swap-section-left">
          <div className={cx("PositionEditor-token-symbol",{
            largePadding: !tokenBalance,
            smallPadding: tokenBalance
          })}>{props.children}</div>
          {tokenBalance && <div style={{ marginTop:"6px",marginLeft:"4px",justifyContent: "flex-start" }} className={cx("align-right", { clickable: onClickTopRightLabel })} onClick={onClickTopRightLabel}>
            <span className="Exchange-swap-label muted">{topRightLabel}</span>&nbsp;
            <span className="Exchange-swap-balance font-number">
              {tokenBalance}
            </span>
          </div>}
          
          
        </div>
        {/* {showMaxButton && (
          <div className="Exchange-swap-max" onClick={onClickMax}>
            MAX
          </div>
        )} */}
        <div className="Exchange-swap-section-right">
          
          <div className="Exchange-swap-input-container">
            {!staticInput && (
              <input
                type="number"
                min="0"
                placeholder="0.0"
                className="Exchange-swap-input font-number"
                value={inputValue}
                onChange={onInputValueChange}
              />
            )}
            {staticInput && <div className="InputSection-static-input">{inputValue}</div>}            
          </div>
          <div className="muted font-number">
            {topLeftLabel}{balance}
          </div>
        </div>
      </div>
        
    </div>
  );
}
