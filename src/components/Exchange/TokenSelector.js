import React, { useState, useEffect } from "react";
import cx from "classnames";

import { formatAmount, expandDecimals, bigNumberify } from "../../Helpers";

import { getToken } from "../../data/Tokens";

import { BiChevronDown } from "react-icons/bi";

import Modal from "../Modal/Modal";

import dropDownIcon from "../../img/DROP_DOWN.svg";
import IconSearch from "../../assets/icons/icon-search-new.svg";
import "./TokenSelector.css";
import TooltipWithPortal from "../Tooltip/TooltipWithPortal";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import IconArrow from '../../assets/icons/icon-arrows'

export default function TokenSelector(props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const tokenInfo = getToken(props.chainId, props.tokenAddress);
  const {
    tokens,
    mintingCap,
    infoTokens,
    showMintingCap,
    disabled,
    selectedTokenLabel,
    showBalances = true,
    showTokenImgInDropdown = false,
    showSymbolImage = false,
    showNewCaret = false,
    getTokenState = () => ({ disabled: false, message: null }),
    disableBodyScrollLock,
    newStyle,
  } = props;

  const visibleTokens = tokens.filter((t) => !t.isTempHidden);

  const onSelectToken = (token) => {
    setIsModalVisible(false);
    props.onSelectToken(token);
  };

  useEffect(() => {
    if (isModalVisible) {
      setSearchKeyword("");
    }
  }, [isModalVisible]);

  if (!tokenInfo) {
    return null;
  }

  var tokenImage = null;

  try {
    tokenImage = getImageUrl({
      path: `coins/${tokenInfo.symbol.toLowerCase()}`,
    });
  } catch (error) {
    console.error(error);
  }

  const onSearchKeywordChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const filteredTokens = visibleTokens.filter((item) => {
    return (
      item.name.toLowerCase().indexOf(searchKeyword.toLowerCase()) > -1 ||
      item.symbol.toLowerCase().indexOf(searchKeyword.toLowerCase()) > -1
    );
  });

  const _handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredTokens.length > 0) {
      onSelectToken(filteredTokens[0]);
    }
  };

  return (
    <div className={cx("TokenSelector", { disabled }, props.className)}>
      <Modal
        disableBodyScrollLock={disableBodyScrollLock}
        isVisible={isModalVisible}
        setIsVisible={setIsModalVisible}
        label={props.label}
      >
        <div className="TokenSelector-tokens">
          <div className="TokenSelector-token-row TokenSelector-token-input-row">
            <img src={IconSearch} alt=""/>
            <input
              type="text"
              placeholder="Search Token"
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e)}
              onKeyDown={_handleKeyDown}
              // autoFocus
            />
          </div>
          <div className="TokenSelector-token-rows">
            {filteredTokens.map((token, tokenIndex) => {
              let tokenPopupImage;
              try {
                tokenPopupImage = getImageUrl({
                  path: `coins/${token.symbol.toLowerCase()}`,
                });
              } catch (error) {
                tokenPopupImage = getImageUrl({
                  path: `coins/busd`,
                });
              }
              let info = infoTokens ? infoTokens[token.address] : {};
              let mintAmount;
              let balance = info.balance;
              if (showMintingCap && mintingCap && info.usdgAmount) {
                mintAmount = mintingCap.sub(info.usdgAmount);
              }
              if (mintAmount && mintAmount.lt(0)) {
                mintAmount = bigNumberify(0);
              }
              let balanceUsd;
              if (balance && info.maxPrice) {
                balanceUsd = balance.mul(info.maxPrice).div(expandDecimals(1, token.decimals));
              }

              const tokenState = getTokenState(info) || {};

              return (
                <div
                  key={token.address}
                  className={cx("TokenSelector-token-row", { disabled: tokenState.disabled })}
                  onClick={() => !tokenState.disabled && onSelectToken(token)}
                >
                  {tokenState.disabled && tokenState.message && (
                    <TooltipWithPortal
                      className="TokenSelector-tooltip"
                      portalClassName="TokenSelector-tooltip-portal"
                      handle={<div className="TokenSelector-tooltip-backing" />}
                      position={tokenIndex < filteredTokens.length / 2 ? "center-bottom" : "center-top"}
                      disableHandleStyle
                      closeOnDoubleClick
                      fitHandleWidth
                      renderContent={() => tokenState.message}
                    />
                  )}
                  <div className="Token-info">
                    {showTokenImgInDropdown && <img src={tokenPopupImage} alt={token.name} className="token-logo" />}
                    <div className="Token-symbol">
                      <div className="Token-text">{token.symbol}</div>
                      <span style={{ display: "flex", alignItems: "center", gap: 13 }} className="text-accent">
                        {token.name}
                        {token.isNew && (
                          <span
                            style={{
                              background: "#f2c75c",
                              fontWeight: "bold",
                              fontSize: 12,
                              padding: "0 10px",
                              color: "black",
                              borderRadius: 30,
                              userSelect: "none",
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="Token-balance">
                    {showBalances && balance && (
                      <div className="Token-text font-number">
                        {balance.gt(0) && formatAmount(balance, token.decimals, 4, true)}
                        {balance.eq(0) && "-"}
                      </div>
                    )}
                    <span className="text-accent">
                      {mintAmount && <div>Mintable: {formatAmount(mintAmount, token.decimals, 2, true)} USDG</div>}
                      {showMintingCap && !mintAmount && <div>-</div>}
                      {!showMintingCap && showBalances && balanceUsd && balanceUsd.gt(0) && (
                        <div className="font-number">${formatAmount(balanceUsd, 30, 2, true)}</div>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
      {newStyle ?
        selectedTokenLabel ? (
          <div className="TokenSelector-box" onClick={() => setIsModalVisible(true)}>
            {selectedTokenLabel}
            {!showNewCaret && <BiChevronDown className="TokenSelector-caret" />}
          </div>
        ) : (
          <div className="TokenSelector-box" onClick={() => setIsModalVisible(true)}>
            {showSymbolImage && (
              <div className="selected-token-img-container">
                <img src={tokenImage} alt={tokenInfo.symbol} width={18} height={18} />
              </div>
            )}
            <span className="selected-token-text">{tokenInfo.symbol}</span>
          </div>
        )
      :
        selectedTokenLabel ? (
          <div className="TokenSelector-box" onClick={() => setIsModalVisible(true)}>
            {selectedTokenLabel}
            {!showNewCaret && <IconArrow />}
          </div>
        ) : (
          <div className="TokenSelector-box" onClick={() => setIsModalVisible(true)}>
            {tokenInfo.symbol}
            {showSymbolImage && (
              <img src={tokenImage} alt={tokenInfo.symbol} className="TokenSelector-box-symbol" />
            )}
            {showNewCaret && <img src={dropDownIcon} alt="dropDownIcon" className="TokenSelector-box-caret" />}
            {!showNewCaret && <BiChevronDown className="TokenSelector-caret" />}
          </div>
        )
      }
    </div>
  );
}
