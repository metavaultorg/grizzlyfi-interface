import { Menu } from "@headlessui/react";
import { FiChevronDown } from "react-icons/fi";
import { getChainName, getExplorerUrl, ICONLINKS } from "../../config/chains";
import { getContract } from "../../config/contracts";
import { unavailableTokenSymbols } from "../../data/Tokens";
import { addTokenToMetamask, useChainId } from "../../Helpers";
import useWeb3Onboard from "../../hooks/useWeb3Onboard";
import coingeckoIcon from "../../img/coingecko.png";
import metamaskIcon from "../../img/ic_metamask_hover_16.svg";
import bscscanIcon from "../../img/ic_bscscan.svg";
import "./AssetDropdown.css";

function AssetDropdown({ assetSymbol, assetInfo, showReserves }) {
  const { active } = useWeb3Onboard();
  const { chainId } = useChainId();
  let { coingecko, link } = ICONLINKS[chainId][assetSymbol];

  const txUrl = getExplorerUrl(chainId) + "address/" + getContract(chainId,"Vault");

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
            {link && showReserves && (
              <a
                href={txUrl}
                className="asset-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img style={{ width: 30, height: 30}} src={bscscanIcon} alt="Show in explorer" />
                <p>Proof of Reserves</p>
              </a>
            )}
          </>
        </Menu.Item>
        <Menu.Item>
          <>
            {link && (
              <a href={link} className="asset-item" target="_blank" rel="noopener noreferrer">
                <img style={{ width: 30, height: 30}} src={bscscanIcon} alt={getChainName(chainId)} />
                <p>{getChainName(chainId)} Network</p>
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
