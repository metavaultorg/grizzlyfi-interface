import { useEffect, useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import cx from "classnames";
import BiCopy from "../../assets/icons/copyIcon.svg";
import RiFileDownloadLine from "../../assets/icons/downloadIcon.svg";
import FiTwitter from "../../assets/icons/twitterIcon.svg";
import { useCopyToClipboard } from "react-use";
import Modal from "../Modal/Modal";
import mvxLogo from "../../img/metavault_trade_logo.svg";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import "./PositionShare.css";
import { QRCodeSVG } from "qrcode.react";
import {
  formatAmount,
  getHomeUrl,
  getRootShareApiUrl,
  getTwitterIntentURL,
  helperToast,
  USD_DECIMALS,
} from "../../Helpers";
import { useAffiliateCodes } from "../../Api/referrals";
import SpinningLoader from "../Common/SpinningLoader";
import useLoadImage from "../../hooks/useLoadImage";
import shareBgImg from "../../assets/sharePositionBg.webp";

const ROOT_SHARE_URL = getRootShareApiUrl();
const UPLOAD_URL = ROOT_SHARE_URL + "/api/upload";
const UPLOAD_SHARE = ROOT_SHARE_URL + "/api/s";
const config = { quality: 0.95, canvasWidth: 681, canvasHeight: 346 };

function getShareURL(imageInfo, ref) {
  if (!imageInfo) return;
  let url = `${UPLOAD_SHARE}?id=${imageInfo.id}`;
  if (ref.success) {
    url = url + `&ref=${ref.code}`;
  }
  return url;
}

function PositionShare({ setIsPositionShareModalOpen, isPositionShareModalOpen, positionToShare, account, chainId }) {
  const userAffiliateCode = useAffiliateCodes(chainId, account);
  const [uploadedImageInfo, setUploadedImageInfo] = useState();
  const [uploadedImageError, setUploadedImageError] = useState();
  const [, copyToClipboard] = useCopyToClipboard();
  const sharePositionBgImg = useLoadImage(shareBgImg);
  const positionRef = useRef();
  const tweetLink = getTwitterIntentURL(
    `Latest $${positionToShare?.indexToken?.symbol} trade on @MetavaultTRADE`,
    getShareURL(uploadedImageInfo, userAffiliateCode)
  );

  console.log("tweetLink", tweetLink);

  useEffect(() => {
    (async function () {
      const element = positionRef.current;
      if (element && userAffiliateCode.success && sharePositionBgImg && positionToShare) {
        const image = await toJpeg(element, config);
        try {
          const imageInfo = await fetch(UPLOAD_URL, { method: "POST", body: image }).then((res) => res.json());
          setUploadedImageInfo(imageInfo);
        } catch {
          setUploadedImageInfo(null);
          setUploadedImageError("Image generation error, please refresh and try again.");
        }
      }
    })();
  }, [userAffiliateCode, sharePositionBgImg, positionToShare]);

  async function handleDownload() {
    const { indexToken, isLong } = positionToShare;
    const element = positionRef.current;
    if (!element) return;
    const dataUrl = await toJpeg(element, config);
    const link = document.createElement("a");
    link.download = `${indexToken.symbol}-${isLong ? "long" : "short"}.jpeg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
  }

  function handleCopy() {
    if (!uploadedImageInfo) return;
    const url = getShareURL(uploadedImageInfo, userAffiliateCode);
    copyToClipboard(url);
    helperToast.success("Link copied to clipboard.");
  }
  return (
    <Modal
      className="position-share-modal"
      isVisible={isPositionShareModalOpen}
      setIsVisible={setIsPositionShareModalOpen}
      label="Share Position"
    >
      <div style={{ padding: "10px" }} className="query-modal">
        <PositionShareCard
          userAffiliateCode={userAffiliateCode}
          positionRef={positionRef}
          position={positionToShare}
          chainId={chainId}
          account={account}
          uploadedImageInfo={uploadedImageInfo}
          uploadedImageError={uploadedImageError}
          sharePositionBgImg={sharePositionBgImg}
        />
        {uploadedImageError && <span className="error">{uploadedImageError}</span>}

        <div className="actions query-actions">
          <button
            style={{ display: "flex", gap: 15, alignItems: "center", justifyContent: "center" }}
            disabled={!uploadedImageInfo}
            className="mr-base App-button-option share"
            onClick={handleCopy}
          >
            <img src={BiCopy} alt="Copy" />
            Copy
          </button>
          <button
            style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 15 }}
            className="mr-base App-button-option share"
            onClick={handleDownload}
          >
            <img src={RiFileDownloadLine} alt="Download" />
            Download
          </button>
          <div className={cx("tweet-link-container", { disabled: !uploadedImageInfo })}>
            <a
              style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 15 }}
              target="_blank"
              className={cx("tweet-link App-button-option share", { disabled: !uploadedImageInfo })}
              rel="noreferrer"
              href={tweetLink}
            >
              <img src={FiTwitter} alt="Twitter" />
              Tweet
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PositionShareCard({
  positionRef,
  position,
  userAffiliateCode,
  uploadedImageInfo,
  uploadedImageError,
  sharePositionBgImg,
}) {
  const { code, success } = userAffiliateCode;
  const { deltaAfterFeesPercentageStr, isLong, leverage, indexToken, averagePrice, markPrice } = position;
  const homeURL = getHomeUrl();
  return (
    <div className="relative">
      <div
        ref={positionRef}
        className="position-share"
        style={{
          backgroundImage: `url(${sharePositionBgImg})`,
          backgroundSize: "cover",
          padding: 10,
          borderRadius: 10,
        }}
      >
        <div style={{ borderRadius: 15, padding: "25px 15.8px " }} className="bg-card--backdrop">
          <img
            width={131}
            height={43}
            className="logo"
            src={getImageUrl({
              path: "brandLogos/tradeLogoHorizontal",
              format: "png",
              width: 338,
              height: 112,
            })}
            alt="MVX Logo"
          />
          <div
            className="share-infos"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 25,
              paddingBottom: 25,
              borderBottom: "1px solid #EAEAEA26",
              flexWrap: "wrap",
            }}
          >
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                listStyle: "none",
                marginTop: 0,
              }}
              className="info"
            >
              <li className={`side${isLong}`}>{isLong ? "LONG" : "SHORT"}</li>
              <h3 style={{ fontSize: 38, fontWeight: 600, marginBottom: 0 }}>{deltaAfterFeesPercentageStr}</h3>
            </ul>
            <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
              <img
                width={40}
                height={40}
                src={getImageUrl({
                  path: `coins/others/${indexToken.symbol}-original`,
                })}
                alt=""
              />
              <div>
                <span style={{ margin: 0, fontSize: 28 }}>{indexToken.symbol} USD</span>
                <li style={{ listStyle: "none", fontSize: 38, lineHeight: "45px", fontWeight: 600 }}>
                  {formatAmount(leverage, 4, 2, true)}x&nbsp;
                </li>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 10,
              marginTop: "1.5rem",
            }}
          >
            <div
              style={{
                background: "rgba(118, 118, 128, 0.24)",
                borderRadius: 15,
                textAlign: "center",
                padding: "15px 30px",
              }}
            >
              <p style={{ margin: 0 }}>Entry Price</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                ${formatAmount(averagePrice, USD_DECIMALS, indexToken.displayDecimals, true)}
              </p>
            </div>
            <div
              style={{
                background: "rgba(118, 118, 128, 0.24)",
                borderRadius: 15,
                textAlign: "center",
                padding: "15px 30px",
              }}
            >
              <p style={{ margin: 0 }}>Market Price</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600 }} className="">
                ${formatAmount(markPrice, USD_DECIMALS, indexToken.displayDecimals, true)}
              </p>
            </div>
            <div
              style={{
                background: "rgba(118, 118, 128, 0.24)",
                borderRadius: 15,
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "15px 30px",
                gap: 10,
              }}
              className=""
            >
              <div>
                <QRCodeSVG size={50} value={success ? `${homeURL}/#/?ref=${code}` : `${homeURL}`} />
              </div>
              <div>
                {success ? (
                  <>
                    <p style={{ margin: 0 }} className="">
                      Referral Code
                    </p>
                    <p style={{ margin: 0, fontWeight: 600 }}>{code}</p>
                  </>
                ) : (
                  <p className="">https://app.metavault.trade</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!uploadedImageInfo && !uploadedImageError && (
        <div style={{ zIndex: 100000 }} className="image-overlay-wrapper">
          <div className="image-overlay">
            <SpinningLoader />
            <p className="loading-text">Generating shareable image...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionShare;
