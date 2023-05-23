import React from 'react'
import './ItemCard.css'


export default function ItemCard({ icon, label, value, buttonEle,className }) {
    return (
        <div className={`item-card-container ${className}`}>
            <div className='left'>
                <div className='icon-container'>
                    <img src={icon} alt={label} />
                </div>
                <div className='content-container'>
                    <div style={{fontSize:14,fontWeight:600,opacity:0.6}}>{label}</div>
                    <div style={{fontSize:24,fontWeight:500}}>{value}</div>
                </div>
            </div>

                {buttonEle}

        </div>
    )
}
