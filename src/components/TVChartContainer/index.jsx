import * as React from "react";
import "./index.css";
import Datafeed from "./api";

function getLanguageFromURL() {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(window.location.search);
  return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export class TVChartContainer extends React.PureComponent {
  static defaultProps = {
    symbol: "BTC/USD",
    interval: "15",
    libraryPath: "/charting_library/",
    // chartsStorageUrl: "https://sltv.grizzly.fi",
    chartsStorageApiVersion: "1.1",
    clientId: "metavault.trade",
    userId: "metavault.trade",
    fullscreen: false,
    autosize: true,
    studiesOverrides: {},
  };
  tvWidget = null;

  constructor(props) {
    super(props);

    this.ref = React.createRef();
  }

  componentDidMount() {
    const widgetOptions = {
      symbol: this.props.symbol,
      datafeed: Datafeed,
      interval: this.props.interval,
      theme: "dark",
      container: this.ref.current,
      library_path: this.props.libraryPath,
      locale: getLanguageFromURL() || "en",
      disabled_features: ["use_localstorage_for_settings", "header_symbol_search"],
      enabled_features: ["study_templates"],
      charts_storage_url: this.props.chartsStorageUrl,
      charts_storage_api_version: this.props.chartsStorageApiVersion,
      client_id: this.props.clientId,
      user_id: this.props.userId,
      fullscreen: this.props.fullscreen,
      autosize: this.props.autosize,
      visible_plots_set: "ohlc",
      studies_overrides: this.props.studiesOverrides,
      custom_css_url: "./themed.css",
      overrides: {
        // "mainSeriesProperties.showCountdown": true,
        "paneProperties.backgroundGradientStartColor": "#1f1f1f",
        "paneProperties.backgroundGradientEndColor": "#1f1f1f",
        "paneProperties.vertGridProperties.color": "#2b2b2b",
        "paneProperties.horzGridProperties.color": "#2b2b2b",
        // "symbolWatermarkProperties.transparency": 90,
        // "scalesProperties.textColor": "#AAA",
        "mainSeriesProperties.candleStyle.wickUpColor": "#0ecc83",
        "mainSeriesProperties.candleStyle.wickDownColor": "#fa3c58",

      },
      time_frames: [
        { text: "1y", resolution: "1D", description: "1 Year" },
        { text: "6m", resolution: "240", description: "6 Months" },
        { text: "3m", resolution: "240", description: "3 Months" },
        { text: "1m", resolution: "60", description: "1 Month" },
        { text: "5d", resolution: "15", description: "5 Days" },
        { text: "1d", resolution: "5", description: "1 Day" },
      ],
    };
    const tvWidget = (window.tvWidget = new window.TradingView.widget(widgetOptions));

    this.tvWidget = tvWidget;

    tvWidget.onChartReady(() => {
      tvWidget.headerReady().then(() => {
        console.log("Chart has loaded!");
      });
    });
  }

  componentWillUnmount() {
    if (this.tvWidget !== null) {
      this.tvWidget.remove();
      this.tvWidget = null;
    }
  }

  render() {
    return <div ref={this.ref} className={"TVChartContainer"} />;
  }
}
