import React, { useEffect, useState } from 'react';
import { useChainId,getChainName, DEFAULT_CHAIN_ID, SELECTED_NETWORK_LOCAL_STORAGE_KEY, switchNetwork } from '../../Helpers'
import './WrongNetwork.css'
import { useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
export default function WrongNetwork({ isOpen, setIsOpen }) {

  // useEffect(() => {
  //   if (isOpen) {
  //     setTimeout(() => {
  //       setIsOpen(false)
  //     }, 7000);
  //   }
    
  // }, [isOpen, setIsOpen])
  let { chainId:currentChainId } = useWeb3React();
  // const { chainId:currentChainId } = useChainId();
  const chainId = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY) || DEFAULT_CHAIN_ID;
  return (
    <div>
      { isOpen && 
        <div className='wrong-network-container'>
          App network ({getChainName(chainId)}) doesn't match to network selected in wallet (network with id: {currentChainId}).
          <div style={{marginLeft:16}} className="clickable underline" onClick={() => switchNetwork(chainId, true)}>
            Add to {getChainName(chainId)}
          </div>
          <button className="add-btn" onClick={() => switchNetwork(chainId, true)}>
            Switch to {getChainName(chainId)}
          </button>
      </div>
      }
    </div>
  )
}
