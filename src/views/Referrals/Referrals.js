/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";

import Card from "../../components/Common/Card";
import SEO from "../../components/Common/SEO";
import Tab from "../../components/Tab/Tab";
// import Footer from "../../Footer";
import { format as formatDateFn } from "date-fns";
import { decodeReferralCode, encodeReferralCode, useReferralsData } from "../../Api/referrals";
import {
  MAX_REFERRAL_CODE_LENGTH,
  USD_DECIMALS,
  bigNumberify,
  formatAmount,
  // formatDate,
  getPageTitle,
  helperToast,
  isAddressZero,
  isHashZero,
  shortenAddress,
  useChainId,
  useDebounce,
  useLocalStorageSerializeKey,
} from "../../Helpers";

// import AffiliatesIcon from "../../assets/icons/AffiliatesIcon";
// import CashbackIcon from "../../assets/icons/CashbackIcon";
// import ReferralCodeIcon from "../../assets/icons/ReferralCodeIcon";

import { BiCopy, BiEditAlt, BiErrorCircle } from "react-icons/bi";
import { FiPlus } from "react-icons/fi";
import { useCopyToClipboard, useLocalStorage } from "react-use";
import {
  getReferralCodeOwner,
  registerReferralCode,
  setTraderReferralCodeByUser,
  useCodeOwner,
  useReferrerTier,
  useUserReferralCode,
} from "../../Api";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import Checkbox from "../../components/Checkbox/Checkbox";
import Loader from "../../components/Common/Loader";
import Modal from "../../components/Modal/Modal";
import Tooltip from "../../components/Tooltip/Tooltip";
import { getNativeToken, getToken } from "../../data/Tokens";
import useWeb3Onboard from "../../hooks/useWeb3Onboard";
import "./Referrals.css";
import { REFERRALS_SELECTED_TAB_KEY, REFERRAL_CODE_KEY, REFERRAL_CODE_QUERY_PARAMS } from "../../config/localStorage";
import { getChainName, getExplorerUrl } from "../../config/chains";

const REFERRAL_DATA_MAX_TIME = 60000 * 5; // 5 minutes
const TRADERS = "Traders";
const AFFILIATES = "Affiliates";
const TAB_OPTIONS = [TRADERS, AFFILIATES];
export const CODE_REGEX = /^\w+$/; // only number, string and underscore is allowed

const intervals = [
  { label: "year", seconds: 31536000 },
  { label: "month", seconds: 2592000 },
  { label: "day", seconds: 86400 },
  { label: "hour", seconds: 3600 },
  { label: "min", seconds: 60 },
  { label: "second", seconds: 1 },
];
const tierDiscountInfo = {
  0: 5,
  1: 10,
  2: 10,
};
async function validateReferralCodeExists(referralCode, chainId) {
  const referralCodeBytes32 = encodeReferralCode(referralCode);
  const referralCodeOwner = await getReferralCodeOwner(chainId, referralCodeBytes32);
  return !isAddressZero(referralCodeOwner);
}
export function timeSince(time) {
  const seconds = (Date.now() / 1000 - time) | 0;
  const interval = intervals.find((i) => i.seconds < seconds);

  if (!interval) return "";
  const count = (seconds / interval.seconds) | 0;
  return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
}
function isRecentReferralCodeNotExpired(referralCodeInfo) {
  if (referralCodeInfo.time) {
    return referralCodeInfo.time + REFERRAL_DATA_MAX_TIME > Date.now();
  }
}

async function getReferralCodeTakenStatus(account, referralCode, chainId) {
  const referralCodeBytes32 = encodeReferralCode(referralCode);

  const codeOwner = await getReferralCodeOwner(chainId, referralCodeBytes32);

  const takenOnBsc =
    !isAddressZero(codeOwner) && (codeOwner !== account || (codeOwner === account ));
  if (takenOnBsc) {
    return { status: "current", info: codeOwner };
  }
  return { status: "none", info: codeOwner };
}

export function getTierIdDisplay(tierId) {
  if (!tierId) {
    return "";
  }
  return Number(tierId) + 1;
}

const tierRebateInfo = {
  0: 5,
  1: 10,
  2: 15,
};

const getSampleReferrarStat = (code, ownerOnOtherNetwork, account) => {
  return {
    discountUsd: bigNumberify(0),
    referralCode: code,
    totalRebateUsd: bigNumberify(0),
    tradedReferralsCount: 0,
    registeredReferralsCount: 0,
    trades: 0,
    volume: bigNumberify(0),
    time: Date.now(),
    codeOwner: {
      code: encodeReferralCode(code),
      codeString: code,
      owner: undefined,
      isTaken: !isAddressZero(ownerOnOtherNetwork),
      isTakenByCurrentUser:
        !isAddressZero(ownerOnOtherNetwork) && ownerOnOtherNetwork.toLowerCase() === account.toLowerCase(),
    },
  };
};

export function getUSDValue(value) {
  return `$${formatAmount(value, USD_DECIMALS, 2, true, "0.00")}`;
}

