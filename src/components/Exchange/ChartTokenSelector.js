import React from "react";
import { Menu } from "@headlessui/react";
import FaChevronDown from "../../img/DROP_DOWN.svg";
import cx from "classnames";
import "./ChartTokenSelector.css";
import { getTokens, getWhitelistedTokens } from "../../data/Tokens";
import { LONG, SHORT, SWAP } from "../../Helpers";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import IconArrow from '../../assets/icons/icon-arrows'

export default function ChartTokenSelector(props) {
  const { chainId, selectedToken, onSelectToken, swapOption } = props;

  const isLong = swapOption === LONG;
  const isShort = swapOption === SHORT;
  const isSwap = swapOption === SWAP;

  let options = getTokens(chainId);
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const indexTokens = whitelistedTokens.filter((token) => !token.isStable && !token.isWrapped && token.symbol !== "stMATIC");
  const shortableTokens = indexTokens.filter((token) => token.isShortable);

  if (isLong) {
    options = indexTokens;
  }
  if (isShort) {
    options = shortableTokens;
  }

  const onSelect = async (token) => {
    onSelectToken(token);
  };

  var value = selectedToken;

  return (
    <Menu>
      <Menu.Button as="div" disabled={isSwap}>
        <button
          className={cx("App-cta small transparent chart-token-selector flex", { "default-cursor": isSwap })}
        >
          <img src={getImageUrl({
            path: `coins/${value.symbol.toLowerCase()}`,
          })} alt={value.name} className="token-logo"  width={48} />
          <span className="chart-token-selector--current">{value.symbol} / USD</span>
          {/* {!isSwap && <img style={{ width: 14, height: 14 }} src={FaChevronDown} alt="chevron down" />} */}
          {!isSwap && <IconArrow />}
        </button>
      </Menu.Button>
      <div className="chart-token-menu">
        <Menu.Items as="div" className="menu-items chart-token-menu-items">
          {options.map((option, index) => (
            <Menu.Item key={index}>
              <div
                className="menu-item"
                onClick={() => {
                  onSelect(option);
                }}
              >
                <span style={{ marginLeft: 5,padding:'15px 0' }} className="token-label">
                  {option.symbol} / USD
                </span>
              </div>
            </Menu.Item>
          ))}
        </Menu.Items>
      </div>
    </Menu>
  );
}
