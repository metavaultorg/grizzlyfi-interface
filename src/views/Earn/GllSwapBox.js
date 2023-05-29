import React, { useState, useEffect } from "react";
import './GllSwapBox.css'

import { useHistory } from "react-router-dom";

import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { ethers } from "ethers";
import Tab from "../../components/Tab/Tab";
import cx from "classnames";

import { getToken, getTokens, getWhitelistedTokens, getWrappedToken, getNativeToken } from "../../data/Tokens";
import { getContract } from "../../Addresses";
import {
    helperToast,
    useLocalStorageByChainId,
    getTokenInfo,
    // getChainName,
    useChainId,
    expandDecimals,
    fetcher,
    bigNumberify,
    formatAmount,
    formatAmountFree,
    formatKeyAmount,
    // formatDateTime,
    getBuyMvlpToAmount,
    getBuyMvlpFromAmount,
    getSellMvlpFromAmount,
    getSellMvlpToAmount,
    parseValue,
    approveTokens,
    getUsd,
    adjustForDecimals,
    MVLP_DECIMALS,
    USD_DECIMALS,
    BASIS_POINTS_DIVISOR,
    MVLP_COOLDOWN_DURATION,
    SECONDS_PER_YEAR,
    USDM_DECIMALS,
    POLYGON,
    PLACEHOLDER_ACCOUNT,
    MVXMVLP_DISPLAY_DECIMALS,
    SLIPPAGE_BPS_KEY,
    DEFAULT_SLIPPAGE_AMOUNT,
    useLocalStorageSerializeKey,
} from "../../Helpers";
import { callContract, useMvxPrice, useInfoTokens } from "../../Api";

import TokenSelector from "../../components/Exchange/TokenSelector";
import BuyInputSection from "../../components/BuyInputSection/BuyInputSection";
import Tooltip from "../../components/Tooltip/Tooltip";

import Reader from "../../abis/Reader.json";
import RewardReader from "../../abis/RewardReader.json";
import Vault from "../../abis/Vault.json";
import MvlpManager from "../../abis/MvlpManager.json";
import RewardTracker from "../../abis/RewardTracker.json";
import Vester from "../../abis/Vester.json";
import RewardRouter from "../../abis/RewardRouter.json";
import Token from "../../abis/Token.json";

import gll24Icon from "../../assets/icons/honey-token.svg";
import mvlp24Icon from "../../img/ic_mvlp_24.svg";
import mvlp40Icon from "../../assets/icons/mvlpCoin.png";
import arrowIcon from "../../img/ic_convert_down.svg";
import ItemCard from '../../components/ItemCard/ItemCard'
import IconPercentage from '../../assets/icons/icon-percentage.svg'
import IconMoney from '../../assets/icons/icon-investments-money.svg'
import IconClaim from '../../assets/icons/icon-claim-reward.svg'
import IconNext from '../../assets/icons/icon-next-left.svg'

import OliveSvg from "../../assets/platforms/olive.svg";

import AssetDropdown from "../../views/Dashboard/AssetDropdown";
import { getImageUrl } from "../../cloudinary/getImageUrl";

const { AddressZero } = ethers.constants;

