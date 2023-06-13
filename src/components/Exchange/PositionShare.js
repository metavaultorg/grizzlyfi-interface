import { useEffect, useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import cx from "classnames";
import BiCopy from "../../assets/icons/copyIcon.svg";
import RiFileDownloadLine from "../../assets/icons/downloadIcon.svg";
import FiTwitter from "../../assets/icons/twitterIcon.svg";
import { useCopyToClipboard } from "react-use";
import Modal from "../Modal/Modal";
import Logo from '../../assets/logos/Logo.jsx'
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
import IconNext from '../../assets/icons/icon-next-left.svg';
import longImg from "../../assets/icons/icon-long.svg";
import shortImg from "../../assets/icons/icon-short.svg";
import { MdClose } from "react-icons/md";

const ROOT_SHARE_URL = getRootShareApiUrl();
const UPLOAD_URL = ROOT_SHARE_URL + "/api/upload";
const UPLOAD_SHARE = ROOT_SHARE_URL + "/api/s";
const config = { quality: 0.95, canvasWidth: 800, canvasHeight: 400, backgroundColor: '#444c56' };

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
  const [onCopy, setOnCopy] = useState(false);
  const [onTweet, setOnTweet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();
  const positionRef = useRef();


  useEffect(() => {
    if (!uploadedImageInfo) return;
    if (onCopy) {
      handleCopy(false);
      setOnCopy(false);
    }
    if (onTweet) {
      handleTweet();
      setOnTweet(false);
    }
  }, [uploadedImageInfo, onCopy, onTweet]);

  const uploadToServer = async () => {
    const element = positionRef.current;
    if (element && userAffiliateCode.success && positionToShare) {
      const image = await toJpeg(element, config);
      setLoading(true);
      try {
        const imageInfo = await fetch(UPLOAD_URL, { method: "POST", body: image }).then((res) => res.json());
        setUploadedImageInfo(imageInfo);
      } catch {
        setUploadedImageInfo(null);
        setUploadedImageError("Image generation error, please refresh and try again.");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleDownload() {
    const { indexToken, isLong } = positionToShare;
    const element = positionRef.current;
    if (!positionRef.current) return;
    config['backgroundColor'] = '#444c56';
    const dataUrl = await toJpeg(element, config);
    const link = document.createElement("a");
    link.download = `${indexToken.symbol}-${isLong ? "long" : "short"}.jpeg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
  }

  function handleCopy(init = true) {
    if (loading) {
      return;
    }
    if (!uploadedImageInfo && init) {
      setOnCopy(true);
      uploadToServer();
      return;
    }
    if (!uploadedImageInfo && !init) {
      helperToast.error("Image generation error, please try again.");
    }
    const url = getShareURL(uploadedImageInfo, userAffiliateCode);
    copyToClipboard(url);
    helperToast.success("Link copied to clipboard.");
  }

  const handleTweet = async (init = true) => {
    if (loading) return;
    if (!uploadedImageInfo && init) {
      setOnTweet(true);
      uploadToServer();
      return;
    }
    if (!uploadedImageInfo && !init) {
      helperToast.error("Image generation error, please try again.");
      return;
    }

    const tweetLink = getTwitterIntentURL(
      `Latest $${positionToShare?.indexToken?.symbol} trade on @GrizzlyTRADE`,
      getShareURL(uploadedImageInfo, userAffiliateCode)
    );

    console.log("tweetLink", tweetLink);

    window.open(tweetLink, '_blank', 'noreferrer');
  }
  return (
    <Modal
      className="position-share-modal"
      isVisible={isPositionShareModalOpen}
      setIsVisible={setIsPositionShareModalOpen}
    >
      <div className="Modal-close-button" onClick={() => setIsPositionShareModalOpen(false)}>
        <MdClose fontSize={28} className="Modal-close-icon" />
      </div>
      <div className="share-modal section-share">
        <PositionShareCard
          userAffiliateCode={userAffiliateCode}
          positionRef={positionRef}
          position={positionToShare}
          chainId={chainId}
          account={account}
          uploadedImageInfo={uploadedImageInfo}
          uploadedImageError={uploadedImageError}
        />
        <div style={{ position: "relative" }}>
          <div className="share-dividing-line" />
          {loading && <div style={{ zIndex: 100000 }} className="image-overlay-wrapper">
            <div className="image-overlay">
              <SpinningLoader />
              <p className="loading-text">Generating shareable image...</p>
            </div>
          </div>}
        </div>
        <div className="actions share-actions">
          <button
            disabled={loading}
            className="mr-base share-action"
            onClick={handleCopy}
          >
            <img src={BiCopy} alt="Copy" />
            <span>Copy</span>
          </button>
          <button
            className="mr-base share-action"
            onClick={handleDownload}
          >
            <img src={RiFileDownloadLine} alt="Download" />
            <span>Download</span>
          </button>
          <button
            disabled={loading}
            className="mr-base share-action"
            onClick={handleTweet}
          >
            <img src={FiTwitter} alt="Twitter" />
            <span>Tweet</span>
          </button>
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
}) {
  const { code, success } = userAffiliateCode;
  const { deltaAfterFeesPercentageStr, isLong, leverage, indexToken, averagePrice, markPrice } = position;

  const homeURL = getHomeUrl();
  return (
    <div className="relative" >
      <div
        ref={positionRef}
        className="position-share"
      >
        <div className="bg-card--backdrop">
          <div className="logo">
            <Logo />
            <div className="logo-text">FUTURES</div>
          </div>
          <div className="share-infos" >
            <div className="share-token-infos">
              <div className="share-token">
                <img width={48} height={48}
                  src={getImageUrl({
                    path: `coins/${indexToken.symbol}`,
                  })} alt=""
                />
                <div>{indexToken.symbol}</div>
              </div>
              <div className={`share-token-long side${isLong}`}>
                <img src={isLong ? longImg : shortImg} alt="" width={24} height={24} />
                <span>{isLong ? "LONG" : "SHORT"}</span>
                <div className={`share-token-leverage bgside${isLong}`}>
                  {formatAmount(leverage, 4, 2, true)}x&nbsp;
                </div>
              </div>
            </div>
            <div className={`share-delta font-number side${deltaAfterFeesPercentageStr.substring(0, 1) === '+'}`}>{deltaAfterFeesPercentageStr}</div>
            <div className="share-price">
              <div className="share-price-entry">
                <span className="share-price-entry-label">Entry Price</span>
                <span className=" font-number">${formatAmount(averagePrice, USD_DECIMALS, indexToken.displayDecimals, true)}</span>
              </div>
              <div style={{
                display:"flex",
                gap: "8px",
              }}>
                <img src={IconNext} alt="" width={16} style={{ transform: "rotate(-90deg)", marginRight: "-16px", opacity: "0.3" }} />
                <img src={IconNext} alt="" width={16} style={{ transform: "rotate(-90deg)" }} />
              </div>
              <div className="share-price-entry">
                <span className="share-price-entry-label">Market Price</span>
                <span className=" font-number">${formatAmount(markPrice, USD_DECIMALS, indexToken.displayDecimals, true)}</span>
              </div>
            </div>
            <div className="share-referral">
              <div className="share-referral-qrcode">
                <QRCodeSVG size={80} value={success ? `${homeURL}/#/?ref=${code}` : `${homeURL}`} />
              </div>
              <div>
                {success ? (
                  <>
                    <div className="share-referral-label">
                      REFERRAL CODE
                    </div>
                    <div className="share-referral-value">{code}</div>
                  </>
                ) : (
                  <div className="share-referral-value">https://app.metavault.trade</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PositionShare;
