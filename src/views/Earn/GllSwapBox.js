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
    // formatDateTime,
    getBuyGllToAmount,
    getBuyGllFromAmount,
    getSellGllFromAmount,
    getSellGllToAmount,
    parseValue,
    approveTokens,
    getUsd,
    adjustForDecimals,
    GLL_DECIMALS,
    USD_DECIMALS,
    BASIS_POINTS_DIVISOR,
    GLL_COOLDOWN_DURATION,
    SECONDS_PER_YEAR,
    USDG_DECIMALS,
    BSC,
    PLACEHOLDER_ACCOUNT,
    SLIPPAGE_BPS_KEY,
    DEFAULT_SLIPPAGE_AMOUNT,
    useLocalStorageSerializeKey,
} from "../../Helpers";
import { callContract, useInfoTokens } from "../../Api";

import TokenSelector from "../../components/Exchange/TokenSelector";
import BuyInputSection from "../../components/BuyInputSection/BuyInputSection";
import Tooltip from "../../components/Tooltip/Tooltip";

import Reader from "../../abis/Reader.json";
import RewardReader from "../../abis/RewardReader.json";
import Vault from "../../abis/Vault.json";
import GllManager from "../../abis/GllManager.json";
import RewardTracker from "../../abis/RewardTracker.json";
import RewardRouter from "../../abis/RewardRouter.json";
import Token from "../../abis/Token.json";

import gll24Icon from "../../assets/icons/honey-token.svg";
import ItemCard from '../../components/ItemCard/ItemCard'
import IconMoney from '../../assets/icons/icon-investments-money.svg'
import IconNext from '../../assets/icons/icon-next-left.svg'

const { AddressZero } = ethers.constants;

