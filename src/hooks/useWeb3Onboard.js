import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { opBNB, DEFAULT_CHAIN_ID } from "../Helpers";
import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";

export default function useWeb3Onboard() {
  const SUPPORTED_CHAINS = [opBNB];
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [chainId, setChainId] = useState(5611);
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

      if (SUPPORTED_CHAINS.includes(cId)) {
        setWrongChain(false);
        setChainId(cId);
      } else {
        // not supported chain == wrong chain
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
       } else {
        setActive(false);
        setChain({chainId:DEFAULT_CHAIN_ID});
      }   
    } else {
      setActive(false);
      setAccount(null);
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