function getStakingData(stakingInfo) {
    if (!stakingInfo || stakingInfo.length === 0) {
        return;
    }

    const keys = ["stakedMvlpTracker", "feeMvlpTracker"];
    const data = {};
    const propsLength = 5;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        data[key] = {
            claimable: stakingInfo[i * propsLength],
            tokensPerInterval: stakingInfo[i * propsLength + 1],
            averageStakedAmounts: stakingInfo[i * propsLength + 2],
            cumulativeRewards: stakingInfo[i * propsLength + 3],
            totalSupply: stakingInfo[i * propsLength + 4],
        };
    }

    return data;
}
export default function GllSwapBox(props) {
    const { isBuying, setPendingTxns, connectWallet, setIsBuying, getWeightText } = props;
    const history = useHistory();
    const swapLabel = isBuying ? "+ LIQ." : "- LIQ.";
    const tabLabel = isBuying ? "Deposit" : "Withdraw";
    const { active, library, account } = useWeb3React();
    const { chainId } = useChainId();
    const [savedSlippageAmount, setSavedSlippageAmount] = useLocalStorageSerializeKey(
        [chainId, SLIPPAGE_BPS_KEY],
        DEFAULT_SLIPPAGE_AMOUNT
    );

    const tokens = getTokens(chainId);
    const whitelistedTokens = getWhitelistedTokens(chainId);
    const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
    const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);
    
    const [swapValue, setSwapValue] = useState("");
    const [mvlpValue, setMvlpValue] = useState("");
    const [swapTokenAddress, setSwapTokenAddress] = useLocalStorageByChainId(
        chainId,
        `${swapLabel}-swap-token-address`,
        AddressZero
    );
    const [isApproving, setIsApproving] = useState(false);
    const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [anchorOnSwapAmount, setAnchorOnSwapAmount] = useState(true);
    const [feeBasisPoints, setFeeBasisPoints] = useState("");

    const readerAddress = getContract(chainId, "Reader");
    const rewardReaderAddress = getContract(chainId, "RewardReader");
    const vaultAddress = getContract(chainId, "Vault");
    const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
    const stakedMvlpTrackerAddress = getContract(chainId, "StakedMvlpTracker");
    const feeMvlpTrackerAddress = getContract(chainId, "FeeMvlpTracker");
    const usdmAddress = getContract(chainId, "USDM");
    const mvlpManagerAddress = getContract(chainId, "MvlpManager");
    const rewardRouterAddress = getContract(chainId, "RewardRouter");
    const tokensForBalanceAndSupplyQuery = [stakedMvlpTrackerAddress, usdmAddress];

    const tokenAddresses = tokens.map((token) => token.address);
    const { data: tokenBalances } = useSWR(
        [`MvlpSwap:getTokenBalances:${active}`, chainId, readerAddress, "getTokenBalances", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, Reader, [tokenAddresses]),
        }
    );
    const { data: balancesAndSupplies } = useSWR(
        [
            `MvlpSwap:getTokenBalancesWithSupplies:${active}`,
            chainId,
            readerAddress,
            "getTokenBalancesWithSupplies",
            account || PLACEHOLDER_ACCOUNT,
        ],
        {
            fetcher: fetcher(library, Reader, [tokensForBalanceAndSupplyQuery]),
        }
    );

    const { data: aums } = useSWR([`MvlpSwap:getAums:${active}`, chainId, mvlpManagerAddress, "getAums"], {
        fetcher: fetcher(library, MvlpManager),
    });

    const { data: totalTokenWeights } = useSWR(
        [`MvlpSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
        {
            fetcher: fetcher(library, Vault),
        }
    );

    const tokenAllowanceAddress = swapTokenAddress === AddressZero ? nativeTokenAddress : swapTokenAddress;
    const { data: tokenAllowance } = useSWR(
        [active, chainId, tokenAllowanceAddress, "allowance", account || PLACEHOLDER_ACCOUNT, mvlpManagerAddress],
        {
            fetcher: fetcher(library, Token),
        }
    );

    const { data: lastPurchaseTime } = useSWR(
        [`MvlpSwap:lastPurchaseTime:${active}`, chainId, mvlpManagerAddress, "lastAddedAt", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, MvlpManager),
        }
    );

    const { data: mvlpBalance } = useSWR(
        [`MvlpSwap:mvlpBalance:${active}`, chainId, feeMvlpTrackerAddress, "stakedAmounts", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, RewardTracker),
        }
    );
    const mvlpVesterAddress = getContract(chainId, "MvlpVester");
    const { data: reservedAmount } = useSWR(
        [`MvlpSwap:reservedAmount:${active}`, chainId, mvlpVesterAddress, "pairAmounts", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, Vester),
        }
    );

    const { mvxPrice } = useMvxPrice({ polygon: chainId === POLYGON ? library : undefined }, active, infoTokens);

    const rewardTrackersForStakingInfo = [stakedMvlpTrackerAddress, feeMvlpTrackerAddress];
    const { data: stakingInfo } = useSWR(
        [`MvlpSwap:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
        }
    );

    const stakingData = getStakingData(stakingInfo);

    const redemptionTime = lastPurchaseTime ? lastPurchaseTime.add(MVLP_COOLDOWN_DURATION) : undefined;
    const inCooldownWindow = redemptionTime && parseInt(Date.now() / 1000) < redemptionTime;

    const mvlpSupply = balancesAndSupplies ? balancesAndSupplies[1] : bigNumberify(0);
    const usdmSupply = balancesAndSupplies ? balancesAndSupplies[3] : bigNumberify(0);
    let aum;
    if (aums && aums.length > 0) {
        aum = isBuying ? aums[0] : aums[1];
    }
    const mvlpPrice =
        aum && aum.gt(0) && mvlpSupply.gt(0)
            ? aum.mul(expandDecimals(1, MVLP_DECIMALS)).div(mvlpSupply)
            : expandDecimals(1, USD_DECIMALS);
    let mvlpBalanceUsd;
    if (mvlpBalance) {
        mvlpBalanceUsd = mvlpBalance.mul(mvlpPrice).div(expandDecimals(1, MVLP_DECIMALS));
    }
    const mvlpSupplyUsd = mvlpSupply.mul(mvlpPrice).div(expandDecimals(1, MVLP_DECIMALS));

    let reserveAmountUsd;
    if (reservedAmount) {
        reserveAmountUsd = reservedAmount.mul(mvlpPrice).div(expandDecimals(1, MVLP_DECIMALS));
    }

    const swapToken = getToken(chainId, swapTokenAddress);
    const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);

    const swapTokenBalance = swapTokenInfo && swapTokenInfo.balance ? swapTokenInfo.balance : bigNumberify(0);

    const swapAmount = parseValue(swapValue, swapToken && swapToken.decimals);
    const mvlpAmount = parseValue(mvlpValue, MVLP_DECIMALS);

    const needApproval =
        isBuying && swapTokenAddress !== AddressZero && tokenAllowance && swapAmount && swapAmount.gt(tokenAllowance);

    const swapUsdMin = getUsd(swapAmount, swapTokenAddress, false, infoTokens);
    const mvlpUsdMax =
        mvlpAmount && mvlpPrice ? mvlpAmount.mul(mvlpPrice).div(expandDecimals(1, MVLP_DECIMALS)) : undefined;

    let isSwapTokenCapReached;
    if (swapTokenInfo.managedUsd && swapTokenInfo.maxUsdmAmount) {
        isSwapTokenCapReached = swapTokenInfo.managedUsd.gt(
            adjustForDecimals(swapTokenInfo.maxUsdmAmount, USDM_DECIMALS, USD_DECIMALS)
        );
    }

    const onSwapValueChange = (e) => {
        setAnchorOnSwapAmount(true);
        setSwapValue(e.target.value);
    };

    const onMvlpValueChange = (e) => {
        setAnchorOnSwapAmount(false);
        setMvlpValue(e.target.value);
    };

    const onSelectSwapToken = (token) => {
        setSwapTokenAddress(token.address);
        setIsWaitingForApproval(false);
    };

    const nativeToken = getTokenInfo(infoTokens, AddressZero);

    let totalApr = bigNumberify(0);

    let feeMvlpTrackerAnnualRewardsUsd;
    let feeMvlpTrackerApr;
    if (
        stakingData &&
        stakingData.feeMvlpTracker &&
        stakingData.feeMvlpTracker.tokensPerInterval &&
        nativeToken &&
        nativeToken.minPrice &&
        mvlpSupplyUsd &&
        mvlpSupplyUsd.gt(0)
    ) {
        feeMvlpTrackerAnnualRewardsUsd = stakingData.feeMvlpTracker.tokensPerInterval
            .mul(SECONDS_PER_YEAR)
            .mul(nativeToken.minPrice)
            .div(expandDecimals(1, 18));
        feeMvlpTrackerApr = feeMvlpTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(mvlpSupplyUsd);
        totalApr = totalApr.add(feeMvlpTrackerApr);
    }

    let stakedMvlpTrackerAnnualRewardsUsd;
    let stakedMvlpTrackerApr;

    if (
        mvxPrice &&
        stakingData &&
        stakingData.stakedMvlpTracker &&
        stakingData.stakedMvlpTracker.tokensPerInterval &&
        mvlpSupplyUsd &&
        mvlpSupplyUsd.gt(0)
    ) {
        stakedMvlpTrackerAnnualRewardsUsd = stakingData.stakedMvlpTracker.tokensPerInterval
            .mul(SECONDS_PER_YEAR)
            .mul(mvxPrice)
            .div(expandDecimals(1, 18));
        stakedMvlpTrackerApr = stakedMvlpTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(mvlpSupplyUsd);
        totalApr = totalApr.add(stakedMvlpTrackerApr);
    }

    useEffect(() => {
        const updateSwapAmounts = () => {
            if (anchorOnSwapAmount) {
                if (!swapAmount) {
                    setMvlpValue("");
                    setFeeBasisPoints("");
                    return;
                }

                if (isBuying) {
                    const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyMvlpToAmount(
                        swapAmount,
                        swapTokenAddress,
                        infoTokens,
                        mvlpPrice,
                        usdmSupply,
                        totalTokenWeights
                    );
                    const nextValue = formatAmountFree(nextAmount, MVLP_DECIMALS, MVLP_DECIMALS);
                    setMvlpValue(nextValue);
                    setFeeBasisPoints(feeBps);
                } else {
                    const { amount: nextAmount, feeBasisPoints: feeBps } = getSellMvlpFromAmount(
                        swapAmount,
                        swapTokenAddress,
                        infoTokens,
                        mvlpPrice,
                        usdmSupply,
                        totalTokenWeights
                    );
                    const nextValue = formatAmountFree(nextAmount, MVLP_DECIMALS, MVLP_DECIMALS);
                    setMvlpValue(nextValue);
                    setFeeBasisPoints(feeBps);
                }

                return;
            }

            if (!mvlpAmount) {
                setSwapValue("");
                setFeeBasisPoints("");
                return;
            }

            if (swapToken) {
                if (isBuying) {
                    const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyMvlpFromAmount(
                        mvlpAmount,
                        swapTokenAddress,
                        infoTokens,
                        mvlpPrice,
                        usdmSupply,
                        totalTokenWeights
                    );
                    const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
                    setSwapValue(nextValue);
                    setFeeBasisPoints(feeBps);
                } else {
                    const { amount: nextAmount, feeBasisPoints: feeBps } = getSellMvlpToAmount(
                        mvlpAmount,
                        swapTokenAddress,
                        infoTokens,
                        mvlpPrice,
                        usdmSupply,
                        totalTokenWeights,
                        true
                    );

                    const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
                    setSwapValue(nextValue);
                    setFeeBasisPoints(feeBps);
                }
            }
        };

        updateSwapAmounts();
    }, [
        isBuying,
        anchorOnSwapAmount,
        swapAmount,
        mvlpAmount,
        swapToken,
        swapTokenAddress,
        infoTokens,
        mvlpPrice,
        usdmSupply,
        totalTokenWeights,
    ]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const switchSwapOption = (hash = "") => {
        history.push(`${history.location.pathname}#${hash}`);
        props.setIsBuying(hash === "redeem" ? false : true);
    };

    const fillMaxAmount = () => {
        if (isBuying) {
            setAnchorOnSwapAmount(true);
            setSwapValue(formatAmountFree(swapTokenBalance, swapToken.decimals, swapToken.decimals));
            return;
        }

        setAnchorOnSwapAmount(false);
        setMvlpValue(formatAmountFree(maxSellAmount, MVLP_DECIMALS, MVLP_DECIMALS));
    };

    const getError = () => {
        if (!isBuying && inCooldownWindow) {
            return [`Redemption time not yet reached`];
        }

        if (!swapAmount || swapAmount.eq(0)) {
            return ["Enter an amount"];
        }
        if (!mvlpAmount || mvlpAmount.eq(0)) {
            return ["Enter an amount"];
        }

        if (isBuying) {
            const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
            if (swapTokenInfo && swapTokenInfo.balance && swapAmount && swapAmount.gt(swapTokenInfo.balance)) {
                return [`Insufficient ${swapTokenInfo.symbol} Balance`];
            }

            if (swapTokenInfo.maxUsdmAmount && swapTokenInfo.usdmAmount && swapUsdMin) {
                const usdmFromAmount = adjustForDecimals(swapUsdMin, USD_DECIMALS, USDM_DECIMALS);
                const nextUsdmAmount = swapTokenInfo.usdmAmount.add(usdmFromAmount);
                if (swapTokenInfo.maxUsdmAmount.gt(0) && nextUsdmAmount.gt(swapTokenInfo.maxUsdmAmount)) {
                    return [`${swapTokenInfo.symbol} pool exceeded, try different token`, true];
                }
            }
        }

        if (!isBuying) {
            if (maxSellAmount && mvlpAmount && mvlpAmount.gt(maxSellAmount)) {
                return [`Insufficient GLL Balance`];
            }

            const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
            if (
                swapTokenInfo &&
                swapTokenInfo.availableAmount &&
                swapAmount &&
                swapAmount.gt(swapTokenInfo.availableAmount)
            ) {
                return [`Insufficient Liquidity`];
            }
        }

        return [false];
    };

    const isPrimaryEnabled = () => {
        if (!active) {
            return true;
        }
        const [error, modal] = getError();
        if (error) {
            console.error(error);
        }
        if (error && !modal) {
            return false;
        }
        if ((needApproval && isWaitingForApproval) || isApproving) {
            return false;
        }
        if (isApproving) {
            return false;
        }
        if (isSubmitting) {
            return false;
        }
        if (isBuying && isSwapTokenCapReached) {
            return false;
        }

        return true;
    };

    const getPrimaryText = () => {
        if (!active) {
            return "Connect Wallet";
        }
        const [error, modal] = getError();
        if (error) {
            console.error(error);
        }

        if (error && !modal) {
            return error;
        }
        if (isBuying && isSwapTokenCapReached) {
            return `Max Capacity for ${swapToken.symbol} Reached`;
        }

        if (needApproval && isWaitingForApproval) {
            return "Waiting for Approval";
        }
        if (isApproving) {
            return `Approving ${swapToken.symbol}...`;
        }
        if (needApproval) {
            return `Approve ${swapToken.symbol}`;
        }

        if (isSubmitting) {
            return isBuying ? `Providing...` : `is selling the ...`;
        }

        return isBuying ? "Deposit" : "Withdraw";
    };

    const approveFromToken = () => {
        approveTokens({
            setIsApproving,
            library,
            tokenAddress: swapToken.address,
            spender: mvlpManagerAddress,
            chainId: chainId,
            onApproveSubmitted: () => {
                setIsWaitingForApproval(true);
            },
            infoTokens,
            getTokenInfo,
        });
    };

    const buyMvlp = () => {
        setIsSubmitting(true);

        const minMvlp = mvlpAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        const method = swapTokenAddress === AddressZero ? "mintAndStakeMvlpETH" : "mintAndStakeMvlp";
        const params = swapTokenAddress === AddressZero ? [0, minMvlp] : [swapTokenAddress, swapAmount, 0, minMvlp];
        const value = swapTokenAddress === AddressZero ? swapAmount : 0;

        callContract(chainId, contract, method, params, {
            value,
            sentMsg: "Providing...",
            failMsg: "Deposit failed.",
            successMsg: `${formatAmount(swapAmount, swapTokenInfo.decimals, 4, true)} ${swapTokenInfo.symbol
                } provided for ${formatAmount(mvlpAmount, 18, 4, true)} GLL !`,
            setPendingTxns,
        })
            .then(async () => { })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const sellMvlp = () => {
        setIsSubmitting(true);

        const minOut = swapAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        const method = swapTokenAddress === AddressZero ? "unstakeAndRedeemMvlpETH" : "unstakeAndRedeemMvlp";
        const params =
            swapTokenAddress === AddressZero
                ? [mvlpAmount, minOut, account]
                : [swapTokenAddress, mvlpAmount, minOut, account];

        callContract(chainId, contract, method, params, {
            sentMsg: "Withdraw submitted!",
            failMsg: "Withdraw failed.",
            successMsg: `${formatAmount(mvlpAmount, 18, 4, true)} GLL sold for ${formatAmount(
                swapAmount,
                swapTokenInfo.decimals,
                4,
                true
            )} ${swapTokenInfo.symbol}!`,
            setPendingTxns,
        })
            .then(async () => { })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const onClickPrimary = () => {
        if (!active) {
            connectWallet();
            return;
        }

        if (needApproval) {
            approveFromToken();
            return;
        }

        const [error, modal] = getError();
        if (error) {
            console.error(error);
        }

        if (modal) {
            return;
        }

        if (isBuying) {
            buyMvlp();
        } else {
            sellMvlp();
        }
    };

    let payLabel = "Pay";
    let receiveLabel = "Receive";
    let payBalance = "$0.00";
    let receiveBalance = "$0.00";
    if (isBuying) {
        if (swapUsdMin) {
            payBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
        }
        if (mvlpUsdMax) {
            receiveBalance = `$${formatAmount(mvlpUsdMax, USD_DECIMALS, 2, true)}`;
        }
    } else {
        if (mvlpUsdMax) {
            payBalance = `$${formatAmount(mvlpUsdMax, USD_DECIMALS, 2, true)}`;
        }
        if (swapUsdMin) {
            receiveBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
        }
    }

    const selectToken = (token) => {
        setAnchorOnSwapAmount(false);
        setSwapTokenAddress(token.address);
        helperToast.success(`${token.symbol} selected in order form`);
    };

    let feePercentageText = formatAmount(feeBasisPoints, 2, 2, true, "-");
    if (feeBasisPoints !== undefined && feeBasisPoints.toString().length > 0) {
        feePercentageText += "%";
    }

    let maxSellAmount = mvlpBalance;
    if (mvlpBalance && reservedAmount) {
        maxSellAmount = mvlpBalance.sub(reservedAmount);
    }

    const wrappedTokenSymbol = getWrappedToken(chainId).symbol;
    const nativeTokenSymbol = getNativeToken(chainId).symbol;

    const onSwapOptionChange = (opt) => {
        if (opt === "Withdraw") {
            switchSwapOption("redeem");
        } else {
            switchSwapOption();
        }
    };

    return (
        <div className="GllSwap-box App-box basis-mobile">
            {mvlpBalance && mvlpBalance.gt(0) ?
                <ItemCard
                    className='col-span-2'
                    label='Current Deposit'
                    value={`$${formatAmount(mvlpBalance, MVLP_DECIMALS, 4, true)} GLL (~$${formatAmount(mvlpBalanceUsd, USD_DECIMALS, 2, true)})`}
                    icon={IconMoney} />
                :
                <ItemCard
                    style={{ opacity: "0.5" }}
                    className='col-span-2'
                    label='Your Total Deposits'
                    value={`${formatAmount(0, USD_DECIMALS, 2, true)}`}
                    icon={IconMoney} />
            }
            <Tab
                options={["Deposit", "Withdraw"]}
                option={tabLabel}
                onChange={onSwapOptionChange}
                className="Exchange-swap-option-tabs"
            />
            <div className="GllSwap-content">
                <div className="GllSwap-buy-section">
                    <div className="GllSwap-text">How much collateral will you add to position?</div>
                    {isBuying && (
                        <BuyInputSection
                            topLeftLabel={`≈ `}
                            topRightLabel={`Balance: `}
                            tokenBalance={`${formatAmount(swapTokenBalance, swapToken.decimals, 4, true)}`}
                            inputValue={swapValue}
                            onInputValueChange={onSwapValueChange}
                            showMaxButton={swapValue !== formatAmountFree(swapTokenBalance, swapToken.decimals, swapToken.decimals)}
                            onClickTopRightLabel={fillMaxAmount}
                            onClickMax={fillMaxAmount}
                            selectedToken={swapToken}
                            balance={payBalance}
                        >
                            <TokenSelector
                                label="Pay"
                                chainId={chainId}
                                tokenAddress={swapTokenAddress}
                                onSelectToken={onSelectSwapToken}
                                tokens={whitelistedTokens}
                                infoTokens={infoTokens}
                                className="GllSwap-from-token"
                                showSymbolImage={true}
                                showTokenImgInDropdown={true}
                                newStyle={true}
                            />
                        </BuyInputSection>
                    )}

                    {!isBuying && (
                        <BuyInputSection
                            topLeftLabel={`≈ `}
                            topRightLabel={`Available: `}
                            tokenBalance={`${formatAmount(maxSellAmount, MVLP_DECIMALS, 4, true)}`}
                            inputValue={mvlpValue}
                            onInputValueChange={onMvlpValueChange}
                            showMaxButton={mvlpValue !== formatAmountFree(maxSellAmount, MVLP_DECIMALS, MVLP_DECIMALS)}
                            onClickTopRightLabel={fillMaxAmount}
                            onClickMax={fillMaxAmount}
                            balance={payBalance}
                            defaultTokenName={"GLL"}
                        >
                            <div className="selected-token">
                                <div className="selected-token-img-container">
                                    <img src={gll24Icon} alt="gll24Icon" width={18} height={18} />
                                </div>
                                <span className="selected-token-text">GLL</span>
                            </div>
                        </BuyInputSection>
                    )}
                </div>
                <div className="GllSwap-dividing">
                    <div className="GllSwap-dividing-line" />
                    <div className="GllSwap-next">
                        <img src={IconNext} alt="" width={16} style={{marginBottom:"-8px",opacity:"0.3"}}/>
                        <img src={IconNext} alt="" width={16} />
                    </div>
                </div>
                {/* <div className="AppOrder-ball-container">
                    <div className="AppOrder-ball">
                        <img
                            src={arrowIcon}
                            alt="arrowIcon"
                            onClick={() => {
                                setIsBuying(!isBuying);
                                switchSwapOption(isBuying ? "redeem" : "");
                            }}
                        />
                    </div>
                </div> */}

                <div className="GllSwap-buy-section">
                    <div className="GllSwap-text">You will Recieve</div>
                    {isBuying && (
                        <BuyInputSection
                            topLeftLabel={`≈ `}
                            topRightLabel={`Balance: `}
                            tokenBalance={`${formatAmount(mvlpBalance, MVLP_DECIMALS, 4, true)}`}
                            inputValue={mvlpValue}
                            onInputValueChange={onMvlpValueChange}
                            balance={receiveBalance}
                            defaultTokenName={"GLL"}
                        >
                            <div className="selected-token">
                                <div className="selected-token-img-container">
                                    <img src={gll24Icon} alt="gll24Icon" width={18} height={18} />
                                </div>
                                <span className="selected-token-text">GLL</span>
                            </div>
                        </BuyInputSection>
                    )}

                    {!isBuying && (
                        <BuyInputSection
                            topLeftLabel={`≈ `}
                            topRightLabel={`Balance: `}
                            tokenBalance={`${formatAmount(swapTokenBalance, swapToken.decimals, 4, true)}`}
                            inputValue={swapValue}
                            onInputValueChange={onSwapValueChange}
                            balance={receiveBalance}
                            selectedToken={swapToken}
                        >
                            <TokenSelector
                                label="Receive"
                                chainId={chainId}
                                tokenAddress={swapTokenAddress}
                                onSelectToken={onSelectSwapToken}
                                tokens={whitelistedTokens}
                                infoTokens={infoTokens}
                                className="GllSwap-from-token"
                                showSymbolImage={true}
                                showTokenImgInDropdown={true}
                                newStyle={true}
                            />
                        </BuyInputSection>
                    )}
                </div>
                <div className="GllSwap-data">
                    <div className="Exchange-info-row">
                        <div className="Exchange-info-label">Slippage</div>
                        <div className="font-number">{(parseInt(savedSlippageAmount) / BASIS_POINTS_DIVISOR) * 100}%</div>
                    </div>
                    <div className="Exchange-info-row">
                        <div className="Exchange-info-label">Minimum Received</div>
                        {isBuying && mvlpAmount && <div className="font-number">{formatAmountFree(mvlpAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR), MVLP_DECIMALS, 2)} GLL</div>}
                        {!isBuying && mvlpAmount && <div className="font-number">{formatAmountFree(swapAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR), swapToken.decimals, swapToken.displayDecimals)} {swapToken.symbol}</div>}
                    </div>
                    <div className="Exchange-info-row">
                        <div className="Exchange-info-label">Weight / Target</div>
                        {getWeightText(infoTokens[swapToken.address])}
                    </div>
                    <div className="Exchange-info-row">
                        <div className="Exchange-info-label">{feeBasisPoints > 50 ? "WARNING: High Fees" : "Fees"}</div>
                        <div className="align-right fee-block">
                            {isBuying && (
                                <Tooltip
                                    handle={isBuying && isSwapTokenCapReached ? "NA" : feePercentageText}
                                    position="right-bottom"
                                    handleClassName="font-number"
                                    renderContent={() => {
                                        return (
                                            <>
                                                {feeBasisPoints > 50 && (
                                                    <div>Select an alternative asset for providing liquidity to reduce fees.</div>
                                                )}
                                                To get the lowest fee percentages, look in the "SAVE FEES" section below.
                                            </>
                                        );
                                    }}
                                />
                            )}
                            {!isBuying && (
                                <Tooltip
                                    handle={feePercentageText}
                                    position="right-bottom"
                                    handleClassName="font-number"
                                    renderContent={() => {
                                        return (
                                            <>
                                                {feeBasisPoints > 50 && (
                                                    <div>To reduce fees, select a different asset to remove liquidity.</div>
                                                )}
                                                To get the lowest fee percentages, look in the "SAVE FEES" section below.
                                            </>
                                        );
                                    }}
                                />
                            )}
                        </div>
                    </div>

                </div>
            </div>


            <div className="GllSwap-cta Exchange-swap-button-container">
                <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
                    {getPrimaryText()}
                </button>
            </div>
        </div>
    )
}