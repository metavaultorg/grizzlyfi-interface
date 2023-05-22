import { getTokenBySymbol } from "../../../data/Tokens";
import historyProvider from "./historyProvider.js";
import { DEFAULT_CHAIN_ID } from "../../../Helpers";

// Websocket creation
var socket_url = process.env.REACT_APP_PRICE_API_WS_URL;
var socket;
connect();
// keep track of subscriptions
var _subs = [];
var _interval;

function subscribeBars(symbolInfo, resolution, updateCb, uid, resetCache) {
  // console.log("subscribeBars");
  const resolutionInMs = resolution === "1D" ? 60 * 60 * 24 * 1000 : resolution * 60 * 1000;
  var newSub = {
    uid,
    resolution,
    symbolInfo,
    lastBar: historyProvider.history[symbolInfo.name].lastBar,
    listener: updateCb,
  };

  // reload chart from server in every resolution time
  newSub.reloadChartInterval = setInterval(() => {
    // console.log("SetInterval");
    window.tvWidget.load();
  }, resolutionInMs);

  _subs.push(newSub);
}

function unsubscribeBars(uid) {
  // console.log("unsubscribeBars");
  const chartSubcription = _subs.find((s) => s.uid === uid);
  clearInterval(chartSubcription.reloadChartInterval);
  var subIndex = _subs.findIndex((e) => e.uid === uid);
  if (subIndex === -1) {
    console.log("No subscription found for ", uid);
    return;
  }
  _subs.splice(subIndex, 1);
}

function updateBarWithAveragePrice(name, averagePriceValue) {
  const chartSubcription = _subs.find((s) => s.symbolInfo.name === name);
  if (chartSubcription) {
    const barData = {
      ts: new Date().getTime() / 1000,
      price: averagePriceValue,
    };
    var _lastBar = this.updateBar(barData, chartSubcription);
    chartSubcription.listener(_lastBar);
    chartSubcription.lastBar = _lastBar;
  }
}

// Take a single trade, and subscription record, return updated bar
function updateBar(data, sub) {
  var lastBar = sub.lastBar;
  let resolution = sub.resolution;
  if (resolution.includes("D")) {
    // 1 day in minutes === 1440
    resolution = 1440;
  } else if (resolution.includes("W")) {
    // 1 week in minutes === 10080
    resolution = 10080;
  }
  var coeff = resolution * 60;
  var rounded = Math.floor(data.ts / coeff) * coeff;
  var lastBarSec = lastBar.time / 1000;
  var _lastBar;

  if (rounded > lastBarSec) {
    // create a new candle, use last close as open **PERSONAL CHOICE**
    _lastBar = {
      time: rounded * 1000,
      open: lastBar.close,
      high: lastBar.close,
      low: lastBar.close,
      close: data.price,
      volume: data.volume,
    };
  } else {
    // update lastBar candle!
    if (data.price < lastBar.low) {
      lastBar.low = data.price;
    } else if (data.price > lastBar.high) {
      lastBar.high = data.price;
    }

    lastBar.volume += data.volume;
    lastBar.close = data.price;
    _lastBar = lastBar;
  }
  return _lastBar;
}

function onMessage(message) {
  // console.log(`onMessage`);
  try {
    if (_subs.length === 0) return;
    const data = JSON.parse(message.data);
    const tokenPrices = {
      BTC: data.prices[0],
      ETH: data.prices[1],
      LINK: data.prices[2],
      UNI: data.prices[3],
      MATIC: data.prices[4],
      AAVE: data.prices[5],
    };
    for (let i = 0; i < _subs.length; i++) {
      const chartSubcription = _subs[i];
      const tokenSymbol = chartSubcription.symbolInfo.name.split("/")[0];
      const tokenPrice = tokenPrices[tokenSymbol];
      if (tokenPrice) {
        // console.log("tokenPrice: " + tokenPrice);
        const barData = {
          ts: data.ts / 1000,
          price: tokenPrice / 10000,
        };
        var _lastBar = updateBar(barData, chartSubcription);
        chartSubcription.listener(_lastBar);
        chartSubcription.lastBar = _lastBar;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

function onClose() {
  console.log("Websocket Closed");
  _interval = setInterval(connect, 10000);
}

function connect() {
  try {
    socket = new WebSocket(socket_url);
    socket.onmessage = onMessage;
    socket.onclose = onClose;
    if (_interval) clearInterval(_interval);
    console.log("Websocket Connected");
  } catch (error) {
    console.log(error);
  }
}

export default { subscribeBars, unsubscribeBars, updateBar, updateBarWithAveragePrice };
