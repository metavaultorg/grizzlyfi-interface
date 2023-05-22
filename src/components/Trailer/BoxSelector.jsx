import React, { useState } from "react";

import cx from "classnames";

import Radio from "../Radio/Radio";

export default function BoxSelector(props) {
    const { selectors, selected, setSelected } = props;

    return (
        <>
            <div className="box-select StopLoss-trailing-box Exchange-swap-section">
                {selectors.map(s =>
                    <div
                        key={s.value}
                        className={s.value === selected ? "active" : ""}
                        onClick={()=>setSelected(s.value)}
                    >
                        {s.text}
                    </div>
                )}
                <input
                    type="number"
                    min="0"
                    placeholder="Price"
                // value={triggerPriceValue}
                // onChange={onTriggerPriceChange}
                />
            </div>

        </>
    );
}