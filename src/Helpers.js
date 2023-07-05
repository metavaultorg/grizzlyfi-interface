import React, { useState, useRef, useEffect, useCallback } from "react";
import { InjectedConnector } from "@web3-react/injected-connector";
import {
  WalletConnectConnector,
  UserRejectedRequestError as UserRejectedRequestErrorWalletConnect,
} from "@web3-react/walletconnect-connector";
import { toast } from "react-toastify";
import { useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
import { useLocalStorage } from "react-use";
import { ethers } from "ethers";
import { format as formatDateFn } from "date-fns";
import Token from "./abis/Token.json";
import _ from "lodash";
import { getContract } from "./Addresses";
import useSWR from "swr";

import OrderBookReader from "./abis/OrderBookReader.json";
import OrderBook from "./abis/OrderBook.json";

import { getWhitelistedTokens, isValidToken } from "./data/Tokens";

const { AddressZero } = ethers.constants;

export const UI_VERSION = "1.3";

// use a random placeholder account instead of the zero address as the zero address might have tokens
export const PLACEHOLDER_ACCOUNT = ethers.Wallet.createRandom().address;

export const opBNB = 5611;
export const ZKSYNC = 324;
export const MUMBAI_TESTNET = 80001;

export const DEFAULT_CHAIN_ID = opBNB;
export const CHAIN_ID = DEFAULT_CHAIN_ID;

export const MIN_PROFIT_TIME = 0;

const SELECTED_NETWORK_LOCAL_STORAGE_KEY = "SELECTED_NETWORK";

const CHAIN_NAMES_MAP = {
  [opBNB]: "opBNB",
};

const GAS_PRICE_ADJUSTMENT_MAP = {
  [opBNB]: 200000000,
};

const MAX_GAS_PRICE_MAP = {
  [opBNB]: 2000000000,
};

const BSC_RPC_PROVIDERS = process.env.REACT_APP_BSC_RPC_URLS.split(" ");

export const WALLET_CONNECT_LOCALSTORAGE_KEY = "walletconnect";
export const WALLET_LINK_LOCALSTORAGE_PREFIX = "-walletlink";
export const SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY = "eagerconnect";
export const CURRENT_PROVIDER_LOCALSTORAGE_KEY = "currentprovider";

export function getChainName(chainId) {
  return CHAIN_NAMES_MAP[chainId];
}

export const USDG_ADDRESS = getContract(CHAIN_ID, "USDG");
export const MAX_LEVERAGE = 100 * 10000;

export const MAX_PRICE_DEVIATION_BASIS_POINTS = 250;
export const DEFAULT_GAS_LIMIT = 1 * 1000 * 1000;
export const SECONDS_PER_YEAR = 31536000;
export const USDG_DECIMALS = 18;
export const USD_DECIMALS = 30;
export const USD_DISPLAY_DECIMALS = 2;
export const GLL_DISPLAY_DECIMALS = 4;
export const BASIS_POINTS_DIVISOR = 10000;
export const DEPOSIT_FEE = 30;
export const DUST_BNB = "2000000000000000";
export const DUST_USD = expandDecimals(1, USD_DECIMALS);
export const PRECISION = expandDecimals(1, 30);
export const GLL_DECIMALS = 18;
export const DEFAULT_MAX_USDG_AMOUNT = expandDecimals(200 * 1000 * 1000, 18);

export const TAX_BASIS_POINTS = 50;
export const STABLE_TAX_BASIS_POINTS = 5;
export const MINT_BURN_FEE_BASIS_POINTS = 20;
export const SWAP_FEE_BASIS_POINTS = 30;
export const STABLE_SWAP_FEE_BASIS_POINTS = 25;
export const MARGIN_FEE_BASIS_POINTS = 10;

export const TRAILING_STOP_FEE = 50;

export const LIQUIDATION_FEE = expandDecimals(5, USD_DECIMALS);

export const GLL_COOLDOWN_DURATION = 60;
export const THRESHOLD_REDEMPTION_VALUE = expandDecimals(993, 27); // 0.993
export const FUNDING_RATE_PRECISION = 1000000;

export const SWAP = "Swap";
export const INCREASE = "Increase";
export const DECREASE = "Decrease";
export const LONG = "Long";
export const SHORT = "Short";
export const INACTIVE = "Inactive";

export const MARKET = "Market";
export const LIMIT = "Limit";
export const STOP = "Stop";
export const LEVERAGE_ORDER_OPTIONS = [MARKET, LIMIT/*, STOP*/];
export const SWAP_ORDER_OPTIONS = [MARKET, LIMIT];
export const SWAP_OPTIONS = [LONG, SHORT, SWAP];
export const DEFAULT_SLIPPAGE_AMOUNT = 30;
export const DEFAULT_HIGHER_SLIPPAGE_AMOUNT = 100;

export const DECREASE_ORDER_TYPES = ["Decrease", "(SL)", "(TP)","(TS)"];

export const SLIPPAGE_BPS_KEY = "Exchange-swap-slippage-basis-points-v3";
export const CLOSE_POSITION_RECEIVE_TOKEN_KEY = "Close-position-receive-token";
export const IS_PNL_IN_LEVERAGE_KEY = "Exchange-swap-is-pnl-in-leverage";
export const SHOW_PNL_AFTER_FEES_KEY = "Exchange-swap-show-pnl-after-fees";
export const DISABLE_ORDER_VALIDATION_KEY = "disable-order-validation";
export const SHOULD_SHOW_POSITION_LINES_KEY = "Exchange-swap-should-show-position-lines";
export const REFERRAL_CODE_KEY = "GrizzlyFi-referralCode";
export const REFERRAL_CODE_QUERY_PARAMS = "ref";
export const REFERRALS_SELECTED_TAB_KEY = "Referrals-selected-tab";
export const MAX_REFERRAL_CODE_LENGTH = 20;

export const FIRST_DATE_TS = parseInt(+new Date(2022, 5, 1) / 1000);

export const TRIGGER_PREFIX_ABOVE = ">";
export const TRIGGER_PREFIX_BELOW = "<";

export const MIN_PROFIT_BIPS = 0;

export const GLLPOOLCOLORS = {
  MATIC: "#7C43DA",
  ETH: "#6185F5",
  BTC: "#F7931A",
  LINK: "#3256D6",
  USDC: "#2775CA",
  USDT: "#67B18A",
  AAVE: "#9695F8",
  DAI: "#FAC044",
  UNI: "#E9167C",
  BUSD: "#F0B90B",
  stMATIC: "#25c0ff",
};
export const HIGH_EXECUTION_FEES_MAP = {
  [opBNB]: 3, // 3 USD
};
export const ICONLINKS = {
  5611: {
    GLL: {
      bsc: "https://bscscan.com/address/0x9F4f8bc00F48663B7C204c96b932C29ccc43A2E8",
    },
    tBNB: {
      coingecko: "https://www.coingecko.com/en/coins/bsc",
      bsc: "https://bscscan.com/address/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/weth",
      bsc: "https://bscscan.com/address/0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    },
    BTC: {
      coingecko: "https://www.coingecko.com/en/coins/wrapped-bitcoin",
      bsc: "https://bscscan.com/address/0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    },
    DAI: {
      coingecko: "https://www.coingecko.com/en/coins/dai",
      bsc: "https://bscscan.com/address/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    },
    BUSD: {
      coingecko: "https://www.coingecko.com/en/coins/binance-usd",
      bsc: "https://bscscan.com/token/0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      bsc: "https://bscscan.com/address/0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    },
    USDT: {
      coingecko: "https://www.coingecko.com/en/coins/tether",
      bsc: "https://bscscan.com/address/0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    },
    LINK: {
      coingecko: "https://www.coingecko.com/en/coins/chainlink",
      bsc: "https://bscscan.com/address/0xb0897686c545045afc77cf20ec7a532e3120e0f1",
    },
    AAVE: {
      coingecko: "https://www.coingecko.com/en/coins/aave",
      bsc: "https://bscscan.com/address/0xd6df932a45c0f255f85145f286ea0b292b21c90b",
    },
    UNI: {
      coingecko: "https://www.coingecko.com/en/coins/uniswap",
      bsc: "https://bscscan.com/address/0xb33eaad8d922b1083446dc23f610c2567fb5180f",
    },
    stMATIC: {
      coingecko: "https://www.coingecko.com/en/coins/lido-staked-matic",
      bsc: "https://bscscan.com/address/0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4",
    },
  },
};

export const platformTokens = {
  5611: {
    // bsc
    GLL: {
      name: "GrizzlyFi Leverage Liquidity",
      symbol: "GLL",
      decimals: 18,
      address: getContract(opBNB, "FeeGllTracker"),
      imageUrl: "https://res.cloudinary.com/grizzlyfi/image/upload/v1662984581/website-assets/gll-token.png",
    },
  },
};

const supportedChainIds = [opBNB];
const injectedConnector = new InjectedConnector({
  supportedChainIds,
});

const getWalletConnectConnector = () => {
  const chainId = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY) || DEFAULT_CHAIN_ID;
  return new WalletConnectConnector({
    rpc: {
      [opBNB]: BSC_RPC_PROVIDERS[0],
      
    },
    qrcode: true,
    chainId,
  });
};

export function isSupportedChain(chainId) {
  return supportedChainIds.includes(chainId);
}

export function deserialize(data) {
  for (const [key, value] of Object.entries(data)) {
    if (value._type === "BigNumber") {
      data[key] = bigNumberify(value.value);
    }
  }
  return data;
}

export function isHomeSite() {
  return process.env.REACT_APP_IS_HOME_SITE === "true";
}

export const helperToast = {
  success: (content) => {
    toast.dismiss();
    toast.success(content);
  },
  error: (content) => {
    toast.dismiss();
    toast.error(content);
  },
};

export function useLocalStorageByChainId(chainId, key, defaultValue) {
  const [internalValue, setInternalValue] = useLocalStorage(key, {});

  const setValue = useCallback(
    (value) => {
      setInternalValue((internalValue) => {
        if (typeof value === "function") {
          value = value(internalValue[chainId] || defaultValue);
        }
        const newInternalValue = {
          ...internalValue,
          [chainId]: value,
        };
        return newInternalValue;
      });
    },
    [chainId, setInternalValue, defaultValue]
  );

  let value;
  if (chainId in internalValue) {
    value = internalValue[chainId];
  } else {
    value = defaultValue;
  }

  return [value, setValue];
}

export function useLocalStorageSerializeKey(key, value, opts) {
  key = JSON.stringify(key);
  return useLocalStorage(key, value, opts);
}

function getTriggerPrice(tokenAddress, max, info, orderOption, triggerPriceUsd) {
  // Limit/stop orders are executed with price specified by user
  if (orderOption && orderOption !== MARKET && triggerPriceUsd) {
    return triggerPriceUsd;
  }

  // Market orders are executed with current market price
  if (!info) {
    return;
  }
  if (max && !info.maxPrice) {
    return;
  }
  if (!max && !info.minPrice) {
    return;
  }
  return max ? info.maxPrice : info.minPrice;
}

export function getLiquidationPriceFromDelta({ liquidationAmount, size, collateral, averagePrice, isLong }) {
  if (!size || size.eq(0)) {
    return;
  }

  if (liquidationAmount.gt(collateral)) {
    const liquidationDelta = liquidationAmount.sub(collateral);
    const priceDelta = liquidationDelta.mul(averagePrice).div(size);
    return isLong ? averagePrice.add(priceDelta) : averagePrice.sub(priceDelta);
  }

  const liquidationDelta = collateral.sub(liquidationAmount);
  const priceDelta = liquidationDelta.mul(averagePrice).div(size);

  return isLong ? averagePrice.sub(priceDelta) : averagePrice.add(priceDelta);
}

export const replaceNativeTokenAddress = (path, nativeTokenAddress) => {
  if (!path) {
    return;
  }

  let updatedPath = [];
  for (let i = 0; i < path.length; i++) {
    let address = path[i];
    if (address === AddressZero) {
      address = nativeTokenAddress;
    }
    updatedPath.push(address);
  }

  return updatedPath;
};

export function getMarginFee(sizeDelta) {
  if (!sizeDelta) {
    return bigNumberify(0);
  }
  const afterFeeUsd = sizeDelta.mul(BASIS_POINTS_DIVISOR - MARGIN_FEE_BASIS_POINTS).div(BASIS_POINTS_DIVISOR);
  return sizeDelta.sub(afterFeeUsd);
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
  if (chainId === opBNB) {
    return process.env.REACT_APP_GRIZZLYFI_API_URL;
  }
  return process.env.REACT_APP_GRIZZLYFI_API_URL;
}

export function getServerUrl(chainId, path) {
  return `${getServerBaseUrl(chainId)}${path}`;
}

export function isTriggerRatioInverted(fromTokenInfo, toTokenInfo) {
  if (!toTokenInfo || !fromTokenInfo) return false;
  if (toTokenInfo.isStable || toTokenInfo.isUsdg) return true;
  if (toTokenInfo.maxPrice) return toTokenInfo.maxPrice.lt(fromTokenInfo.maxPrice);
  return false;
}

export function getExchangeRate(tokenAInfo, tokenBInfo, inverted) {
  if (!tokenAInfo || !tokenAInfo.minPrice || !tokenBInfo || !tokenBInfo.maxPrice) {
    return;
  }
  if (inverted) {
    return tokenAInfo.minPrice.mul(PRECISION).div(tokenBInfo.maxPrice);
  }
  return tokenBInfo.maxPrice.mul(PRECISION).div(tokenAInfo.minPrice);
}

export function getMostAbundantStableToken(chainId, infoTokens) {
  const whitelistedTokens = getWhitelistedTokens(chainId);
  let availableAmount;
  let stableToken = whitelistedTokens.find((t) => t.isStable);
  for (let i = 0; i < whitelistedTokens.length; i++) {
    const info = getTokenInfo(infoTokens, whitelistedTokens[i].address);
    if (!info.isStable || !info.availableAmount) {
      continue;
    }

    const adjustedAvailableAmount = adjustForDecimals(info.availableAmount, info.decimals, USD_DECIMALS);
    if (!availableAmount || adjustedAvailableAmount.gt(availableAmount)) {
      availableAmount = adjustedAvailableAmount;
      stableToken = info;
    }
  }
  return stableToken;
}

export function shouldInvertTriggerRatio(tokenA, tokenB) {
  if (tokenB.isStable || tokenB.isUsdg) return true;
  if (tokenB.maxPrice && tokenA.maxPrice && tokenB.maxPrice.lt(tokenA.maxPrice)) return true;
  return false;
}

export function getExchangeRateDisplay(rate, tokenA, tokenB, opts = {}) {
  if (!rate || !tokenA || !tokenB) return "...";
  if (shouldInvertTriggerRatio(tokenA, tokenB)) {
    [tokenA, tokenB] = [tokenB, tokenA];
    rate = PRECISION.mul(PRECISION).div(rate);
  }
  const rateValue = formatAmount(
    rate,
    USD_DECIMALS,
    tokenA.isStable || tokenA.isUsdg ? tokenA.displayDecimals : 4,
    true
  );
  if (opts.omitSymbols) {
    return rateValue;
  }
  return `${rateValue} ${tokenA.symbol} / ${tokenB.symbol}`;
}

const adjustForDecimalsFactory = (n) => (number) => {
  if (n === 0) {
    return number;
  }
  if (n > 0) {
    return number.mul(expandDecimals(1, n));
  }
  return number.div(expandDecimals(1, -n));
};

export function adjustForDecimals(amount, divDecimals, mulDecimals) {
  return amount.mul(expandDecimals(1, mulDecimals)).div(expandDecimals(1, divDecimals));
}

export function getTargetUsdgAmount(token, usdgSupply, totalTokenWeights) {
  if (!token || !token.weight || !usdgSupply) {
    return;
  }

  if (usdgSupply.eq(0)) {
    return bigNumberify(0);
  }

  return token.weight.mul(usdgSupply).div(totalTokenWeights);
}

export function getFeeBasisPoints(
  token,
  usdgDelta,
  feeBasisPoints,
  taxBasisPoints,
  increment,
  usdgSupply,
  totalTokenWeights
) {
  if (!token || !token.usdgAmount || !usdgSupply || !totalTokenWeights) {
    return 0;
  }

  feeBasisPoints = bigNumberify(feeBasisPoints);
  taxBasisPoints = bigNumberify(taxBasisPoints);

  const initialAmount = token.usdgAmount;
  let nextAmount = initialAmount.add(usdgDelta);
  if (!increment) {
    nextAmount = usdgDelta.gt(initialAmount) ? bigNumberify(0) : initialAmount.sub(usdgDelta);
  }

  const targetAmount = getTargetUsdgAmount(token, usdgSupply, totalTokenWeights);
  if (!targetAmount || targetAmount.eq(0)) {
    return feeBasisPoints.toNumber();
  }

  const initialDiff = initialAmount.gt(targetAmount)
    ? initialAmount.sub(targetAmount)
    : targetAmount.sub(initialAmount);
  const nextDiff = nextAmount.gt(targetAmount) ? nextAmount.sub(targetAmount) : targetAmount.sub(nextAmount);

  if (nextDiff.lt(initialDiff)) {
    const rebateBps = taxBasisPoints.mul(initialDiff).div(targetAmount);
    return rebateBps.gt(feeBasisPoints) ? 0 : feeBasisPoints.sub(rebateBps).toNumber();
  }

  let averageDiff = initialDiff.add(nextDiff).div(2);
  if (averageDiff.gt(targetAmount)) {
    averageDiff = targetAmount;
  }
  const taxBps = taxBasisPoints.mul(averageDiff).div(targetAmount);
  return feeBasisPoints.add(taxBps).toNumber();
}

export function getBuyGllToAmount(fromAmount, swapTokenAddress, infoTokens, gllPrice, usdgSupply, totalTokenWeights) {
  const defaultValue = { amount: bigNumberify(0), feeBasisPoints: 0 };
  if (!fromAmount || !swapTokenAddress || !infoTokens || !gllPrice || !usdgSupply || !totalTokenWeights) {
    return defaultValue;
  }

  const swapToken = getTokenInfo(infoTokens, swapTokenAddress);
  if (!swapToken || !swapToken.minPrice) {
    return defaultValue;
  }

  let gllAmount = fromAmount.mul(swapToken.minPrice).div(gllPrice);
  gllAmount = adjustForDecimals(gllAmount, swapToken.decimals, USDG_DECIMALS);

  let usdgAmount = fromAmount.mul(swapToken.minPrice).div(PRECISION);
  usdgAmount = adjustForDecimals(usdgAmount, swapToken.decimals, USDG_DECIMALS);
  const feeBasisPoints = getFeeBasisPoints(
    swapToken,
    usdgAmount,
    MINT_BURN_FEE_BASIS_POINTS,
    TAX_BASIS_POINTS,
    true,
    usdgSupply,
    totalTokenWeights
  );

  gllAmount = gllAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints).div(BASIS_POINTS_DIVISOR);

  return { amount: gllAmount, feeBasisPoints };
}

export function getSellGllFromAmount(
  toAmount,
  swapTokenAddress,
  infoTokens,
  gllPrice,
  usdgSupply,
  totalTokenWeights
) {
  const defaultValue = { amount: bigNumberify(0), feeBasisPoints: 0 };
  if (!toAmount || !swapTokenAddress || !infoTokens || !gllPrice || !usdgSupply || !totalTokenWeights) {
    return defaultValue;
  }

  const swapToken = getTokenInfo(infoTokens, swapTokenAddress);
  if (!swapToken || !swapToken.maxPrice) {
    return defaultValue;
  }

  let gllAmount = toAmount.mul(swapToken.maxPrice).div(gllPrice);
  gllAmount = adjustForDecimals(gllAmount, swapToken.decimals, USDG_DECIMALS);

  let usdgAmount = toAmount.mul(swapToken.maxPrice).div(PRECISION);
  usdgAmount = adjustForDecimals(usdgAmount, swapToken.decimals, USDG_DECIMALS);
  const feeBasisPoints = getFeeBasisPoints(
    swapToken,
    usdgAmount,
    MINT_BURN_FEE_BASIS_POINTS,
    TAX_BASIS_POINTS,
    false,
    usdgSupply,
    totalTokenWeights
  );

  gllAmount = gllAmount.mul(BASIS_POINTS_DIVISOR).div(BASIS_POINTS_DIVISOR - feeBasisPoints);

  return { amount: gllAmount, feeBasisPoints };
}

export function getBuyGllFromAmount(toAmount, fromTokenAddress, infoTokens, gllPrice, usdgSupply, totalTokenWeights) {
  const defaultValue = { amount: bigNumberify(0) };
  if (!toAmount || !fromTokenAddress || !infoTokens || !gllPrice || !usdgSupply || !totalTokenWeights) {
    return defaultValue;
  }

  const fromToken = getTokenInfo(infoTokens, fromTokenAddress);
  if (!fromToken || !fromToken.minPrice) {
    return defaultValue;
  }

  let fromAmount = toAmount.mul(gllPrice).div(fromToken.minPrice);
  fromAmount = adjustForDecimals(fromAmount, GLL_DECIMALS, fromToken.decimals);

  const usdgAmount = toAmount.mul(gllPrice).div(PRECISION);
  const feeBasisPoints = getFeeBasisPoints(
    fromToken,
    usdgAmount,
    MINT_BURN_FEE_BASIS_POINTS,
    TAX_BASIS_POINTS,
    true,
    usdgSupply,
    totalTokenWeights
  );

  fromAmount = fromAmount.mul(BASIS_POINTS_DIVISOR).div(BASIS_POINTS_DIVISOR - feeBasisPoints);

  return { amount: fromAmount, feeBasisPoints };
}

export function getSellGllToAmount(toAmount, fromTokenAddress, infoTokens, gllPrice, usdgSupply, totalTokenWeights) {
  const defaultValue = { amount: bigNumberify(0) };
  if (!toAmount || !fromTokenAddress || !infoTokens || !gllPrice || !usdgSupply || !totalTokenWeights) {
    return defaultValue;
  }

  const fromToken = getTokenInfo(infoTokens, fromTokenAddress);
  if (!fromToken || !fromToken.maxPrice) {
    return defaultValue;
  }

  let fromAmount = toAmount.mul(gllPrice).div(fromToken.maxPrice);
  fromAmount = adjustForDecimals(fromAmount, GLL_DECIMALS, fromToken.decimals);

  const usdgAmount = toAmount.mul(gllPrice).div(PRECISION);
  const feeBasisPoints = getFeeBasisPoints(
    fromToken,
    usdgAmount,
    MINT_BURN_FEE_BASIS_POINTS,
    TAX_BASIS_POINTS,
    false,
    usdgSupply,
    totalTokenWeights
  );

  fromAmount = fromAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints).div(BASIS_POINTS_DIVISOR);

  return { amount: fromAmount, feeBasisPoints };
}

export function getNextFromAmount(
  chainId,
  toAmount,
  fromTokenAddress,
  toTokenAddress,
  infoTokens,
  toTokenPriceUsd,
  ratio,
  usdgSupply,
  totalTokenWeights,
  forSwap
) {
  const defaultValue = { amount: bigNumberify(0) };

  if (!toAmount || !fromTokenAddress || !toTokenAddress || !infoTokens) {
    return defaultValue;
  }

  if (fromTokenAddress === toTokenAddress) {
    return { amount: toAmount };
  }

  const fromToken = getTokenInfo(infoTokens, fromTokenAddress);
  const toToken = getTokenInfo(infoTokens, toTokenAddress);

  if (fromToken.isNative && toToken.isWrapped) {
    return { amount: toAmount };
  }

  if (fromToken.isWrapped && toToken.isNative) {
    return { amount: toAmount };
  }

  // the realtime price should be used if it is for a transaction to open / close a position
  // or if the transaction involves doing a swap and opening / closing a position
  // otherwise use the contract price instead of realtime price for swaps

  let fromTokenMinPrice;
  if (fromToken) {
    fromTokenMinPrice = forSwap ? fromToken.contractMinPrice : fromToken.minPrice;
  }

  let toTokenMaxPrice;
  if (toToken) {
    toTokenMaxPrice = forSwap ? toToken.contractMaxPrice : toToken.maxPrice;
  }

  if (!fromToken || !fromTokenMinPrice || !toToken || !toTokenMaxPrice) {
    return defaultValue;
  }

  const adjustDecimals = adjustForDecimalsFactory(fromToken.decimals - toToken.decimals);

  let fromAmountBasedOnRatio;
  if (ratio && !ratio.isZero()) {
    fromAmountBasedOnRatio = toAmount.mul(ratio).div(PRECISION);
  }

  const fromAmount =
    ratio && !ratio.isZero() ? fromAmountBasedOnRatio : toAmount.mul(toTokenMaxPrice).div(fromTokenMinPrice);

  let usdgAmount = fromAmount.mul(fromTokenMinPrice).div(PRECISION);
  usdgAmount = adjustForDecimals(usdgAmount, toToken.decimals, USDG_DECIMALS);
  const swapFeeBasisPoints =
    fromToken.isStable && toToken.isStable ? STABLE_SWAP_FEE_BASIS_POINTS : SWAP_FEE_BASIS_POINTS;
  const taxBasisPoints = fromToken.isStable && toToken.isStable ? STABLE_TAX_BASIS_POINTS : TAX_BASIS_POINTS;
  const feeBasisPoints0 = getFeeBasisPoints(
    fromToken,
    usdgAmount,
    swapFeeBasisPoints,
    taxBasisPoints,
    true,
    usdgSupply,
    totalTokenWeights
  );
  const feeBasisPoints1 = getFeeBasisPoints(
    toToken,
    usdgAmount,
    swapFeeBasisPoints,
    taxBasisPoints,
    false,
    usdgSupply,
    totalTokenWeights
  );
  const feeBasisPoints = feeBasisPoints0 > feeBasisPoints1 ? feeBasisPoints0 : feeBasisPoints1;

  return {
    amount: adjustDecimals(fromAmount.mul(BASIS_POINTS_DIVISOR).div(BASIS_POINTS_DIVISOR - feeBasisPoints)),
    feeBasisPoints,
  };
}

export function getNextToAmount(
  chainId,
  fromAmount,
  fromTokenAddress,
  toTokenAddress,
  infoTokens,
  toTokenPriceUsd,
  ratio,
  usdgSupply,
  totalTokenWeights,
  forSwap
) {
  const defaultValue = { amount: bigNumberify(0) };
  if (!fromAmount || !fromTokenAddress || !toTokenAddress || !infoTokens) {
    return defaultValue;
  }

  if (fromTokenAddress === toTokenAddress) {
    return { amount: fromAmount };
  }

  const fromToken = getTokenInfo(infoTokens, fromTokenAddress);
  const toToken = getTokenInfo(infoTokens, toTokenAddress);

  if (fromToken.isNative && toToken.isWrapped) {
    return { amount: fromAmount };
  }

  if (fromToken.isWrapped && toToken.isNative) {
    return { amount: fromAmount };
  }

  // the realtime price should be used if it is for a transaction to open / close a position
  // or if the transaction involves doing a swap and opening / closing a position
  // otherwise use the contract price instead of realtime price for swaps

  let fromTokenMinPrice;
  if (fromToken) {
    fromTokenMinPrice = forSwap ? fromToken.contractMinPrice : fromToken.minPrice;
  }

  let toTokenMaxPrice;
  if (toToken) {
    toTokenMaxPrice = forSwap ? toToken.contractMaxPrice : toToken.maxPrice;
  }

  if (!fromTokenMinPrice || !toTokenMaxPrice) {
    return defaultValue;
  }

  const adjustDecimals = adjustForDecimalsFactory(toToken.decimals - fromToken.decimals);

  let toAmountBasedOnRatio = bigNumberify(0);
  if (ratio && !ratio.isZero()) {
    toAmountBasedOnRatio = fromAmount.mul(PRECISION).div(ratio);
  }

  if (toTokenAddress === USDG_ADDRESS) {
    const feeBasisPoints = getSwapFeeBasisPoints(fromToken.isStable);

    if (ratio && !ratio.isZero()) {
      const toAmount = toAmountBasedOnRatio;
      return {
        amount: adjustDecimals(toAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints).div(BASIS_POINTS_DIVISOR)),
        feeBasisPoints,
      };
    }

    const toAmount = fromAmount.mul(fromTokenMinPrice).div(PRECISION);
    return {
      amount: adjustDecimals(toAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints).div(BASIS_POINTS_DIVISOR)),
      feeBasisPoints,
    };
  }

  if (fromTokenAddress === USDG_ADDRESS) {
    const redemptionValue = toToken.redemptionAmount
      .mul(toTokenPriceUsd || toTokenMaxPrice)
      .div(expandDecimals(1, toToken.decimals));

    if (redemptionValue.gt(THRESHOLD_REDEMPTION_VALUE)) {
      const feeBasisPoints = getSwapFeeBasisPoints(toToken.isStable);

      const toAmount =
        ratio && !ratio.isZero()
          ? toAmountBasedOnRatio
          : fromAmount.mul(toToken.redemptionAmount).div(expandDecimals(1, toToken.decimals));

      return {
        amount: adjustDecimals(toAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints).div(BASIS_POINTS_DIVISOR)),
        feeBasisPoints,
      };
    }

    const expectedAmount = fromAmount;

    const stableToken = getMostAbundantStableToken(chainId, infoTokens);
    if (!stableToken || stableToken.availableAmount.lt(expectedAmount)) {
      const toAmount =
        ratio && !ratio.isZero()
          ? toAmountBasedOnRatio
          : fromAmount.mul(toToken.redemptionAmount).div(expandDecimals(1, toToken.decimals));
      const feeBasisPoints = getSwapFeeBasisPoints(toToken.isStable);
      return {
        amount: adjustDecimals(toAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints).div(BASIS_POINTS_DIVISOR)),
        feeBasisPoints,
      };
    }

    const feeBasisPoints0 = getSwapFeeBasisPoints(true);
    const feeBasisPoints1 = getSwapFeeBasisPoints(false);

    if (ratio && !ratio.isZero()) {
      const toAmount = toAmountBasedOnRatio
        .mul(BASIS_POINTS_DIVISOR - feeBasisPoints0 - feeBasisPoints1)
        .div(BASIS_POINTS_DIVISOR);
      return {
        amount: adjustDecimals(toAmount),
        path: [USDG_ADDRESS, stableToken.address, toToken.address],
        feeBasisPoints: feeBasisPoints0 + feeBasisPoints1,
      };
    }

    // get toAmount for USDG => stableToken
    let toAmount = fromAmount.mul(PRECISION).div(stableToken.maxPrice);
    // apply USDG => stableToken fees
    toAmount = toAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints0).div(BASIS_POINTS_DIVISOR);

    // get toAmount for stableToken => toToken
    toAmount = toAmount.mul(stableToken.minPrice).div(toTokenPriceUsd || toTokenMaxPrice);
    // apply stableToken => toToken fees
    toAmount = toAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints1).div(BASIS_POINTS_DIVISOR);

    return {
      amount: adjustDecimals(toAmount),
      path: [USDG_ADDRESS, stableToken.address, toToken.address],
      feeBasisPoints: feeBasisPoints0 + feeBasisPoints1,
    };
  }

  const toAmount =
    ratio && !ratio.isZero()
      ? toAmountBasedOnRatio
      : fromAmount.mul(fromTokenMinPrice).div(toTokenPriceUsd || toTokenMaxPrice);

  let usdgAmount = fromAmount.mul(fromTokenMinPrice).div(PRECISION);
  usdgAmount = adjustForDecimals(usdgAmount, fromToken.decimals, USDG_DECIMALS);
  const swapFeeBasisPoints =
    fromToken.isStable && toToken.isStable ? STABLE_SWAP_FEE_BASIS_POINTS : SWAP_FEE_BASIS_POINTS;
  const taxBasisPoints = fromToken.isStable && toToken.isStable ? STABLE_TAX_BASIS_POINTS : TAX_BASIS_POINTS;
  const feeBasisPoints0 = getFeeBasisPoints(
    fromToken,
    usdgAmount,
    swapFeeBasisPoints,
    taxBasisPoints,
    true,
    usdgSupply,
    totalTokenWeights
  );
  const feeBasisPoints1 = getFeeBasisPoints(
    toToken,
    usdgAmount,
    swapFeeBasisPoints,
    taxBasisPoints,
    false,
    usdgSupply,
    totalTokenWeights
  );
  const feeBasisPoints = feeBasisPoints0 > feeBasisPoints1 ? feeBasisPoints0 : feeBasisPoints1;

  return {
    amount: adjustDecimals(toAmount.mul(BASIS_POINTS_DIVISOR - feeBasisPoints).div(BASIS_POINTS_DIVISOR)),
    feeBasisPoints,
  };
}

