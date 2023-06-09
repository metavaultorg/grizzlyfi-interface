import { Bridge } from "@socket.tech/widget";
import React, { useEffect } from "react";
import Footer from "../../Footer";

import { ethers } from "ethers";

import { useWeb3React } from "@web3-react/core";

import "./BuyMVX.css";

import { useChainId } from "../../Helpers";

import AcrossSvg from "../../assets/platforms/across.svg";
import CbridgeSvg from "../../assets/platforms/cbridge.svg";
import FirebirdSvg from "../../assets/platforms/firebird.svg";
import ParaswapSvg from "../../assets/platforms/paraswap.svg";
import OneInchSvg from "../../assets/platforms/1inch.svg";
import HopSvg from "../../assets/platforms/hop.svg";
import HotbitSvg from "../../assets/platforms/hotbit.svg";
import HyphenSvg from "../../assets/platforms/hyphen.svg";
import KyberSvg from "../../assets/platforms/kyber.svg";
import MexcSvg from "../../assets/platforms/mexc.svg";
import MultichainSvg from "../../assets/platforms/multichain.svg";
import OpenOceanSvg from "../../assets/platforms/openocean.svg";
import SwypeSvg from "../../assets/platforms/swype.svg";
import SynapseSvg from "../../assets/platforms/synapse.svg";
import UniswapSvg from "../../assets/platforms/uniswap.svg";
import XpollinateSvg from "../../assets/platforms/xpollinate.svg";
import MuteSvg from "../../assets/platforms/mute.svg";
import MerlinSvg from "../../assets/platforms/merlin.svg";
import VelocoreSvg from "../../assets/platforms/velocore.svg";
import Polygon24Svg from "../../img/ic_polygon_24.svg";
import ZkSync24Svg from "../../img/ic_zksync_24.svg";

