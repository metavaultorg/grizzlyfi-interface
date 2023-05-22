import cx from "classnames";
import "./Button.css";


export function ConnectWalletButton({ imgSrc, children, onClick, className }) {
  let classNames = "btn btn-yellow connect-wallet";
  return (
    <button className={classNames} onClick={onClick}>
      {children}
    </button>
  );
}
