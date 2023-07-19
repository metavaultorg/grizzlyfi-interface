import React, { useEffect, useState } from "react";
import { DEFAULT_CHAIN_ID, getChainName, isSupportedChain } from "../../config/chains";
import { SELECTED_NETWORK_LOCAL_STORAGE_KEY } from "../../config/localStorage";
import {  switchNetwork, } from "../../Helpers";
import "./WrongNetwork.css";
export default function WrongNetwork() {
  const [currentChainId, setCurrentChainId] = useState();
  const [isOpen,setIsOpen] = useState(false)
  const chainId = Number(localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY)) || DEFAULT_CHAIN_ID;

  useEffect(() => {
    const getCurrentChainId = async () => {
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      setCurrentChainId(chainIdHex ? parseInt(chainIdHex) : null);
    };
    getCurrentChainId();
  }, []);
  useEffect(() => {
    if (chainId && currentChainId && !isSupportedChain(currentChainId)) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [currentChainId, chainId])

  
  return (
    <div>
      {isOpen && (
        <div className="wrong-network-container">
          <p>
            App network doesn't match to network selected in wallet (network with id:{" "}
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
