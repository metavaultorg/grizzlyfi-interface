// /* eslint-disable react-hooks/exhaustive-deps */
// import React,{ useEffect } from "react";
// import { createChart, IChartApi, ISeriesApi } from "lightweight-charts";
// import {
//   PriceScaleMode,
//   SeriesMarker,
//   Time,
// } from "lightweight-charts-baseline";
// import { strictGet, TRADEABLE_TOKEN_ADDRESS_MAP, intervalInMsMap } from './util'

// let myChart
// let series
// const positiveColor = "#79ffab";
// const negativeColor = "#ff7b41";
// export const baseOptions = {
//   rightPriceScale: {
//     visible: false,
//   },
//   handleScale: {

//   },
//   grid: {
//     horzLines: {
//       color: 'rgba(255, 255, 255, 0.15)',
//       visible: true,
//     },
//     vertLines: {
//       color: 'rgba(255, 255, 255, 0.15)',
//       visible: true
//     },
//   },
//   overlayPriceScales: {
//     borderVisible: false,
//   },
//   leftPriceScale: {
//     visible: false,
//     scaleMargins: {
//       bottom: 0,
//       top: 0,
//     }
//   },
//   layout: {
//     textColor: '#ffffff',
//     backgroundColor: 'transparent',
//     fontFamily: `'Inter','Manrope',sans-serif'`,
//     fontSize: 12
//   },
//   timeScale: {
//     rightOffset: 0,
//     secondsVisible: true,
//     timeVisible: true,
//     lockVisibleTimeRangeOnResize: true,
//   },
// }
// export default function CandleStick(props) {
//   const { indextoken, interval, timeFrame, limit } = props;
//   const candleSticksOption = {
//     rightPriceScale: {
//       entireTextOnly: true,
//       borderVisible: false,
//       mode: PriceScaleMode.Logarithmic,
//     },
//     timeScale: {
//       timeVisible: timeFrame <= intervalInMsMap.DAY7,
//       secondsVisible: timeFrame <= intervalInMsMap.MIN60,
//       borderVisible: true,
//       borderColor: "#ffffff",
//       rightOffset: 0,
//     },
//     priceScale: {
//       // position: 'left',
//     },
//   };
//   useEffect(() => {
//     let chartDom = document.getElementById("candle");
//     myChart = createChart(
//       chartDom,
//       Object.assign(baseOptions, candleSticksOption)
//     );
//     series = myChart.addCandlestickSeries({
//       upColor: positiveColor,
//       downColor: negativeColor,
//       borderDownColor: negativeColor,
//       borderUpColor: positiveColor,
//       wickDownColor: negativeColor,
//       wickUpColor: positiveColor,
//     });
//     const priceScale = series.priceScale();
//     priceScale.applyOptions({
//       scaleMargins: {
//         top: 0.2,
//         bottom: 0.2,
//       },
//     });
//     window.addEventListener("resize", handleResize);
//     return () => {
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);
//   const handleResize = () => {
//     if (window.innerWidth >= 1280) {
//       myChart.resize(window.innerWidth / 2, window.innerHeight);
//     } else {
//       myChart.resize(document.getElementById("candle").clientWidth, 240);
//     }
//   };
//   useEffect(() => {
//     if (!indextoken) return;
//     const token = strictGet(TRADEABLE_TOKEN_ADDRESS_MAP, indextoken);

//     fetchCandleData(token, interval, timeFrame, limit);
//   }, [timeFrame, indextoken, interval, limit]);
//   const fetchCandleData = async (
//     token,
//     interval,
//     timeFrame,
//     limit
//   ) => {
//     const result = await fetchHistoricKline(token.symbol, {
//       // @ts-ignore
//       interval: interval,
//       limit: limit,
//     });
//     if (!result) return;

//     // const newKlineData = formatKlineData(result);

//     const endDate = Date.now();
//     const startDate = Math.floor(endDate - timeFrame) / 1000;

//     series.setData(
//       result.map((d) => ({ ...d, time: d.time }))
//     );

//   };
//   return (
//     <div>
      
//     </div>
//   )
// }