export function getCodeError(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  if (trimmedValue.length > MAX_REFERRAL_CODE_LENGTH) {
    return `The referral code can't be more than ${MAX_REFERRAL_CODE_LENGTH} characters.`;
  }

  if (!CODE_REGEX.test(trimmedValue)) {
    return "Only letters, numbers and underscores are allowed.";
  }
  return "";
}

function Referrals({ connectWallet, setPendingTxns, pendingTxns }) {
  const { active, account, library, chainId: chainIdWithoutLocalStorage } = useWeb3Onboard();
  const { chainId } = useChainId();
  const [activeTab, setActiveTab] = useLocalStorage(REFERRALS_SELECTED_TAB_KEY, TRADERS);
  const { data: referralsData, loading } = useReferralsData(chainIdWithoutLocalStorage, account);
  const [recentlyAddedCodes, setRecentlyAddedCodes] = useLocalStorageSerializeKey([chainId, "REFERRAL", account], []);
  const { userReferralCode } = useUserReferralCode(library, chainId, account);
  const { codeOwner } = useCodeOwner(library, chainId, account, userReferralCode);
  const { referrerTier: traderTier } = useReferrerTier(library, chainId, codeOwner);
  const userReferralCodeInLocalStorage = window.localStorage.getItem(REFERRAL_CODE_KEY);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const listenerWidth = () => {
      window.addEventListener("resize", () => {
        setWindowWidth(window.innerWidth);
      });
    };
    listenerWidth();
    return window.removeEventListener("resize", listenerWidth);
  }, [windowWidth]);

  let referralCodeInString;
  if (userReferralCode && !isHashZero(userReferralCode)) {
    referralCodeInString = decodeReferralCode(userReferralCode);
  }

  if (!referralCodeInString && userReferralCodeInLocalStorage && !isHashZero(userReferralCodeInLocalStorage)) {
    referralCodeInString = decodeReferralCode(userReferralCodeInLocalStorage);
  }
  const showInfo = () => {
    if (activeTab === TRADERS && referralCodeInString && active) {
      return false;
    }
    if (activeTab === AFFILIATES && referralsData?.codes?.length && active) {
      return false;
    }
    return true;
  };
  function handleCreateReferralCode(code) {
    const referralCodeHex = encodeReferralCode(code);
    return registerReferralCode(chainId, referralCodeHex, {
      library,
      sentMsg: "Referral code submitted!",
      failMsg: "Referral code creation failed.",
      pendingTxns,
    });
  }

  function renderAffiliatesTab() {
    if (!account)
      return (
        <CreateReferralCode
          account={account}
          isWalletConnected={active}
          handleCreateReferralCode={handleCreateReferralCode}
          library={library}
          chainId={chainId}
          setPendingTxns={setPendingTxns}
          pendingTxns={pendingTxns}
          referralsData={referralsData}
          connectWallet={connectWallet}
          recentlyAddedCodes={recentlyAddedCodes}
          setRecentlyAddedCodes={setRecentlyAddedCodes}
        />
      );
    if (loading) return <Loader />;
    if (
      referralsData &&
      referralsData.codes &&
      (referralsData.codes?.length > 0 || recentlyAddedCodes.filter(isRecentReferralCodeNotExpired).length > 0)
    ) {
      return (
        <AffiliatesInfo
          account={account}
          active={active}
          referralsData={referralsData}
          handleCreateReferralCode={handleCreateReferralCode}
          setRecentlyAddedCodes={setRecentlyAddedCodes}
          recentlyAddedCodes={recentlyAddedCodes}
          chainId={chainId}
          library={library}
          setPendingTxns={setPendingTxns}
          pendingTxns={pendingTxns}
        />
      );
    } else {
      return (
        <CreateReferralCode
          account={account}
          isWalletConnected={active}
          handleCreateReferralCode={handleCreateReferralCode}
          library={library}
          chainId={chainId}
          setPendingTxns={setPendingTxns}
          pendingTxns={pendingTxns}
          referralsData={referralsData}
          connectWallet={connectWallet}
          recentlyAddedCodes={recentlyAddedCodes}
          setRecentlyAddedCodes={setRecentlyAddedCodes}
        />
      );
    }
  }

  function renderTradersTab() {
    if (!account)
      return (
        <JoinReferralCode
          account={account}
          connectWallet={connectWallet}
          isWalletConnected={active}
          library={library}
          chainId={chainId}
          setPendingTxns={setPendingTxns}
          pendingTxns={pendingTxns}
        />
      );
    if (!referralsData) return <Loader />;
    if (!referralCodeInString) {
      return (
        <JoinReferralCode
          account={account}
          connectWallet={connectWallet}
          isWalletConnected={active}
          library={library}
          chainId={chainId}
          setPendingTxns={setPendingTxns}
          pendingTxns={pendingTxns}
        />
      );
    }

    return (
      <TradersInfo
        account={account}
        referralCodeInString={referralCodeInString}
        chainId={chainId}
        library={library}
        referralsData={referralsData}
        setPendingTxns={setPendingTxns}
        pendingTxns={pendingTxns}
        traderTier={traderTier}
      />
    );
  }

  return (
    <SEO title={getPageTitle("Referrals")}>
      <div className="referrals-header-big">
        <div className="referrals-header">
          <div className="referrals-header--text">
            <h3>Invite Friends & Earn Commissions</h3>
            <p>Enjoy Fee-Cashback and Fee-Commissions through the Grizzly Trade referral program.</p>
          </div>
          <div className="referrals-header-img">
            <img
              src={getImageUrl({
                path: "referralBanner",
                format: "png",
              })}
              alt=""
            />
          </div>
        </div>
      </div>
      <div className="default-container page-layout Referrals">
        {/* <div style={{ marginBottom: 60, marginTop: 14 }} className="refer-texts">
          <h4>Create a referral code in three easy steps</h4>
          <p> Make sure you are connected to your wallet to proceed</p>
        </div> */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 30,
            // flexDirection: account || windowWidth < 1130 ? "column" : "row",
            flexDirection: "column",
          }}
        >
          {showInfo() ? (
            <div
              className="instructions-container"
            >
              <div className="instruction-container">
                <div className="instruction-container--header">
                  {/* <span>01</span> */}
                  <img
                    src={getImageUrl({
                      path: "affiliates-icon",
                    })}
                    alt="Affiliates"
                  />
                </div>
                <p>1.Click on the ‘Affiliates’ tab </p>
                <p>Go to Affiliates tab to Generate your Referrarl link</p>
              </div>
              <div className="instruction-container">
                <div className="instruction-container--header">
                  {/* <span>02</span> */}
                  <img
                    src={getImageUrl({
                      path: "referralCode-icon",
                    })}
                    alt="Referral Code"
                  />
                </div>
                <p>
                  2. Enter your own unique code
                </p>
                <p>(Combination of Letters, Numbers or underscores) e.g. Grz_44</p>
              </div>
              <div className="instruction-container">
                <div className="instruction-container--header">
                  {/* <span>03</span> */}
                  <img
                    src={getImageUrl({
                      path: "cashback-icon",
                    })}
                    alt="Cashback"
                  />
                </div>
                <p>
                  3.Share your referral link on social media.
                </p>
                <p>Enjoy up to 15% Fee-Commission.
                  Referred Traders can get up to 10% Cashback.</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === AFFILIATES ? (
                <AffiliatesStats referralsData={referralsData} />
              ) : (
                <TraderStats
                  account={account}
                  referralCodeInString={referralCodeInString}
                  chainId={chainId}
                  library={library}
                  referralsData={referralsData}
                  setPendingTxns={setPendingTxns}
                  pendingTxns={pendingTxns}
                  traderTier={traderTier}
                />
              )}
            </>
          )}

          <div style={{ display: "flex", flexDirection: "column", width: "100%", flexBasis: "50%" }}>
            <div
              className="ref-container"
              style={{
                background: " #1f1f1f",
                border: "solid 1px #2b2b2b",
                padding: 24,
                borderRadius: 40,
                // height: 373.03,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div>
                <Tab options={TAB_OPTIONS} option={activeTab} setOption={setActiveTab} onChange={setActiveTab} />
                {activeTab === AFFILIATES ? renderAffiliatesTab() : renderTradersTab()}
              </div>
            </div>
            {/* <a
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(118,118,128,.24)",
                width: "100%",
                marginTop: 15,
                textDecoration: "none",
                padding: 15,
                color: "#f2c75c",
                borderRadius: 15,
              }}
              href="https://docs.grizzly.fi/v/eng/product/grizzly-trade"
              target="_blank"
              rel="noreferrer"
            >
              For more details, see the Referral Program.
              <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M10.0061 6.75002C9.59188 6.7471 9.25373 7.08051 9.25081 7.49471C9.24789 7.90892 9.5813 8.24706 9.99551 8.24998L15.1538 8.28635L6.52045 16.9197C6.22756 17.2126 6.22756 17.6875 6.52045 17.9804C6.81334 18.2733 7.28822 18.2733 7.58111 17.9804L16.2137 9.34778L16.2508 14.5054C16.2538 14.9196 16.592 15.253 17.0062 15.25C17.4204 15.247 17.7538 14.9088 17.7508 14.4946L17.7008 7.54361C17.6978 7.13357 17.3661 6.80191 16.9561 6.79902L10.0061 6.75002Z"
                  fill="white"
                />
              </svg>
            </a>
            <a
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(118,118,128,.24)",
                width: "100%",
                marginTop: 15,
                textDecoration: "none",
                padding: 15,
                color: "#f2c75c",
                borderRadius: 15,
              }}
              href="https://stats.grizzly.fi/referrals"
              target="_blank"
              rel="noreferrer"
            >
              See the referral stats in Referral Stats.
              <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M10.0061 6.75002C9.59188 6.7471 9.25373 7.08051 9.25081 7.49471C9.24789 7.90892 9.5813 8.24706 9.99551 8.24998L15.1538 8.28635L6.52045 16.9197C6.22756 17.2126 6.22756 17.6875 6.52045 17.9804C6.81334 18.2733 7.28822 18.2733 7.58111 17.9804L16.2137 9.34778L16.2508 14.5054C16.2538 14.9196 16.592 15.253 17.0062 15.25C17.4204 15.247 17.7538 14.9088 17.7508 14.4946L17.7008 7.54361C17.6978 7.13357 17.3661 6.80191 16.9561 6.79902L10.0061 6.75002Z"
                  fill="white"
                />
              </svg>
            </a> */}
          </div>
        </div>
        {/*  <div className="referral-tab-container text-uppercase">
          <Tab options={TAB_OPTIONS} option={activeTab} setOption={setActiveTab} onChange={setActiveTab} />
        </div>
        {activeTab === AFFILIATES ? renderAffiliatesTab() : renderTradersTab()} */}
        {/* <div style={{ marginTop: 24 }}>
          <Footer />
        </div> */}
      </div>
    </SEO>
  );
}

