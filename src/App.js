import { ethers } from "ethers";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SWRConfig } from "swr";

import { AnimatePresence, motion } from "framer-motion";

import NotFound from "./404";

import { Web3Provider } from "@ethersproject/providers";

import { NavLink, Redirect, Route, Switch } from "react-router-dom";
import Logo from "./assets/logos/Logo.jsx";

import {
  activateInjectedProvider,
  BASIS_POINTS_DIVISOR,
  clearWalletConnectData,
  clearWalletLinkData,
  CURRENT_PROVIDER_LOCALSTORAGE_KEY,
  DEFAULT_SLIPPAGE_AMOUNT,
  getAccountUrl,
  getChainName,
  getExplorerUrl,
  getInjectedHandler,
  getWalletConnectHandler,
  hasCoinBaseWalletExtension,
  hasExodusWalletExtension,
  hasMetaMaskWalletExtension,
  helperToast,
  IS_PNL_IN_LEVERAGE_KEY,
  isMobileDevice,
  opBNB,
  REFERRAL_CODE_KEY,
  REFERRAL_CODE_QUERY_PARAMS,
  SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY,
  SHOULD_SHOW_POSITION_LINES_KEY,
  SHOW_PNL_AFTER_FEES_KEY,
  SLIPPAGE_BPS_KEY,
  switchNetwork,
  useChainId,
  useLocalStorageSerializeKey,
  ZKSYNC,
} from "./Helpers";

import Actions from "./views/Actions/Actions";
import BeginAccountTransfer from "./views/BeginAccountTransfer/BeginAccountTransfer";
import CompleteAccountTransfer from "./views/CompleteAccountTransfer/CompleteAccountTransfer";
import Dashboard from "./views/Dashboard/Dashboard";
import { Exchange } from "./views/Exchange/Exchange";
import Referrals from "./views/Referrals/Referrals";

import cx from "classnames";
import { cssTransition, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Checkbox from "./components/Checkbox/Checkbox";
import Modal from "./components/Modal/Modal";
import NetworkSelector from "./components/NetworkSelector/NetworkSelector";

import { FaTimes } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { RiMenuLine } from "react-icons/ri";

import "./App.css";
import "./AppOrder.css";
import "./Font.css";
import "./Input.css";
import "./Shared.css";
import "./components/Common/Button.css";

import { encodeReferralCode } from "./Api/referrals";
import AddressDropdown from "./components/AddressDropdown/AddressDropdown";
import SEO from "./components/Common/SEO";
import EventToastContainer from "./components/EventToast/EventToastContainer";
import useEventToast from "./components/EventToast/useEventToast";
import useRouteQuery from "./hooks/useRouteQuery";
import coinbaseImg from "./img/coinbaseWallet.png";
import exodusImg from "./img/ic_exodus.svg";
import metamaskImg from "./img/ic_metamask_hover_16.svg";
import walletConnectImg from "./img/walletconnect-circle-blue.svg";

import { getContract } from "./Addresses";

import IconToken from "./assets/icons/honey-token.svg";
import IconProfile from "./assets/icons/icon-profile.svg";
import APRLabel from "./components/APRLabel/APRLabel";
import LinkDropdown from "./components/LinkDropdown/LinkDropdown";
import Earn from "./views/Earn/Earn";
import ReferralTerms from "./views/ReferralTerms/ReferralTerms";
import WrongNetwork from './components/WrongNetwork/WrongNetwork'

import { useConnectWallet, Web3OnboardProvider } from "@web3-onboard/react";

import { initWeb3Onboard } from "./services";

import useWeb3Onboard from "./hooks/useWeb3Onboard";

if ("ethereum" in window) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  return library;
}

const Zoom = cssTransition({
  enter: "zoomIn",
  exit: "zoomOut",
  appendPosition: false,
  collapse: true,
  collapseDuration: 200,
  duration: 200,
});

const bscWsProvider = new ethers.providers.WebSocketProvider(process.env.REACT_APP_BSC_WS);

function getWsProvider(active, chainId) {
  if (!active) {
    return;
  }

  if (chainId === opBNB) {
    return bscWsProvider;
  }
}

