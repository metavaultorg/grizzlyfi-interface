import React from 'react'
import './ItemCard.css'


export default function ItemCard({ icon, label, value, buttonEle,className,style }) {
    return (
        <div className={`item-card-container ${className}`} style={style}>
            <div className='left'>
                <div className='icon-container'>
                    <img src={icon} alt='img' />
                </div>
                <div className='content-container'>
                    <div style={{fontSize:14,fontWeight:600,opacity:0.6}}>{label}</div>
                    <div className='font-number' style={{fontSize:24,fontWeight:500}}>{value}</div>
                </div>
            </div>

            {buttonEle}

        </div>
    )
}
