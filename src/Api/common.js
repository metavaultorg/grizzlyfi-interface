import { ApolloClient, InMemoryCache } from "@apollo/client";

export const priceGraphClient = createClient(process.env.REACT_APP_PRICE_SUBGRAPH);

export const coreGraphClient = createClient(process.env.REACT_APP_GRIZZLYFI_CORE_SUBGRAPH);

// All Positions
export const positionsGraphClient = createClient(process.env.REACT_APP_GRIZZLYFI_POSITIONS_SUBGRAPH);

export const referralsGraphClient = createClient(process.env.REACT_APP_GRIZZLYFI_REFERRAL_SUBGRAPH);


function createClient(uri) {
  return new ApolloClient({
    uri,
    cache: new InMemoryCache(),
  });
}
