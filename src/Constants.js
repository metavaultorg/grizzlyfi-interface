import { ethers } from "ethers";

import { opBNB } from "./Helpers";

const { parseEther } = ethers.utils;

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
