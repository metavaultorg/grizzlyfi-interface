import { BSC, opBNB } from "../config/contracts";

const SECONDS_PER_WEEK = 604800;

const FEES = {
  [opBNB]: [],
  [BSC]: []
};

export function getFeeHistory(chainId) {
  return FEES[chainId].concat([]).reverse();
}