export function getProfitPrice(closePrice, position) {
  let profitPrice;
  if (position && position.averagePrice && closePrice) {
    profitPrice = position.isLong
      ? position.averagePrice.mul(BASIS_POINTS_DIVISOR + MIN_PROFIT_BIPS).div(BASIS_POINTS_DIVISOR)
      : position.averagePrice.mul(BASIS_POINTS_DIVISOR - MIN_PROFIT_BIPS).div(BASIS_POINTS_DIVISOR);
  }
  return profitPrice;
}

export function calculatePositionDelta(
  price,
  { size, collateral, isLong, averagePrice, lastIncreasedTime },
  sizeDelta
) {
  if (!sizeDelta) {
    sizeDelta = size;
  }
  if(!averagePrice){
    return
  }
  const priceDelta = averagePrice.gt(price) ? averagePrice.sub(price) : price.sub(averagePrice);
  
  let delta = sizeDelta.mul(priceDelta).div(averagePrice);
  const pendingDelta = delta;

  const minProfitExpired = lastIncreasedTime + MIN_PROFIT_TIME < Date.now() / 1000;
  const hasProfit = isLong ? price.gt(averagePrice) : price.lt(averagePrice);
  if (!minProfitExpired && hasProfit && delta.mul(BASIS_POINTS_DIVISOR).lte(size.mul(MIN_PROFIT_BIPS))) {
    delta = bigNumberify(0);
  }

  const deltaPercentage = delta.mul(BASIS_POINTS_DIVISOR).div(collateral);
  const pendingDeltaPercentage = pendingDelta.mul(BASIS_POINTS_DIVISOR).div(collateral);

  return {
    delta,
    pendingDelta,
    pendingDeltaPercentage,
    hasProfit,
    deltaPercentage,
  };
}

