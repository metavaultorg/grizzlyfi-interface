import { ethers } from "ethers";
import { gql } from "@apollo/client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import useSWR from "swr";

import OrderBook from "../abis/OrderBook.json";
import OrderBookSwap from "../abis/OrderBookSwap.json";
import PositionManager from "../abis/PositionManager.json";
import Vault from "../abis/Vault.json";
import Router from "../abis/Router.json";
import UniPool from "../abis/UniPool.json";
import Token from "../abis/Token.json";
import VaultReader from "../abis/VaultReader.json";
import ReferralStorage from "../abis/ReferralStorage.json";
import PositionRouter from "../abis/PositionRouter.json";

import { getContract, MVD_TREASURY_ADDRESS, MVX_MULTISIG_ADDRESS,MVX_RESERVE_TIMELOCK, MVX_TEAM_VESTING_ADDRESS } from "../Addresses";
import { getConstant } from "../Constants";
import {
  UI_VERSION,
  // DEFAULT_GAS_LIMIT,
  bigNumberify,
  getExplorerUrl,
  getServerBaseUrl,
  getServerUrl,
  setGasPrice,
  getGasLimit,
  replaceNativeTokenAddress,
  getProvider,
  getOrderKey,
  fetcher,
  parseValue,
  expandDecimals,
  getInfoTokens,
  isAddressZero,
  helperToast,
  POLYGON,
  ZKSYNC,
  FIRST_DATE_TS,
  getUsd,
  USD_DECIMALS,
  HIGH_EXECUTION_FEES_MAP,
  SWAP,
  INCREASE,
  DECREASE,
} from "../Helpers";
import { getTokens, getTokenBySymbol, getWhitelistedTokens } from "../data/Tokens";

import { polygonGraphClient, positionsGraphClient } from "./common";
import { groupBy } from "lodash";
import { getAddress } from "ethers/lib/utils";
export * from "./prices";

const { AddressZero } = ethers.constants;

function getMvxGraphClient(chainId) {
  if (chainId === POLYGON) {
    return polygonGraphClient;
  }
  throw new Error(`Unsupported chain ${chainId}`);
}

export function useAllOrdersStats(chainId) {
  const query = gql(`{
    orderStat(id: "total") {
      openSwap
      openIncrease
      openDecrease
      executedSwap
      executedIncrease
      executedDecrease
      cancelledSwap
      cancelledIncrease
      cancelledDecrease
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getMvxGraphClient(chainId).query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.orderStat : null;
}

export function useInfoTokens(library, chainId, active, tokenBalances, fundingRateInfo, vaultPropsLength) {
  const tokens = getTokens(chainId);
  const vaultReaderAddress = getContract(chainId, "VaultReader");
  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);

  const { data: vaultTokenInfo } = useSWR(
    [`useInfoTokens:${active}`, chainId, vaultReaderAddress, "getVaultTokenInfoV4"],
    {
      fetcher: fetcher(library, VaultReader, [
        vaultAddress,
        positionRouterAddress,
        nativeTokenAddress,
        expandDecimals(1, 18),
        whitelistedTokenAddresses,
      ]),
    }
  );

  const indexPricesUrl = getServerUrl(chainId, "/prices");
  // const { data: indexPrices } = useSWR([indexPricesUrl], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.json()),
  //   refreshInterval: 500,
  //   refreshWhenHidden: true,
  // });

  const indexPrices = [];

  return {
    infoTokens: getInfoTokens(
      tokens,
      tokenBalances,
      whitelistedTokens,
      vaultTokenInfo,
      fundingRateInfo,
      vaultPropsLength,
      indexPrices,
      nativeTokenAddress
    ),
  };
}

export function useUserStat(chainId) {
  const query = gql(`{
    userStat(id: "total") {
      id
      uniqueCount
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getMvxGraphClient(chainId).query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.userStat : null;
}

export function useLiquidationsData(chainId, account) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (account) {
      const query = gql(`{
         liquidatedPositions(
           where: {account: "${account.toLowerCase()}"}
           first: 100
           orderBy: timestamp
           orderDirection: desc
         ) {
           key
           timestamp
           borrowFee
           loss
           collateral
           size
           markPrice
           type
         }
      }`);
      const graphClient = getMvxGraphClient(chainId);
      graphClient
        .query({ query })
        .then((res) => {
          const _data = res.data.liquidatedPositions.map((item) => {
            return {
              ...item,
              size: bigNumberify(item.size),
              collateral: bigNumberify(item.collateral),
              markPrice: bigNumberify(item.markPrice),
            };
          });
          setData(_data);
        })
        .catch(console.warn);
    }
  }, [setData, chainId, account]);

  return data;
}

