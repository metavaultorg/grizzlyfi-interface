import React from 'react'
import EarningsCard from './EarningsCard'
import { getImageUrl } from "../../cloudinary/getImageUrl";
import GHNYIcon from './icon-ghny-black.svg'
import ClaimButton from "../../components/ClaimButton/ClaimButton";

export default function Earnings() {
  return (
    <div className='Earings'>
      <div className='Earings-left'>
        <h3>Your Earnings</h3>
        <p>Claim your Rewards</p>
      </div>
      <div className='Earings-right'>
        <div className='cards'>
          <EarningsCard
            icon={getImageUrl({ path: `coins/bnb`, })}
            tokenName='BNB'
            tokenValue={0.42}
            UsdValue={421.03}
            action={<ClaimButton />}
          />
          <EarningsCard
            icon={GHNYIcon}
            tokenName='GHNY'
            tokenValue={212}
            UsdValue={442.02}
            action={<ClaimButton />}
          />
        </div>
        
        <button  className={"btn-secondary claim-all-btn"} style={{  height: 56, }} >
          Claim All
        </button >
      </div>
    </div>
  )
}
