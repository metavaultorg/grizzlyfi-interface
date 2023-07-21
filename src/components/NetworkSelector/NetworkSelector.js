import React, { useState, useEffect } from "react";
import cx from "classnames";

import Modal from "../Modal/Modal";

import "./NetworkSelector.css";

import selectorDropdowns from "../../img/ic_selector_dropdowns.svg";
import tick from "../../img/NetworkSelectedTick.svg";

import Select, { components } from "react-select";
import { find } from "lodash";
import { useLockBodyScroll } from "react-use";

export default function NetworkSelector(props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { small, options, label, modalLabel, className, showCaret = true } = props;
  const [selectedNetwork, setSelectedNetwork] = useState(label);
  const [networkChanged, setNetworkChanged] = useState(false);

  useEffect(() => {
    setSelectedNetwork(label);
  }, [label, networkChanged]);

  useLockBodyScroll(isModalVisible);

  function renderOption(option) {
    var optionIcon = require("../../img/" + option.icon);
    return (
      <div className={cx("Selector-option", option.network, { disabled: option.disabled })} onClick={() => onSelect(option)} key={option.value}>
        <img src={optionIcon.default} alt={option.icon} className="Selector-option_icon" />
        <span className="Selector-option_label">{option.label}</span>
        {selectedNetwork === option.network && <div className="selected-icon"></div>}
      </div>
    );
  }

  const onSelect = async (token) => {
    if (token.disabled) return;
    setIsModalVisible(false);
    props.showModal(false);
    let network;
    try {
      network = await props.onSelect(token);
      setSelectedNetwork(network);
    } catch (error) {
      console.error(error);
    }
    setNetworkChanged(true);
  };

  const DropdownIndicator = (props) => {
    return (
      <components.DropdownIndicator {...props}>
        <img src={selectorDropdowns} alt="selectorDropdowns" />
      </components.DropdownIndicator>
    );
  };
  function Option(props) {
    let className = cx(props.className, props.data.label.toLowerCase());
    props = { ...props, className };
    return <components.Option {...props} />;
  }
  function IndicatorsContainer(props) {
    return (
      <components.IndicatorsContainer {...props}>
        <img src={selectorDropdowns} alt="" />
      </components.IndicatorsContainer>
    );
  }

  function SingleValue({ data, ...props }) {
    let icon = require("../../img/" + data.icon);
    return (
      <components.SingleValue {...props}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={icon} alt={data.label} width={28} className="network-icon" />
          {/* <span style={{ marginLeft: 5 }} className="network-label">
            {data.label}
          </span> */}
        </div>
      </components.SingleValue>
    );
  }

  const customStyles = {
    option: (provided, state) => {
      const backgroundColor = "#333";
      return {
        ...provided,
        ":active": {
          backgroundColor: "rgba(255, 255, 255, 0.15)"
        },
        margin: 0,
        cursor: "pointer",
        backgroundColor,
        color: "#fff",
        // height: 36,
        padding: 16,
      };
    },
    control: (provided, state) => {
      return {
        width: 72,
        height: 52,
        cursor: "pointer",
        fontSize: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flow: 0,
        gap: "8px",
        "@media (max-width: 1300px)": {
          width: 60,
          height: 36,
          padding: "5px",
          gap: "3px"
        },
      };
    },
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: () => ({
      padding: 0,
      flow: 0
    }),
    menu: (provided, state) => {
      return {
        ...provided,
        // background: "rgba(2, 2, 15, 1)",
        border: "1px solid #3f3f3f",
        background: "#333",
        // boxShadow: "0px 5px 12px #00000052",
        borderRadius: "22px",
        fontSize: "16px",
        width: "248px",
        right: '0'
      }
    },
    menuList: (provided) => ({
      // border: "1px solid rgba(255, 255, 255, 0.16)",
      borderRadius: "22px",
      background: "#333",
      overflow: 'hidden',
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: "white",
      margin: 0,
      fontSize: "16px",
      borderRadius: "16px",
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      paddingRight: 0,
      flex: "none",
      padding: 0
    }),
  };

  const toggleModal = function (val) {
    setIsModalVisible(true);
    props.showModal(true);
  };

  var value = find(options, (o) => {
    return o.network === selectedNetwork;
  });

  value = value || options[0];

  return (
    <div className={cx("Selector", className)}>
      {isModalVisible && (
        <div>
          <Modal className="selector-modal" isVisible={isModalVisible} setIsVisible={toggleModal} label={modalLabel}>
            <div className="Selector-options">{options.map(renderOption)}</div>
          </Modal>
        </div>
      )}
      <Select
        value={value}
        options={options}
        components={{
          DropdownIndicator,
          SingleValue,
          Option,
          IndicatorsContainer,
        }}
        classNamePrefix="react-select"
        onChange={onSelect}
        isSearchable={false}
        className={"network-select"}
        styles={customStyles}
        getOptionLabel={(e) => {
          var optionIcon = require("../../img/" + e.icon);
          return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", }}>
              <div style={{ display: "flex", alignItems: "center",}}>
                <img src={optionIcon} alt={e.icon} className="network-icon" />
                <span className={cx("network-label", { disabled: e.disabled })}>
                  {e.label}
                </span>
              </div>
              {selectedNetwork === e.network && (
                <img src={tick} alt="Selected" style={{ marginLeft: 5 }}></img>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
