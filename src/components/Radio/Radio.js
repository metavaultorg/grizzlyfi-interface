import React from "react";

import cx from "classnames";

import "./Radio.css";

export default function Radio(props) {
  const { options, option, setOption } = props;

  return (
    <div className="Radio">
      {options.map((opt) => (
        <div key={opt} className={cx("Radio-option", { active: opt === option })} onClick={() => setOption(opt)}>
          {opt}
          <div className="Radio-option-bubble">
            <div className="Radio-option-bubble-inner"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
