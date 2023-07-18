import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAIN_IDS } from "../config/chains";
import { SELECTED_NETWORK_LOCAL_STORAGE_KEY } from "../config/localStorage";

export default function useWeb3Onboard() {

  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);
  const [active, setActive] = useState(false);
  const [account, setAccount] = useState("");
  const [library, setLibrary] = useState(undefined);
  const [wrongChain, setWrongChain] = useState(false);

  useEffect(async () => {
    if (!wallet) {
      setWrongChain(false);
    }
    if (wallet && connectedChain) {
      const cId = +BigInt(connectedChain.id).toString();
      // state variable

      if (SUPPORTED_CHAIN_IDS.includes(cId)) {
        setWrongChain(false);
        setChainId(cId);
        localStorage.setItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY, cId.toString())
      } else {
        // not supported chain == wrong chain
        localStorage.setItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY, DEFAULT_CHAIN_ID.toString())
        setWrongChain(true);
      }
    }
  }, [wallet, connectedChain]);

  useEffect(() => {
    if (wallet?.provider) {
      const account = wallet.accounts[0].address;
      setAccount(account);
      if(!wrongChain) {
        setActive(true);
        localStorage.setItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY, chainId.toString())
      } else {
        setActive(false);
        // setChain({chainId: DEFAULT_CHAIN_ID});
        localStorage.setItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY, DEFAULT_CHAIN_ID.toString())
      }   
    } else {
      setActive(false);
      setAccount(null);
      localStorage.setItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY, DEFAULT_CHAIN_ID.toString())
    }
  }, [wallet,wrongChain]);

  useEffect(() => {
    if (!wallet?.provider) {
      setLibrary(null);
    } else {
      const provider = new ethers.providers.Web3Provider(wallet.provider, "any");
      setLibrary(provider);
    }
  }, [wallet]);

  return { active, account, library, chainId, wrongChain };
}