export function getDeltaStr({ delta, deltaPercentage, hasProfit }) {
  let deltaStr;
  let deltaPercentageStr;

  if (delta.gt(0)) {
    deltaStr = hasProfit ? "+" : "-";
    deltaPercentageStr = hasProfit ? "+" : "-";
  } else {
    deltaStr = "";
    deltaPercentageStr = "";
  }
  deltaStr += `$${formatAmount(delta, USD_DECIMALS, 2, true)}`;
  deltaPercentageStr += `${formatAmount(deltaPercentage, 2, 2)}%`;

  return { deltaStr, deltaPercentageStr };
}

export function getLeverage({
  size,
  sizeDelta,
  increaseSize,
  collateral,
  collateralDelta,
  increaseCollateral,
  entryFundingRate,
  cumulativeFundingRate,
  hasProfit,
  delta,
  includeDelta,
}) {
  if (!size && !sizeDelta) {
    return;
  }
  if (!collateral && !collateralDelta) {
    return;
  }

  let nextSize = size ? size : bigNumberify(0);
  if (sizeDelta) {
    if (increaseSize) {
      nextSize = size.add(sizeDelta);
    } else {
      if (sizeDelta.gte(size)) {
        return;
      }
      nextSize = size.sub(sizeDelta);
    }
  }

  let remainingCollateral = collateral ? collateral : bigNumberify(0);
  if (collateralDelta) {
    if (increaseCollateral) {
      remainingCollateral = collateral.add(collateralDelta);
    } else {
      if (collateralDelta.gte(collateral)) {
        return;
      }
      remainingCollateral = collateral.sub(collateralDelta);
    }
  }

  if (delta && includeDelta) {
    if (hasProfit) {
      remainingCollateral = remainingCollateral.add(delta);
    } else {
      if (delta.gt(remainingCollateral)) {
        return;
      }

      remainingCollateral = remainingCollateral.sub(delta);
    }
  }

  if (remainingCollateral.eq(0)) {
    return;
  }

  remainingCollateral = sizeDelta
    ? remainingCollateral.mul(BASIS_POINTS_DIVISOR - MARGIN_FEE_BASIS_POINTS).div(BASIS_POINTS_DIVISOR)
    : remainingCollateral;
  if (entryFundingRate && cumulativeFundingRate) {
    const fundingFee = size.mul(cumulativeFundingRate.sub(entryFundingRate)).div(FUNDING_RATE_PRECISION);
    remainingCollateral = remainingCollateral.sub(fundingFee);
  }

  return nextSize.mul(BASIS_POINTS_DIVISOR).div(remainingCollateral);
}

