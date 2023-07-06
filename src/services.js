import coinbaseModule from "@web3-onboard/coinbase";
import injectedModule from "@web3-onboard/injected-wallets";
import { init } from "@web3-onboard/react";
import trustModule from "@web3-onboard/trust";
import walletConnectModule from "@web3-onboard/walletconnect";

import logo from "./img/grizzlyfi_logo.svg";

const WALLET_CONNECT_PROJECT_ID= "3ab636e7fe6c139595c27583f842d846";
const WEB3_ONBOARD_DAPP_ID= "2a56b719-c7ea-4a64-bbf1-98569383edd3";

const dappId = "2a56b719-c7ea-4a64-bbf1-98569383edd3";

const injected = injectedModule({
  custom: [
    // include custom (not natively supported) injected wallet modules here
  ],
  // display all wallets even if they are unavailable
  // displayUnavailable: true
  // but only show Binance and Bitski wallet if they are available
  // filter: {
  //   [ProviderLabel.Binance]: 'unavailable',
  //   [ProviderLabel.Bitski]: 'unavailable'
  // }
  // do a manual sort of injected wallets so that MetaMask and Coinbase are ordered first
  // sort: wallets => {
  //   const metaMask = wallets.find(
  //     ({ label }) => label === ProviderLabel.MetaMask
  //   )
  //   const coinbase = wallets.find(
  //     ({ label }) => label === ProviderLabel.Coinbase
  //   )

  //   return (
  //     [
  //       metaMask,
  //       coinbase,
  //       ...wallets.filter(
  //         ({ label }) =>
  //           label !== ProviderLabel.MetaMask &&
  //           label !== ProviderLabel.Coinbase
  //       )
  //     ]
  //       // remove undefined values
  //       .filter(wallet => wallet)
  //   )
  // }
  // walletUnavailableMessage: wallet => `Oops ${wallet.label} is unavailable!`
});

const coinbase = coinbaseModule();

const walletConnect = walletConnectModule({
  connectFirstChainId: true,
  version: 2,
  handleUri: (uri) => console.log(uri),
  projectId: WALLET_CONNECT_PROJECT_ID,
  requiredChains: [137],
  qrcodeModalOptions: {
    mobileLinks: ["rainbow", "metamask", "argent", "trust", "imtoken", "pillar"],
  },
});

const trust = trustModule();

export const initWeb3Onboard = init({
  connect: {
    autoConnectAllPreviousWallet: true,
  },
  wallets: [injected, walletConnect, coinbase, trust],
  chains: [
    // {
    //   id: "0x38",
    //   token: "BNB",
    //   label: "BSC",
    //   rpcUrl: "https://rpc.ankr.com/bsc",
    // },
    {
      id: "0x15EB",
      token: "tBNB",
      label: "opBNB Testnet",
      rpcUrl: "https://opbnb-testnet-rpc.bnbchain.org"
    }
  ],
  appMetadata: {
    name: "GrizzlyFi",
    icon: logo,
    description: "Decentralized spot & perpetual exchange",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
  accountCenter: {
    desktop: {
      position: "topRight",
      enabled: false,
      minimal: false,
    },
  },
  apiKey: WEB3_ONBOARD_DAPP_ID,
  notify: {
    transactionHandler: (transaction) => {
      console.log({ transaction });
      if (transaction.eventCode === "txPool") {
        return {
          // autoDismiss set to zero will persist the notification until the user excuses it
          autoDismiss: 0,
          // message: `Your transaction is pending, click <a href="https://goerli.etherscan.io/tx/${transaction.hash}" rel="noopener noreferrer" target="_blank">here</a> for more info.`,
          // or you could use onClick for when someone clicks on the notification itself
          onClick: () => window.open(`https://goerli.etherscan.io/tx/${transaction.hash}`),
        };
      }
    },
  },
  theme: "dark",
});
