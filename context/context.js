import React, {useState} from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import JSBI from "jsbi";
import web3Modal from "web3modal";

// internal import
import { SwapRouter } from "@uniswap/universal-router-sdk";
import { 
    TradeType, 
    Ether, 
    CurrencyAmount, 
    Token, 
    Percent,
} from "@uniswap/sdk-core";
import { Trade as V2Trade } from "@uniswap/v2-sdk";

import { 
    Pool, 
    nearestUsableTick, 
    TickMath, 
    TICK_SPACINGS, 
    FeeAmount, 
    Trade as V3Trade, 
    Route as RouteV3, 
} from "@uniswap/v3-sdk";

import { MixedRouteTrade, Trade as RouterTrade } from "@uniswap/router-sdk";
import IUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";


// internal import 
import { ERC20_ABI, web3ModalProvider, CONNECTING_CONTRACT } from "./constants";
import { shortAddress, parseErrorMsg } from "../utils/index";;

export const CONTEXT = React.createContext({});

export const PROVIDER = ({ children }) => {
    const TOKEN_SWAP = "TOKEN_SWAP";
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState("");
    const [chainId, setChainId] = useState();

    // notification
    const notifyError = (message) => toast.error(message, { duration: 4000 });
    const notifySuccess = (message) => toast.success(message, { duration: 4000 });

    // connect wallet
    const connect = async () => {
        try {
            if(!window.ethereum) return notifyError("Please install MetaMask");
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            if(accounts.length) {
                setAddress(accounts[0]);
            } else {
                notifyError("Please connect wallet");
            }
            const provider = await web3ModalProvider();
            const network = await provider.getNetwork();
            setChainId(network.chainId);
        } catch (error) {
            notifyError(parseErrorMsg(error));
        }
    }

    const LOAD_TOKEN = async (token) => {
        try {
            const tokenDetail = await CONNECTING_CONTRACT(token);
            return tokenDetail;
        } catch (error) {
            notifyError(parseErrorMsg(error));
        }
    }

    // internal function 

    async function getPool(tokenA, tokenB, feeAmount, provider) {
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
        console.log("Token0:", token0);
        console.log("Token1:", token1);
        console.log("FeeAmount:", feeAmount);
        const poolAddress = Pool.getAddress(token0, token1, feeAmount);
        console.log("Pool Address:", poolAddress);
    
        const contract = new ethers.Contract(poolAddress, IUniswapV3Pool.abi, provider);
        const slot0 = await contract.slot0();
        console.log("slot0:", slot0);
        const liquidityParts = await contract.liquidity();
        console.log("liquidityParts:", liquidityParts);
        // let liquidity = await contract.liquidity();
        // let { sqrtPriceX96, tick } = await contract.slot0();
    
        const sqrtPriceX96 = JSBI.BigInt(slot0[0].toString());
        const liquidity = JSBI.BigInt(liquidityParts.toString());
        // Extract tick value explicitly
        const tick = slot0.tick; 
        console.log("Converted sqrtPriceX96:", sqrtPriceX96.toString());
        console.log("Converted liquidity:", liquidity.toString());
        console.log("Tick:", tick);
    
        console.log("calling pool --------");
    
        try {
            const pool = new Pool(token0, token1, feeAmount, sqrtPriceX96, liquidity, tick, [
                {
                    index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
                    liquidityNet: liquidity,
                    liquidityGross: liquidity,
                },{
                    index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
                    liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt("-1")),
                    liquidityGross: liquidity,
                }
            ]);
    
            console.log("Created Pool instance:", pool);
            return pool;
        } catch (error) {
            console.error("Error creating Pool instance:", error);
            return undefined;
        }    
    }
    

    // swap_options 

    function swapOptions(options) {
        return Object.assign(
            {
                slippageTolerance: new Percent(5, 1000),
                recipient: RECIPIENT,
            },
            options
        );
    }
    

    // BUILDTRADE

    function buildTrade(trades) {
        if (trades.length === 0) {
            console.log("No trades to process.");
            return;
        }
    
        console.log("Building trade with trades:", trades);
    
        const routeTrade = new RouterTrade({
            v2Routes: trades
                .filter((trade) => trade instanceof V2Trade)
                .map((trade) => ({
                    routev2: trade.route,
                    inputAmount: trade.inputAmount,
                    outputAmount: trade.outputAmount,
                })),
            v3Routes: trades
                .filter((trade) => trade instanceof V3Trade)
                .map((trade) => ({
                    routev3: trade.route,
                    inputAmount: trade.inputAmount,
                    outputAmount: trade.outputAmount,
                })),
            mixedRoutes: trades
                .filter((trade) => trade instanceof MixedRouteTrade)
                .map((trade) => ({
                    mixedRoutes: trade.route,
                    inputAmount: trade.inputAmount,
                    outputAmount: trade.outputAmount,
                })),
            tradeType: trades[0]?.tradeType ?? "default",
        });
    
        console.log("Built trade:", routeTrade);
        return routeTrade;
    }
    
    

    // DEMO ACCOUNT 
    const RECIPIENT = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

    // swap functions 
    const swap = async (token_1, token_2, swapInputAmount) => {
        setLoading(true);
        console.log("swapInputAmount:", swapInputAmount);
        try{
            if(!token_1 || !token_2 || !swapInputAmount) return notifyError("Please select token");
            console.log("calling me-------swap");
            // const _inputAmount = 1;
            const provider = await web3ModalProvider();
            const signer = provider.getSigner();

            // USER ADDRESS
            const userAddress = await signer.getAddress();
            const ETHER = Ether.onChain(token_1.ChainId);
            // const ETHER = ETHER.onChain(1);

            // token contract 
            const tokenAddress_1 = await CONNECTING_CONTRACT(token_1.address); // 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
            const tokenAddress_2 = await CONNECTING_CONTRACT(token_2.address); // 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48

            const TOKEN_A = new Token(
                tokenAddress_1.ChainId, 
                tokenAddress_1.address, 
                tokenAddress_1.decimals, 
                tokenAddress_1.symbol, 
                tokenAddress_1.name
            );

            const TOKEN_B = new Token(
                tokenAddress_2.ChainId, 
                tokenAddress_2.address, 
                tokenAddress_2.decimals, 
                tokenAddress_2.symbol, 
                tokenAddress_2.name
            );

            const WETH_USDC_V3 = await getPool(
                TOKEN_A, 
                TOKEN_B, 
                FeeAmount.MEDIUM, 
                provider
            );
            console.log("WETH_USDC_V3 pool:",WETH_USDC_V3);

            const inputEther = ethers.utils.parseEther(swapInputAmount).toString();
            console.log("inputEther:", inputEther);

            const trade = await V3Trade.fromRoute(
                new RouteV3([WETH_USDC_V3], ETHER, TOKEN_B),
                CurrencyAmount.fromRawAmount(ETHER, inputEther),
                TradeType.EXACT_INPUT
            );

            // console.log("trade:", trade);
            // if (trade && trade.swaps && trade.swaps.length > 0) {
            //     const swap = trade.swaps[0];
            //     console.log("Swap input amount:", swap.inputAmount.toExact());
            //     console.log("Swap output amount:", swap.outputAmount.toExact());
            // } else {
            //     console.error("Trade or swaps array is empty.");
            // }

            let routerTrade;
            try {
                console.log("trade:", trade); // Log trade to check if it’s valid
                routerTrade =  buildTrade([trade]); // Ensure async is handled
                if (routerTrade) {
                    console.log("routerTrade:", routerTrade);
                } else {
                    console.error("routerTrade is undefined or null");
                }
            } catch (error) {
                console.error("Error building trade:", error);
            }

            const opts = swapOptions({});
            console.log("opts:", opts);

            let params;
            try {
                params = SwapRouter.swapCallParameters(routerTrade, opts);
                console.log("params:", params);
            } catch (error) {
                console.log("Error:", error);
            }

            let ethBalance;
            let tokenA;
            let tokenB;

            ethBalance = await provider.getBalance(userAddress);
            tokenA = await tokenAddress_1.balance;
            tokenB = await tokenAddress_2.balance;
            console.log("BEFORE SWAP");
            console.log("ETH balance:", ethers.utils.formatEther(ethBalance, 18));
            console.log("Token A balance:", tokenA);
            console.log("Token B balance:", tokenB);

            let tx;
            try {
                tx = await signer.sendTransaction({
                    data: params.calldata,
                    to: userAddress,  // Replace with Uniswap router address
                    value: params.value,     // Ensure this is set correctly based on the swap type
                    from: userAddress
                });
                const receipt = await tx.wait();
                console.log("Transaction successful:", receipt);
            } catch (error) {
                console.error("Transaction failed:", error);
            }
            console.log("tx:", tx);

            console.log("------------calling_me")
            const receipt = await tx.wait();

            console.log("-------------SUCCESS");
            console.log("Status", receipt.status);

            ethBalance = await provider.getBalance(userAddress);
            tokenA = tokenAddress_1.balance;
            tokenB = tokenAddress_2.balance;
            console.log("AFTER SWAP");
            console.log("ETH balance:", ethers.utils.formatEther(ethBalance, 18));
            notifySuccess(`TOKEN: ${token_1.symbol}, ${token_2.symbol} SWAPPED SUCCESSFULLY`);
            setLoading(false);
            console.log("Token A balance:", tokenA);
            console.log("Token B balance:", tokenB);

        } catch (error) {
            const message = parseErrorMsg(error);
            notifyError(message);
            console.log(message);
        }
    }

    return (
        <CONTEXT.Provider 
        value={{ 
            TOKEN_SWAP,
            LOAD_TOKEN,
            notifyError,
            notifySuccess,
            setLoading,
            loading,
            connect,
            address,
            swap,
        }}> 
        
        {children}{""}
    </CONTEXT.Provider>
    )

}
