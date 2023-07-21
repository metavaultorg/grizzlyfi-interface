import React, { useState } from 'react'
import { getTokenBySymbol } from '../../data/Tokens';
import RewardRouter from "../../abis/RewardRouter.json";
import useWeb3Onboard from '../../hooks/useWeb3Onboard';
import { ethers } from 'ethers';
import { callContract } from '../../Api';
import { getContract, opBNB } from '../../config/contracts';

export default function ClaimButtonOpBNB({ className = "" }) {
    const { active, library, account, chainId } = useWeb3Onboard();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    if(chainId !== opBNB){
        return <></>
    }

    function claim() {
        const rewardRouterAddress = getContract(chainId, "RewardRouter");
        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        setIsSubmitting(true);
        callContract(chainId, contract, "handleRewards", [true, true, false], {
            sentMsg: "Claiming...",
            failMsg: "Claim failed.",
            successMsg: `Claim Succeed!`,
        })
            .then(async () => { })
            .catch((error) => {
                console.log(error);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    return (
        <button disabled={isSubmitting || !active} className={className || "btn-secondary"} style={{ width: 75, height: 32 }} onClick={claim}>
            Claim
        </button >
    )
}
