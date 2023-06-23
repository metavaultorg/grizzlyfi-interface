import { ethers } from "ethers";

import { BSC } from "./Helpers";

const { parseEther } = ethers.utils;

const constants = {
  [BSC]: {
    nativeTokenSymbol: "BNB",
    wrappedTokenSymbol: "WBNB",
    defaultCollateralSymbol: "USDC",
    defaultFlagOrdersEnabled: true,
    positionReaderPropsLength: 9,
    v2: true,

    SWAP_ORDER_EXECUTION_GAS_FEE: parseEther("0.5"),
    INCREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.5"),
    // contract requires that execution fee be strictly greater than instead of gte
    DECREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.55"),
    TRAILING_STOP_EXECUTION_GAS_FEE: parseEther("1"),
  },
};

export const getConstant = (chainId, key) => {
  if (!constants[chainId]) {
    throw new Error(`Unsupported chainId ${chainId}`);
  }
  if (!(key in constants[chainId])) {
    throw new Error(`Key ${key} does not exist for chainId ${chainId}`);
  }
  return constants[chainId][key];
};