function CreateReferralCode({
  account,
  handleCreateReferralCode,
  isWalletConnected,
  connectWallet,
  setRecentlyAddedCodes,
  recentlyAddedCodes,
  chainId,
}) {
  const [referralCode, setReferralCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmCreateReferralCode, setConfirmCreateReferralCode] = useState(false);
  const [error, setError] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  const [referralCodeCheckStatus, setReferralCodeCheckStatus] = useState("ok");
  const debouncedReferralCode = useDebounce(referralCode, 300);

  useEffect(() => {
    let cancelled = false;
    const checkCodeTakenStatus = async () => {
      if (error || error.length > 0) {
        setReferralCodeCheckStatus("ok");
        return;
      }
      const { status: takenStatus } = await getReferralCodeTakenStatus(account, debouncedReferralCode, chainId);
      // ignore the result if the referral code to check has changed
      if (cancelled) {
        return;
      }
      if (takenStatus === "none") {
        setReferralCodeCheckStatus("ok");
      } else {
        setReferralCodeCheckStatus("taken");
      }
    };
    setReferralCodeCheckStatus("checking");
    checkCodeTakenStatus();
    return () => {
      cancelled = true;
    };
  }, [account, debouncedReferralCode, error, chainId]);

  function getButtonError() {
    if (!referralCode || referralCode.length === 0) {
      return "Enter a code";
    }
    if (referralCodeCheckStatus === "taken") {
      return "Code Already Taken";
    }
    if (referralCodeCheckStatus === "checking") {
      return "Checking Code...";
    }

    return false;
  }

  const buttonError = getButtonError();

  function getPrimaryText() {
    if (buttonError) {
      return buttonError;
    }

    if (isProcessing) {
      return `Creating...`;
    }

    return "Create";
  }
  function isPrimaryEnabled() {
    if (buttonError) {
      return false;
    }
    if (isChecked) {
      return true;
    }
    if (error || isProcessing) {
      return false;
    }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsProcessing(true);
    const { status: takenStatus, info: codeOwner } = await getReferralCodeTakenStatus(account, referralCode, chainId);
    if (takenStatus === "all" || takenStatus === "current") {
      setError(`Referral code is taken.`);
      setIsProcessing(false);
    }

    if (takenStatus === "none") {
      setIsProcessing(true);
      try {
        const tx = await handleCreateReferralCode(referralCode);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          recentlyAddedCodes.push(getSampleReferrarStat(referralCode, codeOwner, account));
          helperToast.success("Referral code created!");
          setRecentlyAddedCodes(recentlyAddedCodes);
          setReferralCode("");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  }

  return (
    <div
      style={{
        // background: account ? "rgba(118,118,128,.24)" : "transparent",
        // border: account ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
        marginBottom: account ? 140 : 0,
      }}
      className="referral-card section-center mt-medium"
    >
      <h2 className="title">Generate your Referral Code</h2>
      <p className="sub-title">
        Looks like you don’t have a referral code yet. <br /> Create one now and start earning commissions.
      </p>
      <div className="card-action">
        {isWalletConnected ? (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={referralCode}
              disabled={isProcessing}
              className={`text-input ${!error && "mb-sm"}`}
              placeholder="Enter a code"
              onChange={({ target }) => {
                let { value } = target;
                setReferralCode(value);
                setError(getCodeError(value));
              }}
            />
            {error && (
              <p className="error" style={{ textAlign: "left" }}>
                {error}
              </p>
            )}
            {confirmCreateReferralCode && (
              <div className="confirm-checkbox">
                <Checkbox isChecked={isChecked} setIsChecked={setIsChecked}>
                  Confirm creating referral code
                </Checkbox>
              </div>
            )}
            <button className="App-cta Exchange-swap-button" type="submit" disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
          </form>
        ) : (
          <button
            style={{ fontSize: "17px", fontWeight: 600, fontFamily: "Boston" }}
            className="App-cta Exchange-swap-button"
            type="submit"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}

function AffiliatesInfo({
  account,
  referralsData,
  handleCreateReferralCode,
  chainId,
  setRecentlyAddedCodes,
  recentlyAddedCodes,
}) {
  const [referralCode, setReferralCode] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [confirmCreateReferralCode, setConfirmCreateReferralCode] = useState(false);
  const [isAddReferralCodeModalOpen, setIsAddReferralCodeModalOpen] = useState(false);
  const [error, setError] = useState("");
  const addNewModalRef = useRef(null);

  const [referralCodeCheckStatus, setReferralCodeCheckStatus] = useState("ok");
  const debouncedReferralCode = useDebounce(referralCode, 300);

  useEffect(() => {
    let cancelled = false;
    const checkCodeTakenStatus = async () => {
      if (error || error.length > 0) {
        setReferralCodeCheckStatus("ok");
        return;
      }
      const { status: takenStatus } = await getReferralCodeTakenStatus(account, referralCode, chainId);

      // ignore the result if the referral code to check has changed
      if (cancelled) {
        return;
      }
      if (takenStatus === "none") {
        setReferralCodeCheckStatus("ok");
      } else {
        setReferralCodeCheckStatus("taken");
      }
    };
    setReferralCodeCheckStatus("checking");
    checkCodeTakenStatus();
    return () => {
      cancelled = true;
    };
  }, [account, debouncedReferralCode, error, chainId, referralCode]);

  function getButtonError() {
    if (!referralCode || referralCode.length === 0) {
      return "Enter a code";
    }
    if (referralCodeCheckStatus === "taken") {
      return "Code already taken";
    }
    if (referralCodeCheckStatus === "checking") {
      return "Checking code...";
    }

    return false;
  }

  const buttonError = getButtonError();

  function getPrimaryText() {
    if (buttonError) {
      return buttonError;
    }

    if (isAdding) {
      return `Creating...`;
    }

    return "Create";
  }
  function isPrimaryEnabled() {
    if (buttonError) {
      return false;
    }

    if (isChecked) {
      return true;
    }

    if (error || isAdding) {
      return false;
    }
    return true;
  }

  const [, copyToClipboard] = useCopyToClipboard();
  const open = () => setIsAddReferralCodeModalOpen(true);
  const close = () => {
    setReferralCode("");
    setIsAdding(false);
    setError("");
    setConfirmCreateReferralCode(false);
    setIsChecked(false);
    setIsAddReferralCodeModalOpen(false);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setIsAdding(true);
    const { status: takenStatus, info: codeOwner } = await getReferralCodeTakenStatus(account, referralCode, chainId);

    if (takenStatus === "all" || takenStatus === "current") {
      setError(`Referral code is taken.`);
      setIsAdding(false);
    }

    if (takenStatus === "none") {
      setIsAdding(true);
      try {
        const tx = await handleCreateReferralCode(referralCode);
        close();
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          recentlyAddedCodes.push(getSampleReferrarStat(referralCode, codeOwner, account));
          helperToast.success("Referral code created!");
          setRecentlyAddedCodes(recentlyAddedCodes);
          setReferralCode("");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAdding(false);
      }
    }
  }

  let { cumulativeStats, referrerTotalStats, rebateDistributions, referrerTierInfo } = referralsData;
  const finalReferrerTotalStats = recentlyAddedCodes.filter(isRecentReferralCodeNotExpired).reduce((acc, cv) => {
    const addedCodes = referrerTotalStats.map((c) => c.referralCode.trim());
    if (!addedCodes.includes(cv.referralCode)) {
      acc = acc.concat(cv);
    }
    return acc;
  }, referrerTotalStats);

  const tierId = referrerTierInfo?.tierId;

  return (
    <div className="referral-body-container">
      <div className="list">
        <Modal
          className="Connect-wallet-modal"
          isVisible={isAddReferralCodeModalOpen}
          setIsVisible={close}
          label="Create Referral Code"
          onAfterOpen={() => addNewModalRef.current?.focus()}
        >
          <div className="edit-referral-modal">
            <form onSubmit={handleSubmit}>
              <input
                disabled={isAdding}
                ref={addNewModalRef}
                type="text"
                placeholder="Enter referral code"
                className={`text-input ${!error && "mb-sm"}`}
                value={referralCode}
                onChange={(e) => {
                  const { value } = e.target;
                  setReferralCode(value);
                  setError(getCodeError(value));
                }}
              />
              {error && <p className="error">{error}</p>}
              {confirmCreateReferralCode && (
                <div className="confirm-checkbox">
                  <Checkbox isChecked={isChecked} setIsChecked={setIsChecked}>
                    Confirm creating referral code
                  </Checkbox>
                </div>
              )}
              <button type="submit" className="App-cta Exchange-swap-button" disabled={!isPrimaryEnabled()}>
                {getPrimaryText()}
              </button>
            </form>
          </div>
        </Modal>
        <Card
          title={
            <div className="referral-table-header">
              <p className="title">
                Referral Codes{" "}
                <span className="sub-title">
                  {referrerTierInfo && `Tier ${getTierIdDisplay(tierId)} (${tierRebateInfo[tierId]}% fee-commissions)`}
                </span>
              </p>
              <button
                className="transparent-btn transparent-btnmargintop create-btn"
                onClick={open}
                style={{ marginBottom: 8, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 18 }}
              >
                <FiPlus size={24} /> <span className="ml-small">Create new</span>
              </button>
            </div>
          }
        >
          <div className="table-wrapper">
            <table className="referral-table">
              <thead>
                <tr>
                  <th className="table-head" scope="col">
                    Referral Code
                  </th>
                  <th className="table-head" scope="col">
                    Total Volume
                  </th>
                  <th className="table-head" scope="col">
                    Traders Referred
                  </th>
                  <th className="table-head" scope="col">
                    Total Fee-Commissions
                  </th>
                </tr>
              </thead>
              <tbody>
                {finalReferrerTotalStats.map((stat, index) => {
                  const codeOwner = stat?.codeOwner;
                  let referrerRebate = bigNumberify(0);
                  if (stat && stat.totalRebateUsd && stat.totalRebateUsd.sub && stat.discountUsd) {
                    referrerRebate = stat.totalRebateUsd.sub(stat.discountUsd);
                  }
                  return (
                    <tr key={index}>
                      <td data-label="Referral Code">
                        <div className="table-referral-code">
                          <div
                            onClick={() => {
                              copyToClipboard(
                                `https://trade.grizzly.fi/#/trade/?${REFERRAL_CODE_QUERY_PARAMS}=${stat.referralCode}`
                              );
                              helperToast.success("Referral link copied to your clipboard");
                            }}
                            className="referral-code copy-icon"
                          >
                            <span>{stat.referralCode}</span>
                            <BiCopy />
                          </div>
                          {codeOwner && codeOwner?.isTaken && !codeOwner?.isTakenByCurrentUser && (
                            <div className="info">
                              <Tooltip
                                position="right"
                                handle={<BiErrorCircle color="#e82e56" size={16} />}
                                renderContent={() => (
                                  <div>
                                    This code has been taken by someone else on {getChainName(chainId)}, you will not receive fee-cashback
                                    from traders using this code on.
                                  </div>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td data-label="Total Volume">{getUSDValue(stat.volume)}</td>
                      <td data-label="Traders Referred">{stat.registeredReferralsCount}</td>
                      <td data-label="Total Fee-commissions">{getUSDValue(referrerRebate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {rebateDistributions?.length > 0 ? (
        <div className="reward-history">
          <Card title="Fee-commissions Distribution History" tooltipText="Fee-commissions are airdropped weekly.">
            <div className="table-wrapper">
              <table className="referral-table">
                <thead>
                  <tr>
                    <th className="table-head" scope="col">
                      Date
                    </th>
                    <th className="table-head" scope="col">
                      Amount
                    </th>
                    <th className="table-head" scope="col">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rebateDistributions.map((rebate, index) => {
                    let tokenInfo;
                    try {
                      tokenInfo = getToken(chainId, rebate.token);
                    } catch {
                      tokenInfo = getNativeToken(chainId);
                    }
                    const explorerURL = getExplorerUrl(chainId);
                    return (
                      <tr key={index}>
                        <td className="table-head" data-label="Date">
                          <div>{timeSince(rebate.timestamp)}</div>
                          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }}>
                            {formatDateFn(rebate.timestamp * 1000, "dd/MM/yyyy")}
                          </div>
                        </td>
                        <td className="table-head" data-label="Amount">
                          {formatAmount(rebate.amount, tokenInfo.decimals, 4, true)} {tokenInfo.symbol}
                        </td>
                        <td className="table-head" data-label="Address">
                          {/* <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={explorerURL + `tx/${rebate.transactionHash}`}
                          >
                            {shortenAddress(rebate.transactionHash, 13)}
                          </a> */}
                          {shortenAddress(rebate.transactionHash, 13)}
                          <span
                            className="td-icon"
                            onClick={() => {
                              copyToClipboard(rebate.transactionHash);
                              helperToast.success("Transaction hash copied to your clipboard");
                            }}
                          >
                            <img alt="copy" src={getImageUrl({ path: "icon-copy-new" })} />
                          </span>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={explorerURL + `tx/${rebate.transactionHash}`}
                            className="td-icon"
                          >
                            <img alt="link" src={getImageUrl({ path: "icon-send-token" })} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyMessage
          tooltipText="Fee-commissions are airdropped weekly."
          message="No fee-commissions distribution history yet."
        />
      )}
    </div>
  );
}

function TradersInfo({
  account,
  referralsData,
  traderTier,
  chainId,
  library,
  referralCodeInString,
  setPendingTxns,
  pendingTxns,
}) {
  if(!referralsData) return <></>
  const { referralTotalStats, discountDistributions } = referralsData;

  const [, copyToClipboard] = useCopyToClipboard();

  return (
    <div className="rebate-container">
      {discountDistributions.length > 0 ? (
        <div className="reward-history">
          <Card title="Fee-cashback Distribution History" tooltipText="Fee-cashback are airdropped weekly.">
            <div className="table-wrapper">
              <table className="referral-table">
                <thead>
                  <tr>
                    <th className="table-head" scope="col">
                      Date
                    </th>
                    <th className="table-head" scope="col">
                      Amount
                    </th>
                    <th className="table-head" scope="col">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {discountDistributions.map((rebate, index) => {
                    let tokenInfo;
                    try {
                      tokenInfo = getToken(chainId, rebate.token);
                    } catch {
                      tokenInfo = getNativeToken(chainId);
                    }
                    const explorerURL = getExplorerUrl(chainId);
                    return (
                      <tr key={index}>
                        <td data-label="Date">
                          <div>{timeSince(rebate.timestamp)}</div>
                          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }}>
                            {formatDateFn(rebate.timestamp * 1000, "dd/MM/yyyy")}
                          </div>
                        </td>
                        <td data-label="Amount">
                          {formatAmount(rebate.amount, tokenInfo.decimals, 4, true)} {tokenInfo.symbol}
                        </td>
                        <td data-label="Address">
                          {/* <a
                            style={{ color: "#f2c75c" }}
                            target="_blank"
                            rel="noopener noreferrer"
                            href={explorerURL + `tx/${rebate.transactionHash}`}
                          >
                            {shortenAddress(rebate.transactionHash, 20)}
                          </a> */}
                          {shortenAddress(rebate.transactionHash, 20)}
                          <span
                            className="td-icon"
                            onClick={() => {
                              copyToClipboard(rebate.transactionHash);
                              helperToast.success("Transaction hash copied to your clipboard");
                            }}
                          >
                            <img alt="copy" src={getImageUrl({ path: "icon-copy-new" })} />
                          </span>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={explorerURL + `tx/${rebate.transactionHash}`}
                            className="td-icon"
                          >
                            <img alt="copy" src={getImageUrl({ path: "icon-send-token" })} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyMessage
          message="No fee-cashback distribution history yet."
          tooltipText="Fee-cashbacks are airdropped weekly."
        />
      )}
    </div>
  );
}

function JoinReferralCode({
  isWalletConnected,
  account,
  chainId,
  library,
  connectWallet,
  setPendingTxns,
  pendingTxns,
}) {
  const [referralCode, setReferralCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState("");
  function handleSetTraderReferralCode(event, code) {
    event.preventDefault();
    setIsSubmitting(true);
    const referralCodeHex = encodeReferralCode(code);
    return setTraderReferralCodeByUser(chainId, referralCodeHex, {
      library,
      account,
      successMsg: `Referral code added!`,
      failMsg: "Adding referral code failed.",
      setPendingTxns,
      pendingTxns,
    })
      .then((res) => {
        setIsJoined(true);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }
  //
  if (isJoined) return <Loader />;
  return (
    <div
      style={{
        // background: account ? "rgba(118,118,128,.24)" : "transparent",
        // border: account ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
        marginBottom: account ? 140 : 0,
      }}
      className="referral-card section-center mt-medium"
    >
      <h2 className="title">Enter Referral Code</h2>
      <p className="sub-title">To receive fee-cashback, use one referral code.</p>
      <div className="card-action">
        {isWalletConnected ? (
          <form onSubmit={(e) => handleSetTraderReferralCode(e, referralCode)}>
            <input
              type="text"
              value={referralCode}
              disabled={isSubmitting}
              className={`text-input ${!error && "mb-sm"}`}
              placeholder="Enter a code"
              onChange={({ target }) => {
                let { value } = target;
                setReferralCode(value);
                setError(getCodeError(value));
              }}
            />
            {error && (
              <p className="error" style={{ textAlign: "left" }}>
                {error}
              </p>
            )}
            <button
              className="App-cta Exchange-swap-button"
              type="submit"
              disabled={!referralCode.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting.." : "Submit"}
            </button>
          </form>
        ) : (
          <button
            style={{ fontSize: "17px", fontWeight: 600, fontFamily: "Boston" }}
            className="App-cta Exchange-swap-button"
            type="submit"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}

export function InfoCard({ label, data, tooltipText, toolTipPosition = "left-bottom", iconPath }) {
  return (
    <div className="info-card">
      <div className="card-icon">
        <img
          src={getImageUrl({
            path: iconPath,
          })}
          alt=""
        />
      </div>

      <div className="card-details">
        <h3 className="label">
          {tooltipText ? (
            <Tooltip handle={label} position={toolTipPosition} renderContent={() => tooltipText} />
          ) : (
            label
          )}
        </h3>
        <div className="data">{data}</div>
      </div>
    </div>
  );
}

function EmptyMessage({ message = "", tooltipText }) {
  return (
    <div className="empty-message mt-5">
      {tooltipText ? (
        <Tooltip
          className="mt-2"
          handle={<p>{message}</p>}
          position="center-bottom"
          renderContent={() => tooltipText}
        />
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
function TraderStats({
  referralsData,
  referralCodeInString,
  traderTier,
  chainId,
  library,
  account,
  setPendingTxns,
  pendingTxns,
}) {
  let referralTotalStats = null;
  if(referralsData){
    referralTotalStats = referralsData.referralTotalStats;
  }
  // const { referralTotalStats } = referralsData;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editReferralCode, setEditReferralCode] = useState("");
  const [isUpdateSubmitting, setIsUpdateSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [referralCodeExists, setReferralCodeExists] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const editModalRef = useRef(null);
  const debouncedEditReferralCode = useDebounce(editReferralCode, 300);

  const open = () => setIsEditModalOpen(true);
  const close = () => {
    setEditReferralCode("");
    setIsUpdateSubmitting(false);
    setError("");
    setIsEditModalOpen(false);
  };

  useEffect(() => {
    let cancelled = false;
    async function checkReferralCode() {
      if (debouncedEditReferralCode === "" || !CODE_REGEX.test(debouncedEditReferralCode)) {
        setIsValidating(false);
        setReferralCodeExists(false);
        return;
      }

      setIsValidating(true);
      const codeExists = await validateReferralCodeExists(debouncedEditReferralCode, chainId);
      if (!cancelled) {
        setReferralCodeExists(codeExists);
        setIsValidating(false);
      }
    }
    checkReferralCode();
    return () => {
      cancelled = true;
    };
  }, [debouncedEditReferralCode, chainId]);

  function handleUpdateReferralCode(event) {
    event.preventDefault();
    setIsUpdateSubmitting(true);
    const referralCodeHex = encodeReferralCode(editReferralCode);
    return setTraderReferralCodeByUser(chainId, referralCodeHex, {
      library,
      account,
      successMsg: `Referral code updated!`,
      failMsg: "Referral code updated failed.",
      setPendingTxns,
      pendingTxns,
    })
      .then(() => {
        setIsEditModalOpen(false);
      })
      .finally(() => {
        setIsUpdateSubmitting(false);
      });
  }
  function getPrimaryText() {
    if (editReferralCode === referralCodeInString) {
      return "Referral Code is same";
    }
    if (isUpdateSubmitting) {
      return "Updating...";
    }
    if (debouncedEditReferralCode === "") {
      return "ENTER REFERRAL CODE";
    }
    if (isValidating) {
      return `Checking code...`;
    }
    if (!referralCodeExists) {
      return `Referral Code does not exist`;
    }

    return "Update";
  }
  function isPrimaryEnabled() {
    if (
      debouncedEditReferralCode === "" ||
      isUpdateSubmitting ||
      isValidating ||
      !referralCodeExists ||
      editReferralCode === referralCodeInString
    ) {
      return false;
    }
    return true;
  }
  return (
    <div className="referral-stats">
      <InfoCard
        label="Total Trading Volume"
        tooltipText="Volume traded by this account with an active referral code."
        data={getUSDValue(referralTotalStats?.volume)}
        iconPath="icon-investments-money"
      />
      <InfoCard
        label="Total Fee-cashback"
        tooltipText="Fee-cashback earned by this account as a trader."
        data={getUSDValue(referralTotalStats?.discountUsd)}
        iconPath="icon-withdraw"
      />
      <InfoCard
        iconPath="icon-referral-invite-friend"
        label="Active Referral Code"
        data={
          <div className="active-referral-code">
            <div className="edit">
              <span>{referralCodeInString}</span>
              <BiEditAlt onClick={open} />
            </div>
            {traderTier && (
              <div className="tier">
                <Tooltip
                  handle={`Tier ${getTierIdDisplay(traderTier)} (${tierDiscountInfo[traderTier]}% fee-cashback)`}
                  position="right-bottom"
                  renderContent={() =>
                    `You will receive a ${tierDiscountInfo[traderTier]}% cashback on your opening and closing fees, this fee-cashback will be airdropped to your account every Friday`
                  }
                />
              </div>
            )}
          </div>
        }
      />
      <Modal
        className="Connect-wallet-modal"
        isVisible={isEditModalOpen}
        setIsVisible={close}
        label="Edit Referral Code"
        onAfterOpen={() => editModalRef.current?.focus()}
      >
        <div className="edit-referral-modal">
          <form onSubmit={handleUpdateReferralCode}>
            <input
              ref={editModalRef}
              disabled={isUpdateSubmitting}
              type="text"
              placeholder="Enter referral code"
              className={`text-input ${!error && "mb-sm"}`}
              value={editReferralCode}
              onChange={({ target }) => {
                const { value } = target;
                setEditReferralCode(value);
                setError(getCodeError(value));
              }}
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="App-cta Exchange-swap-button" disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
function AffiliatesStats({ referralsData }) {
  let { cumulativeStats } = referralsData;
  let referrerRebates = bigNumberify(0);
  if (cumulativeStats && cumulativeStats.rebates && cumulativeStats.discountUsd) {
    referrerRebates = cumulativeStats.rebates.sub(cumulativeStats.discountUsd);
  }
  return (
    <div className="referral-stats">
      <InfoCard
        label="Total Traders Referred"
        tooltipText="Amount of traders you referred."
        data={cumulativeStats?.registeredReferralsCount || "0"}
        iconPath="icon-profile"
      />
      <InfoCard
        label="Total Trading Volume"
        tooltipText="Volume traded by your referred traders."
        data={getUSDValue(cumulativeStats?.volume)}
        iconPath="icon-investments-money"
      />
      <InfoCard
        label="Total Fee-Commissions"
        tooltipText="Fee-Commissions earned by this account as an affiliate."
        data={getUSDValue(referrerRebates)}
        iconPath="icon-percentage"
      />
    </div>
  );
}

export default Referrals;
