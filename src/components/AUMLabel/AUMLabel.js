import React, {  } from "react";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";

import {
    fetcher,
    formatAmount,
    useChainId,
    USD_DECIMALS,
} from "../../Helpers";
import { getContract } from "../../Addresses";
import GllManager from "../../abis/GllManager.json";

export default function AUMLabel() {
    const { active, library } = useWeb3React();
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