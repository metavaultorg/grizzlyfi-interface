import { ethers } from "ethers";
import { BSC, opBNB } from "../config/chains";
import { getContract } from "../config/contracts";

const TOKENS = {
  [opBNB] : [
    // bsc
    {
      name: "Bitcoin",
      symbol: "BTC",
      address: "0xB30AED2ea16d77dD0Ccb97172cCcfC483E713DCE",
      coingeckoUrl: "https://www.coingecko.com/en/coins/bitcoin",
      decimals: 8,
      isShortable: true,
      displayDecimals:2
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      address: "0xC27f7aa3D8097Bb4E624844010Af804Dae23818c",
      coingeckoUrl: "https://www.coingecko.com/en/coins/ethereum",
      decimals: 18,
      isShortable: true,
      displayDecimals:2
    },
    {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
      address: ethers.constants.AddressZero,
      coingeckoUrl: "https://www.coingecko.com/en/coins/bnb",
      isNative: true,
      isShortable: false,
      displayDecimals:3
    },
    {
      name: "Wrapped BNB",
      symbol: "WBNB",
      decimals: 18,
      address: "0x617d91847b74b70a3d3e3745445cb0d1b3c8560e",
      coingeckoUrl: "https://www.coingecko.com/en/coins/wbnb",
      isWrapped: true,
      baseSymbol: "BNB",
      displayDecimals:3
    },
    {
      name: "USDC",
      symbol: "USDC",
      address: "0x9367c561915f9D062aFE3b57B18e30dEC62b8488",
      coingeckoUrl: "https://www.coingecko.com/en/coins/usd-coin",
      decimals: 6,
      isStable: true,
      displayDecimals:4
    },
    {
      name: "USDT",
      symbol: "USDT",
      address: "0x85778C9284B24D5f4D58568a0707fb55ECc50023",
      coingeckoUrl: "https://www.coingecko.com/en/coins/tether",
      decimals: 6,
      isStable: true,
      displayDecimals:4
    },
  ],
  [BSC] : [
    // bsc
    {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
      address: ethers.constants.AddressZero,
      coingeckoUrl: "https://www.coingecko.com/en/coins/bnb",
      isNative: true,
      isShortable: false,
      displayDecimals:3
    },
    {
      name: "Wrapped BNB",
      symbol: "WBNB",
      decimals: 18,
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      coingeckoUrl: "https://www.coingecko.com/en/coins/wbnb",
      isWrapped: true,
      baseSymbol: "BNB",
      displayDecimals:3
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      coingeckoUrl: "https://www.coingecko.com/en/coins/ethereum",
      decimals: 18,
      isShortable: true,
      displayDecimals:2
    },
    {
      name: "Bitcoin",
      symbol: "BTC",
      address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
      coingeckoUrl: "https://www.coingecko.com/en/coins/bitcoin",
      decimals: 18,
      isShortable: true,
      displayDecimals:2
    },

    {
      name: "USDC",
      symbol: "USDC",
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      coingeckoUrl: "https://www.coingecko.com/en/coins/usd-coin",
      decimals: 18,
      isStable: true,
      displayDecimals:4
    },
    {
      name: "USDT",
      symbol: "USDT",
      address: "0x55d398326f99059fF775485246999027B3197955",
      coingeckoUrl: "https://www.coingecko.com/en/coins/tether",
      decimals: 18,
      isStable: true,
      displayDecimals:4
    },
  ],
};


const ADDITIONAL_TOKENS = {
  [opBNB]: [
    {
      name: "GrizzlyFi Leverage Liquidity",
      symbol: "GLL",
      address: getContract(opBNB, "GLL"),
      decimals: 18,
    },
  ],
  [BSC]: [
    {
      name: "GrizzlyFi Leverage Liquidity",
      symbol: "GLL",
      address: getContract(BSC, "GLL"),
      decimals: 18,
    },
  ],
};

export const unavailableTokenSymbols = {
  [opBNB]: ["BNB"],
  [BSC]:["BNB"]
};

const CHAIN_IDS = [opBNB,BSC];

const TOKENS_MAP = {};
const TOKENS_MAP_LOWER = {};
const TOKENS_BY_SYMBOL_MAP = {};

for (let j = 0; j < CHAIN_IDS.length; j++) {
  const chainId = CHAIN_IDS[j];
  TOKENS_MAP[chainId] = {};
  TOKENS_MAP_LOWER[chainId] = {};
  TOKENS_BY_SYMBOL_MAP[chainId] = {};
  let tokens = TOKENS[chainId];
  if (ADDITIONAL_TOKENS[chainId]) {
    tokens = tokens.concat(ADDITIONAL_TOKENS[chainId]);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    TOKENS_MAP[chainId][token.address] = token;
    TOKENS_MAP_LOWER[chainId][token.address.toLowerCase()] = token;
    TOKENS_BY_SYMBOL_MAP[chainId][token.symbol] = token;
  }
}

const WRAPPED_TOKENS_MAP = {};
const NATIVE_TOKENS_MAP = {};
for (const chainId of CHAIN_IDS) {
  for (const token of TOKENS[chainId]) {
    if (token.isWrapped) {
      WRAPPED_TOKENS_MAP[chainId] = token;
    } else if (token.isNative) {
      NATIVE_TOKENS_MAP[chainId] = token;
    }
  }
}

export function getWrappedToken(chainId) {
  return WRAPPED_TOKENS_MAP[chainId];
}

export function getNativeToken(chainId) {
  return NATIVE_TOKENS_MAP[chainId];
}

export function getTokens(chainId) {
  return TOKENS[chainId];
}

export function isValidToken(chainId, address) {
  if (!TOKENS_MAP_LOWER[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  return address.toLowerCase() in TOKENS_MAP_LOWER[chainId];
}

export function getToken(chainId, address) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  if (!TOKENS_MAP[chainId][address]) {
    localStorage.removeItem("Exchange-token-selection-v2");
    localStorage.removeItem("BuyGll-swap-token-address");
    window.location.reload();
  }
  return TOKENS_MAP[chainId][address];
}

export function getTokenBySymbol(chainId, symbol) {
  const token = TOKENS_BY_SYMBOL_MAP[chainId][symbol];
  if (!token) {
    throw new Error(`Incorrect symbol "${symbol}" for chainId ${chainId}`);
  }
  return token;
}

export function getWhitelistedTokens(chainId) {
  return TOKENS[chainId].filter((token) => token.symbol !== "USDG");
}