function AppHeaderLinks({ small, openSettings, clickCloseIcon }) {
  return (
    <div className="App-header-links mobile-header-padding">
      {small && (
        <div className="App-header-links-header">
          <div className="App-header-menu-icon-block" onClick={() => clickCloseIcon()}>
            <FiX className="App-header-menu-icon" />
          </div>
          <a
            style={{ width: 21, height: 21 }}
            className="App-header-link-main"
            href=" https://trade.grizzly.fi/#/dashboard"
            rel="noopener noreferrer"
          >
            {/* <img
              style={{ width: 21, height: 21 }}
              src={getImageUrl({
                path: "brandLogos/tradeLogomark",
                width: 21,
                height: 21,
              })}
              alt=""
            /> */}
            <Logo />
          </a>
        </div>
      )}
      <div className="App-header-link-container App-header-link-home">
        <a href="https://trade.grizzly.fi/#/dashboard" rel="noopener noreferrer">
          Home
        </a>
      </div>

      <div className="App-header-link-container">
        <NavLink activeClassName="active" to="/dashboard">
          Dashboard
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <NavLink activeClassName="active" to="/trade">
          Trade
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <NavLink activeClassName="active" to="/earn">
          Earn
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <NavLink activeClassName="active" to="/referrals">
          Referrals
        </NavLink>
      </div>
      {/* <div className="App-header-link-container">
        <NavLink activeClassName="active" to="/buy">
          Buy
        </NavLink>
      </div>
      
      <div className="App-header-link-container">
        <a href="https://docs.grizzly.fi/v/eng/product/grizzly-trade" target="_blank" rel="noopener noreferrer">
          <span
            className="hover-white"
            style={{
              display: "flex",
              alignItems: "center",
              color: "color: rgba(255, 255, 255, 0.8)",
              opacity: "80%",
              whiteSpace: "nowrap",
              lineHeight: "28px",
            }}
          >
            Docs
            <TopRightArrColored />
          </span>
        </a>
      </div> */}

      {small && (
        <div className="App-header-link-container">
          {/* eslint-disable-next-line */}
          <a href="#" onClick={openSettings}>
            Settings
          </a>
        </div>
      )}
    </div>
  );
}

function AppHeaderUser({
  openSettings,
  small,
  setWalletModalVisible,
  showNetworkSelectorModal,
  disconnectAccountAndCloseSettings,
}) {
  const { account, active, library, chainId } = useWeb3Onboard();

  const [{ wallet }, connect, disconnect] = useConnectWallet();

  const showSelector = false;
  const networkOptions = [
    {
      label: "Bsc Network",
      network: "Bsc",
      value: opBNB,
      icon: "ic_bsc_24.svg",
      color: "#2e2f5a",
    },
    {
      label: "zkSync (Coming Soon)",
      network: "zkSync",
      value: ZKSYNC,
      icon: "ic_zksync_24.svg",
      color: "#2e2f5a",
      disabled: true,
    },
  ];

  useEffect(() => {
    if (active) {
      setWalletModalVisible(false);
    }
  }, [active, setWalletModalVisible]);

  const onNetworkSelect = useCallback(
    (option) => {
      if (option.value === chainId) {
        return;
      }
      return switchNetwork(option.value, active);
    },
    [chainId, active]
  );

  const selectorLabel = getChainName(chainId);

  const accountUrl = getAccountUrl(chainId, account);

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="App-header-user">
      {showSelector && (
        <NetworkSelector
          options={networkOptions}
          label={selectorLabel}
          onSelect={onNetworkSelect}
          className="App-header-user-network"
          showCaret={true}
          modalLabel="Select Network"
          small={small}
          showModal={showNetworkSelectorModal}
        />
      )}
      {/* <div className="App-header-user-link">
        <NavLink disabled="disabled" className="btn btn-blue" to="/trade">
          Trade
        </NavLink>
      </div> */}
      {active ? (
        <div style={{ display: "flex", gap: 8 }}>
          <div className="App-header-balance">
            <img src={IconToken} alt="icon" width={24} />
            <APRLabel chainId={chainId} label="nativeTokenPrice" usePercentage={false} tokenDecimals={30} />
          </div>
          {/* <div className="App-header-network"><img src={IconBnb} alt="icon" /></div> */}
          <div style={{ position: "relative" }}>
            <LinkDropdown />
          </div>
          <div className="App-header-user-address">
            <img src={IconProfile} alt="icon" style={{ marginLeft: 8 }} />
            <AddressDropdown
              account={account}
              small={small}
              accountUrl={accountUrl}
              disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
              openSettings={openSettings}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <LinkDropdown />
          </div>
          <button className={"btn btn-yellow btn-wallet"} onClick={() => handleConnectWallet()}>
            {/* {small ? "Connect" : "Connect Wallet"} */}
            Connect
          </button>
        </div>

        // <ConnectWalletButton onClick={() => setWalletModalVisible(true)} imgSrc={connectWalletImg}>
        //   {small ? "Connect" : "Connect Wallet"}
        // </ConnectWalletButton>
      )}
    </div>
  );
}

