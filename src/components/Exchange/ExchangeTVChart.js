import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useWeb3React } from "@web3-react/core";
import cx from "classnames";
import stream from "../TVChartContainer/api/stream";

import { TVChartContainer } from "../TVChartContainer/index";

import {
  USD_DECIMALS,
  SWAP,
  INCREASE,
  CHART_PERIODS,
  getTokenInfo,
  formatAmount,
  formatDateTime,
  BASIS_POINTS_DIVISOR,
  TRIGGER_PREFIX_ABOVE,
  TRIGGER_PREFIX_BELOW,
  bigNumberify,
  expandDecimals,
  usePrevious,
  getLiquidationPrice,
  useLocalStorageSerializeKey,
} from "../../Helpers";
import { useChartPrices, useInfoTokens } from "../../Api";

import { getTokens, getToken } from "../../data/Tokens";
import ChartTokenSelector from "./ChartTokenSelector";

const PRICE_LINE_TEXT_WIDTH = 15;

const timezoneOffset = -new Date().getTimezoneOffset() * 60;

export function getChartToken(swapOption, fromToken, toToken, chainId) {
  if (!fromToken || !toToken) {
    return;
  }

  if (swapOption !== SWAP) {
    return toToken;
  }

  if (fromToken.isUsdm && toToken.isUsdm) {
    return getTokens(chainId).find((t) => t.isStable);
  }
  if (fromToken.isUsdm) {
    return toToken;
  }
  if (toToken.isUsdm) {
    return fromToken;
  }

  if (fromToken.isStable && toToken.isStable) {
    return toToken;
  }
  if (fromToken.isStable) {
    return toToken;
  }
  if (toToken.isStable) {
    return fromToken;
  }

  return toToken;
}

const DEFAULT_PERIOD = "4h";

