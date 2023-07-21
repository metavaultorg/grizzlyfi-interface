import { ethers } from "ethers";
import { sample } from "lodash";
import { getContract } from "./contracts";


const { parseEther } = ethers.utils;

export const opBNB = 5611;
export const BSC = 56;

export const DEFAULT_CHAIN_ID = BSC;
export const CHAIN_ID = DEFAULT_CHAIN_ID;

export const SUPPORTED_CHAIN_IDS = [opBNB, BSC];


export const CHAIN_NAMES_MAP = {
  [opBNB]: "opBNB",
  [BSC]: "BNB",
};

export const GAS_PRICE_ADJUSTMENT_MAP = {
  [opBNB]: 200000000,
  [BSC]: 200000000,
};

export const MAX_GAS_PRICE_MAP = {
  [opBNB]: 2000000000,
  [BSC]: 2000000000,
};

export const DEFAULT_GAS_PRICE_MAP = {
  [opBNB]: 2000000000,
  [BSC]: 3300000000,
};

export const HIGH_EXECUTION_FEES_MAP = {
  [opBNB]: 3, // 3 USD
  [BSC]: 3, // 3 USD

};

export const GAS_MULTIPLIER_MAP = {
  [opBNB]: 700000, 
  [BSC]: 700000, 

};



export const FEES = {
  [opBNB] : {
    TAX_BASIS_POINTS : 50,
    STABLE_TAX_BASIS_POINTS : 5,    
    MINT_BURN_FEE_BASIS_POINTS : 20,
    SWAP_FEE_BASIS_POINTS : 30,
    STABLE_SWAP_FEE_BASIS_POINTS : 25,
    MARGIN_FEE_BASIS_POINTS : 10,
  },
  [BSC] : {
    TAX_BASIS_POINTS : 50,
    STABLE_TAX_BASIS_POINTS : 5,    
    MINT_BURN_FEE_BASIS_POINTS : 20,
    SWAP_FEE_BASIS_POINTS : 30,
    STABLE_SWAP_FEE_BASIS_POINTS : 25,
    MARGIN_FEE_BASIS_POINTS : 10,
  },
};

const constants = {
  [opBNB]: {
    nativeTokenSymbol: "BNB",
    wrappedTokenSymbol: "WBNB",
    defaultCollateralSymbol: "USDC",
    defaultFlagOrdersEnabled: true,
    positionReaderPropsLength: 9,
    v2: true,

    SWAP_ORDER_EXECUTION_GAS_FEE: parseEther("0.005"),
    INCREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.005"),
    // contract requires that execution fee be strictly greater than instead of gte
    DECREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.0055"),
    TRAILING_STOP_EXECUTION_GAS_FEE: parseEther("0.01"),
  },
  [BSC]: {
    nativeTokenSymbol: "BNB",
    wrappedTokenSymbol: "WBNB",
    defaultCollateralSymbol: "USDC",
    defaultFlagOrdersEnabled: true,
    positionReaderPropsLength: 9,
    v2: true,
    SWAP_ORDER_EXECUTION_GAS_FEE: parseEther("0.005"),
    INCREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.005"),
    // contract requires that execution fee be strictly greater than instead of gte
    DECREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.0055"),
    TRAILING_STOP_EXECUTION_GAS_FEE: parseEther("0.01"),
  },
};

