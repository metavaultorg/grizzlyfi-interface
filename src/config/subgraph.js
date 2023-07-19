import { ApolloClient, InMemoryCache } from "@apollo/client";
import { opBNB, BSC, isSupportedChain } from "./chains";

const priceGraphClient = {
  [opBNB]: createClient(process.env.REACT_APP_OPBNB_PRICE_SUBGRAPH),
  [BSC]: createClient(process.env.REACT_APP_BSC_PRICE_SUBGRAPH),
};

const coreGraphClient = {
  [opBNB]: createClient(process.env.REACT_APP_OPBNB_CORE_SUBGRAPH),
  [BSC]: createClient(process.env.REACT_APP_BSC_CORE_SUBGRAPH),
};

const positionsGraphClient = {
  [opBNB]: createClient(process.env.REACT_APP_OPBNB_POSITIONS_SUBGRAPH),
  [BSC]: createClient(process.env.REACT_APP_BSC_POSITIONS_SUBGRAPH),
};

const referralsGraphClient = {
  [opBNB]: createClient(process.env.REACT_APP_OPBNB_REFERRAL_SUBGRAPH),
  [BSC]: createClient(process.env.REACT_APP_BSC_REFERRAL_SUBGRAPH),
};

export function getPriceGraphClient(chainId) {
  if (isSupportedChain(chainId)) {
    return priceGraphClient[chainId];
  }
  throw new Error(`Unsupported chain ${chainId}`);
}
export function getCoreGraphClient(chainId) {
  if (isSupportedChain(chainId)) {
    return coreGraphClient[chainId];
  }
  throw new Error(`Unsupported chain ${chainId}`);
}

export function getPositionsGraphClient(chainId) {
  if (isSupportedChain(chainId)) {
    return positionsGraphClient[chainId];
  }
  throw new Error(`Unsupported chain ${chainId}`);
}

export function getReferralsGraphClient(chainId) {
  if (isSupportedChain(chainId)) {
    return referralsGraphClient[chainId];
  }  
  throw new Error(`Unsupported chain ${chainId}`);
}


function createClient(uri) {
  return new ApolloClient({
    uri,
    cache: new InMemoryCache(),
  });
}