export function getLiquidationPrice(data) {
  let {
    isLong,
    size,
    collateral,
    averagePrice,
    entryFundingRate,
    cumulativeFundingRate,
    sizeDelta,
    collateralDelta,
    increaseCollateral,
    increaseSize,
    delta,
    hasProfit,
    includeDelta,
  } = data;
  if (!size || !collateral || !averagePrice) {
    return;
  }

  let nextSize = size ? size : bigNumberify(0);
  let remainingCollateral = collateral;

  if (sizeDelta) {
    if (increaseSize) {
      nextSize = size.add(sizeDelta);
    } else {
      if (sizeDelta.gte(size)) {
        return;
      }
      nextSize = size.sub(sizeDelta);
    }

    if (includeDelta && !hasProfit) {
      const adjustedDelta = sizeDelta.mul(delta).div(size);
      remainingCollateral = remainingCollateral.sub(adjustedDelta);
    }
  }

  if (collateralDelta) {
    if (increaseCollateral) {
      remainingCollateral = remainingCollateral.add(collateralDelta);
    } else {
      if (collateralDelta.gte(remainingCollateral)) {
        return;
      }
      remainingCollateral = remainingCollateral.sub(collateralDelta);
    }
  }

  let positionFee = getMarginFee(size).add(LIQUIDATION_FEE);
  if (entryFundingRate && cumulativeFundingRate) {
    const fundingFee = size.mul(cumulativeFundingRate.sub(entryFundingRate)).div(FUNDING_RATE_PRECISION);
    positionFee = positionFee.add(fundingFee);
  }

  const liquidationPriceForFees = getLiquidationPriceFromDelta({
    liquidationAmount: positionFee,
    size: nextSize,
    collateral: remainingCollateral,
    averagePrice,
    isLong,
  });

  const liquidationPriceForMaxLeverage = getLiquidationPriceFromDelta({
    liquidationAmount: nextSize.mul(BASIS_POINTS_DIVISOR).div(MAX_LEVERAGE),
    size: nextSize,
    collateral: remainingCollateral,
    averagePrice,
    isLong,
  });

  if (!liquidationPriceForFees) {
    return liquidationPriceForMaxLeverage;
  }
  if (!liquidationPriceForMaxLeverage) {
    return liquidationPriceForFees;
  }

  if (isLong) {
    // return the higher price
    return liquidationPriceForFees.gt(liquidationPriceForMaxLeverage)
      ? liquidationPriceForFees
      : liquidationPriceForMaxLeverage;
  }

  // return the lower price
  return liquidationPriceForFees.lt(liquidationPriceForMaxLeverage)
    ? liquidationPriceForFees
    : liquidationPriceForMaxLeverage;
}

export function getUsd(amount, tokenAddress, max, infoTokens, orderOption, triggerPriceUsd) {
  if (!amount) {
    return;
  }
  if (tokenAddress === USDG_ADDRESS) {
    return amount.mul(PRECISION).div(expandDecimals(1, 18));
  }
  const info = getTokenInfo(infoTokens, tokenAddress);
  const price = getTriggerPrice(tokenAddress, max, info, orderOption, triggerPriceUsd);
  if (!price) {
    return;
  }

  return amount.mul(price).div(expandDecimals(1, info.decimals));
}

export function getPositionKey(account, collateralTokenAddress, indexTokenAddress, isLong, nativeTokenAddress) {
  const tokenAddress0 = collateralTokenAddress === AddressZero ? nativeTokenAddress : collateralTokenAddress;
  const tokenAddress1 = indexTokenAddress === AddressZero ? nativeTokenAddress : indexTokenAddress;
  return account + ":" + tokenAddress0 + ":" + tokenAddress1 + ":" + isLong;
}

export function getPositionContractKey(account, collateralToken, indexToken, isLong) {
  return ethers.utils.solidityKeccak256(
    ["address", "address", "address", "bool"],
    [account, collateralToken, indexToken, isLong]
  );
}

export function getSwapFeeBasisPoints(isStable) {
  return isStable ? STABLE_SWAP_FEE_BASIS_POINTS : SWAP_FEE_BASIS_POINTS;
}

const RPC_PROVIDERS = {
  [opBNB]: BSC_RPC_PROVIDERS,
//   [ZKSYNC]: ZKSYNC_RPC_PROVIDERS,

};

const FALLBACK_PROVIDERS = {
  [opBNB]: process.env.REACT_APP_BSC_FALLBACK_PROVIDERS.split(" "),
};

export function shortenAddress(address, length) {
  if (!length) {
    return "";
  }
  if (!address) {
    return address;
  }
  if (address.length < 10) {
    return address;
  }
  let left = Math.floor((length - 3) / 2) + 1;
  return address.substring(0, left) + "..." + address.substring(address.length - (length - (left + 3)), address.length);
}

