import { Menu } from "@headlessui/react";
import { HiDotsHorizontal } from "react-icons/hi";
import "./PositionDropdown.css";
import IconEdit from "../../assets/icons/icon-edit.svg";
import IconTickNew from "../../assets/icons/icon-tick-new.svg";
import IconPlus from "../../assets/icons/icon-plus.svg";
import IconShare from "../../assets/icons/icon-share.svg";

function PositionDropdown({ handleEditCollateral, handleAddTrailingStop, handleShare, handleMarketSelect, hasTrailingStopOrder, position }) {
  return (
    <Menu>
      <Menu.Button as="div">
        <button className="PositionDropdown-dots-icon">
          <HiDotsHorizontal fontSize={16} fontWeight={400} />
        </button>
      </Menu.Button>
      <div className="PositionDropdown-extra-options">
        <Menu.Items as="div" className="menu-items">
          <Menu.Item>
            <div className="menu-item" onClick={handleEditCollateral}>
              <img src={IconEdit} alt="IconEdit"/>
              <p>Edit Collateral</p>
            </div>
          </Menu.Item>
          {!hasTrailingStopOrder && position.leverage &&
          <Menu.Item>
            <div className="menu-item" onClick={handleAddTrailingStop}>
              <img src={IconPlus} alt="IconPlus"/>
              <p>Add Trailing Stop</p>
            </div>
          </Menu.Item>
          }
          <Menu.Item>
            <div className="menu-item" onClick={handleMarketSelect}>
              <img src={IconTickNew} alt="IconTickNew"/>
              <p>Select Market</p>
            </div>
          </Menu.Item>
          <Menu.Item>
            <div className="menu-item" onClick={handleShare}>
              <img src={IconShare} alt="IconShare"/>
              <p style={{ border: "none" }}>Share Position</p>
            </div>
          </Menu.Item>
        </Menu.Items>
      </div>
    </Menu>
  );
}

export default PositionDropdown;
