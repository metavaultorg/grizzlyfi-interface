import React from 'react'
import './Earn.css'
import "../Exchange/Exchange.css";
import ItemCard from '../../components/ItemCard/ItemCard'
import IconPercentage from '../../assets/icons/icon-percentage.svg'
import IconMoney from '../../assets/icons/icon-investments-money.svg'
import IconClaim from '../../assets/icons/icon-claim-reward.svg'
import { getImageUrl } from "../../cloudinary/getImageUrl";
const tokenPairMarketList = [
  { name: 'BTC', symbol: 'BTC', value: '$456', amount: '1.54', utilization: '34', weight: '1', target: '123', volumeUsd: '56' },
  { name: 'ETH', symbol: 'ETH', value: '$456', amount: '1.62', utilization: '34', weight: '1', target: '123', volumeUsd: '56' },
  { name: 'BNB', symbol: 'DAI', value: '$456', amount: '2.52', utilization: '34', weight: '1', target: '123', volumeUsd: '56' },
  { name: 'USDT', symbol: 'USDT', value: '$456', amount: '1.62', utilization: '34', weight: '1', target: '123', volumeUsd: '56' },
]
export default function Earn() {
  return (
    <div className="Earn Exchange page-layout">
      <div className="section-header" style={{maxWidth:1006,margin:'0 auto'}}>
        <h1>Grizzly Leverage Liquidity</h1>
        <p className="text-description" style={{ marginTop: 16, marginBottom: 48 }}>The Grizzly Leverage Liquidity tokens (GLL) is the counterparty to everyone trading with leverage. Deposit your favourite cryptocurrency and earn a solid yield which comes from the trading fees paid on Grizzly Trade. Earn like an exchange. </p>
      </div>
      <div className='Exchange-content'>
        <div className='Exchange-left'>
          <div className="earn-info flex" >
            <ItemCard className='earn-item-card ' label='APR' value={`$123`} icon={IconPercentage} />
            <ItemCard style={{minWidth:298}} className='earn-item-card ' label='Assets Under Management' value={`$123`} icon={IconMoney} />
            <ItemCard style={{ width:'-webkit-fill-available',minWidth:320}} className='earn-item-card ' label='Claimable Rewards' value='$92.21' icon={IconClaim} buttonEle={<button
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
        <div className="inner-card-title">GLL Statistics</div>
        <div className="">
          <table style={{ width: '100%', textAlign: 'left', borderSpacing: '0px 10px' }} cellspacing="0" cellpadding="0">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Amount</th>
                <th>Value</th>
                <th>Utilization</th>
                <th>Weight/Target</th>
              </tr>
            </thead>
            <tbody>
              {tokenPairMarketList.map((assetItem, index) => {
                var tokenImage = null;

                try {
                  tokenImage = getImageUrl({
                    path: `coins/others/${assetItem.symbol.toLowerCase()}-original`,
                  });
                } catch (error) {
                  console.error(error);
                }
                return (

                  <tr
                    key={index}
                    style={{ background:'rgba(255,255,255,0.05)'}}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: 'center', gap: 16 }}>
                        <img
                          style={{ objectFit: "contain" }}
                          src={tokenImage || tokenImage.default}
                          alt={assetItem.symbol}
                          width={32}
                          height={32}
                        />
                        <span>{assetItem.name}</span>
                      </div>
                    </td>
                    <td >{assetItem.amount}</td>
                    <td>{assetItem.value}</td>
                    <td>{assetItem.utilization}</td>
                    <td>{assetItem.weight}/{assetItem.target}</td>

                  </tr>


                )
              }

              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
