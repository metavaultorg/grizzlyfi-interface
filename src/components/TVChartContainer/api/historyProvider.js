import { getStatsUrl } from "../../../config/chains";

const axios = require("axios").default;


const history = {};

export default {
  history: history,

  getBars: function (chainId,symbolInfo, resolution, periodParams) {
    var split_symbol = symbolInfo.name.split(/[:/]/);

    const url = split_symbol[0];
    const api_root = getStatsUrl(chainId);
    return axios
      .get(`${api_root}/api/candles/${url}`, {
        params: {
          preferableChainId: "5611",
          period:
            resolution === "1D"
              ? "1d"
              : resolution === "240"
              ? "4h"
              : resolution === "60"
              ? "1h"
              : resolution === "15"
              ? "15m"
              : "5m",
          preferableSource: "fast",
          from: periodParams.from,
          to: !periodParams.firstDataRequest ? periodParams.to : "",
        },
      })
      .then((response) => {
        if (response.status && response.status.toString() !== "200") {
          console.log(" API error:", response.statusText);
          return [];
        }
        if (response.data.prices.length) {
          var bars = response.data.prices.map((el) => {
            return {
              time: el.t * 1000, //TradingView requires bar time in ms
              low: el.l,
              high: el.h,
              open: el.o,
              close: el.c,
            };
          });
          if (periodParams.firstDataRequest) {
            var lastBar = bars[bars.length - 1];
            history[symbolInfo.name] = { lastBar: lastBar };
          }
          return bars;
        } else {
          return [];
        }
      });
  },
};
