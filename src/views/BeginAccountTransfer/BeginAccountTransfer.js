import { ethers } from "ethers";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";

import { getContract } from "../../config/contracts";
import { callContract } from "../../Api";

import Modal from "../../components/Modal/Modal";

import RewardRouter from "../../abis/RewardRouter.json";
import RewardTracker from "../../abis/RewardTracker.json";

import { FaCheck, FaTimes } from "react-icons/fa";

import { fetcher, useChainId } from "../../Helpers";

import useWeb3Onboard from "../../hooks/useWeb3Onboard";
import "./BeginAccountTransfer.css";

function ValidationRow({ isValid, children }) {
  return (
    <div className="ValidationRow">
      <div className="ValidationRow-icon-container">
        {isValid && <FaCheck className="ValidationRow-icon" />}
        {!isValid && <FaTimes className="ValidationRow-icon" />}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function BeginAccountTransfer(props) {
  const { setPendingTxns } = props;
  const { active, library, account } = useWeb3Onboard();
  const { chainId } = useChainId();

  const [receiver, setReceiver] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferSubmittedModalVisible, setIsTransferSubmittedModalVisible] = useState(false);
  let parsedReceiver = ethers.constants.AddressZero;
  if (ethers.utils.isAddress(receiver)) {
    parsedReceiver = receiver;
  }

  const rewardRouterAddress = getContract(chainId, "RewardRouter");

  const feeGllTrackerAddress = getContract(chainId, "FeeGllTracker");
  const { data: cumulativeGllRewards } = useSWR(
    [active, chainId, feeGllTrackerAddress, "cumulativeRewards", parsedReceiver],
    {
      fetcher: fetcher(library, RewardTracker),
    }
  );

  const { data: pendingReceiver } = useSWR([active, chainId, rewardRouterAddress, "pendingReceivers", account], {
    fetcher: fetcher(library, RewardRouter),
  });

  const needApproval = false;

  const hasStakedGll = cumulativeGllRewards && cumulativeGllRewards.gt(0);
  const hasPendingReceiver = pendingReceiver && pendingReceiver !== ethers.constants.AddressZero;

  const getError = () => {
    if (!account) {
      return "Wallet is not connected";
    }
    if (!receiver || receiver.length === 0) {
      return "Enter Receiver Address";
    }
    if (!ethers.utils.isAddress(receiver)) {
      return "Invalid Receiver Address";
    }
    if ((parsedReceiver || "").toString().toLowerCase() === (account || "").toString().toLowerCase()) {
      return "Self-transfer not supported";
    }

    if (
      (parsedReceiver || "").length > 0 &&
      (parsedReceiver || "").toString().toLowerCase() === (pendingReceiver || "").toString().toLowerCase()
    ) {
      return "Transfer already initiated";
    }
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isTransferring) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }

    if (isApproving) {
      return "Approving...";
    }
    if (isTransferring) {
      return "Transferring";
    }

    return "Begin Transfer";
  };

  const onClickPrimary = () => {
    if (needApproval) {
      return;
    }

    setIsTransferring(true);
    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());

    callContract(chainId, contract, "signalTransfer", [parsedReceiver], {
      sentMsg: "Transfer submitted!",
      failMsg: "Transfer failed.",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsTransferSubmittedModalVisible(true);
      })
      .finally(() => {
        setIsTransferring(false);
      });
  };

  const completeTransferLink = `/complete_account_transfer/${account}/${parsedReceiver}`;
  const pendingTransferLink = `/complete_account_transfer/${account}/${pendingReceiver}`;

  return (
    <div className="Page page-layout">
      <Modal
        isVisible={isTransferSubmittedModalVisible}
        setIsVisible={setIsTransferSubmittedModalVisible}
        label="Transfer Submitted"
      >
        Your transfer has been initiated.
        <br />
        <br />
        <Link className="App-cta" to={completeTransferLink}>
          Continue
        </Link>
      </Modal>
      <div className="BeginAccountTransfer">
        <div className="Page-title-section">
          <div className="Page-title">Transfer Account</div>
          <div className="Page-description">
            Please only use this for full account transfers.
            <br />
            This will transfer all your GLL tokens to your new account.
            <br />
            Transfers are only supported if the receiving account has not staked GLL token before.
            <br />
            Transfers are one-way, you will not be able to transfer staked tokens back to the sending account.
          </div>
          {hasPendingReceiver && (
            <div className="Page-description">
              You have a <Link to={pendingTransferLink}>pending transfer</Link> to {pendingReceiver}.
            </div>
          )}
        </div>
        <div style={{ padding: "24px 0 0 0" }} className="Page-content">
          <div className="">
            <div className="input-row">
              <div>
                <input
                  type="text"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="text-input"
                  placeholder="Receiver Address"
                />
              </div>
            </div>
            <div className="BeginAccountTransfer-validations">
              <ValidationRow isValid={!hasStakedGll}>Receiver has not staked GLL tokens before</ValidationRow>
            </div>
            <div className="input-row">
              <button
                className="App-cta Exchange-swap-button"
                disabled={!isPrimaryEnabled()}
                onClick={() => onClickPrimary()}
              >
                {getPrimaryText()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