export function formatDateTime(time) {
  return formatDateFn(time * 1000, "dd MMM yyyy, h:mm a");
}

export function getTimeRemaining(time) {
  const now = parseInt(Date.now() / 1000);
  if (time < now) {
    return "0h 0m";
  }
  const diff = time - now;
  const hours = parseInt(diff / (60 * 60));
  const minutes = parseInt((diff - hours * 60 * 60) / 60);
  return `${hours}h ${minutes}m`;
}

export function formatDate(time) {
  return formatDateFn(time * 1000, "dd MMM yyyy");
}

export function hasMetaMaskWalletExtension() {
  return window.ethereum;
}

export function hasExodusWalletExtension() {
  return window.exodus;
}

export function hasCoinBaseWalletExtension() {
  const { ethereum } = window;

  if (!ethereum?.providers && !ethereum?.isCoinbaseWallet) {
    return false;
  }
  return window.ethereum.isCoinbaseWallet || ethereum.providers.find(({ isCoinbaseWallet }) => isCoinbaseWallet);
}

export function activateInjectedProvider(providerName) {
  const { ethereum } = window;

  if (!ethereum?.providers && !ethereum?.isCoinbaseWallet && !ethereum?.isMetaMask && !ethereum?.isExodus) {
    return undefined;
  }

  let provider;
  if (ethereum?.providers) {
    switch (providerName) {
      case "CoinBase":
        provider = ethereum.providers.find(({ isCoinbaseWallet }) => isCoinbaseWallet);
        break;
      case "Exodus":
        provider = ethereum.providers.find(({ isExodus }) => isExodus);
        break;
      case "MetaMask":
      default:
        provider = ethereum.providers.find(({ isMetaMask }) => isMetaMask);
        break;
    }
  }

  if (provider) {
    ethereum.setSelectedProvider(provider);
  }
}

export function getInjectedConnector() {
  return injectedConnector;
}

export function useChainId() {
  let { chainId } = useWeb3React();

  if (!chainId) {
    const chainIdFromLocalStorage = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY);
    if (chainIdFromLocalStorage) {
      chainId = parseInt(chainIdFromLocalStorage);
      if (!chainId) {
        // localstorage value is invalid
        localStorage.removeItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY);
      }
    }
  }

  if (!chainId || !supportedChainIds.includes(chainId)) {
    chainId = DEFAULT_CHAIN_ID;
  }
  return { chainId };
}

export function useENS(address) {
  const [ensName, setENSName] = useState();

  useEffect(() => {
    async function resolveENS() {
      if (address) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(
            BSC_RPC_PROVIDERS[0]
          );
          const name = await provider.lookupAddress(address.toLowerCase());
          if (name) setENSName(name);
        } catch (e) {
          console.log("Error on useENS");
          console.error(e);
        }
      }
    }
    resolveENS();
  }, [address]);

  return { ensName };
}

export function clearWalletConnectData() {
  localStorage.removeItem(WALLET_CONNECT_LOCALSTORAGE_KEY);
}

export function clearWalletLinkData() {
  Object.entries(localStorage)
    .map((x) => x[0])
    .filter((x) => x.startsWith(WALLET_LINK_LOCALSTORAGE_PREFIX))
    .map((x) => localStorage.removeItem(x));
}

export function useEagerConnect(setActivatingConnector) {
  const { activate, active } = useWeb3React();
  const [tried, setTried] = useState(false);

  useEffect(() => {
    (async function () {
      if (Boolean(localStorage.getItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY)) !== true) {
        // only works with WalletConnect
        clearWalletConnectData();
        // force clear localStorage connection for MM/CB Wallet (Brave legacy)
        clearWalletLinkData();
        return;
      }

      let shouldTryWalletConnect = false;
      try {
        // naive validation to not trigger Wallet Connect if data is corrupted
        const rawData = localStorage.getItem(WALLET_CONNECT_LOCALSTORAGE_KEY);
        if (rawData) {
          const data = JSON.parse(rawData);
          if (data && data.connected) {
            shouldTryWalletConnect = true;
          }
        }
      } catch (ex) {
        if (ex instanceof SyntaxError) {
          // rawData is not a valid json
          clearWalletConnectData();
        }
      }

      if (shouldTryWalletConnect) {
        try {
          const connector = getWalletConnectConnector();
          setActivatingConnector(connector);
          await activate(connector, undefined, true);
          // in case Wallet Connect is activated no need to check injected wallet
          return;
        } catch (ex) {
          // assume data in localstorage is corrupted and delete it to not retry on next page load
          clearWalletConnectData();
        }
      }

      try {
        const connector = getInjectedConnector();
        const currentProviderName = localStorage.getItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY) ?? false;
        if (currentProviderName !== false) {
          activateInjectedProvider(currentProviderName);
        }
        const authorized = await connector.isAuthorized();
        if (authorized) {
          setActivatingConnector(connector);
          await activate(connector, undefined, true);
        }
      } catch (ex) {}

      setTried(true);
    })();
  }, []); // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (!tried && active) {
      setTried(true);
    }
  }, [tried, active]);

  return tried;
}

export function useInactiveListener(suppress = false) {
  const injected = getInjectedConnector();
  const { active, error, activate } = useWeb3React();

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        activate(injected);
      };
      const handleChainChanged = (chainId) => {
        activate(injected);
      };
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          activate(injected);
        }
      };
      const handleNetworkChanged = (networkId) => {
        activate(injected);
      };

      ethereum.on("connect", handleConnect);
      ethereum.on("chainChanged", handleChainChanged);
      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("networkChanged", handleNetworkChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener("connect", handleConnect);
          ethereum.removeListener("chainChanged", handleChainChanged);
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
          ethereum.removeListener("networkChanged", handleNetworkChanged);
        }
      };
    }
  }, [active, error, suppress, activate]);
}

export function getProvider(library, chainId) {
  let provider;
  if (library) {
    return library.getSigner();
  }
  provider = _.sample(RPC_PROVIDERS[chainId]);
  return new ethers.providers.StaticJsonRpcProvider(provider, { chainId });
}

export function getFallbackProvider(chainId) {
  if (!FALLBACK_PROVIDERS[chainId]) {
    return;
  }

  const provider = _.sample(FALLBACK_PROVIDERS[chainId]);
  return new ethers.providers.StaticJsonRpcProvider(provider, { chainId });
}

export const getContractCall = ({ provider, contractInfo, arg0, arg1, method, params, additionalArgs, onError }) => {
  if (ethers.utils.isAddress(arg0)) {
    const address = arg0;
    const contract = new ethers.Contract(address, contractInfo.abi, provider);

    if (additionalArgs) {
      return contract[method](...params.concat(additionalArgs));
    }
    return contract[method](...params);
  }

  if (!provider) {
    return;
  }

  return provider[method](arg1, ...params);
};

// prettier-ignore
export const fetcher = (library, contractInfo, additionalArgs) => (...args) => {
  // eslint-disable-next-line
  const [id, chainId, arg0, arg1, ...params] = args;
  const provider = getProvider(library, chainId);

  const method = ethers.utils.isAddress(arg0) ? arg1 : arg0;

  const contractCall = getContractCall({
    provider,
    contractInfo,
    arg0,
    arg1,
    method,
    params,
    additionalArgs,
  })

  let shouldCallFallback = true

  const handleFallback = async (resolve, reject, error) => {
    if (!shouldCallFallback) {
      return
    }
    // prevent fallback from being called twice
    shouldCallFallback = false

    const fallbackProvider = getFallbackProvider(chainId)
    if (!fallbackProvider) {
      reject(error)
      return
    }

    // console.info("using fallbackProvider for", method)
    const fallbackContractCall = getContractCall({
      provider: fallbackProvider,
      contractInfo,
      arg0,
      arg1,
      method,
      params,
      additionalArgs,
    })

    fallbackContractCall.then((result) => resolve(result)).catch((e) => {
      // console.error("fallback fetcher error", id, contractInfo.contractName, method, e);
      reject(e)
    })
  }

  return new Promise(async (resolve, reject) => {
    contractCall.then((result) => {
      shouldCallFallback = false
      resolve(result)
    }).catch((e) => {
      // console.error("fetcher error", id, contractInfo.contractName, method, e);
      handleFallback(resolve, reject, e)
    })

    setTimeout(() => {
      handleFallback(resolve, reject, "contractCall timeout")
    }, 2000)
  })
};

export function bigNumberify(n) {
  try {
    return ethers.BigNumber.from(n);
  } catch (e) {
    console.error("bigNumberify error", e);
    return undefined;
  }
}

export function expandDecimals(n, decimals) {
  return bigNumberify(n).mul(bigNumberify(10).pow(decimals));
}

export const trimZeroDecimals = (amount) => {
  if (parseFloat(amount) === parseInt(amount)) {
    return parseInt(amount).toString();
  }
  return amount;
};

export const limitDecimals = (amount, maxDecimals) => {
  let amountStr = amount.toString();
  if (maxDecimals === undefined) {
    return amountStr;
  }
  if (maxDecimals === 0) {
    return amountStr.split(".")[0];
  }
  const dotIndex = amountStr.indexOf(".");
  if (dotIndex !== -1) {
    let decimals = amountStr.length - dotIndex - 1;
    if (decimals > maxDecimals) {
      amountStr = amountStr.substr(0, amountStr.length - (decimals - maxDecimals));
    }
  }
  return amountStr;
};

export const compactNumber = value => {
  const abs = Math.abs(value)
  if (abs >= 1e9) {
    return `${(value / 1e9).toFixed(abs < 1e10 ? 2 : 1)}B`
  }
  if (abs >= 1e6) {
    return `${(value / 1e6).toFixed(abs < 1e7 ? 2 : 1)}M`
  }
  if (abs >= 1e3) {
    return `${(value / 1e3).toFixed(abs < 1e4 ? 2 : 1)}K`
  }
  return `${value.toFixed(1)}`
}

export const formatNumber = (value, displayDecimals, useComma, compact) => {
  if (!value) {
    return null;
  }
  let ret = limitDecimals(value, displayDecimals);
  if (compact) {
    ret = compactNumber(ret)
  }
  if (useComma) {
    ret = numberWithCommas(ret);
  }
  return ret;
}

