import React from 'react'
import './ItemCard.css'


export default function ItemCard({ icon, label, value, buttonEle }) {
    return (
        <div className='item-card-container'>
            <div className='left'>
                <div className='icon-container'>
                    {icon}
                </div>
                <div className='content-container'>
                    <div>{label}</div>
                    <div>{value}</div>
                </div>
            </div>

                {buttonEle}

        </div>
    )
}
