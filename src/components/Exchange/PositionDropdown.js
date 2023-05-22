import { Menu } from "@headlessui/react";
import { HiDotsVertical } from "react-icons/hi";
import { AiOutlineEdit, AiOutlinePlus } from "react-icons/ai";
import { BiSelectMultiple } from "react-icons/bi";
import { RiShareBoxFill } from "react-icons/ri";
import "./PositionDropdown.css";

function PositionDropdown({ handleEditCollateral, handleAddTrailingStop, handleShare, handleMarketSelect, hasTrailingStopOrder, position }) {
  return (
    <Menu>
      <Menu.Button as="div">
        <button className="PositionDropdown-dots-icon">
          <HiDotsVertical fontSize={20} fontWeight={700} />
        </button>
      </Menu.Button>
      <div className="PositionDropdown-extra-options">
        <Menu.Items as="div" className="menu-items">
          <Menu.Item>
            <div className="menu-item" onClick={handleEditCollateral}>
              <AiOutlineEdit fontSize={16} />
              <p>Edit Collateral</p>
            </div>
          </Menu.Item>
          {!hasTrailingStopOrder && position.leverage &&
          <Menu.Item>
            <div className="menu-item" onClick={handleAddTrailingStop}>
              <AiOutlinePlus fontSize={16} />
              <p>Add Trailing Stop</p>
            </div>
          </Menu.Item>
          }
          <Menu.Item>
            <div className="menu-item" onClick={handleMarketSelect}>
              <BiSelectMultiple fontSize={16} />
              <p>Select Market</p>
            </div>
          </Menu.Item>
          <Menu.Item>
            <div className="menu-item" onClick={handleShare}>
              <RiShareBoxFill fontSize={16} />
              <p style={{ border: "none" }}>Share Position</p>
            </div>
          </Menu.Item>
        </Menu.Items>
      </div>
    </Menu>
  );
}

export default PositionDropdown;