function getStakingData(stakingInfo) {
    if (!stakingInfo || stakingInfo.length === 0) {
        return;
    }

    const keys = ["feeGllTracker"];
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
    const { isBuying, setPendingTxns, connectWallet, getWeightText } = props;
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
    const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);
    const [swapValue, setSwapValue] = useState("");
    const [gllValue, setGllValue] = useState("");
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
    const stakedGllTrackerAddress = getContract(chainId, "StakedGllTracker");
    const feeGllTrackerAddress = getContract(chainId, "FeeGllTracker");
    const usdgAddress = getContract(chainId, "USDG");
    const gllManagerAddress = getContract(chainId, "GllManager");
    const rewardRouterAddress = getContract(chainId, "RewardRouter");
    const tokensForBalanceAndSupplyQuery = [stakedGllTrackerAddress, usdgAddress];

    const tokenAddresses = tokens.map((token) => token.address);
    const { data: tokenBalances } = useSWR(
        [`GllSwap:getTokenBalances:${active}`, chainId, readerAddress, "getTokenBalances", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, Reader, [tokenAddresses]),
        }
    );
    const { data: balancesAndSupplies } = useSWR(
        [
            `GllSwap:getTokenBalancesWithSupplies:${active}`,
            chainId,
            readerAddress,
            "getTokenBalancesWithSupplies",
            account || PLACEHOLDER_ACCOUNT,
        ],
        {
            fetcher: fetcher(library, Reader, [tokensForBalanceAndSupplyQuery]),
        }
    );

    const { data: fundingRateInfo } = useSWR([active, chainId, readerAddress, "getFundingRates"], {
        fetcher: fetcher(library, Reader, [vaultAddress, nativeTokenAddress, whitelistedTokenAddresses]),
    });

    const { infoTokens } = useInfoTokens(library, chainId, active, tokenBalances, fundingRateInfo);

    const { data: aums } = useSWR([`GllSwap:getAums:${active}`, chainId, gllManagerAddress, "getAums"], {
        fetcher: fetcher(library, GllManager),
    });

    const { data: totalTokenWeights } = useSWR(
        [`GllSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
        {
            fetcher: fetcher(library, Vault),
        }
    );

    const tokenAllowanceAddress = swapTokenAddress === AddressZero ? nativeTokenAddress : swapTokenAddress;
    const { data: tokenAllowance } = useSWR(
        [active, chainId, tokenAllowanceAddress, "allowance", account || PLACEHOLDER_ACCOUNT, gllManagerAddress],
        {
            fetcher: fetcher(library, Token),
        }
    );

    const { data: lastPurchaseTime } = useSWR(
        [`GllSwap:lastPurchaseTime:${active}`, chainId, gllManagerAddress, "lastAddedAt", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, GllManager),
        }
    );

    const { data: gllBalance } = useSWR(
        [`GllSwap:gllBalance:${active}`, chainId, feeGllTrackerAddress, "stakedAmounts", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, RewardTracker),
        }
    );

    const rewardTrackersForStakingInfo = [feeGllTrackerAddress];
    const { data: stakingInfo } = useSWR(
        [`GllSwap:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
        }
    );

    const stakingData = getStakingData(stakingInfo);

    const redemptionTime = lastPurchaseTime ? lastPurchaseTime.add(GLL_COOLDOWN_DURATION) : undefined;
    const inCooldownWindow = redemptionTime && parseInt(Date.now() / 1000) < redemptionTime;

    const gllSupply = balancesAndSupplies ? balancesAndSupplies[1] : bigNumberify(0);
    const usdgSupply = balancesAndSupplies ? balancesAndSupplies[3] : bigNumberify(0);
    let aum;
    if (aums && aums.length > 0) {
        aum = isBuying ? aums[0] : aums[1];
    }
    const gllPrice =
        aum && aum.gt(0) && gllSupply.gt(0)
            ? aum.mul(expandDecimals(1, GLL_DECIMALS)).div(gllSupply)
            : expandDecimals(1, USD_DECIMALS);
    let gllBalanceUsd;
    if (gllBalance) {
        gllBalanceUsd = gllBalance.mul(gllPrice).div(expandDecimals(1, GLL_DECIMALS));
    }
    const gllSupplyUsd = gllSupply.mul(gllPrice).div(expandDecimals(1, GLL_DECIMALS));


    const swapToken = getToken(chainId, swapTokenAddress);
    const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);

    const swapTokenBalance = swapTokenInfo && swapTokenInfo.balance ? swapTokenInfo.balance : bigNumberify(0);

    const swapAmount = parseValue(swapValue, swapToken && swapToken.decimals);
    const gllAmount = parseValue(gllValue, GLL_DECIMALS);

    const needApproval =
        isBuying && swapTokenAddress !== AddressZero && tokenAllowance && swapAmount && swapAmount.gt(tokenAllowance);

    const swapUsdMin = getUsd(swapAmount, swapTokenAddress, false, infoTokens);
    const gllUsdMax =
        gllAmount && gllPrice ? gllAmount.mul(gllPrice).div(expandDecimals(1, GLL_DECIMALS)) : undefined;

    let isSwapTokenCapReached;
    if (swapTokenInfo.managedUsd && swapTokenInfo.maxUsdgAmount) {
        isSwapTokenCapReached = swapTokenInfo.managedUsd.gt(
            adjustForDecimals(swapTokenInfo.maxUsdgAmount, USDG_DECIMALS, USD_DECIMALS)
        );
    }

    const onSwapValueChange = (e) => {
        setAnchorOnSwapAmount(true);
        setSwapValue(e.target.value);
    };

    const onGllValueChange = (e) => {
        setAnchorOnSwapAmount(false);
        setGllValue(e.target.value);
    };

    const onSelectSwapToken = (token) => {
        setSwapTokenAddress(token.address);
        setIsWaitingForApproval(false);
    };

    const nativeToken = getTokenInfo(infoTokens, AddressZero);

    let totalApr = bigNumberify(0);

    let feeGllTrackerAnnualRewardsUsd;
    let feeGllTrackerApr;
    if (
        stakingData &&
        stakingData.feeGllTracker &&
        stakingData.feeGllTracker.tokensPerInterval &&
        nativeToken &&
        nativeToken.minPrice &&
        gllSupplyUsd &&
        gllSupplyUsd.gt(0)
    ) {
        feeGllTrackerAnnualRewardsUsd = stakingData.feeGllTracker.tokensPerInterval
            .mul(SECONDS_PER_YEAR)
            .mul(nativeToken.minPrice)
            .div(expandDecimals(1, 18));
        feeGllTrackerApr = feeGllTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(gllSupplyUsd);
        totalApr = totalApr.add(feeGllTrackerApr);
    }

    useEffect(() => {
        const updateSwapAmounts = () => {
            if (anchorOnSwapAmount) {
                if (!swapAmount) {
                    setGllValue("");
                    setFeeBasisPoints("");
                    return;
                }

                if (isBuying) {
                    const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyGllToAmount(
                        swapAmount,
                        swapTokenAddress,
                        infoTokens,
                        gllPrice,
                        usdgSupply,
                        totalTokenWeights
                    );
                    const nextValue = formatAmountFree(nextAmount, GLL_DECIMALS, GLL_DECIMALS);
                    setGllValue(nextValue);
                    setFeeBasisPoints(feeBps);
                } else {
                    const { amount: nextAmount, feeBasisPoints: feeBps } = getSellGllFromAmount(
                        swapAmount,
                        swapTokenAddress,
                        infoTokens,
                        gllPrice,
                        usdgSupply,
                        totalTokenWeights
                    );
                    const nextValue = formatAmountFree(nextAmount, GLL_DECIMALS, GLL_DECIMALS);
                    setGllValue(nextValue);
                    setFeeBasisPoints(feeBps);
                }

                return;
            }

            if (!gllAmount) {
                setSwapValue("");
                setFeeBasisPoints("");
                return;
            }

            if (swapToken) {
                if (isBuying) {
                    const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyGllFromAmount(
                        gllAmount,
                        swapTokenAddress,
                        infoTokens,
                        gllPrice,
                        usdgSupply,
                        totalTokenWeights
                    );
                    const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
                    setSwapValue(nextValue);
                    setFeeBasisPoints(feeBps);
                } else {
                    const { amount: nextAmount, feeBasisPoints: feeBps } = getSellGllToAmount(
                        gllAmount,
                        swapTokenAddress,
                        infoTokens,
                        gllPrice,
                        usdgSupply,
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
        gllAmount,
        swapToken,
        swapTokenAddress,
        infoTokens,
        gllPrice,
        usdgSupply,
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
        setGllValue(formatAmountFree(maxSellAmount, GLL_DECIMALS, GLL_DECIMALS));
    };

    const getError = () => {
        if (!isBuying && inCooldownWindow) {
            return [`Redemption time not yet reached`];
        }

        if (!swapAmount || swapAmount.eq(0)) {
            return ["Enter an amount"];
        }
        if (!gllAmount || gllAmount.eq(0)) {
            return ["Enter an amount"];
        }

        if (isBuying) {
            const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
            if (swapTokenInfo && swapTokenInfo.balance && swapAmount && swapAmount.gt(swapTokenInfo.balance)) {
                return [`Insufficient ${swapTokenInfo.symbol} Balance`];
            }

            if (swapTokenInfo.maxUsdgAmount && swapTokenInfo.usdgAmount && swapUsdMin) {
                const usdgFromAmount = adjustForDecimals(swapUsdMin, USD_DECIMALS, USDG_DECIMALS);
                const nextUsdgAmount = swapTokenInfo.usdgAmount.add(usdgFromAmount);
                if (swapTokenInfo.maxUsdgAmount.gt(0) && nextUsdgAmount.gt(swapTokenInfo.maxUsdgAmount)) {
                    return [`${swapTokenInfo.symbol} pool exceeded, try different token`, true];
                }
            }
        }

        if (!isBuying) {
            if (maxSellAmount && gllAmount && gllAmount.gt(maxSellAmount)) {
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
            spender: gllManagerAddress,
            chainId: chainId,
            onApproveSubmitted: () => {
                setIsWaitingForApproval(true);
            },
            infoTokens,
            getTokenInfo,
        });
    };

    const buyGll = () => {
        setIsSubmitting(true);

        const minGll = gllAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        const method = swapTokenAddress === AddressZero ? "mintAndStakeGllETH" : "mintAndStakeGll";
        const params = swapTokenAddress === AddressZero ? [0, minGll] : [swapTokenAddress, swapAmount, 0, minGll];
        const value = swapTokenAddress === AddressZero ? swapAmount : 0;

        callContract(chainId, contract, method, params, {
            value,
            sentMsg: "Providing...",
            failMsg: "Deposit failed.",
            successMsg: `${formatAmount(swapAmount, swapTokenInfo.decimals, 4, true)} ${swapTokenInfo.symbol
                } provided for ${formatAmount(gllAmount, 18, 4, true)} GLL !`,
            setPendingTxns,
        })
            .then(async () => { })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const sellGll = () => {
        setIsSubmitting(true);

        const minOut = swapAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        const method = swapTokenAddress === AddressZero ? "unstakeAndRedeemGllETH" : "unstakeAndRedeemGll";
        const params =
            swapTokenAddress === AddressZero
                ? [gllAmount, minOut, account]
                : [swapTokenAddress, gllAmount, minOut, account];

        callContract(chainId, contract, method, params, {
            sentMsg: "Withdraw submitted!",
            failMsg: "Withdraw failed.",
            successMsg: `${formatAmount(gllAmount, 18, 4, true)} GLL sold for ${formatAmount(
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
            buyGll();
        } else {
            sellGll();
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
        if (gllUsdMax) {
            receiveBalance = `$${formatAmount(gllUsdMax, USD_DECIMALS, 2, true)}`;
        }
    } else {
        if (gllUsdMax) {
            payBalance = `$${formatAmount(gllUsdMax, USD_DECIMALS, 2, true)}`;
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

    let maxSellAmount = gllBalance;
    if (gllBalance ) {
        maxSellAmount = gllBalance;
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
        <div className="GllSwap-box App-box basis-mobile section-gllswapbox">
            {gllBalance && gllBalance.gt(0) ?
                <ItemCard
                    className='col-span-2'
                    label='Current Deposit'
                    value={
                        <div className="font-number" style={{ display: "inline-flex",alignItems:"center", fontSize: "24px", fontWeight: "500" }}>
                            {formatAmount(gllBalance, GLL_DECIMALS, 4, true)} GLL
                            <div className="font-number" style={{ display: "inline-flex", fontSize: "16px", fontWeight:"400", opacity: "0.5" }}>
                                (~${formatAmount(gllBalanceUsd, USD_DECIMALS, 2, true)})
                            </div>
                        </div>
                    }
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
                            showBorder={true}
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
                            // tokenBalance={`${formatAmount(maxSellAmount, GLL_DECIMALS, 4, true)}`}
                            inputValue={gllValue}
                            onInputValueChange={onGllValueChange}
                            showMaxButton={gllValue !== formatAmountFree(maxSellAmount, GLL_DECIMALS, GLL_DECIMALS)}
                            onClickTopRightLabel={fillMaxAmount}
                            onClickMax={fillMaxAmount}
                            balance={payBalance}
                            defaultTokenName={"GLL"}
                            showBorder={true}
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
                        <img src={IconNext} alt="" width={16} style={{ marginBottom: "-8px", opacity: "0.3" }} />
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
                            // tokenBalance={`${formatAmount(gllBalance, GLL_DECIMALS, 4, true)}`}
                            inputValue={gllValue}
                            onInputValueChange={onGllValueChange}
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
                        {isBuying && gllAmount && <div className="font-number">{formatAmountFree(gllAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR), GLL_DECIMALS, 2)} GLL</div>}
                        {!isBuying && swapAmount && <div className="font-number">{formatAmountFree(swapAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR), swapToken.decimals, swapToken.displayDecimals)} {swapToken.symbol}</div>}
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