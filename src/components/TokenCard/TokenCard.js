import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import mvxBigIcon from "../../assets/icons/mvxCoinWithStars.png";
import mvlpBigIcon from "../../assets/icons/mvlpCoin.png";
import mvdBigIcon from "../../assets/icons/mvdCoin.png";
import RightArr from "../../assets/icons/RightArr";
import buyPolygonIcon from "../../assets/icons/buyOnPolygon.svg";
import CamelotLogo from "../../assets/icons/camelot.svg";

import { POLYGON, switchNetwork, useChainId } from "../../Helpers";

import { useWeb3React } from "@web3-react/core";

import APRLabel from "../APRLabel/APRLabel";
import { MvdService } from "@metavault/sdk";
import { getImageUrl } from "../../cloudinary/getImageUrl";

import "./TokenCard.css"

export default function TokenCard() {
  const { chainId } = useChainId();
  const { active } = useWeb3React();
  const [mvdApr, setMvdApr] = useState("...");

  MvdService.getApr().then(setMvdApr);

  const changeNetwork = useCallback(
    (network) => {
      if (network === chainId) {
        return;
      }
      if (!active) {
        setTimeout(() => {
          return switchNetwork(network, active);
        }, 500);
      } else {
        return switchNetwork(network, active);
      }
    },
    [chainId, active]
  );

  return (
    <div className="Home-token-card-options mb-180 ">
      <div className="Home-token-card-option borderradius token-card-flex ">
        <div style={{ display: "flex", flexDirection: "column" }} className="">
          <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
            <img
              style={{ width: 100, height: 100, marginRight: 15 }}
              src={getImageUrl({
                path: "coins/mvx-original",
                format: "png",
                width: 246,
                height: 246,
              })}
              alt="mvxBigIcon"
            />{" "}
            <span className="text-bigger">MVX</span>
          </div>
          <div>
            <p className="token-card-paragraph">
              The utility and governance token is called MVX. Acquires 30% of the earnings the platform generates.
            </p>
          </div>
        </div>
        <div className="Home-token-card-option-info">
          <div style={{ fontSize: 17, lineHeight: "28px", fontWeight: 600 }} className="Home-token-card-option-apr">
            <p style={{ opacity: "80%" }} className="token-apr">
              Polygon APR: <APRLabel chainId={POLYGON} label="mvxAprTotal" />
            </p>
            <div className="Home-token-card-option-action flexible-card">
              <div style={{ width: "100%" }} className="buy">
                <Link to="/buy_mvx" className="buy-polygon purple-hover" onClick={() => changeNetwork(POLYGON)}>
                  {/* Buy on <img height={40} src={buyPolygonIcon} alt="Buy on Polygon" /> */}
                  Buy MVX
                </Link>
              </div>
              <a
                href="https://docs.metavault.trade/tokenomics"
                target="_blank"
                rel="noreferrer"
                className="btn-read-more"
              >
                Read More <RightArr />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="Home-token-card-option borderradius token-card-flex ">
        <div style={{ display: "flex", flexDirection: "column" }} className="">
          <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
            <img
              style={{ width: 100, height: 100, marginRight: 15 }}
              src={getImageUrl({
                path: "coins/mvlp-original",
                format: "png",
              })}
              alt="mvxBigIcon"
            />{" "}
            <span className="text-bigger">MVLP</span>
          </div>
          <div>
            <p className="token-card-paragraph">
              The platform's liquidity token, MVLP, receives 70% of the fees collected.
            </p>
          </div>
        </div>
        <div className="Home-token-card-option-info">
          <div style={{ fontSize: 17, lineHeight: "28px", fontWeight: 600 }} className="Home-token-card-option-apr">
            <p style={{ opacity: "80%" }} className="token-apr">
            Polygon APR: <APRLabel chainId={POLYGON} label="mvlpAprTotal" key="POLYGON" />
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 30 }}
              className="Home-token-card-option-action card-flex-2"
            >
              <div className="card-flex">
                <Link
                  style={{ background: "#ffaa27", color: "#000" }}
                  to="/buy_mvlp"
                  className="buy-polygon2 basis-212"
                  onClick={() => changeNetwork(POLYGON)}
                >
                  + LIQ.
                </Link>
                <Link
                  style={{
                    background: "#625df5",
                  }}
                  to="/buy_mvlp#redeem"
                  className="buy-polygon basis-76 purple-hover"
                  onClick={() => changeNetwork(POLYGON)}
                >
                  - LIQ.
                </Link>
              </div>

              <a href="https://docs.metavault.trade/mvlp" target="_blank" rel="noreferrer" className="btn-read-more">
                Read More <RightArr />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="Home-token-card-option borderradius token-card-flex ">
        <div style={{ display: "flex", flexDirection: "column" }} className="">
          <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
            <img
              style={{ width: 100, height: 100, marginRight: 15 }}
              src={getImageUrl({
                path: "coins/mvd-original",
                format: "png",
              })}
              alt="mvdBigIcon"
            />{" "}
            <span className="text-bigger">MVD</span>
          </div>
          <div>
            <p className="token-card-paragraph">Our DAO-Ecosystem Token</p>
          </div>
        </div>
        <div className="Home-token-card-option-info">
          <div style={{ fontSize: 17, lineHeight: "28px", fontWeight: 600 }} className="Home-token-card-option-apr">
            <p style={{ opacity: "80%" }} className="token-apr">
              Arbitrum APR: {mvdApr}%
            </p>
            <div className="Home-token-card-option-action flexible-card">
              <div style={{ width: "100%" }} className="buy ">
                <a
                  href="https://app.camelot.exchange/?token2=0x15a808ed3846d25e88ae868de79f1bcb1ac382b5"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                  className="buy-polygon purple-hover"
                >
                  BUY on Camelot <img height={20} src={CamelotLogo} alt="Buy on Camelot" />
                </a>
              </div>
              <a
                href="https://docs.metavault.org/about-metavault/tokens#mvd"
                target="_blank"
                rel="noreferrer"
                className="btn-read-more"
              >
                Read More <RightArr />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
