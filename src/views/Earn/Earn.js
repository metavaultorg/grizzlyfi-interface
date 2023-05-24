import React from 'react'
import './Earn.css'
import "../Exchange/Exchange.css";
import ItemCard from '../../components/ItemCard/ItemCard'
import IconPercentage from '../../assets/icons/icon-percentage.svg'
import IconMoney from '../../assets/icons/icon-investments-money.svg'
import IconClaim from '../../assets/icons/icon-claim-reward.svg'

export default function Earn() {
  return (
    <div className="Earn Exchange page-layout">
      <div className="section-header" style={{maxWidth:1006,margin:'0 auto'}}>
        <h1>Grizzly Leverage Liquidity</h1>
        <p className="text-description" style={{ marginTop: 16, marginBottom: 48 }}>The Grizzly Leverage Liquidity tokens (GLL) is the counterparty to everyone trading with leverage. Deposit your favourite cryptocurrency and earn a solid yield which comes from the trading fees paid on Grizzly Trade. Earn like an exchange. </p>
      </div>
      <div className='Exchange-content'>
        <div className='Exchange-left'>
          <div className="grid-cols-7" style={{ margin: '40px 200px' }}>
            <ItemCard className='col-span-2' label='Total PnL' value={`$123`} icon={IconPercentage} />
            <ItemCard className='col-span-2' label='Your GLL deposit' value={`$123`} icon={IconMoney} />
            <ItemCard className='col-span-3' label='Claimable' value='$92.21' icon={IconClaim} buttonEle={<button
              className="btn-secondary "
              style={{ width: 75, height: 32 }}
            >
              Claim
            </button>}
            />
          </div>
        </div>
        <div className='Exchange-right'>
          <div className='Exchange-swap-box'>1231312313</div>
        </div>
      </div>
      <div className='earn-statistics'>

      </div>
    </div>
  )
}