export const padDecimals = (amount, minDecimals) => {
  let amountStr = amount.toString();
  const dotIndex = amountStr.indexOf(".");
  if (dotIndex !== -1) {
    const decimals = amountStr.length - dotIndex - 1;
    if (decimals < minDecimals) {
      amountStr = amountStr.padEnd(amountStr.length + (minDecimals - decimals), "0");
    }
  } else {
    amountStr = amountStr + ".0000";
  }
  return amountStr;
};

export const formatKeyAmount = (map, key, tokenDecimals, displayDecimals, useCommas) => {
  if (!map || !map[key]) {
    return "...";
  }

  return formatAmount(map[key], tokenDecimals, displayDecimals, useCommas);
};

export const formatArrayAmount = (arr, index, tokenDecimals, displayDecimals, useCommas) => {
  if (!arr || !arr[index]) {
    return "...";
  }

  return formatAmount(arr[index], tokenDecimals, displayDecimals, useCommas);
};

function _parseOrdersData(ordersData, account, indexes, extractor, uintPropsLength, addressPropsLength) {
  if (!ordersData || ordersData.length === 0) {
    return [];
  }
  const [uintProps, addressProps] = ordersData;
  const count = uintProps.length / uintPropsLength;

  const orders = [];
  for (let i = 0; i < count; i++) {
    const sliced = addressProps
      .slice(addressPropsLength * i, addressPropsLength * (i + 1))
      .concat(uintProps.slice(uintPropsLength * i, uintPropsLength * (i + 1)));

    if (sliced[0] === AddressZero && sliced[1] === AddressZero) {
      continue;
    }

    const order = extractor(sliced);
    order.index = indexes[i];
    order.account = account;
    orders.push(order);
  }

  return orders;
}

function parseDecreaseOrdersData(chainId, decreaseOrdersData, account, indexes) {
  const extractor = (sliced) => {
    const isLong = sliced[5].toString() === "1";
    return {
      collateralToken: sliced[0],
      indexToken: sliced[1],
      receiveToken: sliced[2],
      collateralDelta: sliced[3],
      sizeDelta: sliced[4],
      isLong,
      triggerPrice: sliced[6],
      triggerAboveThreshold: sliced[7].toString() === "1",
      orderType:sliced[8],
      trailingStopPercentage:sliced[9],
      type: DECREASE,
    };
  };
  return _parseOrdersData(decreaseOrdersData, account, indexes, extractor, 7, 3).filter((order) => {
    return isValidToken(chainId, order.collateralToken) && isValidToken(chainId, order.indexToken);
  });
}

function parseIncreaseOrdersData(chainId, increaseOrdersData, account, indexes) {
  const extractor = (sliced) => {
    const isLong = sliced[5].toString() === "1";
    return {
      purchaseToken: sliced[0],
      collateralToken: sliced[1],
      indexToken: sliced[2],
      purchaseTokenAmount: sliced[3],
      sizeDelta: sliced[4],
      isLong,
      triggerPrice: sliced[6],
      triggerAboveThreshold: sliced[7].toString() === "1",
      type: INCREASE,
    };
  };
  return _parseOrdersData(increaseOrdersData, account, indexes, extractor, 5, 3).filter((order) => {
    return (
      isValidToken(chainId, order.purchaseToken) &&
      isValidToken(chainId, order.collateralToken) &&
      isValidToken(chainId, order.indexToken)
    );
  });
}

function parseSwapOrdersData(chainId, swapOrdersData, account, indexes) {
  if (!swapOrdersData || !swapOrdersData.length) {
    return [];
  }

  const extractor = (sliced) => {
    const triggerAboveThreshold = sliced[6].toString() === "1";
    const shouldUnwrap = sliced[7].toString() === "1";

    return {
      path: [sliced[0], sliced[1], sliced[2]].filter((address) => address !== AddressZero),
      amountIn: sliced[3],
      minOut: sliced[4],
      triggerRatio: sliced[5],
      triggerAboveThreshold,
      type: SWAP,
      shouldUnwrap,
    };
  };
  return _parseOrdersData(swapOrdersData, account, indexes, extractor, 5, 3).filter((order) => {
    return order.path.every((token) => isValidToken(chainId, token));
  });
}

export function getOrderKey(order) {
  return `${order.type}-${order.account}-${order.index}`;
}

export function useAccountOrders(flagOrdersEnabled, overrideAccount) {
  const { library, account: connectedAccount } = useWeb3React();
  const active = true; // this is used in Actions.js so set active to always be true
  const account = overrideAccount || connectedAccount;

  const { chainId } = useChainId();
  const shouldRequest = active && account && flagOrdersEnabled;

  const orderBookAddress = getContract(chainId, "OrderBook");
  const orderBookReaderAddress = getContract(chainId, "OrderBookReader");

  const key = shouldRequest ? [active, chainId, orderBookAddress, account] : false;
  const {
    data: orders = [],
    mutate: updateOrders,
    error: ordersError,
  } = useSWR(key, {
    dedupingInterval: 5000,
    fetcher: async (active, chainId, orderBookAddress, account) => {
      const provider = getProvider(library, chainId);
      const orderBookContract = new ethers.Contract(orderBookAddress, OrderBook.abi, provider);
      const orderBookReaderContract = new ethers.Contract(orderBookReaderAddress, OrderBookReader.abi, provider);

      // const fetchIndexesFromServer = () => {
      //   const ordersIndexesUrl = `${getServerBaseUrl(chainId)}/orders_indices?account=${account}`;
      //   return fetch(ordersIndexesUrl)
      //     .then(async (res) => {
      //       const json = await res.json();
      //       const ret = {};
      //       for (const key of Object.keys(json)) {
      //         ret[key.toLowerCase()] = json[key].map((val) => parseInt(val.value));
      //       }

      //       return ret;
      //     })
      //     .catch(() => ({ swap: [], increase: [], decrease: [] }));
      // };

      const fetchIndexesFromServer = () => {
        return { swap: [], increase: [], decrease: [] };
      };

      const fetchLastIndex = async (type) => {
        const method = type.toLowerCase() + "OrdersIndex";
        return await orderBookContract[method](account).then((res) => bigNumberify(res._hex).toNumber());
      };

      const fetchLastSwapIndex = async (type) => {
        const method = type.toLowerCase() + "OrdersIndex";
        return await orderBookContract[method](account).then((res) => bigNumberify(res._hex).toNumber());
      };

      const fetchLastIndexes = async () => {
        const [swap, increase, decrease] = await Promise.all([
          fetchLastSwapIndex("swap"),
          fetchLastIndex("increase"),
          fetchLastIndex("decrease"),
        ]);
        return { swap, increase, decrease };
      };

      const getRange = (to, from) => {
        const LIMIT = 10;
        const _indexes = [];
        from = from || Math.max(to - LIMIT, 0);
        for (let i = to - 1; i >= from; i--) {
          _indexes.push(i);
        }
        return _indexes;
      };

      const getIndexes = (knownIndexes, lastIndex) => {
        if (knownIndexes.length === 0) {
          return getRange(lastIndex);
        }
        return [
          ...knownIndexes,
          ...getRange(lastIndex, knownIndexes[knownIndexes.length - 1] + 1).sort((a, b) => b - a),
        ];
      };

      const getOrders = async (method, knownIndexes, lastIndex, parseFunc) => {
        const indexes = method === "getDecreaseOrders"? await getIndexesDec(knownIndexes, lastIndex) : getIndexes(knownIndexes, lastIndex);
        //const indexes = getIndexes(knownIndexes, lastIndex);
        const validIndexes = indexes.filter((i)=>i>=0);
        // console.log("method",validIndexes,indexes,method)
        const ordersData = await orderBookReaderContract[method](
          orderBookAddress,
          account,
          validIndexes
        );

        const orders = parseFunc(chainId, ordersData, account, validIndexes);

       

        return orders;
      };

      const getIndexesDec = async (knownIndexes, lastIndex) => {
        const indexes = getIndexes(knownIndexes, lastIndex);
        return Promise.all(
          indexes.map(async (index) => {
            const ordersData = await orderBookContract["decreaseOrders"](account, index);
            if (ordersData.account !== AddressZero) return index;
            return -1;
          })
        );
      };

      try {
        const [serverIndexes, lastIndexes] = await Promise.all([fetchIndexesFromServer(), fetchLastIndexes()]);
        const [swapOrders = [], increaseOrders = [], decreaseOrders = []] = await Promise.all([
          getOrders("getSwapOrders", serverIndexes.swap, lastIndexes.swap, parseSwapOrdersData),
          getOrders("getIncreaseOrders", serverIndexes.increase, lastIndexes.increase, parseIncreaseOrdersData),
          getOrders("getDecreaseOrders", serverIndexes.decrease, lastIndexes.decrease, parseDecreaseOrdersData),
        ]);


        return [...swapOrders, ...increaseOrders, ...decreaseOrders];
      } catch (ex) {
        console.error(ex);
      }
    },
  });

  return [orders, updateOrders, ordersError];
}

export const formatAmount = (amount, tokenDecimals, displayDecimals, useCommas, defaultValue) => {
  try {
    if (defaultValue === undefined) {
      defaultValue = "...";
    }
    if (amount === undefined || amount.toString().length === 0) {
      return defaultValue;
    }
    if (displayDecimals === undefined) {
      displayDecimals = 4;
    }
    let amountStr = ethers.utils.formatUnits(amount, tokenDecimals);
    amountStr = limitDecimals(amountStr, displayDecimals);
    if (displayDecimals !== 0) {
      amountStr = padDecimals(amountStr, displayDecimals);
    }
    if (useCommas) {
      return numberWithCommas(amountStr);
    }
    return amountStr;
  } catch (error) {
    console.log("Error on formatAmount");
    console.log(error);
  }
};

export const formatAmountFree = (amount, tokenDecimals, displayDecimals) => {
  if (!amount) {
    return "...";
  }
  let amountStr = ethers.utils.formatUnits(amount, tokenDecimals);
  amountStr = limitDecimals(amountStr, displayDecimals);
  return trimZeroDecimals(amountStr);
};

export const parseValue = (value, tokenDecimals) => {
  const pValue = parseFloat(value);
  if (isNaN(pValue)) {
    return undefined;
  }
  value = limitDecimals(value, tokenDecimals);
  try {
    const amount = ethers.utils.parseUnits(value, tokenDecimals);
    return bigNumberify(amount);
  } catch (error) {
    console.log(error)
  }
};

