import React, { Children, useState} from "react";
import { ethers, Signer } from "ethers";
import toast from "react-hot-toast";
import JSBI from "jsbi";
import Web3Modal from "web3modal";

import { SwapRouter } from "@uniswap/universal-router-sdk";
import { TradeType, Ether, CurrencyAmount, Token, Percent, sqrt, Ether } from "@uniswap/sdk-core";
import { Trade as V2Trade } from "@uniswap/v2-sdk";
import { Pool, nearestUsableTick, TickMath, TICK_SPACINGS, FeeAmount, Trade as V3Trade, Route as RouteV3 } from "@uniswap/v3-sdk";

import { MixedRouteTrade, Trade as RouterTrade, RouteV2 } from "@uniswap/router-sdk"
import IUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";

import {ERC20_ABI, web3Provider, CONNECTING_CONTRACT} from './constants'
import { shortAddress, parseErrorMsg } from "../utils/index";
import { ETHER } from "@uniswap/sdk";

export const Context = React.createContext();

export const PROVIDER = ({ Children }) => {
    const TOKEN_SWAP = "TOKEN_SWAP";
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState("");
    const [chainId, setChainId] = useState();

    const notifyError = (msg) => toast.error(msg, { duration: 5000 });
    const notifySuccess = (msg) => toast.success(msg, { duration: 5000 });

    const connect = async () => {
        try{
            if(!window.ethereum) return notifyError("Please install MetaMask");

            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

            if(accounts.length){
                setAddress(accounts[0]);
            } else {
                notifyError("Sorry, you have no account ");
            }

            const provider = await web3Provider();
            const network = await provider.getNetwork();
        } catch (error) {
            notifyError(parseErrorMsg(error));
        }
    };

    // load token data 

    const LOAD_TOKEN = async (token) => {
        try {
            const tokenDetail = await CONNECTING_CONTRACT(token);
            return tokenDetail;
        } catch (error) {
            notifyError(parseErrorMsg(error));
            console.log(error);
        }
    }

    // INTERNAL FUNCTION
    async function getPool(tokenA, tokenB, feeAmount, provider) {
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
        const poolAddress = Pool.getAddress(token0, token1, feeAmount);

        const contract = new ethers.Contract(poolAddress, IUniswapV3Pool, provider);

        let liquidity = await contract.liquidity();

        let { sqrtPriceX96 , tick } = await contract.slot0();

        liquidity = JSBI.BigInt(liquidity.toString());
        sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96.toString());

        console.log("Calling Pool----------")
        return new Pool(token0, token1, feeAmount, sqrtPriceX96, liquidity, tick, [
            {
                index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[FeeAmount]),
                liquidityNet: liquidity,
                liquidityGross: liquidity,
            },
            {
                index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[FeeAmount]),
                liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt("-1")),
                liquidityGross: liquidity,
            },
        ]);

    }

    // sawp option function
    function swapOptions(options){
        return Object.assign(
            {
                slippageTolerance: new Percent(5, 1000),
                recipient: RECIPIENT,
            },
            options
        )
    }

    function buildTrade(trade) {
        return new RouterTrade({
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
            .filter((trade) => trade instanceof V3Trade)
            .map((trade) => ({
                mixedRoute: trade.route,
                inputAmount: trade.inputAmount,
                outputAmount: trade.outputAmount,
            })),

            tradeType: trades[0].tradeType,
        })
    }

    //demo account 
    const RECIPIENT = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

    // swap functions 
    const swap = async (token_1, token_2, swapInputAmount) => {
        try {
            console.log("CALLING ME_______SWAP");
            const _inputAmount = 1;
            const provider = await web3Provider();
            const network = await provider.getNetwork();
            // const ETHER = Ether.onChain(network.chainId);
            const Ether = Ether.onChain(1);

            // Token Contract 
            const tokenAddress1 = await CONNECTING_CONTRACT("");
            const tokenAddress2 = await CONNECTING_CONTRACT("");

            //Token details 
            const TOKEN_A = new Token(
                tokenAddress1.ChainId,
                tokenAddress1.address,
                tokenAddress1.decimals,
                tokenAddress1.symbol,
                tokenAddress1.name
            );

            const TOKEN_B = new Token(
                tokenAddress2.ChainId,
                tokenAddress2.address,
                tokenAddress2.decimals,
                tokenAddress2.symbol,
                tokenAddress2.name
            );
            
            const WETH_USDC_V3 = await  getPool(
                TOKEN_A,
                TOKEN_B,
                FeeAmount.MEDIUM,
                provider
            );
            
            const inputEther = ethers.utils.parseEther("1").toString();

            const trade = await V3Trade.fromRoute(
                new RouteV3([WETH_USDC_V3], ETHER, TOKEN_B),
                CurrencyAmount.fromRawAmount(ETHER, inputEther),
                TradeType.EXACT_INPUT
            );

            const routerTrade = buildTrade([trade]);
            const opts = swapOptions({
                
            })

            // const params = SwapRouter.swapERC20CallParameters(routerTrade, opts);
            const params = SwapRouter.swapCallParameters(routerTrade, opts);
            console.log(WETH_USDC_V3);
            console.log(trade);
            console.log(routerTrade);
            console.log(opts);
            console.log(params);

            let ethBalance;
            let tokenA;
            let tokenB;

            ethBalance = await provider.getBalance(RECIPIENT);
            tokenA = await tokenAddress1.balance;
            tokenB = await tokenAddress2.balance;
            console.log("-------before swap");
            console.log("Eth balance: ", ethers.utils.formatEther(ethBalance, 18));
            console.log("TokenA: ", tokenA);
            console.log("TokenB: ", tokenB);

            const tx = await signer.sendTransaction({
                data: params.calldata,
                to: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
                value: params.value,
                from: RECIPIENT,
            });

            console.log("-------calling me ");
            const receipt = await tx.wait();

            console.log("-------succes");
            console.log("Status", receipt.status);

            ethBalance = await provider.getBalance(RECIPIENT);
            tokenA = await tokenAddress1.balance;
            tokenB = await tokenAddress2.balance;
            console.log("-------after swap");

            console.log("Eth balance: ", ethers.utils.formatEther(ethBalance, 18));
            console.log("TokenA: ", tokenA);
            console.log("TokenB: ", tokenB);

        } catch (error) {
            notifyError(parseErrorMsg(error));
            console.log(error);
        }
    };

    return (
        <Context.Provider 
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
            
            {Children}{""}
        </Context.Provider>
    )

}