export function useAllPositions(chainId, library) {
  const count = 1000;
  const query = gql(`{
    aggregatedTradeOpens(
      first: ${count}
    ) {
      account
      initialPosition{
        indexToken
        collateralToken
        isLong
        sizeDelta
      }
      increaseList {
        sizeDelta
      }
      decreaseList {
        sizeDelta
      }
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    positionsGraphClient.query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query]);

  const key = res ? `allPositions${count}__` : false;
  const { data: positions = [] } = useSWR(key, async () => {
    const provider = getProvider(library, chainId);
    const vaultAddress = getContract(chainId, "Vault");
    const contract = new ethers.Contract(vaultAddress, Vault.abi, provider);
    const ret = await Promise.all(
      res.data.aggregatedTradeOpens.map(async (dataItem) => {
        try {
          const { indexToken, collateralToken, isLong } = dataItem.initialPosition;
          const positionData = await contract.getPosition(dataItem.account, collateralToken, indexToken, isLong);
          const position = {
            size: bigNumberify(positionData[0]),
            collateral: bigNumberify(positionData[1]),
            entryFundingRate: bigNumberify(positionData[3]),
            account: dataItem.account,
          };
          position.fundingFee = await contract.getFundingFee(collateralToken, position.size, position.entryFundingRate);
          position.marginFee = position.size.div(1000);
          position.fee = position.fundingFee.add(position.marginFee);

          const THRESHOLD = 5000;
          const collateralDiffPercent = position.fee.mul(10000).div(position.collateral);
          position.danger = collateralDiffPercent.gt(THRESHOLD);

          return position;
        } catch (ex) {
          console.error(ex);
        }
      })
    );

    return ret.filter(Boolean);
  });

  return positions;
}

export function useAllOrders(chainId, library) {
  const query = gql(`{
    orders(
      first: 1000,
      orderBy: createdTimestamp,
      orderDirection: desc,
      where: {status: "open", createdTimestamp_gt: 1666206221}
    ) {
      type
      account
      index
      status
      createdTimestamp
    }
  }`);

  const [res, setRes] = useState();

  useEffect(() => {
    getMvxGraphClient(chainId).query({ query }).then(setRes);
  }, [setRes, query, chainId]);

  const key = res ? res.data.orders.map((order) => `${order.type}-${order.account}-${order.index}`) : null;
  const { data: orders = [] } = useSWR(key, () => {
    const provider = getProvider(library, chainId);
    const orderBookAddress = getContract(chainId, "OrderBook");
    const orderBookSwapAddress = getContract(chainId, "OrderBookSwap");
    const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, provider);
    const swapContract = new ethers.Contract(orderBookSwapAddress, OrderBookSwap.abi, provider);
    return Promise.all(
      res.data.orders.map(async (order) => {
        try {
          const type = order.type.charAt(0).toUpperCase() + order.type.substring(1);
          const orderContract = order.type === "swap" ? swapContract : contract;
          const method = `get${type}Order`;
          const orderFromChain = await orderContract[method](order.account, order.index);
          const ret = {};
          for (const [key, val] of Object.entries(orderFromChain)) {
            ret[key] = val;
          }
          if (order.type === "swap") {
            ret.path = [ret.path0, ret.path1, ret.path2].filter((address) => address !== AddressZero);
          }
          ret.type = type;
          ret.index = order.index;
          ret.account = order.account;
          ret.createdTimestamp = order.createdTimestamp;
          return ret;
        } catch (ex) {
          console.error(ex);
        }
      })
    );
  });

  return orders.filter(Boolean);
}

export function usePositionsForOrders(chainId, library, orders) {
  const key = orders ? orders.map((order) => getOrderKey(order) + "____") : null;
  const { data: positions = {} } = useSWR(key, async () => {
    const provider = getProvider(library, chainId);
    const vaultAddress = getContract(chainId, "Vault");
    const contract = new ethers.Contract(vaultAddress, Vault.abi, provider);
    const data = await Promise.all(
      orders.map(async (order) => {
        try {
          const position = await contract.getPosition(
            order.account,
            order.collateralToken,
            order.indexToken,
            order.isLong
          );
          if (position[0].eq(0)) {
            return [null, order];
          }
          return [position, order];
        } catch (ex) {
          console.error(ex);
        }
      })
    );
    return data.reduce((memo, [position, order]) => {
      memo[getOrderKey(order)] = position;
      return memo;
    }, {});
  });

  return positions;
}

function invariant(condition, errorMsg) {
  if (!condition) {
    throw new Error(errorMsg);
  }
}

export function useTradesFromGraph(chainId, account) {
  const [trades, setTrades] = useState();

  useEffect(() => {
    const queryString = account && account.length > 0 ? `where : { account: "${account.toLowerCase()}"}` : `where : { account: "0x111"}`;
    const query = gql(`{
      actionDatas ( orderBy: timestamp orderDirection: desc first:50 ${queryString} ) {
        id
        action
        account
        txhash
        blockNumber
        timestamp
        params
      }
    }`);

      getMvxGraphClient(chainId).query({ query }).then(setTrades);
  }, [setTrades, chainId, account]);

  return { trades };
}

export function useTrailingStopOrders(account) {
  const url =
    account && account.length > 0
      ? `${process.env.REACT_APP_ORDER_API_URL}/trailing-stop-orders?account=${account}`
      : `${process.env.REACT_APP_ORDER_API_URL}/trailing-stop-orders`;
  const { data: trailingStopOrders, mutate: updateTrailingStopOrders } = useSWR(url, {
    dedupingInterval: 30000,
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  return { trailingStopOrders, updateTrailingStopOrders };
}


export function useTrades(chainId, account) {
  const url =
    account && account.length > 0
      ? `${getServerBaseUrl(chainId)}/actions?account=${account}`
      : `${getServerBaseUrl(chainId)}/actions`;

  const { data: trades, mutate: updateTrades } = useSWR(url, {
    dedupingInterval: 10000,
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  if (trades) {
    trades.sort((item0, item1) => {
      const data0 = item0.data;
      const data1 = item1.data;
      const time0 = parseInt(data0.timestamp);
      const time1 = parseInt(data1.timestamp);
      if (time1 > time0) {
        return 1;
      }
      if (time1 < time0) {
        return -1;
      }

      const block0 = parseInt(data0.blockNumber);
      const block1 = parseInt(data1.blockNumber);

      if (isNaN(block0) && isNaN(block1)) {
        return 0;
      }

      if (isNaN(block0)) {
        return 1;
      }

      if (isNaN(block1)) {
        return -1;
      }

      if (block1 > block0) {
        return 1;
      }

      if (block1 < block0) {
        return -1;
      }

      return 0;
    });
  }

  return { trades, updateTrades };
}

export function useMinExecutionFee(library, active, chainId, infoTokens) {
  const positionRouterAddress = getContract(chainId, "PositionRouter");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  const { data: minExecutionFee } = useSWR([active, chainId, positionRouterAddress, "minExecutionFee"], {
    fetcher: fetcher(library, PositionRouter),
  });

  const { data: gasPrice } = useSWR(["gasPrice", chainId], {
    fetcher: () => {
      return new Promise(async (resolve, reject) => {
        const provider = getProvider(library, chainId);
        if (!provider) {
          resolve(undefined);
          return;
        }

        try {
          const gasPrice = await provider.getGasPrice();
          resolve(gasPrice);
        } catch (e) {
          console.error(e);
        }
      });
    },
  });

  let multiplier;

  // multiplier for polygon is just the average gas usage
  if (chainId === POLYGON) {
    multiplier = 700000;
  }

  let finalExecutionFee = minExecutionFee;

  if (gasPrice && minExecutionFee) {
    const estimatedExecutionFee = gasPrice.mul(multiplier);
    if (estimatedExecutionFee.gt(minExecutionFee)) {
      finalExecutionFee = estimatedExecutionFee;
    }
  }

  const finalExecutionFeeUSD = getUsd(finalExecutionFee, nativeTokenAddress, false, infoTokens);
  const isFeeHigh = finalExecutionFeeUSD?.gt(expandDecimals(HIGH_EXECUTION_FEES_MAP[chainId], USD_DECIMALS));
  const errorMessage =
    isFeeHigh &&
    `The network cost to send transactions is high at the moment, please check the "Execution Fee" value before proceeding.`;

  return {
    minExecutionFee: finalExecutionFee,
    minExecutionFeeUSD: finalExecutionFeeUSD,
    minExecutionFeeErrorMessage: errorMessage,
  };
}

export function useStakedMvxSupply(library, active) {
  const mvxAddress = getContract(POLYGON, "MVX");
  const stakedMvxTrackerAddress = getContract(POLYGON, "StakedMvxTracker");

  const { data, mutate } = useSWR(
    [`StakeV2:stakedMvxSupply:${active}`, POLYGON, mvxAddress, "balanceOf", stakedMvxTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  return { data, mutate };
}

export function useMvdMvxTreasuryHoldings() {
  const { data: mvxHoldings, mutate: updateMvxTreasuryHoldings } = useSWR(
    [`MVX:mvxTreasuryHoldings:${POLYGON}`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [MVD_TREASURY_ADDRESS]),
    }
  );

  return {
    data: mvxHoldings ? bigNumberify(mvxHoldings) : undefined,
    mutate: updateMvxTreasuryHoldings,
  };
}

export function useMvxMultisigHoldings() {

  const { data: mvxHoldingsPolygon} = useSWR(
    [`MVX:mvxMultisigHoldings:${POLYGON}`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [MVX_MULTISIG_ADDRESS]),
    }
  );

  const { data: mvxHoldingsZksync } = useSWR(
    [`MVLP:mvxMultisigHoldings:${ZKSYNC}`, ZKSYNC, getContract(ZKSYNC, "MVX"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [getContract(ZKSYNC, "MvxDeployer")]),
    }
  );


  return {
    data: bigNumberify(mvxHoldingsPolygon || "0").add(mvxHoldingsZksync || "0"),
    mutate: null,
  };



}

export function useMvxReserveTimelockHoldings() {
  const { data: mvxHoldings, mutate: updateMvxMvxReserveTimelockHoldings } = useSWR(
    [`MVX:mvxReserveTimelockHoldings:${POLYGON}`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [MVX_RESERVE_TIMELOCK]),
    }
  );

  return {
    data: mvxHoldings ? bigNumberify(mvxHoldings) : undefined,
    mutate: updateMvxMvxReserveTimelockHoldings,
  };
}

export function useMvxTeamVestingHoldings() {
  const { data: mvxHoldings, mutate: updateMvxTeamVestingHoldings } = useSWR(
    [`MVX:mvxTeamVestingHoldings:${POLYGON}`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [MVX_TEAM_VESTING_ADDRESS]),
    }
  );

  return {
    data: mvxHoldings ? bigNumberify(mvxHoldings) : undefined,
    mutate: updateMvxTeamVestingHoldings,
  };
}

export function useVestingContractHoldings() {
  const { data: mvxVestingContract } = useSWR(
    [`MVX:vestingContractHoldings:${POLYGON}`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [getContract(POLYGON, "MvxVester")]),
    }
  );

  const { data: mvlpVestingContract } = useSWR(
    [`MVLP:vestingContractHoldings:${POLYGON}`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [getContract(POLYGON, "MvlpVester")]),
    }
  );

  return {
    data: bigNumberify(mvxVestingContract || "0").add(mvlpVestingContract || "0"),
    mutate: null,
  };
}

export function useMvdMvlpTreasuryHoldings() {
  const { data: mvlpHoldings, mutate: updateMvlpTreasuryHoldings } = useSWR(
    [`MVLP:mvlpTreasuryHoldings:${POLYGON}`, POLYGON, getContract(POLYGON, "StakedMvlpTracker"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [MVD_TREASURY_ADDRESS]),
    }
  );

  return {
    data: mvlpHoldings ? bigNumberify(mvlpHoldings) : undefined,
    mutate: updateMvlpTreasuryHoldings,
  };
}

export function useProtocolOwnLiquidity() {
  const { data: protocolOwnLiquidity, mutate: updateProtocolOwnLiquidity } = useSWR(
    [`ProtocolOwnLiquidity:${POLYGON}`, POLYGON, getContract(POLYGON, "StakedMvlpTracker"), "balanceOf"],
    {
      fetcher: fetcher(undefined, Token, [MVX_MULTISIG_ADDRESS]),
    }
  );

  return {
    data: protocolOwnLiquidity ? bigNumberify(protocolOwnLiquidity) : undefined,
    mutate: updateProtocolOwnLiquidity,
  };
}

export function useHasOutdatedUi() {
  // const url = getServerUrl(POLYGON, "/ui_version");
  // const { data, mutate } = useSWR([url], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.text()),
  // });

  // let hasOutdatedUi = false;

  // if (data && parseFloat(data) > parseFloat(UI_VERSION)) {
  //   hasOutdatedUi = true;
  // }

  return { data: false };
}

export function useMvxPrice(libraries, active,infoTokens) {
  const polygonLibrary = libraries && libraries.polygon ? libraries.polygon : undefined;
  const { data: mvxPrice, mutate: mutateFromPolygon } = useMvxPriceFromPolygon(polygonLibrary, active,infoTokens);

  const mutate = useCallback(() => {
    mutateFromPolygon();
  }, [mutateFromPolygon]);

  return {
    mvxPrice,
    mutate,
  };
}

export function useTotalMvxSupply() {
  const { data: mvxTotalSupply, mutate: updateMvxTotalSupply } = useSWR(
    [`MVX:totalMvxSupply:${POLYGON}`, POLYGON, getContract(POLYGON, "MVX"), "totalSupply"],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  return {
    total: mvxTotalSupply ? bigNumberify(mvxTotalSupply) : undefined,
    mutate: updateMvxTotalSupply,
  };
}

export function useTotalMvxStaked() {
  const stakedMvxTrackerAddressPolygon = getContract(POLYGON, "StakedMvxTracker");
  let totalStakedMvx = useRef(bigNumberify(0));
  const { data: stakedMvxSupplyPolygon, mutate: updateStakedMvxSupplyPolygon } = useSWR(
    [
      `StakeV2:stakedMvxSupply:${POLYGON}`,
      POLYGON,
      getContract(POLYGON, "MVX"),
      "balanceOf",
      stakedMvxTrackerAddressPolygon,
    ],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const mutate = useCallback(() => {
    updateStakedMvxSupplyPolygon();
  }, [updateStakedMvxSupplyPolygon]);

  if (stakedMvxSupplyPolygon) {
    let total = bigNumberify(stakedMvxSupplyPolygon);
    totalStakedMvx.current = total;
  }

  return {
    polygon: stakedMvxSupplyPolygon,
    total: totalStakedMvx.current,
    mutate,
  };
}

export function useTotalMvxInLiquidity() {
  let poolAddressUniswapWeth = getContract(POLYGON, "UniswapMvxWethPool");
  let poolAddressKyber = getContract(POLYGON, "KyberMvxWethPool");
  let poolAddressQuick = getContract(POLYGON, "QuickMvxWethPool");
  let poolAddressSolidly = getContract(POLYGON, "SolidlyMvxWethPool");
  let poolAddressSolidly2 = getContract(POLYGON, "Solidly2MvxWethPool");
  let poolAddressCelerPolygon = getContract(POLYGON, "CelerBridgeMvxWethPool");
  let poolAddressMute = getContract(ZKSYNC, "MuteMvxWethPool");
  let poolAddressVelocore = getContract(ZKSYNC, "VelocoreMvxWethPool");
  let poolAddressCeler = getContract(ZKSYNC, "CelerMvxWethPool");
  
  let totalMvx = useRef(bigNumberify(0));

  const { data: mvxInLiquidityOnUniswapWeth, mutate: mutateMvxInLiquidityOnUniswapWeth } = useSWR(
    [`StakeV2:mvxInLiquidity:UniswapWeth`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf", poolAddressUniswapWeth],
    {
      fetcher: fetcher(undefined, Token),
    }
  );
  const { data: mvxInLiquidityOnKyber, mutate: mutateMvxInLiquidityOnKyber } = useSWR(
    [`StakeV2:mvxInLiquidity:Kyber`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf", poolAddressKyber],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: mvxInLiquidityOnQuick, mutate: mutateMvxInLiquidityOnQuick } = useSWR(
    [`StakeV2:mvxInLiquidity:Quick`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf", poolAddressQuick],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: mvxInLiquidityOnSolidly, mutate: mutateMvxInLiquidityOnSolidly } = useSWR(
    [`StakeV2:mvxInLiquidity:Solidly`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf", poolAddressSolidly],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: mvxInLiquidityOnSolidly2, mutate: mutateMvxInLiquidityOnSolidly2 } = useSWR(
    [`StakeV2:mvxInLiquidity:Solidly2`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf", poolAddressSolidly2],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: mvxInLiquidityOnCelerPolygon, mutate: mutateMvxInLiquidityOnCelerPolygon } = useSWR(
    [`StakeV2:mvxInLiquidity:CelerPolygon`, POLYGON, getContract(POLYGON, "MVX"), "balanceOf", poolAddressCelerPolygon],
    {
      fetcher: fetcher(undefined, Token),
    }
  );
  

  const { data: mvxInLiquidityOnMute, mutate: mutateMvxInLiquidityOnMute } = useSWR(
    [`StakeV2:mvxInLiquidity:Mute`, ZKSYNC, getContract(ZKSYNC, "MVX"), "balanceOf", poolAddressMute],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: mvxInLiquidityOnVelocore, mutate: mutateMvxInLiquidityOnVelocore } = useSWR(
    [`StakeV2:mvxInLiquidity:Velocore`, ZKSYNC, getContract(ZKSYNC, "MVX"), "balanceOf", poolAddressVelocore],
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: mvxInLiquidityOnCeler, mutate: mutateMvxInLiquidityOnCeler } = useSWR(
    [`StakeV2:mvxInLiquidity:Celer`, ZKSYNC, getContract(ZKSYNC, "MVX"), "balanceOf", poolAddressCeler],
    {
      fetcher: fetcher(undefined, Token),
    }
  );


  const mutate = useCallback(() => {

    mutateMvxInLiquidityOnUniswapWeth();
    mutateMvxInLiquidityOnKyber();
    mutateMvxInLiquidityOnQuick();
    mutateMvxInLiquidityOnSolidly();
    mutateMvxInLiquidityOnSolidly2();
    mutateMvxInLiquidityOnCelerPolygon();
    mutateMvxInLiquidityOnMute();
    mutateMvxInLiquidityOnVelocore();
    mutateMvxInLiquidityOnCeler();
  }, [mutateMvxInLiquidityOnUniswapWeth, mutateMvxInLiquidityOnKyber, mutateMvxInLiquidityOnQuick,mutateMvxInLiquidityOnSolidly,mutateMvxInLiquidityOnSolidly2,mutateMvxInLiquidityOnCelerPolygon,mutateMvxInLiquidityOnMute,mutateMvxInLiquidityOnVelocore,mutateMvxInLiquidityOnCeler]);

  if ( mvxInLiquidityOnUniswapWeth && mvxInLiquidityOnKyber && mvxInLiquidityOnQuick && mvxInLiquidityOnSolidly && mvxInLiquidityOnSolidly2 && mvxInLiquidityOnCelerPolygon && mvxInLiquidityOnMute && mvxInLiquidityOnVelocore&& mvxInLiquidityOnCeler) {
    let total = bigNumberify(mvxInLiquidityOnUniswapWeth).add(mvxInLiquidityOnKyber).add(mvxInLiquidityOnQuick).add(mvxInLiquidityOnSolidly).add(mvxInLiquidityOnSolidly2).add(mvxInLiquidityOnCelerPolygon).add(mvxInLiquidityOnMute).add(mvxInLiquidityOnVelocore).add(mvxInLiquidityOnCeler);
    totalMvx.current = total;
  }
  return {
    uniswapWeth: mvxInLiquidityOnUniswapWeth,
    kyber: mvxInLiquidityOnKyber,
    quick: mvxInLiquidityOnQuick,
    solidly: mvxInLiquidityOnSolidly,
    solidly2: mvxInLiquidityOnSolidly2,
    total: totalMvx.current,
    mutate,
  };


}



export function useUserReferralCode(library, chainId, account) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const { data: userReferralCode, mutate: mutateUserReferralCode } = useSWR(
    account && [`ReferralStorage:traderReferralCodes`, chainId, referralStorageAddress, "traderReferralCodes", account],
    {
      fetcher: fetcher(library, ReferralStorage),
    }
  );
  return {
    userReferralCode,
    mutateUserReferralCode,
  };
}
export function useReferrerTier(library, chainId, account) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const { data: referrerTier, mutate: mutateReferrerTier } = useSWR(
    account && [`ReferralStorage:referrerTiers`, chainId, referralStorageAddress, "referrerTiers", account],
    {
      fetcher: fetcher(library, ReferralStorage),
    }
  );
  return {
    referrerTier,
    mutateReferrerTier,
  };
}
export function useCodeOwner(library, chainId, account, code) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const { data: codeOwner, mutate: mutateCodeOwner } = useSWR(
    account && code && [`ReferralStorage:codeOwners`, chainId, referralStorageAddress, "codeOwners", code],
    {
      fetcher: fetcher(library, ReferralStorage),
    }
  );
  return {
    codeOwner,
    mutateCodeOwner,
  };
}

function useMvxPriceFromPolygon(library, active,infoTokens) {
  const poolAddress = getContract(POLYGON, "UniswapMvxWethPool");
  const { data: uniPoolSlot0, mutate: updateUniPoolSlot0 } = useSWR(
    [`StakeV2:uniPoolSlot0:${active}`, POLYGON, poolAddress, "slot0"],
    {
      fetcher: fetcher(library, UniPool),
    }
  );

  const eth = infoTokens[getTokenBySymbol(POLYGON, "ETH").address];

  const mvxPrice = useMemo(() => {
    if (uniPoolSlot0 && eth && eth.maxPrice) {
      return bigNumberify(((uniPoolSlot0.sqrtPriceX96 / 2 ** 96) ** 2 * 1e18).toFixed()).mul(bigNumberify(10).pow(12)).mul(eth.maxPrice).div(bigNumberify(10).pow(30));
    }
  }, [uniPoolSlot0, eth]);

  const mutate = useCallback(() => {
    updateUniPoolSlot0(undefined, true);
  }, [updateUniPoolSlot0]);

  return { data: mvxPrice, mutate };
}

export async function approvePlugin(
  chainId,
  pluginAddress,
  { library, pendingTxns, setPendingTxns, sentMsg, failMsg }
) {
  const routerAddress = getContract(chainId, "Router");
  const contract = new ethers.Contract(routerAddress, Router.abi, library.getSigner());
  return callContract(chainId, contract, "approvePlugin", [pluginAddress], {
    sentMsg,
    failMsg,
    pendingTxns,
    setPendingTxns,
  });
}

export async function registerReferralCode(chainId, referralCode, { library, ...props }) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, library.getSigner());
  return callContract(chainId, contract, "registerCode", [referralCode], { ...props });
}
export async function setTraderReferralCodeByUser(chainId, referralCode, { library, ...props }) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, library.getSigner());
  const codeOwner = await contract.codeOwners(referralCode);
  if (isAddressZero(codeOwner)) {
    helperToast.error("Referral code does not exist");
    return new Promise((resolve, reject) => {
      reject();
    });
  }
  return callContract(chainId, contract, "setTraderReferralCodeByUser", [referralCode], {
    ...props,
  });
}
export async function getReferralCodeOwner(chainId, referralCode) {
  const referralStorageAddress = getContract(chainId, "ReferralStorage");
  const provider = getProvider(null, chainId);
  const contract = new ethers.Contract(referralStorageAddress, ReferralStorage.abi, provider);
  const codeOwner = await contract.codeOwners(referralCode);
  return codeOwner;
}

export async function createSwapOrder(
  chainId,
  library,
  path,
  amountIn,
  minOut,
  triggerRatio,
  nativeTokenAddress,
  opts = {}
) {
  const executionFee = getConstant(chainId, "SWAP_ORDER_EXECUTION_GAS_FEE");
  const triggerAboveThreshold = false;
  let shouldWrap = false;
  let shouldUnwrap = false;
  opts.value = executionFee;

  if (path[0] === AddressZero) {
    shouldWrap = true;
    opts.value = opts.value.add(amountIn);
  }
  if (path[path.length - 1] === AddressZero) {
    shouldUnwrap = true;
  }
  path = replaceNativeTokenAddress(path, nativeTokenAddress);

  const params = [path, amountIn, minOut, triggerRatio, triggerAboveThreshold, executionFee, shouldWrap, shouldUnwrap];

  const orderBookSwapAddress = getContract(chainId, "OrderBookSwap");
  const contract = new ethers.Contract(orderBookSwapAddress, OrderBookSwap.abi, library.getSigner());

  return callContract(chainId, contract, "createSwapOrder", params, opts);
}

export async function createIncreaseOrder(
  chainId,
  library,
  nativeTokenAddress,
  fromTokenAddress,
  amountIn,
  indexTokenAddress,
  minOut,
  sizeDelta,
  collateralTokenAddress,
  isLong,
  triggerPrice,
  orderProps,
  executionFees,
  opts = {}
) {
  invariant(!isLong || indexTokenAddress === collateralTokenAddress, "invalid token addresses");
  invariant(indexTokenAddress !== AddressZero, "indexToken is 0");
  invariant(collateralTokenAddress !== AddressZero, "collateralToken is 0");

  const fromETH = fromTokenAddress === AddressZero;
  const purchaseToken = fromETH ? nativeTokenAddress : fromTokenAddress;

  const shouldWrap = fromETH;
  const triggerAboveThreshold = !isLong;

  const params = [
    purchaseToken,
    amountIn,
    indexTokenAddress,
    sizeDelta,
    collateralTokenAddress,
    isLong,
    triggerPrice,
    triggerAboveThreshold,
    executionFees,
    shouldWrap,
    orderProps,
  ];

  if (!opts.value) {
    opts.value = fromETH ? amountIn.add(executionFees) : executionFees;
  }

  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, "createIncreaseOrder", params, opts);
}

export async function createDecreaseOrder(
  chainId,
  library,
  indexTokenAddress,
  sizeDelta,
  path,
  collateralDelta,
  isLong,
  triggerPrice,
  triggerAboveThreshold,
  minOut,
  withdrawETH,
  trailingStopPercentage,
  opts = {}
) {
  const collateralToken = path[0]
  invariant(!isLong || indexTokenAddress === collateralToken, "invalid token addresses");
  invariant(indexTokenAddress !== AddressZero, "indexToken is 0");
  invariant(collateralToken !== AddressZero, "collateralToken is 0");

  let executionFee = getConstant(chainId, "DECREASE_ORDER_EXECUTION_GAS_FEE");
  if(trailingStopPercentage > 0){
    executionFee =  getConstant(chainId, "TRAILING_STOP_EXECUTION_GAS_FEE")
  }
  
  const params = [
    indexTokenAddress,
    sizeDelta,
    path,
    collateralDelta,
    isLong,
    triggerPrice,
    triggerAboveThreshold,
    minOut,
    withdrawETH,
    trailingStopPercentage
  ];

  opts.value = executionFee;
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, "createDecreaseOrder", params, opts);
}

export async function cancelSwapOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelSwapOrder";
  const orderBookSwapAddress = getContract(chainId, "OrderBookSwap");
  const contract = new ethers.Contract(orderBookSwapAddress, OrderBookSwap.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelDecreaseOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelDecreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelIncreaseOrder(chainId, library, index, opts) {
  const params = [index];
  const method = "cancelIncreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export function handleCancelOrder(chainId, library, order, opts) {
  let func;
  if (order.type === SWAP) {
    func = cancelSwapOrder;
  } else if (order.type === INCREASE) {
    func = cancelIncreaseOrder;
  } else if (order.type === DECREASE) {
    func = cancelDecreaseOrder;
  }

  return func(chainId, library, order.index, {
    successMsg: "Order cancelled.",
    failMsg: "Cancel failed.",
    sentMsg: "Cancel submitted.",
    pendingTxns: opts.pendingTxns,
    setPendingTxns: opts.setPendingTxns,
  });
}

export async function cancelMultipleOrders(chainId, library, allIndexes = [], opts) {
  const ordersWithTypes = groupBy(allIndexes, (v) => v.split("-")[0]);
  function getIndexes(key) {
    if (!ordersWithTypes[key]) return;
    return ordersWithTypes[key].map((d) => d.split("-")[1]);
  }
  // params order => swap, increase, decrease
  const params = ["Swap", "Increase", "Decrease"].map((key) => getIndexes(key) || []);
  const method = "cancelMultiple";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());
  return callContract(chainId, contract, method, params, opts);
}

export async function updateDecreaseOrder(
  chainId,
  library,
  index,
  collateralDelta,
  sizeDelta,
  triggerPrice,
  triggerAboveThreshold,
  trailingStopPercentage,
  opts
) {
  const params = [index, collateralDelta, sizeDelta, triggerPrice, triggerAboveThreshold,trailingStopPercentage];
  const method = "updateDecreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateIncreaseOrder(
  chainId,
  library,
  index,
  sizeDelta,
  triggerPrice,
  triggerAboveThreshold,
  opts
) {
  const params = [index, sizeDelta, triggerPrice, triggerAboveThreshold];
  const method = "updateIncreaseOrder";
  const orderBookAddress = getContract(chainId, "OrderBook");
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateSwapOrder(chainId, library, index, minOut, triggerRatio, triggerAboveThreshold, opts) {
  const params = [index, minOut, triggerRatio, triggerAboveThreshold];
  const method = "updateSwapOrder";
  const orderBookSwapAddress = getContract(chainId, "OrderBookSwap");
  const contract = new ethers.Contract(orderBookSwapAddress, OrderBookSwap.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function _executeOrder(chainId, library, method, account, index, feeReceiver, opts) {
  const params = [account, index, feeReceiver];
  const positionManagerAddress = getContract(chainId, "PositionManager");
  const contract = new ethers.Contract(positionManagerAddress, PositionManager.abi, library.getSigner());
  return callContract(chainId, contract, method, params, opts);
}

export function executeSwapOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeSwapOrder", account, index, feeReceiver, opts);
}

export function executeIncreaseOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeIncreaseOrder", account, index, feeReceiver, opts);
}

export function executeDecreaseOrder(chainId, library, account, index, feeReceiver, opts) {
  return _executeOrder(chainId, library, "executeDecreaseOrder", account, index, feeReceiver, opts);
}

const NOT_ENOUGH_FUNDS = "NOT_ENOUGH_FUNDS";
const USER_DENIED = "USER_DENIED";
const SLIPPAGE = "SLIPPAGE";
const TX_ERROR_PATTERNS = {
  [NOT_ENOUGH_FUNDS]: ["not enough funds for gas", "failed to execute call with revert code InsufficientGasFunds"],
  [USER_DENIED]: ["User denied transaction signature"],
  [SLIPPAGE]: ["Router: mkt. price lower than limit", "Router: mkt. price higher than limit"],
};
export function extractError(ex) {
  if (!ex) {
    return [];
  }
  const message = ex.data?.message || ex.message;
  if (!message) {
    return [];
  }
  for (const [type, patterns] of Object.entries(TX_ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (message.includes(pattern)) {
        return [message, type];
      }
    }
  }
  return [message];
}

function ToastifyDebug(props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="Toastify-debug">
      {!open && (
        <span className="Toastify-debug-button" onClick={() => setOpen(true)}>
          Show error
        </span>
      )}
      {open && props.children}
    </div>
  );
}

export async function callContract(chainId, contract, method, params, opts) {
  try {
    if (!Array.isArray(params) && typeof params === "object" && opts === undefined) {
      opts = params;
      params = [];
    }
    if (!opts) {
      opts = {};
    }

    const txnOpts = {};

    if (opts.value) {
      txnOpts.value = opts.value;
    }

    txnOpts.gasLimit = opts.gasLimit ? opts.gasLimit : await getGasLimit(contract, method, params, opts.value);

    await setGasPrice(txnOpts, contract.provider, chainId);

    const res = await contract[method](...params, txnOpts);
    const txUrl = getExplorerUrl(chainId) + "tx/" + res.hash;
    const sentMsg = opts.sentMsg || "Transaction sent.";
    helperToast.success(
      <div>
        {sentMsg}{" "}
        <a style={{ color: "#ffaa27" }} href={txUrl} target="_blank" rel="noopener noreferrer">
          View status.
        </a>
        <br />
      </div>
    );
    if (opts.setPendingTxns) {
      const pendingTxn = {
        hash: res.hash,
        message: opts.successMsg || "Transaction completed!",
      };
      opts.setPendingTxns((pendingTxns) => [...pendingTxns, pendingTxn]);
    }
    return res;
  } catch (e) {
    let failMsg;
    const [message, type] = extractError(e);
    switch (type) {
      case NOT_ENOUGH_FUNDS:
        failMsg = <div>There is not enough MATIC in your account on Polygon to send this transaction.</div>;
        break;
      case USER_DENIED:
        failMsg = "Transaction was cancelled.";
        break;
      case SLIPPAGE:
        failMsg =
          'The mkt. price has changed, consider increasing your Allowed Slippage by clicking on the "..." icon next to your address.';
        break;
      default:
        failMsg = (
          <div>
            {opts.failMsg || "Transaction failed."}
            <br />
            {message && <ToastifyDebug>{message}</ToastifyDebug>}
          </div>
        );
    }
    helperToast.error(failMsg);
    throw e;
  }
}

export function useTotalVolume() {
  const swrKey = ["getTotalVolume"];
  let { data: totalVolume } = useSWR(swrKey, {
    fetcher: async (...args) => {
      try {
        return await getTotalVolumeFromGraph();
      } catch (ex2) {
        console.warn("getTotalVolumeFromGraph failed");
        console.warn(ex2);
        return [];
      }
      // }
    },
    dedupingInterval: 30000,
    focusThrottleInterval: 60000 * 5,
  });

  return totalVolume;
}

function getTotalVolumeFromGraph() {
  const requests = [];
  const nowTs = parseInt(Date.now() / 1000);

  const query = gql(`{
      volumeStats( 
        where: {period: total , timestamp_lte: ${nowTs}}  
        ) 
     {  
       margin    
       liquidation    
       swap    
       mint    
       burn
      }
    }`);
  requests.push(polygonGraphClient.query({ query }));

  return Promise.all(requests)
    .then((chunks) => {
      let totalVolume;
      chunks.forEach((chunk) => {
        chunk.data.volumeStats.forEach((item) => {
          totalVolume = bigNumberify(item.margin)
            .add(bigNumberify(item.liquidation))
            .add(bigNumberify(item.swap))
            .add(bigNumberify(item.mint))
            .add(bigNumberify(item.burn));
        });
      });

      return totalVolume;
    })
    .catch((err) => {
      console.error(err);
    });
}

export function useHourlyVolume() {
  const swrKey = ["getHourlyVolume"];
  let { data: hourlyVolume } = useSWR(swrKey, {
    fetcher: async (...args) => {
      try {
        return await getHourlyVolumeFromGraph();
      } catch (ex2) {
        console.warn("getHourlyVolumeFromGraph failed");
        console.warn(ex2);
        return [];
      }
      // }
    },
    dedupingInterval: 30000,
    focusThrottleInterval: 60000 * 5,
  });

  return hourlyVolume;
}

function getHourlyVolumeFromGraph() {
  const requests = [];
  const secondsPerHour = 60 * 60;
  const minTime = parseInt(Date.now() / 1000 / secondsPerHour) * secondsPerHour - 24 * secondsPerHour;
  const nowTs = parseInt(Date.now() / 1000);

  const query = gql(`{
      volumeStats(
        where: {period: hourly, timestamp_gte: ${minTime}, timestamp_lte: ${nowTs}}
        orderBy: timestamp
        orderDirection: desc
        first: 50
      ) {
        timestamp
        margin
        liquidation
        swap
        mint
        burn
        __typename
      }
    }`);
  requests.push(polygonGraphClient.query({ query }));

  return Promise.all(requests)
    .then((chunks) => {
      let hourlyVolume = bigNumberify(0);
      chunks.forEach((chunk) => {
        chunk.data.volumeStats.forEach((item) => {
          hourlyVolume = hourlyVolume
            .add(bigNumberify(item.margin))
            .add(bigNumberify(item.liquidation))
            .add(bigNumberify(item.swap))
            .add(bigNumberify(item.mint))
            .add(bigNumberify(item.burn));
        });
      });
      return hourlyVolume;
    })
    .catch((err) => {
      console.error(err);
    });
}

export function useTotalFees() {
  const swrKey = ["getTotalFees"];
  let { data: totalFees } = useSWR(swrKey, {
    fetcher: async (...args) => {
      try {
        return await getTotalFeesFromGraph();
      } catch (ex2) {
        console.warn("getTotalFeesFromGraph failed");
        console.warn(ex2);
        return [];
      }
      // }
    },
    dedupingInterval: 30000,
    focusThrottleInterval: 60000 * 5,
  });

  return totalFees;
}

function getTotalFeesFromGraph() {
  const requests = [];

  const nowTs = parseInt(Date.now() / 1000);

  const query = gql(`{
    feeStats(
      first: 1000
      orderBy: id
      orderDirection: desc
      where: { period: daily, timestamp_gte: ${FIRST_DATE_TS}, timestamp_lte: ${nowTs} }
    ) {
      id
      margin
      marginAndLiquidation
      swap
      mint
      burn
      timestamp
    }
  }`);

  requests.push(polygonGraphClient.query({ query }));

  return Promise.all(requests)
    .then((chunks) => {
      let totalFees = bigNumberify(0);
      chunks.forEach((chunk) => {
        chunk.data.feeStats.forEach((item) => {
          totalFees = totalFees
            .add(bigNumberify(item.marginAndLiquidation))
            .add(bigNumberify(item.swap))
            .add(bigNumberify(item.mint))
            .add(bigNumberify(item.burn));
        });
      });

      return totalFees;
    })
    .catch((err) => {
      console.error(err);
    });
}
