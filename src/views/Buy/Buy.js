import React, { useEffect } from "react";
import Footer from "../../Footer";
import "./Buy.css";
import TokenCard from "../../components/TokenCard/TokenCard";

import SEO from "../../components/Common/SEO";
import { getPageTitle } from "../../Helpers";
import { getImageUrl } from "../../cloudinary/getImageUrl";

export default function BuyMVXMVLP(props) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <SEO title={getPageTitle("+ LIQ. or MVX")}>
      <div className="BuyMVXMVLP page-layout">
        <div style={{ marginTop: 46 }} className="BuyMVXMVLP-container default-container buypage-container-pd">
          <div className="section-title-block2">
            <div className="section-title-icon">
              <img
                width={116}
                height={116}
                src={getImageUrl({
                  path: "app.metavault.trade/earn-icon",
                  format: "png",
                  width: 116,
                  height: 116,
                })}
                alt=""
              />
            </div>
            <div className="section-title-content">
              <div className="Page-title">Buy</div>
              <div className="Page-description">MVX or MVLP</div>
            </div>
          </div>
          <TokenCard />
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
