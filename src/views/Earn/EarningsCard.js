import React from 'react'

export default function EarningsCard({icon,tokenName,tokenValue,UsdValue,action}) {
  return (
    <div className='EarningsCard'>
      <div>
        <img src={icon} width={40} />
        <div className='tokenName'>{tokenName}</div>
      </div>
      <div>
        <div>
          <div className='tokenValue'>{tokenValue}</div>
          <div className='usdValue'>~${UsdValue}</div>
        </div>
        <div className='action'>
          {action}
        </div>
      </div>
    </div>
  )
}
