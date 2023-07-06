import React from "react";
import useSWR from "swr";

import { getContract } from "../../Addresses";
import { USD_DECIMALS, fetcher, formatAmount, useChainId } from "../../Helpers";
import GllManager from "../../abis/GllManager.json";
import useWeb3Onboard from "../../hooks/useWeb3Onboard";

export default function AUMLabel() {
  const { active, library } = useWeb3Onboard();
  const { chainId } = useChainId();

  const gllManagerAddress = getContract(chainId, "GllManager");

  const { data: aums } = useSWR([`Dashboard:getAums:${active}`, chainId, gllManagerAddress, "getAums"], {
    fetcher: fetcher(library, GllManager),
  });

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  return <>{`$${formatAmount(aum, USD_DECIMALS, 0, true)}`}</>;
}