function FullApp() {
  const exchangeRef = useRef();
  const { connector, library, deactivate, activate, active } = useWeb3Onboard();

  const [{ wallet }, connect, disconnect] = useConnectWallet();

  const { chainId } = useChainId();

  useEventToast();
  const [activatingConnector, setActivatingConnector] = useState();

  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector, chainId]);

  const query = useRouteQuery();

  useEffect(() => {
    let referralCode = query.get(REFERRAL_CODE_QUERY_PARAMS);
    if (referralCode && referralCode.length <= 20) {
      const encodedReferralCode = encodeReferralCode(referralCode);
      if (encodeReferralCode !== ethers.constants.HashZero) {
        localStorage.setItem(REFERRAL_CODE_KEY, encodedReferralCode);
      }
    }
  }, [query]);

  useEffect(() => {
    if (window.ethereum) {
      // hack
      // for some reason after network is changed through Metamask
      // it triggers event with chainId = 1
      // reload helps web3 to return correct chain data
      return window.ethereum.on("chainChanged", () => {
        document.location.reload();
      });
    }
  }, []);

  const disconnectAccount = useCallback(async () => {
    // only works with WalletConnect
    clearWalletConnectData();
    // force clear localStorage connection for MM/CB Wallet (Brave legacy)
    clearWalletLinkData();
    await disconnect(wallet);

  }, [wallet]);

  const disconnectAccountAndCloseSettings = () => {
    disconnectAccount();
    localStorage.removeItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY);
    localStorage.removeItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
    setIsSettingsVisible(false);
  };

  const attemptActivateWallet = (providerName) => {
    localStorage.setItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY, true);
    localStorage.setItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY, providerName);
    activateInjectedProvider(providerName);
    connectInjectedWallet();
  };

  const [walletModalVisible, setWalletModalVisible] = useState();
  const connectWallet = async () => {
    await connect();
  };

  const [isDrawerVisible, setIsDrawerVisible] = useState(undefined);
  const [isNativeSelectorModalVisible, setisNativeSelectorModalVisible] = useState(false);
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const slideVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [savedSlippageAmount, setSavedSlippageAmount] = useLocalStorageSerializeKey(
    [chainId, SLIPPAGE_BPS_KEY],
    DEFAULT_SLIPPAGE_AMOUNT
  );
  const [slippageAmount, setSlippageAmount] = useState(0);
  const [isPnlInLeverage, setIsPnlInLeverage] = useState(false);
  const [showPnlAfterFees, setShowPnlAfterFees] = useState(false);
  

  const [savedIsPnlInLeverage, setSavedIsPnlInLeverage] = useLocalStorageSerializeKey(
    [chainId, IS_PNL_IN_LEVERAGE_KEY],
    false
  );

  const [savedShowPnlAfterFees, setSavedShowPnlAfterFees] = useLocalStorageSerializeKey(
    [chainId, SHOW_PNL_AFTER_FEES_KEY],
    false
  );

  const [savedShouldShowPositionLines, setSavedShouldShowPositionLines] = useLocalStorageSerializeKey(
    [chainId, SHOULD_SHOW_POSITION_LINES_KEY],
    false
  );

  const openSettings = () => {
    const slippage = parseInt(savedSlippageAmount);
    setSlippageAmount((slippage / BASIS_POINTS_DIVISOR) * 100);
    setIsPnlInLeverage(savedIsPnlInLeverage);
    setShowPnlAfterFees(savedShowPnlAfterFees);
    setIsSettingsVisible(true);
  };

  const showNetworkSelectorModal = (val) => {
    setisNativeSelectorModalVisible(val);
  };

  const saveAndCloseSettings = () => {
    const slippage = parseFloat(slippageAmount);
    if (isNaN(slippage)) {
      helperToast.error("Invalid slippage value");
      return;
    }
    if (slippage > 5) {
      helperToast.error("Slippage should be less than 5%");
      return;
    }

    const basisPoints = (slippage * BASIS_POINTS_DIVISOR) / 100;
    if (parseInt(basisPoints) !== parseFloat(basisPoints)) {
      helperToast.error("Max slippage precision is 0.01%");
      return;
    }

    setSavedIsPnlInLeverage(isPnlInLeverage);
    setSavedShowPnlAfterFees(showPnlAfterFees);
    setSavedSlippageAmount(basisPoints);
    setIsSettingsVisible(false);
  };
  useEffect(() => {
    if (isDrawerVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => (document.body.style.overflow = "unset");
  }, [isDrawerVisible]);

  const [pendingTxns, setPendingTxns] = useState([]);

  useEffect(() => {
    const checkPendingTxns = async () => {
      const updatedPendingTxns = [];
      for (let i = 0; i < pendingTxns.length; i++) {
        const pendingTxn = pendingTxns[i];
        const receipt = await library.getTransactionReceipt(pendingTxn.hash);
        if (receipt) {
          if (receipt.status === 0) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.error(
              <div>
                Txn failed.{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
                <br />
              </div>
            );
          }
          if (receipt.status === 1 && pendingTxn.message) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.success(
              <div>
                {pendingTxn.message}{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
                <br />
              </div>
            );
          }
          continue;
        }
        updatedPendingTxns.push(pendingTxn);
      }

      if (updatedPendingTxns.length !== pendingTxns.length) {
        setPendingTxns(updatedPendingTxns);
      }
    };

    const interval = setInterval(() => {
      checkPendingTxns();
    }, 2 * 1000);
    return () => clearInterval(interval);
  }, [library, pendingTxns, chainId]);

  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");

  // useEffect(() => {
  //   const wsVaultAbi = Vault.abi;
  //   const wsProvider = getWsProvider(active, chainId);
  //   if (!wsProvider) {
  //     return;
  //   }

  //   const wsVault = new ethers.Contract(vaultAddress, wsVaultAbi, wsProvider);
  //   const wsPositionRouter = new ethers.Contract(positionRouterAddress, PositionRouter.abi, wsProvider);

  //   const callExchangeRef = (method, ...args) => {
  //     if (!exchangeRef || !exchangeRef.current) {
  //       return;
  //     }

  //     exchangeRef.current[method](...args);
  //   };

  //   // handle the subscriptions here instead of within the Exchange component to avoid unsubscribing and re-subscribing
  //   // each time the Exchange components re-renders, which happens on every data update
  //   const onUpdatePosition = (...args) => callExchangeRef("onUpdatePosition", ...args);
  //   const onClosePosition = (...args) => callExchangeRef("onClosePosition", ...args);
  //   const onIncreasePosition = (...args) => callExchangeRef("onIncreasePosition", ...args);
  //   const onDecreasePosition = (...args) => callExchangeRef("onDecreasePosition", ...args);
  //   const onCancelIncreasePosition = (...args) => callExchangeRef("onCancelIncreasePosition", ...args);
  //   const onCancelDecreasePosition = (...args) => callExchangeRef("onCancelDecreasePosition", ...args);

  //   wsVault.on("UpdatePosition", onUpdatePosition);
  //   wsVault.on("ClosePosition", onClosePosition);
  //   wsVault.on("IncreasePosition", onIncreasePosition);
  //   wsVault.on("DecreasePosition", onDecreasePosition);
  //   wsPositionRouter.on("CancelIncreasePosition", onCancelIncreasePosition);
  //   wsPositionRouter.on("CancelDecreasePosition", onCancelDecreasePosition);

  //   return function cleanup() {
  //     wsVault.off("UpdatePosition", onUpdatePosition);
  //     wsVault.off("ClosePosition", onClosePosition);
  //     wsVault.off("IncreasePosition", onIncreasePosition);
  //     wsVault.off("DecreasePosition", onDecreasePosition);
  //     wsPositionRouter.off("CancelIncreasePosition", onCancelIncreasePosition);
  //     wsPositionRouter.off("CancelDecreasePosition", onCancelDecreasePosition);
  //   };
  // }, [active, chainId, vaultAddress, positionRouterAddress]);

  return (
    <>
      <div className="App">
        {/* <img style={{ position: "absolute" }} src={backgroundLight} alt="background-light" /> */}
        {/* <div className="App-background-side-1"></div>
        <div className="App-background-side-2"></div>
        <div className="App-background"></div>
        <div className="App-background-ball-1"></div>
        <div className="App-background-ball-2"></div>
        <div className="App-highlight"></div> */}
        <div className="App-content">
          {isDrawerVisible && (
            <AnimatePresence>
              {isDrawerVisible && (
                <motion.div
                  className="App-header-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          {isNativeSelectorModalVisible && (
            <AnimatePresence>
              {isNativeSelectorModalVisible && (
                <motion.div
                  className="selector-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setisNativeSelectorModalVisible(!isNativeSelectorModalVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          <header>
            <div className="App-header large">
              <div className="App-header-container-left">
                <a className="App-header-link-main" href=" https://trade.grizzly.fi/#/dashboard">
                  {/* <img
                    style={{ width: "169px", height: "56px", flexBasis: "none" }}
                    src={getImageUrl({
                      path: "brandLogos/tradeLogoHorizontal",
                      format: "png",
                      width: 338,
                      height: 112,
                    })}
                    alt="Logo"
                  /> */}
                  <Logo />
                  <div className="logo-text">TRADE</div>
                </a>
              </div>
              <div className="App-header-container-left">
                <AppHeaderLinks />
              </div>
              <div className="App-header-container-right">
                <AppHeaderUser
                  disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
                  openSettings={openSettings}
                  setActivatingConnector={setActivatingConnector}
                  walletModalVisible={walletModalVisible}
                  setWalletModalVisible={setWalletModalVisible}
                  showNetworkSelectorModal={showNetworkSelectorModal}
                />
              </div>
            </div>
            <div className={cx("App-header", "small", { active: isDrawerVisible })}>
              <div
                className={cx("App-header-link-container", "App-header-top", {
                  active: isDrawerVisible,
                })}
              >
                <div className="App-header-container-left">
                  <div className="App-header-menu-icon-block" onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                    {!isDrawerVisible && <RiMenuLine className="App-header-menu-icon" />}
                    {isDrawerVisible && <FaTimes className="App-header-menu-icon" />}
                  </div>
                  <div className="App-header-link-main clickable" onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                    {/* <img
                      width={24}
                      height={24}
                      src={getImageUrl({
                        path: "brandLogos/tradeLogomark",
                      })}
                      alt="Trade Logo"
                    /> */}
                    <Logo />
                  </div>
                </div>
                <div className="App-header-container-right">
                  <AppHeaderUser
                    disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
                    openSettings={openSettings}
                    small
                    setActivatingConnector={setActivatingConnector}
                    walletModalVisible={walletModalVisible}
                    setWalletModalVisible={setWalletModalVisible}
                    showNetworkSelectorModal={showNetworkSelectorModal}
                  />
                </div>
              </div>
            </div>
          </header>
          <AnimatePresence>
            {isDrawerVisible && (
              <motion.div
                onClick={() => setIsDrawerVisible(false)}
                className="App-header-links-container App-header-drawer"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={slideVariants}
                transition={{ duration: 0.2 }}
              >
                <AppHeaderLinks small openSettings={openSettings} clickCloseIcon={() => setIsDrawerVisible(false)} />
              </motion.div>
            )}
          </AnimatePresence>
          <div><WrongNetwork isOpen={wrongNetworkisOpen} setIsOpen={setWrongNetworkIsOpen} /></div>
          <Switch>
            <Route exact path="/">
              <Redirect to="/trade" />
            </Route>
            <Route exact path="/trade">
              <Exchange
                ref={exchangeRef}
                savedShowPnlAfterFees={savedShowPnlAfterFees}
                savedIsPnlInLeverage={savedIsPnlInLeverage}
                setSavedIsPnlInLeverage={setSavedIsPnlInLeverage}
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                pendingTxns={pendingTxns}
                savedShouldShowPositionLines={savedShouldShowPositionLines}
                setSavedShouldShowPositionLines={setSavedShouldShowPositionLines}
                connectWallet={connectWallet}
              />
            </Route>
            <Route exact path="/dashboard">
              <Dashboard
                savedShowPnlAfterFees={savedShowPnlAfterFees}
                savedIsPnlInLeverage={savedIsPnlInLeverage}
                connectWallet={connectWallet}
              />
            </Route>
            <Route exact path="/earn">
              {/* <Stake setPendingTxns={setPendingTxns} connectWallet={connectWallet} /> */}
              <Earn setPendingTxns={setPendingTxns} connectWallet={connectWallet} />
            </Route>
            <Route exact path="/referrals">
              <Referrals pendingTxns={pendingTxns} connectWallet={connectWallet} setPendingTxns={setPendingTxns} />
            </Route>
            <Route exact path="/actions/:account">
              <Actions />
            </Route>
            <Route exact path="/actions">
              <Actions />
            </Route>
            <Route exact path="/begin_account_transfer">
              <BeginAccountTransfer setPendingTxns={setPendingTxns} />
            </Route>
            <Route exact path="/complete_account_transfer/:sender/:receiver">
              <CompleteAccountTransfer setPendingTxns={setPendingTxns} />
            </Route>
            <Route exact path="/referral-terms">
              <ReferralTerms />
            </Route>
            <Route path="*">
              <NotFound />
            </Route>
          </Switch>
        </div>
      </div>
      <ToastContainer
        limit={1}
        transition={Zoom}
        position="top-right"
        autoClose={7000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        draggable={false}
        pauseOnHover
      />
      <EventToastContainer />
      <Modal
        className="App-settings"
        isVisible={isSettingsVisible}
        setIsVisible={setIsSettingsVisible}
        label="Settings"
      >
        <div className="App-settings-row query-modal">
          <div>Allowed Slippage</div>
          <div className="App-slippage-tolerance-input-container">
            <input
              type="number"
              className="App-slippage-tolerance-input"
              min="0"
              value={slippageAmount}
              onChange={(e) => setSlippageAmount(e.target.value)}
            />
            <div className="App-slippage-tolerance-input-percent">%</div>
          </div>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox isChecked={showPnlAfterFees} setIsChecked={setShowPnlAfterFees}>
            <span style={{ marginLeft: 5 }}>Display PnL after fees</span>
          </Checkbox>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox isChecked={isPnlInLeverage} setIsChecked={setIsPnlInLeverage}>
            <span style={{ marginLeft: 5 }}>Include PnL in leverage display</span>
          </Checkbox>
        </div>
        <div className="Exchange-settings-row">
          <button className="App-cta Exchange-swap-button text-uppercase" onClick={saveAndCloseSettings}>
            Save
          </button>
        </div>
      </Modal>
    </>
  );
}

function App() {
  const [web3Onboard, setWeb3Onboard] = useState(null);

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard);
  }, []);

  if (!web3Onboard) return <div>Loading...</div>;

  return (
    <SWRConfig value={{ refreshInterval: 5000 }}>
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <SEO>
          <FullApp />
        </SEO>
      </Web3OnboardProvider>
    </SWRConfig>
  );
}

export default App;