export default function ExchangeTVChart(props) {
  const {
    swapOption,
    fromTokenAddress,
    toTokenAddress,
    chainId,
    positions,
    savedShouldShowPositionLines,
    orders,
    trailingStopOrders,
    infoTokens,
    setToTokenAddress,
  } = props;

  const { library, account, active } = useWeb3React();

  let [period, setPeriod] = useLocalStorageSerializeKey([chainId, "Chart-period"], DEFAULT_PERIOD);
  if (!(period in CHART_PERIODS)) {
    period = DEFAULT_PERIOD;
  }

  //const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  const fromToken = getTokenInfo(infoTokens, fromTokenAddress);
  const toToken = getTokenInfo(infoTokens, toTokenAddress);

  const [chartToken, setChartToken] = useState({
    maxPrice: null,
    minPrice: null,
  });
  const symbol = chartToken ? (chartToken.isWrapped ? chartToken.baseSymbol : chartToken.symbol) : undefined;
  const marketName = chartToken ? symbol + "_USD" : undefined;
  const previousMarketName = usePrevious(marketName);

  const currentAveragePrice =
    chartToken.maxPrice && chartToken.minPrice ? chartToken.maxPrice.add(chartToken.minPrice).div(2) : null;

  const averagePriceValue = currentAveragePrice
    ? parseFloat(formatAmount(currentAveragePrice, USD_DECIMALS, chartToken.displayDecimals))
    : null;

  useEffect(() => {
    if (averagePriceValue && window.tvWidget) {
      if (window.tvWidget._ready && marketName && averagePriceValue) {
        // console.log("averagePriceValue",averagePriceValue);
        stream.updateBarWithAveragePrice(marketName.replace("_", "/"), averagePriceValue);
      }
    }
  }, [marketName, averagePriceValue]);

  useEffect(() => {
    const tmp = getChartToken(swapOption, fromToken, toToken, chainId);
    setChartToken(tmp);
  }, [swapOption, fromToken, toToken, chainId]);

  const currentOrders = useMemo(() => {
    if (swapOption === SWAP || !chartToken) {
      return [];
    }

    return orders.filter((order) => {
      if (order.type === SWAP) {
        // we can't show non-stable to non-stable swap orders with existing charts
        // so to avoid users confusion we'll show only long/short orders
        return false;
      }

      const indexToken = getToken(chainId, order.indexToken);
      return order.indexToken === chartToken.address || (chartToken.isNative && indexToken.isWrapped);
    });
  }, [orders, chartToken, swapOption, chainId]);

  const ref = useRef(null);
  const chartRef = useRef(null);

  const [priceData, updatePriceData] = useChartPrices(
    chainId,
    chartToken.symbol,
    chartToken.isStable,
    period,
    currentAveragePrice
  );

  const [chartInited, setChartInited] = useState(false);

  const [showChartLines, setShowChartLines] = useState(false);

  useEffect(() => {
    if (marketName !== previousMarketName) {
      setChartInited(false);
    }
  }, [marketName, previousMarketName]);

  useEffect(() => {
    const interval = setInterval(() => {
      updatePriceData(undefined, true);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [updatePriceData]);

  // useEffect(() => {
  //   if (!currentChart) {
  //     return;
  //   }
  //   const resizeChart = () => {
  //     currentChart.resize(chartRef.current.offsetWidth, chartRef.current.offsetHeight);
  //   };
  //   window.addEventListener("resize", resizeChart);
  //   return () => window.removeEventListener("resize", resizeChart);
  // }, [currentChart]);

  useEffect(() => {
    setShowChartLines(false);
    if (!chartInited) {
      if (window.tvWidget)
        window.tvWidget.onChartReady(() => {
          window.tvWidget.headerReady().then(() => {
            window.tvWidget.activeChart().setSymbol(marketName.replace("_", "/"));
            setShowChartLines(true);
          });
        });

      setChartInited(true);
    }
  }, [chartInited, marketName]);

  useEffect(() => {
    const lines = [];
    if (savedShouldShowPositionLines && showChartLines) {
      if (currentOrders && currentOrders.length > 0) {
        currentOrders.forEach((order) => {
          const indexToken = getToken(chainId, order.indexToken);
          let tokenSymbol;
          if (indexToken && indexToken.symbol) {
            tokenSymbol = indexToken.isWrapped ? indexToken.baseSymbol : indexToken.symbol;
          }
          let title = `${order.type === INCREASE ? "Inc." : "Dec."} ${tokenSymbol} ${
            order.isLong ? "Long" : "Short"
          }`;
          const color = "#f2c75c";
          let orderTriggerPrice = order.triggerPrice;

          if(order.orderType && order.orderType.toNumber()=== 3 && trailingStopOrders){
            // console.log("trailingStopOrders-here",trailingStopOrders)
            const trailingStopOrder = trailingStopOrders.filter((o)=>o.orderIndex === order.index);

            title = "TS-" + title;            

            if(trailingStopOrder.length>0){
              
              const trailingStopRefPrice = bigNumberify(trailingStopOrder[0].referencePrice).mul(expandDecimals(1,24));

              orderTriggerPrice = order.isLong ? 
                trailingStopRefPrice.mul(BASIS_POINTS_DIVISOR - order.trailingStopPercentage).div(BASIS_POINTS_DIVISOR)
                :trailingStopRefPrice.mul(BASIS_POINTS_DIVISOR + order.trailingStopPercentage).div(BASIS_POINTS_DIVISOR);

            }

          }

          if (window.tvWidget && window.tvWidget._ready && marketName.startsWith(indexToken.symbol))
            lines.push(
              window.tvWidget
                .activeChart()
                .createPositionLine()
                .setPrice(parseFloat(formatAmount(orderTriggerPrice, USD_DECIMALS, indexToken.displayDecimals)))
                .setLineColor(color)
                .setBodyBorderColor("#f2c75c")
                .setBodyBackgroundColor("#f2c75c")
                .setBodyTextColor("rgb(0, 0, 0)")
                .setLineStyle(1)
                .setLineLength(10)
                .setQuantity("")
                .setBodyFont("12px Boston,sans-serif")
                .setText(title.padEnd(PRICE_LINE_TEXT_WIDTH, " "))
            );
        });
      }
      if (positions && positions.length > 0) {
        const color = "#f2c75c";

        positions.forEach((position) => {
          if (window.tvWidget && window.tvWidget._ready && marketName.startsWith(position.indexToken.symbol))
            lines.push(
              window.tvWidget
                .activeChart()
                .createPositionLine()
                .setPrice(
                  parseFloat(formatAmount(position.averagePrice, USD_DECIMALS, position.indexToken.displayDecimals))
                )
                .setLineColor(color)
                .setBodyBorderColor("#f2c75c")
                .setBodyBackgroundColor("#f2c75c")
                .setBodyTextColor("rgb(0, 0, 0)")
                .setLineStyle(1)
                .setLineLength(10)
                .setQuantity("")
                .setBodyFont("12px Boston,sans-serif")
                .setText(
                  `Open ${position.indexToken.symbol} ${position.isLong ? "Long" : "Short"}`.padEnd(
                    PRICE_LINE_TEXT_WIDTH,
                    " "
                  )
                )
            );

          const liquidationPrice = getLiquidationPrice(position);

          if (window.tvWidget && window.tvWidget._ready&& marketName.startsWith(position.indexToken.symbol))
            lines.push(
              window.tvWidget
                .activeChart()
                .createPositionLine()
                .setPrice(formatAmount(liquidationPrice, USD_DECIMALS, position.indexToken.displayDecimals))
                .setLineColor(color)
                .setBodyBorderColor("#f2c75c")
                .setBodyBackgroundColor("#f2c75c")
                .setBodyTextColor("rgb(0, 0, 0)")
                .setLineStyle(1)
                .setLineLength(10)
                .setQuantity("")
                .setBodyFont("12px Boston,sans-serif")
                .setText(
                  `Liq. ${position.indexToken.symbol} ${position.isLong ? "Long" : "Short"}`.padEnd(
                    PRICE_LINE_TEXT_WIDTH,
                    " "
                  )
                )
            );
        });
      }
    }
    return () => {
      lines.forEach((line) => line.remove());
    };
  }, [currentOrders,trailingStopOrders, positions, chainId, savedShouldShowPositionLines, showChartLines]);

  let high;
  let low;
  let deltaPrice;
  let delta;
  let deltaPercentage;
  let deltaPercentageStr;

  const now = parseInt(Date.now() / 1000);
  const timeThreshold = now - 24 * 60 * 60;

  if (priceData) {
    for (let i = priceData.length - 1; i > 0; i--) {
      const price = priceData[i];
      if (price.time < timeThreshold) {
        break;
      }
      if (!low) {
        low = price.value;
      }
      if (!high) {
        high = price.value;
      }

      if (price.value > high) {
        high = price.value;
      }
      if (price.value < low) {
        low = price.value;
      }
      deltaPrice = price.value;
    }
  }

  if (deltaPrice && currentAveragePrice) {
    const average = parseFloat(formatAmount(currentAveragePrice, USD_DECIMALS, chartToken.displayDecimals));
    delta = average - deltaPrice;
    deltaPercentage = (delta * 100) / average;
    if (deltaPercentage > 0) {
      deltaPercentageStr = `+${deltaPercentage.toFixed(2)}%`;
    } else {
      deltaPercentageStr = `${deltaPercentage.toFixed(2)}%`;
    }
    if (deltaPercentage === 0) {
      deltaPercentageStr = "0.00";
    }
  }

  if (!chartToken || !symbol || !window.TradingView) {
    return null;
  }
  const symbolName = marketName.replace("_", "/");

  const onSelectToken = (token) => {
    const tmp = getTokenInfo(infoTokens, token.address);
    setChartToken(tmp);
    setToTokenAddress(swapOption, token.address);
  };

  const renderChart = () => {
    return <TVChartContainer symbol={symbolName} />;
  };

  return (
    <div  className="ExchangeChart tv" ref={ref}>
      <div className="ExchangeChart-top App-box App-box-border">
        <div className="ExchangeChart-top-inner">
          <div>
            <div className="ExchangeChart-title">
              <ChartTokenSelector
                chainId={chainId}
                selectedToken={chartToken}
                swapOption={swapOption}
                infoTokens={infoTokens}
                onSelectToken={onSelectToken}
                className="chart-token-selector"
              />
            </div>
          </div>
          <div>
            <div className="ExchangeChart-main-price">
              {chartToken.maxPrice && formatAmount(chartToken.maxPrice, USD_DECIMALS, chartToken.displayDecimals)}
            </div>
            <div className="ExchangeChart-info-label">
              ${chartToken.minPrice && formatAmount(chartToken.minPrice, USD_DECIMALS, chartToken.displayDecimals)}
            </div>
          </div>
          <div>
            <div className="ExchangeChart-info-label">24h Change</div>
            <div className={cx({ positive: deltaPercentage > 0, negative: deltaPercentage < 0 })}>
              {!deltaPercentageStr && "-"}
              {deltaPercentageStr && deltaPercentageStr}
            </div>
          </div>
          <div className="ExchangeChart-additional-info">
            <div className="ExchangeChart-info-label">24h High</div>
            <div>
              {!high && "-"}
              {high && high.toFixed(chartToken.displayDecimals)}
            </div>
          </div>
          <div className="ExchangeChart-additional-info">
            <div className="ExchangeChart-info-label">24h Low</div>
            <div>
              {!low && "-"}
              {low && low.toFixed(chartToken.displayDecimals)}
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: "#1f1f1f", marginTop: 60 }} className="ExchangeChart-bottom App-box App-box-border">
        <div className="ExchangeChart-bottom-header">
          <div className="ExchangeChart-bottom-controls"></div>
        </div>
        <div className="ExchangeChart-bottom-content" ref={chartRef}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}