export function numberWithCommas(x) {
  if (!x) {
    return "...";
  }
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function getExplorerUrl(chainId) {
  if (chainId === opBNB) {
    return process.env.REACT_APP_EXPLORER_BSC_URL;
  }
  return process.env.REACT_APP_EXPLORER_BSC_URL;
}

export function getAccountUrl(chainId, account) {
  if (!account) {
    return getExplorerUrl(chainId);
  }
  return getExplorerUrl(chainId) + "address/" + account;
}

export function getTokenUrl(chainId, address) {
  if (!address) {
    return getExplorerUrl(chainId);
  }
  return getExplorerUrl(chainId) + "token/" + address;
}

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const getApiGasPrice = async () => {
  return bigNumberify(0);
};

export async function setGasPrice(txnOpts, provider, chainId) {
  let maxGasPrice = MAX_GAS_PRICE_MAP[chainId];
  const premium = GAS_PRICE_ADJUSTMENT_MAP[chainId] || bigNumberify(0);

  const gasPrice = await getApiGasPrice();
  if (gasPrice.gt(0)) {
      txnOpts["gasPrice"] = gasPrice;//.add(premium);
  } else if (maxGasPrice) {
      const gasPrice = await provider.getGasPrice();
      if (gasPrice.gt(maxGasPrice)) {
          txnOpts["gasPrice"] = bigNumberify(maxGasPrice);//.add(premium);
      }else{
          txnOpts["gasPrice"] = gasPrice;//.add(premium);
      }

      // const feeData = await provider.getFeeData();
      // txnOpts["maxPriorityFeePerGas"] = feeData.maxPriorityFeePerGas.add(priority);
  }
}

export async function getGasLimit(contract, method, params = [], value, gasBuffer) {
  const defaultGasBuffer = 300000;
  const defaultValue = bigNumberify(0);

  if (!value) {
    value = defaultValue;
  }
  console.log("getGasLimit", contract, method, params);
  let gasLimit = await contract.estimateGas[method](...params, { value });

  if (!gasBuffer) {
    gasBuffer = defaultGasBuffer;
  }

  return gasLimit.add(gasBuffer);
}

export function approveTokens({
  setIsApproving,
  library,
  tokenAddress,
  spender,
  chainId,
  onApproveSubmitted,
  getTokenInfo,
  infoTokens,
  pendingTxns,
  setPendingTxns,
  includeMessage,
}) {
  setIsApproving(true);
  const contract = new ethers.Contract(tokenAddress, Token.abi, library.getSigner());
  contract
    .approve(spender, ethers.constants.MaxUint256)
    .then(async (res) => {
      const txUrl = getExplorerUrl(chainId) + "tx/" + res.hash;
      helperToast.success(
        <div>
          Approval submitted!{" "}
          <a style={{ color: "#f2c75c" }} href={txUrl} target="_blank" rel="noopener noreferrer">
            View status.
          </a>
          <br />
        </div>
      );
      if (onApproveSubmitted) {
        onApproveSubmitted();
      }
      if (getTokenInfo && infoTokens && pendingTxns && setPendingTxns) {
        const token = getTokenInfo(infoTokens, tokenAddress);
        const pendingTxn = {
          hash: res.hash,
          message: includeMessage ? `${token.symbol} Approved!` : false,
        };
        setPendingTxns([...pendingTxns, pendingTxn]);
      }
    })
    .catch((e) => {
      console.error(e);
      let failMsg;
      if (
        ["not enough funds for gas", "failed to execute call with revert code InsufficientGasFunds"].includes(
          e.data?.message
        )
      ) {
        failMsg = (
          <div>
            There is not enough tBNB in your account on Bsc to send this transaction.
            <br />
          </div>
        );
      } else if (e.message?.includes("User denied transaction signature")) {
        failMsg = "Approval was cancelled.";
      } else {
        failMsg = "Approval failed.";
      }
      helperToast.error(failMsg);
    })
    .finally(() => {
      setIsApproving(false);
    });
}

export const shouldRaiseGasError = (token, amount) => {
  if (!amount) {
    return false;
  }
  if (token.address !== AddressZero) {
    return false;
  }
  if (!token.balance) {
    return false;
  }
  if (amount.gte(token.balance)) {
    return true;
  }
  if (token.balance.sub(amount).lt(DUST_BNB)) {
    return true;
  }
  return false;
};

export const getTokenInfo = (infoTokens, tokenAddress, replaceNative, nativeTokenAddress) => {
  if (replaceNative && tokenAddress === nativeTokenAddress) {
    return infoTokens[AddressZero];
  }
  return infoTokens[tokenAddress];
};

const NETWORK_METADATA = {
  [opBNB]: {
    chainId: "0x" + opBNB.toString(16),
    chainName: "BSC",
    nativeCurrency: {
      name: "tBNB",
      symbol: "tBNB",
      decimals: 18,
    },
    rpcUrls: BSC_RPC_PROVIDERS,
    blockExplorerUrls: [getExplorerUrl(opBNB)],
  },
};

export const addNetwork = async (metadata) => {
  await window.ethereum.request({ method: "wallet_addEthereumChain", params: [metadata] }).catch();
};

export const switchNetwork = async (chainId, active) => {
  console.log("switchNetwork");
  if (!active) {
    // chainId in localStorage allows to switch network even if wallet is not connected
    // or there is no wallet at all
    localStorage.setItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY, chainId);
    document.location.reload();
    return;
  }

  try {
    const chainIdHex = "0x" + chainId.toString(16);
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    helperToast.success("Connected to " + getChainName(chainId));
    return getChainName(chainId);
  } catch (ex) {
    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
    // This error code indicates that the chain has not been added to MetaMask.
    // 4001 error means user has denied the request
    // If the error code is not 4001, then we need to add the network
    if (ex.code !== 4001) {
      return await addNetwork(NETWORK_METADATA[chainId]);
    }

    console.error("error", ex);
  }
};

export const getWalletConnectHandler = (activate, deactivate, setActivatingConnector) => {
  const fn = async () => {
    const walletConnect = getWalletConnectConnector();
    setActivatingConnector(walletConnect);
    activate(walletConnect, (ex) => {
      if (ex instanceof UnsupportedChainIdError) {
        helperToast.error("Unsupported chain. Switch to Bsc network on your wallet and try again");
        console.warn(ex);
      } else if (!(ex instanceof UserRejectedRequestErrorWalletConnect)) {
        helperToast.error(ex.message);
        console.warn(ex);
      }
      clearWalletConnectData();
      deactivate();
    });
  };
  return fn;
};

export const getInjectedHandler = (activate) => {
  const fn = async () => {
    activate(getInjectedConnector(), (e) => {
      const chainId = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY) || DEFAULT_CHAIN_ID;

      if (e instanceof UnsupportedChainIdError) {
        helperToast.error(
          <div>
            <div>Your wallet is not connected to {getChainName(chainId)}.</div>
            <br />
            <div className="clickable underline margin-bottom" onClick={() => switchNetwork(chainId, true)}>
              Switch to {getChainName(chainId)}
            </div>
            <div className="clickable underline" onClick={() => switchNetwork(chainId, true)}>
              Add {getChainName(chainId)}
            </div>
          </div>
        );
        return;
      }
      const errString = e.message ?? e.toString();
      helperToast.error(errString);
    });
  };
  return fn;
};

export function isMobileDevice(navigator) {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function setTokenUsingIndexPrices(token, indexPrices, nativeTokenAddress) {
  if (!indexPrices) {
    return;
  }

  const tokenAddress = token.isNative ? nativeTokenAddress : token.address;

  const indexPrice = indexPrices[tokenAddress];
  if (!indexPrice) {
    return;
  }

  const indexPriceBn = bigNumberify(indexPrice);
  if (indexPriceBn.eq(0)) {
    return;
  }

  const spread = token.maxPrice.sub(token.minPrice);
  const spreadBps = spread.mul(BASIS_POINTS_DIVISOR).div(token.maxPrice.add(token.minPrice).div(2));

  if (spreadBps.gt(MAX_PRICE_DEVIATION_BASIS_POINTS - 50)) {
    // only set one of the values as there will be a spread between the index price and the Chainlink price
    if (indexPriceBn.gt(token.minPrimaryPrice)) {
      token.maxPrice = indexPriceBn;
    } else {
      token.minPrice = indexPriceBn;
    }
    return;
  }

  const halfSpreadBps = spreadBps.div(2).toNumber();
  token.maxPrice = indexPriceBn.mul(BASIS_POINTS_DIVISOR + halfSpreadBps).div(BASIS_POINTS_DIVISOR);
  token.minPrice = indexPriceBn.mul(BASIS_POINTS_DIVISOR - halfSpreadBps).div(BASIS_POINTS_DIVISOR);
}

export function getInfoTokens(
  tokens,
  tokenBalances,
  whitelistedTokens,
  vaultTokenInfo,
  fundingRateInfo,
  vaultPropsLength,
  indexPrices,
  nativeTokenAddress
) {
  if (!vaultPropsLength) {
    vaultPropsLength = 15;
  }
  const fundingRatePropsLength = 2;
  const infoTokens = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = JSON.parse(JSON.stringify(tokens[i]));
    if (tokenBalances) {
      token.balance = tokenBalances[i];
    }
    if (token.address === USDG_ADDRESS) {
      token.minPrice = expandDecimals(1, USD_DECIMALS);
      token.maxPrice = expandDecimals(1, USD_DECIMALS);
    }
    infoTokens[token.address] = token;
  }

  for (let i = 0; i < whitelistedTokens.length; i++) {
    const token = JSON.parse(JSON.stringify(whitelistedTokens[i]));
    if (vaultTokenInfo) {
      token.poolAmount = vaultTokenInfo[i * vaultPropsLength];
      token.reservedAmount = vaultTokenInfo[i * vaultPropsLength + 1];
      token.availableAmount = token.poolAmount.sub(token.reservedAmount);
      token.usdgAmount = vaultTokenInfo[i * vaultPropsLength + 2];
      token.redemptionAmount = vaultTokenInfo[i * vaultPropsLength + 3];
      token.weight = vaultTokenInfo[i * vaultPropsLength + 4];
      token.bufferAmount = vaultTokenInfo[i * vaultPropsLength + 5];
      token.maxUsdgAmount = vaultTokenInfo[i * vaultPropsLength + 6];
      token.globalShortSize = vaultTokenInfo[i * vaultPropsLength + 7];
      token.maxGlobalShortSize = vaultTokenInfo[i * vaultPropsLength + 8];
      token.maxGlobalLongSize = vaultTokenInfo[i * vaultPropsLength + 9];
      token.minPrice = vaultTokenInfo[i * vaultPropsLength + 10];
      token.maxPrice = vaultTokenInfo[i * vaultPropsLength + 11];
      token.guaranteedUsd = vaultTokenInfo[i * vaultPropsLength + 12];
      token.maxPrimaryPrice = vaultTokenInfo[i * vaultPropsLength + 13];
      token.minPrimaryPrice = vaultTokenInfo[i * vaultPropsLength + 14];

      // save minPrice and maxPrice as setTokenUsingIndexPrices may override it
      token.contractMinPrice = token.minPrice;
      token.contractMaxPrice = token.maxPrice;

      token.maxAvailableShort = bigNumberify(0);
      token.hasMaxAvailableShort = false;
      if (token.maxGlobalShortSize.gt(0)) {
        token.hasMaxAvailableShort = true;
        if (token.maxGlobalShortSize.gt(token.globalShortSize)) {
          token.maxAvailableShort = token.maxGlobalShortSize.sub(token.globalShortSize);
        }
      }

      if (token.maxUsdgAmount.eq(0)) {
        token.maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
      }

      token.availableUsd = token.isStable
        ? token.poolAmount.mul(token.minPrice).div(expandDecimals(1, token.decimals))
        : token.availableAmount.mul(token.minPrice).div(expandDecimals(1, token.decimals));

      token.maxAvailableLong = bigNumberify(0);
      token.hasMaxAvailableLong = false;
      if (token.maxGlobalLongSize.gt(0)) {
        token.hasMaxAvailableLong = true;

        if (token.maxGlobalLongSize.gt(token.guaranteedUsd)) {
          const remainingLongSize = token.maxGlobalLongSize.sub(token.guaranteedUsd);
          token.maxAvailableLong = remainingLongSize.lt(token.availableUsd) ? remainingLongSize : token.availableUsd;
        }
      } else {
        token.maxAvailableLong = token.availableUsd;
      }

      token.maxLongCapacity =
        token.maxGlobalLongSize.gt(0) && token.maxGlobalLongSize.lt(token.availableUsd)
          ? token.maxGlobalLongSize
          : token.availableUsd;

      token.managedUsd = token.availableUsd.add(token.guaranteedUsd);
      token.managedAmount = token.managedUsd.mul(expandDecimals(1, token.decimals)).div(token.minPrice);

      //setTokenUsingIndexPrices(token, indexPrices, nativeTokenAddress);
    }

    if (fundingRateInfo) {
      token.fundingRate = fundingRateInfo[i * fundingRatePropsLength];
      token.cumulativeFundingRate = fundingRateInfo[i * fundingRatePropsLength + 1];
    }

    if (infoTokens[token.address]) {
      token.balance = infoTokens[token.address].balance;
    }

    infoTokens[token.address] = token;
  }

  return infoTokens;
}

