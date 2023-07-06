import { Menu } from "@headlessui/react";
import { FiChevronDown } from "react-icons/fi";
import { addTokenToMetamask, ICONLINKS, platformTokens, useChainId } from "../../Helpers";
import useWeb3Onboard from "../../hooks/useWeb3Onboard";
import coingeckoIcon from "../../img/coingecko.png";
import metamaskIcon from "../../img/ic_metamask_hover_16.svg";
import maticIcon from "../../img/ic_polygon_16.svg";
import zkSyncEraIcon from "../../img/ic_zksync_era.svg";
import "./AssetDropdown.css";

function AssetDropdown({ assetSymbol, assetInfo, showReserves }) {
  const { active } = useWeb3Onboard();
  const { chainId } = useChainId();
  let { coingecko, polygon, zkSync } = ICONLINKS[chainId][assetSymbol];
  const unavailableTokenSymbols = {
    5611: ["tBNB"],
  };

  return (
    <Menu as="div" className="asset-menu">
      <Menu.Button as="div" className="dropdown-arrow">
        <FiChevronDown size={20} />
      </Menu.Button>
      <Menu.Items as="div" className="asset-menu-items">
        <Menu.Item>
          <>
            {coingecko && (
              <a href={coingecko} className="asset-item" target="_blank" rel="noopener noreferrer">
                <img style={{ width: 30, height: 30 }} src={coingeckoIcon} alt="Show on Coingecko" />
                <p>Show on Coingecko</p>
              </a>
            )}
          </>
        </Menu.Item>
        <Menu.Item>
          <>
            {polygon && showReserves && (
              <a
                href="https://bscscan.com/address/0x32848e2d3aecfa7364595609fb050a301050a6b4"
                className="asset-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={maticIcon} alt="Show in explorer" />
                <p>Proof of Reserves</p>
              </a>
            )}
          </>
        </Menu.Item>
        <Menu.Item>
          <>
            {polygon && (
              <a href={polygon} className="asset-item" target="_blank" rel="noopener noreferrer">
                <img src={maticIcon} alt="Bsc" />
                <p>Bsc Network</p>
              </a>
            )}
          </>
        </Menu.Item>

        <Menu.Item>
          <>
            {zkSync && (
              <a href={zkSync} className="asset-item" target="_blank" rel="noopener noreferrer">
                <img src={zkSyncEraIcon} alt="Show in explorer" />
                <p>zkSync Era</p>
              </a>
            )}
          </>
        </Menu.Item>

        <Menu.Item>
          <>
            {active && unavailableTokenSymbols[chainId].indexOf(assetSymbol) < 0 && (
              <div
                onClick={() => {
                  let token = assetInfo
                    ? { ...assetInfo, image: assetInfo.imageUrl }
                    : platformTokens[chainId][assetSymbol];
                  addTokenToMetamask(token);
                }}
                className="asset-item"
              >
                <img style={{ width: 30, height: 30 }} src={metamaskIcon} alt="Add to Metamask" />
                <p>Add to Metamask</p>
              </div>
            )}
          </>
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}

export default AssetDropdown;
