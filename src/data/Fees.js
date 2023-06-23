const SECONDS_PER_WEEK = 604800;

const FEES = {
  56: []
};

export function getFeeHistory(chainId) {
  return FEES[chainId].concat([]).reverse();
}
