import React, { useEffect, useState } from "react";
import { DEFAULT_CHAIN_ID, SELECTED_NETWORK_LOCAL_STORAGE_KEY, getChainName, switchNetwork } from "../../Helpers";
import "./WrongNetwork.css";
export default function WrongNetwork({ isOpen, setIsOpen }) {
  const [currentChainId, setCurrentChainId] = useState();
  const chainId = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY) || DEFAULT_CHAIN_ID;
  useEffect(() => {
    const getCurrentChainId = async () => {
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      setCurrentChainId(chainIdHex ? parseInt(chainIdHex) : null);
    };
    getCurrentChainId();
  }, []);
  useEffect(() => {
    if (chainId && currentChainId && chainId != currentChainId) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [currentChainId,])

  
  return (
    <div>
      {isOpen && (
        <div className="wrong-network-container">
          <p>
            App network ({getChainName(chainId)}) doesn't match to network selected in wallet (network with id:{" "}
            {currentChainId}).
          </p>
          <div style={{ marginLeft: 16 }} className="clickable underline" onClick={() => switchNetwork(chainId, true)}>
            Add to {getChainName(chainId)}
          </div>
          <button className="add-btn" onClick={() => switchNetwork(chainId, true)}>
            Switch to {getChainName(chainId)}
          </button>
        </div>
      )}
    </div>
  );
}
