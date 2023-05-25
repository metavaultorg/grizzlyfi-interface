import React from "react";

import cx from "classnames";

import "./Tab.css";
import {ACTIVE, INACTIVE} from "../../Helpers";


export default function Tab(props) {
  const { options, option, setOption, onChange, type = "block", className, optionLabels, icons, optionClassNames } = props;

  const onClick = (opt) => {
    if (setOption) {
      setOption(opt);
    }
    if (onChange) {
      onChange(opt);
    }
  };

  return (
    <div className={cx("Tab", type, className)}>
      {options.map((opt) => {
        const label = optionLabels && optionLabels[opt] ? optionLabels[opt] : opt;
        return (
          <div className={cx("Tab-option", "muted", { active: opt === option }, optionClassNames? optionClassNames[opt]:"")} onClick={() => onClick(opt)} key={opt}>
            {icons && icons[opt] && <img className="Tab-option-icon" src={(opt !== option && icons[opt+INACTIVE])? icons[opt+INACTIVE] : icons[opt]} alt={option} />}
            {label}
          </div>
        );
      })}
    </div>
  );
}
