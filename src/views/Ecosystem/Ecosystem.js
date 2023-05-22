import React from "react";
import SEO from "../../components/Common/SEO";

import Footer from "../../Footer";
import { getPageTitle } from "../../Helpers";

import maticIcon from "../../img/ic_polygon_24.svg";

import "./Ecosystem.css";

export default function Ecosystem() {
  return (
    <SEO title={getPageTitle("Ecosystem Projects")}>
      <div className="DashboardV2 Page page-layout mb-5">
        <div className="Page-title-section">
          <div className="Page-title">Telegram Groups</div>
          {/* <div className="Page-description">Community-led Telegram groups.</div>*/}
        </div>
        <div className="DashboardV3-projects">
          <div className="App-card">
            <div className="App-card-title">
              Metavault.Trade
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" width={25} />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a href="https://t.me/MetavaultTrade" target="_blank" rel="noopener noreferrer" className="acolor">
                    t.me/MetavaultTrade
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Official Telegram group</div>
              </div>
              {}
            </div>
          </div>

          {}
        </div>
        <div className="Page-title-section mt-4">
          <div className="Page-title">Partnerships and Integrations</div>
          {}
        </div>
        <div className="DashboardV3-projects">
          {}
          <div className="App-card">
            <div className="App-card-title">
              Defi Llama
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://defillama.com/protocol/metavault-trade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    defillama.com
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>DeFi Dashboard</div>
              </div>
              <div className="App-card-row">
                <div className="label">Publication</div>
                <div>
                  <a
                    href="https://twitter.com/DefiLlama/status/1532506582801580040"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    twitter.com/DefiLlama
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">
              DappRadar
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://dappradar.com/polygon/defi/metavault-trade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    dappradar.com
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Dapp Dashboard</div>
              </div>
              <div className="App-card-row">
                <div className="label">Publication</div>
                <div>
                  <a
                    href="https://twitter.com/MetavaultDAO/status/1496805282885820417"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    twitter.com/DappRadar
                  </a>
                </div>
              </div>
              {}
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">
              DeBank
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://debank.com/projects/matic_metavault"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    debank.com
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Multi-chain portfolio tracker</div>
              </div>
              <div className="App-card-row">
                <div className="label">Publication</div>
                <div>
                  <a
                    href="https://twitter.com/DeBankDeFi/status/1554616787861475329"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    twitter.com/DeBankDeFi
                  </a>
                </div>
              </div>
              {}
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">
              Zapper
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://zapper.fi/apps/metavault-trade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    zapper.fi
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Multi-chain asset management</div>
              </div>
              <div className="App-card-row">
                <div className="label">Publication</div>
                <div>
                  {/* <a
                    href="https://twitter.com/tinnetwork_defi/status/1552307823555387392"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    twitter.com/tinnetwork_defi
                  </a> */}
                </div>
              </div>
              {}
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">
              tin.network
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://tin.network"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    tin.network
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Multi-chain asset management</div>
              </div>
              <div className="App-card-row">
                <div className="label">Publication</div>
                <div>
                  <a
                    href="https://twitter.com/tinnetwork_defi/status/1552307823555387392"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    twitter.com/tinnetwork_defi
                  </a>
                </div>
              </div>
              {}
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">
              Firebird Finance
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://app.firebird.finance/swap?outputCurrency=0x2760E46d9BB43dafCbEcaad1F64b93207f9f0eD7&net=137&utm_campaign=oref&aff=T3uEeexPPSSLMwBSSA2jnA9Ngq9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    firebird.finance
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Multi-chain DEX aggregator</div>
              </div>
              <div className="App-card-row">
                <div className="label">Publication</div>
                <div>
                  <a
                    href="https://twitter.com/FinanceFirebird/status/1560194680956092417"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    twitter.com/FinanceFirebird
                  </a>
                </div>
              </div>
              {}
            </div>
          </div>
        </div>

        <div className="Page-title-section mt-4">
          <div className="Page-title">Official Sites</div>
          {}
        </div>
        <div className="DashboardV3-projects">
          <div className="App-card">
            <div className="App-card-title">
              Metavault.Trade statistics
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a href="https://stats.metavault.trade/" target="_blank" rel="noopener noreferrer" className="acolor">
                    stats.metavault.trade
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Metavault.Trade statistics & analytics dashboard</div>
              </div>
            </div>
          </div>

          <div className="App-card">
            <div className="App-card-title">
              Metavault.Trade leaderboard
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://leaderboard.metavault.trade/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    leaderboard.metavault.trade
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Trader performace leaderboard</div>
              </div>
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">
              Metavault.Trade orders
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://app.metavault.trade/orders_overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    metavault.trade/orders_overview
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Trader orders</div>
              </div>
            </div>
          </div>

          <div className="App-card">
            <div className="App-card-title">
              Metavault.Trade Governance
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a href="https://gov.metavault.trade" target="_blank" rel="noopener noreferrer" className="acolor">
                    gov.metavault.trade
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Metavault.Trade governance</div>
              </div>
            </div>
          </div>

          <div className="App-card">
            <div className="App-card-title">
              Metavault.Trade Proposals
              <div className="App-card-title-icon">
                <img src={maticIcon} alt="maticIcon" />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Link</div>
                <div>
                  <a
                    href="https://snapshot.org/#/metavault-trade.eth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acolor"
                  >
                    snapshot.org/#/metavault-trade.eth
                  </a>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Description</div>
                <div>Metavault.Trade proposals voting system</div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </SEO>
  );
}
