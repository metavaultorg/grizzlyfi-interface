import React from "react";

import "./Footer.css";

import logoImg from "./assets/icons/metavaultLogomark.png";
import twitterIcon from "./img/ic_twitter.svg";
import discordIcon from "./img/ic_discord.svg";
import telegramIcon from "./img/ic_telegram.svg";
import githubIcon from "./img/ic_github.svg";
import mediumIcon from "./img/ic_medium.svg";
import gitbookIcon from "./img/ic_gitbook.svg";
import ChainlinkIcon from "./img/chainlink.svg";
import BscIcon from "./img/footerpolygonnew.svg";
import linktreeIcon from "./img/linktree_white.svg";
import TopRightArr from "./assets/icons/TopRightArrColored";
import { NavLink } from "react-router-dom";
import { getImageUrl } from "./cloudinary/getImageUrl";

export default function Footer() {
  return null;
  return (
    <div className="Footer">
      <div className="footer-header">
        <img
          style={{ width: 60, height: 60, marginRight: 15 }}
          src={getImageUrl({
            path: "brandLogos/daoLogomark",
            format: "png",
          })}
          alt="Logo"
        />

        <p style={{ margin: 0 }}>Born out of the Metavault DAO community!</p>
      </div>
      <div className="footer-links--container">
        <a
          style={{ textDecoration: "none" }}
          href="https://t.me/MetavaultTrade"
          target="_blank"
          rel="noreferrer"
          className="footer-link--container"
        >
          <div>
            <img
              className="footer-icon"
              src={getImageUrl({
                path: "communityIcons/telegramLogo-themed--white",
              })}
              alt="Telegram Channel"
            />
            <span>Telegram</span>
          </div>
          <span style={{ marginLeft: "auto" }}>
            <TopRightArr />
          </span>
        </a>
        <a
          style={{ textDecoration: "none" }}
          href="https://twitter.com/MetavaultTRADE"
          target="_blank"
          rel="noreferrer"
          className="footer-link--container"
        >
          <div>
            <img
              className="footer-icon"
              src={getImageUrl({
                path: "communityIcons/twitterLogo-bg--white",
              })}
              alt="Twitter Account"
            />
            <span>Twitter</span>
          </div>
          <span style={{ marginLeft: "auto" }}>
            <TopRightArr />
          </span>
        </a>
        <a
          style={{ textDecoration: "none" }}
          href="https://discord.gg/grizzlyfi"
          target="_blank"
          rel="noreferrer"
          className="footer-link--container"
        >
          <div>
            <img
              className="footer-icon"
              src={getImageUrl({
                path: "communityIcons/discordLogo-themed--white",
              })}
              alt="Discord Group"
            />
            <span>Discord</span>
          </div>
          <span style={{ marginLeft: "auto" }}>
            <TopRightArr />
          </span>
        </a>
        <a
          style={{ textDecoration: "none" }}
          href="https://medium.com/@grizzly.fi"
          target="_blank"
          rel="noreferrer"
          className="footer-link--container"
        >
          <div>
            <img
              className="footer-icon"
              src={getImageUrl({
                path: "communityIcons/medium-themed--white",
              })}
              alt="Medium Blog"
            />
            <span>Medium</span>
          </div>
          <span style={{ marginLeft: "auto" }}>
            <TopRightArr />
          </span>
        </a>
        <a
          style={{ textDecoration: "none" }}
          href="https://github.com/grizzlyfi/"
          target="_blank"
          rel="noreferrer"
          className="footer-link--container"
        >
          <div>
            <img
              className="footer-icon"
              src={getImageUrl({
                path: "communityIcons/githubLogo-themed--white",
              })}
              alt="Github Repo"
            />
            <span>Github</span>
          </div>
          <span style={{ marginLeft: "auto" }}>
            <TopRightArr />
          </span>
        </a>
        <a
          style={{ textDecoration: "none" }}
          href="https://docs.grizzly.fi"
          target="_blank"
          rel="noreferrer"
          className="footer-link--container"
        >
          <div>
            <img
              className="footer-icon"
              src={getImageUrl({
                path: "communityIcons/gitbookLogo-themed--white",
              })}
              alt="Gitbook Docs"
            />
            <span>Gitbook</span>
          </div>
          <span style={{ marginLeft: "auto" }}>
            <TopRightArr />
          </span>
        </a>
      </div>
    </div>
  );
}