export default function BuyMVX() {
  const { library } = useWeb3React();
  const { chainId } = useChainId();

  // const provider = getProvider(library, chainId);

  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Bridge & Swap Config

  const defaultSourceNetwork = 1;
  const defaultDestNetwork = 137;

  // Support for all possible networks
  const supportedNetworks = [1, 10, 56, 100, 137, 250, 42161, 43114, 1313161554];

  const customize = {
    // width: 470,
    fontFamily: "Boston",
    responsiveWidth: true,
    borderRadius: 1,
    primary: "rgb(58, 55, 95)",
    secondary: "rgb(39, 37, 86)",
    text: "rgb(254,254,254)",
    secondaryText: "rgb(240,240,240)",
    accent: "rgb(255,170,39)",
    onAccent: "rgb(0,0,0)",
    interactive: "rgb(15, 20, 66)",
    onInteractive: "rgb(255,170,3)",
    // outline: "rgb(255,26,91)",
    fontWeight: 700,
  };

  return (
    <div className="default-container DashboardV2 page-layout">
      <div className="section-title-block2 mb-3 sectionsmallscreen">
        {/* <div className="section-title-icon section-title-iconsmall">
          <img style={{ width: "116px" }} src={statsIcon} alt="statsBigIcon" />
        </div> */}
        <div className="section-title-content">
          <div className="Page-title">Buy MVX</div>
          <div className="Page-description">
            You can participate in the platform earnings by buying and staking MVX. To buy MVX, ensure you are connected
            to the Polygon Network and have enough MATIC for the gas fees.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "40px" }} className="DashboardV2-content">
        <div className="DashboardV2-cards ">
          {/** Bridge & Swap Section */}
          <div className="App-card ">
            <div className="App-card-title">Bridge & Swap</div>
            <div className="App-card-divider"></div>
            <div style={{ paddingTop: "33.940px", paddingLeft: 0 }} className="App-card-content">
              <div className="bridgeContainer">
                <Bridge
                  provider={provider}
                  API_KEY={process.env.REACT_APP_SOCKET_API_KEY}
                  sourceNetworks={supportedNetworks}
                  destNetworks={supportedNetworks}
                  defaultSourceNetwork={defaultSourceNetwork}
                  defaultDestNetwork={defaultDestNetwork}
                  singleTxOnly={false}
                  customize={customize}
                />

                <div className="App-card-row padding-left"></div>

                <div class="link-group">
                  <h5>MVX Bridge</h5>
                  <div className="bridge-description">
                    <p className="Page-description">To bridge MVX between Polygon and zkSync please us</p>
                    <div className="button-container">
                      <a
                        href="https://app.multichain.org/#/router"
                        target="_blank"
                        style={{ maxWidth: 160 }}
                        rel="noopener noreferrer"
                      >
                        <img className="button-img" src={MultichainSvg} alt="Buy MVX" />
                        Multichain
                      </a>


                    <a href="https://cbridge.celer.network/#/transfer" target="_blank" rel="noopener noreferrer">
                      <img className="button-img" src={CbridgeSvg} alt="Buy MVX" />
                      cBridge
                    </a>
                    </div>
                  </div>
                </div>

                <div className="App-card-row padding-left"></div>

                <div className="link-group">
                  <h5>Funds Bridge </h5>
                  <p className="Page-description">To bridge funds from or to Polygon you can use this bridges.</p>

                  <div className="button-container">
                    <a
                      href="https://synapseprotocol.com/?inputCurrency=USDC&outputCurrency=USDC&outputChain=137"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img className="button-img" src={SynapseSvg} alt="Buy MVX" />
                      Synapse
                    </a>

                    <a href="https://app.multichain.org/#/router" target="_blank" rel="noopener noreferrer">
                      <img className="button-img" src={MultichainSvg} alt="Buy MVX" />
                      Multichain
                    </a>
                    <a href="https://cbridge.celer.network/#/transfer" target="_blank" rel="noopener noreferrer">
                      <img className="button-img" src={CbridgeSvg} alt="Buy MVX" />
                      cBridge
                    </a>
                    <a href="https://bridge.connext.network/" target="_blank" rel="noopener noreferrer">
                      <img className="button-img" src={XpollinateSvg} alt="Buy MVX" />
                      xPollinate
                    </a>
                    <a href="https://app.hop.exchange/#/send?token=ETH" target="_blank" rel="noopener noreferrer">
                      <img className="button-img" src={HopSvg} alt="Buy MVX" />
                      Hop
                    </a>

                    <a href="https://across.to/bridge" target="_blank" rel="noopener noreferrer">
                      <img className="button-img" src={AcrossSvg} alt="Buy MVX" />
                      Across
                    </a>

                    <a
                      className="center"
                      href="https://hyphen.biconomy.io/bridge"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img className="button-img" src={HyphenSvg} alt="Buy MVX" />
                      Hyphen
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/** Buy MVX Section*/}
          <div className="App-card">
            <div className="App-card-title">Buy MVX</div>
            <div className="App-card-divider"></div>
            <div
              style={{
                padding: 5,
                paddingBottom: 30,
              }}
              className="App-card-content"
            >
              <div className="link-group" style={{ paddingTop: 40 }}>
                <p>Buy MVX from decentralized exchanges</p>

                <div className="button-container">
                  <a
                    href="https://app.uniswap.org/#/swap?inputCurrency=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&outputCurrency=0x2760e46d9bb43dafcbecaad1f64b93207f9f0ed7&chain=polygon"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img className="button-img" src={UniswapSvg} alt="Buy MVX" />
                    Uniswap
                    <img className="network-img" src={Polygon24Svg} alt="Polygon"></img>
                  </a>

                  <a
                    href="https://kyberswap.com/swap/polygon/usdt-to-mvx?utm_source=KN%20site&utm_medium=Launch%20App%2FStart%20Trading%2FStart%20Now&utm_campaign=KN-KyberSwap&utm_id=KN-KyberSwap&utm_content=KN-KyberSwap"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img className="button-img" src={KyberSvg} alt="Buy MVX" />
                    KyberSwap
                    <img className="network-img" src={Polygon24Svg} alt="Polygon"></img>
                  </a>

                  <a href="https://app.mute.io/" target="_blank" rel="noopener noreferrer">
                    <img className="button-img" src={MuteSvg} alt="Buy MVX" style={{ padding: "0px" }} />
                    <img className="network-img" src={ZkSync24Svg} alt="zkSync"></img>
                  </a>

                  {/* <a href="https://app.mage.exchange/" target="_blank" rel="noopener noreferrer">
                    <img className="button-img" src={MerlinSvg} alt="Buy MVX" />
                    Merlin
                    <img className="network-img" src={ZkSync24Svg} alt="zkSync"></img>
                  </a> */}

                  <a
                    href="https://app.velocore.xyz/swap?to=ETH&from=0xC8Ac6191CDc9c7bF846AD6b52aaAA7a0757eE305"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img className="button-img" src={VelocoreSvg} alt="Buy MVX" />
                    Velocore
                    <img className="network-img" src={ZkSync24Svg} alt="zkSync"></img>
                  </a>
                </div>
              </div>

              <div className="App-card-row"></div>

              <div className="link-group">
                <p>Buy MVX from centralized exchanges</p>

                <div className="button-container">
                  <a
                    href="https://www.mexc.com/exchange/MVX_USDT?_from=market"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img className="button-img" src={MexcSvg} alt="Buy MVX" />
                    MEXC
                  </a>

                  <a href="https://www.hotbit.io/exchange?symbol=MVX_USDT" target="_blank" rel="noopener noreferrer">
                    <img className="button-img" src={HotbitSvg} alt="Buy MVX" />
                    Hotbit
                  </a>
                </div>
              </div>

              <div className="App-card-row padding-left"></div>

              <div className="link-group">
                <p>Buy MVX via aggregators</p>

                <div className="button-container">
                  <a
                    href="https://app.openocean.finance/CLASSIC#/POLYGON/USDC/MVX"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img className="button-img" src={OpenOceanSvg} alt="Buy MVX" />
                    OpenOcean
                  </a>

                  <a
                    href="https://app.firebird.finance/swap?outputCurrency=0x2760E46d9BB43dafCbEcaad1F64b93207f9f0eD7&net=137&utm_campaign=oref&aff=T3uEeexPPSSLMwBSSA2jnA9Ngq9"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img className="button-img" src={FirebirdSvg} alt="Buy MVX" />
                    Firebird
                  </a>

                  <a href="https://app.paraswap.io/#/?network=polygon" target="_blank" rel="noopener noreferrer">
                    <img className="button-img" src={ParaswapSvg} alt="Buy MVX" />
                    ParaSwap
                  </a>

                  <a href="https://app.1inch.io/#/137/simple/swap/MATIC/MVX" target="_blank" rel="noopener noreferrer">
                    <img className="button-img" src={OneInchSvg} alt="Buy MVX" />
                    1inch
                  </a>
                </div>
              </div>
              <div className="App-card-row padding-left"></div>

              <div className="link-group">
                <p>Buy MVX using your bank account or credit-card</p>

                <div className="button-container">
                  <a href="https://www.swype.com/" target="_blank" rel="noopener noreferrer">
                    <img className="button-img" src={SwypeSvg} alt="Buy MVX" />
                    Swype
                  </a>
                </div>
                <div className="App-card-row padding-left"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