export const ICONLINKS = {
  [opBNB]: {
    GLL: {
      link: "https://opbnbscan.com/address/0x9F4f8bc00F48663B7C204c96b932C29ccc43A2E8",
    },
    BNB: {
      coingecko: "https://www.coingecko.com/en/coins/bnb",
      link: "https://opbnbscan.com/address/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/weth",
      link: "https://opbnbscan.com/address/0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    },
    BTC: {
      coingecko: "https://www.coingecko.com/en/coins/wrapped-bitcoin",
      link: "https://opbnbscan.com/address/0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      link: "https://opbnbscan.com/address/0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    },
    USDT: {
      coingecko: "https://www.coingecko.com/en/coins/tether",
      link: "https://opbnbscan.com/address/0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    },
  },
  [BSC]: {
    GLL: {
      link: "https://bscscan.com/address/0x9F4f8bc00F48663B7C204c96b932C29ccc43A2E8",
    },
    BNB: {
      coingecko: "https://www.coingecko.com/en/coins/bnb",
      link: "https://bscscan.com/address/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/weth",
      link: "https://bscscan.com/address/0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    },
    BTC: {
      coingecko: "https://www.coingecko.com/en/coins/wrapped-bitcoin",
      link: "https://bscscan.com/address/0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      link: "https://bscscan.com/address/0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    },
    USDT: {
      coingecko: "https://www.coingecko.com/en/coins/tether",
      link: "https://bscscan.com/address/0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    },
  },
};

export const platformTokens = {
  [opBNB]: {
    // opBNB
    GLL: {
      name: "GrizzlyFi Leverage Liquidity",
      symbol: "GLL",
      decimals: 18,
      address: getContract(opBNB, "FeeGllTracker"),
      imageUrl: "https://res.cloudinary.com/grizzlyfi/image/upload/v1662984581/website-assets/gll-token.png",
    },
  },
  [BSC]: {
    // bsc
    GLL: {
      name: "GrizzlyFi Leverage Liquidity",
      symbol: "GLL",
      decimals: 18,
      address: getContract(BSC, "FeeGllTracker"),
      imageUrl: "https://res.cloudinary.com/grizzlyfi/image/upload/v1662984581/website-assets/gll-token.png",
    },
  },
};


const RPC_PROVIDERS = {
  [opBNB]: process.env.REACT_APP_OPBNB_RPC_URLS.split(" "),
  [BSC]: process.env.REACT_APP_BSC_RPC_URLS.split(" "),
};

const EXPLORER_URLS = {
  [opBNB]: process.env.REACT_APP_OPBNB_EXPLORER_URL,
  [BSC]: process.env.REACT_APP_BSC_EXPLORER_URL,
};

const API_URLS = {
  [opBNB]: process.env.REACT_APP_OPBNB_API_URL,
  [BSC]: process.env.REACT_APP_BSC_API_URL,
};

const STATS_URLS = {
  [opBNB]: process.env.REACT_APP_OPBNB_STATS_API_URL,
  [BSC]: process.env.REACT_APP_BSC_STATS_API_URL,
};
const FALLBACK_PROVIDERS = {
  [opBNB]: process.env.REACT_APP_OPBNB_FALLBACK_PROVIDERS.split(" "),
  [BSC]: process.env.REACT_APP_BSC_FALLBACK_PROVIDERS.split(" "),
};

const WS_PROVIDERS = {
  [opBNB]: new ethers.providers.WebSocketProvider(process.env.REACT_APP_OPBNB_WS),
  [BSC]: new ethers.providers.WebSocketProvider(process.env.REACT_APP_BSC_WS),
};

export const NETWORK_METADATA = {
  [opBNB]: {
    chainId: "0x" + opBNB.toString(16),
    chainName: "opBNB",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: RPC_PROVIDERS[opBNB],
    blockExplorerUrls: [getExplorerUrl(opBNB)],
  },
  [BSC]: {
    chainId: "0x" + BSC.toString(16),
    chainName: "BSC",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: RPC_PROVIDERS[BSC],
    blockExplorerUrls: [getExplorerUrl(BSC)],
  },
};

// export const CHAIN_ICONS = {
//   [ARBITRUM]: {
//     16: "ic_arbitrum_16.svg",
//     24: "ic_arbitrum_24.svg",
//     96: "ic_arbitrum_96.svg",
//   },
//   [AVALANCHE]: {
//     16: "ic_avalanche_16.svg",
//     24: "ic_avalanche_24.svg",
//     96: "ic_avalanche_96.svg",
//   },
//   [ARBITRUM_TESTNET]: {
//     16: "ic_arbitrum_16.svg",
//     24: "ic_arbitrum_24.svg",
//     96: "ic_arbitrum_96.svg",
//   },
//   [AVALANCHE_FUJI]: {
//     16: "ic_avalanche_testnet_16.svg",
//     24: "ic_avalanche_testnet_24.svg",
//     96: "ic_avalanche_testnet_96.svg",
//   },
// };

export const getConstant = (chainId, key) => {
  if (!constants[chainId]) {
    throw new Error(`Unsupported chainId ${chainId}`);
  }

  if (!(key in constants[chainId])) {
    throw new Error(`Key ${key} does not exist for chainId ${chainId}`);
  }

  return constants[chainId][key];
};

export function getChainName(chainId) {
  return CHAIN_NAMES_MAP[chainId];
}

// export function getChainIcon(chainId: number, size: 16 | 24 | 96): string | undefined {
//   return CHAIN_ICONS[chainId]?.[size];
// }


export function getRpcUrl(chainId){
  return sample(RPC_PROVIDERS[chainId]);
}

export function getFallbackRpcUrl(chainId) {
  return sample(FALLBACK_PROVIDERS[chainId]);
}


export function getExplorerUrl(chainId) {
  return EXPLORER_URLS[chainId];
}

export function getStatsUrl(chainId) {
  return STATS_URLS[chainId];
}

export function getWsUrl(chainId) {
  return EXPLORER_URLS[chainId];
}

export function getHighExecutionFee(chainId) {
  return HIGH_EXECUTION_FEES_MAP[chainId] || 3;
}

export function getGasMultiplier(chainId) {
  return GAS_MULTIPLIER_MAP[chainId] || 0;
}

export function isSupportedChain(chainId) {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}

export function getServerBaseUrl(chainId) {
  if (!chainId) {
    throw new Error("chainId is not provided");
  }
  if (document.location.hostname.includes("deploy-preview")) {
    const fromLocalStorage = localStorage.getItem("SERVER_BASE_URL");
    if (fromLocalStorage) {
      return fromLocalStorage;
    }
  }
  return API_URLS[chainId];
}

export function getServerUrl(chainId, path) {
  return `${getServerBaseUrl(chainId)}${path}`;
}