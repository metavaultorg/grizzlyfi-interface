let eventsData = [
  {
    id: "metavault-trade-verified",
    title: "Metavault Official Domains",
    isActive: true,
    validTill: "02/01/2023 12:00:00 PM",
    bodyText: "Please verify that you are on the correct domain. https://trade.grizzly.fi/#/trade",
    buttons: [
      {
        text: "trade.grizzly.fi",
        link: "https://trade.grizzly.fi/#/trade",
      },
      {
        text: "trade.grizzly.fi",
        link: "https://trade.grizzly.fi/#/trade",
      }
    ],
  },
  {
    id: "metavault-trade-launch-2",
    title: "Metavault OrderBook Update",
    isActive: false,
    validTill: "03/30/2023 12:00:00 PM",
    bodyText: "We have updated the orderbook contract, we ask you to cancel old orders (limit, SL, TP) via the link below and place them again on the regular dApp.",
    buttons: [
      {
        text: "https://cancel-order.grizzly.trade",
        link: "https://trade.grizzly.fi/#/trade",
      }
    ],
  },
  {
    id: "usdc-market-price-impact",
    title: "USDC market price impact",
    isActive: false,
    validTill: "03/30/2023 12:00:00 PM",
    bodyText: "USDC is currently facing a large spread due to its current market price. The spread might impact the transactions related to USDC on the platform, such as leverage with USDC collateral, swaps and GLL minting/burning.",
    buttons: []
  }
];
export default eventsData;