export const CHART_PERIODS = {
  "5m": 60 * 5,
  "15m": 60 * 15,
  "1h": 60 * 60,
  "4h": 60 * 60 * 4,
  "1d": 60 * 60 * 24,
};

export function getTotalVolumeSum(volumes) {
  if (!volumes || volumes.length === 0) {
    return;
  }

  let volume = bigNumberify(0);
  for (let i = 0; i < volumes.length; i++) {
    volume = volume.add(volumes[i].data.volume);
  }

  return volume;
}

export function getBalanceAndSupplyData(balances) {
  if (!balances || balances.length === 0) {
    return {};
  }

  const keys = [ "gll"];
  const balanceData = {};
  const supplyData = {};
  const propsLength = 2;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    balanceData[key] = balances[i * propsLength];
    supplyData[key] = balances[i * propsLength + 1];
  }

  return { balanceData, supplyData };
}

export function getDepositBalanceData(depositBalances) {
  if (!depositBalances || depositBalances.length === 0) {
    return;
  }

  const keys = [
    "gllInStakedGll",
  ];
  const data = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = depositBalances[i];
  }

  return data;
}


export function getStakingData(stakingInfo) {
  if (!stakingInfo || stakingInfo.length === 0) {
    return;
  }

  const keys = ["feeGllTracker"];
  const data = {};
  const propsLength = 5;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = {
      claimable: stakingInfo[i * propsLength],
      tokensPerInterval: stakingInfo[i * propsLength + 1],
      averageStakedAmounts: stakingInfo[i * propsLength + 2],
      cumulativeRewards: stakingInfo[i * propsLength + 3],
      totalSupply: stakingInfo[i * propsLength + 4],
    };
  }

  return data;
}

export function getProcessedData(
  balanceData,
  supplyData,
  depositBalanceData,
  stakingData,
  aum,
  nativeTokenPrice,

) {
  if (
    !balanceData ||
    !supplyData ||
    !depositBalanceData ||
    !stakingData ||
    !aum ||
    !nativeTokenPrice
  ) {
    return {};
  }

  const data = {};



  data.gllSupply = supplyData.gll;
  data.gllPrice =
    data.gllSupply && data.gllSupply.gt(0)
      ? aum.mul(expandDecimals(1, GLL_DECIMALS)).div(data.gllSupply)
      : bigNumberify(0);

  data.gllSupplyUsd = supplyData.gll.mul(data.gllPrice).div(expandDecimals(1, 18));

  data.gllBalance = depositBalanceData.gllInStakedGll;
  data.gllBalanceUsd = depositBalanceData.gllInStakedGll.mul(data.gllPrice).div(expandDecimals(1, GLL_DECIMALS));

  data.feeGllTrackerRewards = stakingData.feeGllTracker.claimable;
  data.feeGllTrackerRewardsUsd = stakingData.feeGllTracker.claimable.mul(nativeTokenPrice).div(expandDecimals(1, 18));

  data.feeGllTrackerAnnualRewardsUsd = stakingData.feeGllTracker.tokensPerInterval
    .mul(SECONDS_PER_YEAR)
    .mul(nativeTokenPrice)
    .div(expandDecimals(1, 18));
  data.gllAprForNativeToken =
    data.gllSupplyUsd && data.gllSupplyUsd.gt(0)
      ? data.feeGllTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(data.gllSupplyUsd)
      : bigNumberify(0);
  data.gllAprTotal = data.gllAprForNativeToken;

  data.totalGllRewardsUsd = data.feeGllTrackerRewardsUsd;



  data.totalNativeTokenRewards = data.feeGllTrackerRewards;
  data.totalNativeTokenRewardsUsd = data.feeGllTrackerRewardsUsd;

  data.totalRewardsUsd = data.totalNativeTokenRewardsUsd;
  data.nativeTokenPrice = nativeTokenPrice;
  return data;
}

export async function addTokenToMetamask(token) {
  try {
    console.log("token");
    const wasAdded = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          image: token.imageUrl,
        },
      },
    });
    if (wasAdded) {
      // https://github.com/MetaMask/metamask-extension/issues/11377
      // We can show a toast message when the token is added to metamask but because of the bug we can't. Once the bug is fixed we can show a toast message.
    }
  } catch (error) {
    console.error(error);
  }
}

export function sleep(ms) {
  return new Promise((resolve) => resolve(), ms);
}

export function getPageTitle(data) {
  return `${data} | Grizzly.fi Trade - Perpetual trading exchange`;
}

export function isHashZero(value) {
  return value === ethers.constants.HashZero;
}
export function isAddressZero(value) {
  return value === ethers.constants.AddressZero;
}

export function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

export function isDevelopment() {
  return !window.location.host?.includes("perp.grizzly.fi") && !window.location.host?.includes("perp.grizzly.fi");
}

export function isLocal() {
  return window.location.host?.includes("localhost");
}

export function getHomeUrl() {
  return "https://trade.grizzly.fi/";
}

export function getRootShareApiUrl() {
  return "https://perp-share.grizzly.fi";
}

export function getTradePageUrl() {
  return "https://trade.grizzly.fi//#/trade";
}

export function tokenImage24(name) {
  let tokenImage = null;
  try {
    tokenImage = require("./img/ic_" + name + "_24svg");
  } catch (error) {
    tokenImage = require("./img/ic_matic_24.svg");
    console.error(error);
  }
  return tokenImage && tokenImage.default;
}

export function importImage(name) {
  let tokenImage = null;
  try {
    tokenImage = require("./img/" + name);
  } catch (error) {
    tokenImage = require("./img/ic_matic_40.svg");
    console.error(error);
  }
  return tokenImage && tokenImage.default;
}

export function getTwitterIntentURL(text, url = "", hashtag = "") {
  let finalURL = "https://twitter.com/intent/tweet?text=";
  if (text.length > 0) {
    finalURL += encodeURIComponent(text.replace(/[\r\n]+/g, " "))
      .replace(/\*%7C/g, "*|URL:")
      .replace(/%7C\*/g, "|*");

    if (hashtag.length > 0) {
      finalURL += "&hashtags=" + encodeURIComponent(hashtag.replace(/#/g, ""));
    }
    if (url.length > 0) {
      finalURL += "&url=" + encodeURIComponent(url);
    }
  }
  return finalURL;
}

export function isValidTimestamp(timestamp) {
  return new Date(timestamp).getTime() > 0;
}

export function getPositionForOrder(account, order, positionsMap) {
  const key = getPositionKey(account, order.collateralToken, order.indexToken, order.isLong);
  const position = positionsMap[key];
  return position && position.size && position.size.gt(0) ? position : null;
}

export function getOrderError(account, order, positionsMap, position) {
  if (order.type !== DECREASE) {
    return;
  }

  const positionForOrder = position ? position : getPositionForOrder(account, order, positionsMap);

  if (!positionForOrder) {
    return "No open position, order cannot be executed unless a position is opened";
  }
  if (positionForOrder.size.lt(order.sizeDelta)) {
    return "Order size is bigger than position, will only be executable if position increases";
  }

  if (positionForOrder.size.gt(order.sizeDelta)) {
    if (positionForOrder.size.sub(order.sizeDelta).lt(positionForOrder.collateral.sub(order.collateralDelta))) {
      return "Order cannot be executed as it would reduce the position's leverage below 1";
    }
    if (positionForOrder.size.sub(order.sizeDelta).lt(expandDecimals(5, USD_DECIMALS))) {
      return "Order cannot be executed as the remaining position would be smaller than $5.00";
    }
  }
}

export function arrayURLFetcher(...urlArr) {
  const fetcher = (url) => fetch(url).then((res) => res.json());
  return Promise.all(urlArr.map(fetcher));
}

export function shouldShowRedirectModal(timestamp) {
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  const expiryTime = timestamp + thirtyDays;
  return !isValidTimestamp(timestamp) || Date.now() > expiryTime;
}

export function today(){
  const now =  parseInt(new Date()/1000);
  return now - now%86400;
}


export function yesterday(){
  return today() - 86400;
}
