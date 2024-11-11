const { SwapRouter } = require("@uniswap/universal-router-sdk");
const {
    TradeType,
    Ether,
    CurrencyAmount,
    Token,
    Percent,
} = require("@uniswap/sdk-core");
const { Trade: V2Trade } = require("@uniswap/v2-sdk");
const {
    Pool,
    nearestUsableTick,
    TickMath,
    TICK_SPACINGS,
    FeeAmount,
    Trade: V3Trade,
    Route: RouteV3,
} = require("@uniswap/v3-sdk");

const { MixedRouteTrade, Trade: RouterTrade } = require("@uniswap/router-sdk");
const IUniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const JSBI = require("jsbi");
const erc20Abi = require("../abis__erc20.json");

const hardhat = require("hardhat");
const provider = hardhat.ethers.provider;

const ETHER = Ether.onChain(1);
const WETH = new Token(1, "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", 18, "WETH", "Wrapped Ether");
const USDC = new Token(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6, "USDC", "USD Coin");

const wethContract = new hardhat.ethers.Contract(WETH.address, erc20Abi, provider);
const usdcContract = new hardhat.ethers.Contract(USDC.address, erc20Abi, provider);

async function getPool(tokenA, tokenB, feeAmount, provider) {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
    const poolAddress = Pool.getAddress(token0, token1, feeAmount);
    
    console.log("Pool Address:", poolAddress);

    const contract = new hardhat.ethers.Contract(poolAddress, IUniswapV3Pool.abi, provider);
    try {
        const liquidity = await contract.liquidity();
        const { sqrtPriceX96, tick } = await contract.slot0();

        return new Pool(token0, token1, feeAmount, JSBI.BigInt(sqrtPriceX96.toString()), JSBI.BigInt(liquidity.toString()), tick, [
            {
                index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
                liquidityNet: JSBI.BigInt(liquidity.toString()),
                liquidityGross: JSBI.BigInt(liquidity.toString()),
            },
            {
                index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
                liquidityNet: JSBI.multiply(JSBI.BigInt(liquidity.toString()), JSBI.BigInt("-1")),
                liquidityGross: JSBI.BigInt(liquidity.toString()),
            },
        ]);
    } catch (error) {
        console.error("Error fetching pool data:", error);
        throw error;
    }
}

function swapOptions(options) {
    return Object.assign(
        {
            slippageTolerance: new Percent(5, 1000),
            recipient: RECIPIENT,
        },
        options
    );
}

function buildTrade(trades) {
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
        .filter((trade) => trade instanceof MixedRouteTrade)
        .map((trade) => ({
            mixedRoute: trade.route,
            inputAmount: trade.inputAmount,
            outputAmount: trade.outputAmount,
        })),
        tradeType: trades[0].tradeType,
    });
}

const RECIPIENT = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

async function main() {
    const signer = await hardhat.ethers.getImpersonatedSigner(RECIPIENT);

    const WETH_USDC_V3 = await getPool(WETH, USDC, FeeAmount.MEDIUM, provider);
    const inputEther = hardhat.ethers.utils.parseUnits("1", 18).toString();

    const trade = await V3Trade.fromRoute(
        new RouteV3([WETH_USDC_V3], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, inputEther),
        TradeType.EXACT_INPUT
    );

    const routerTrade = buildTrade([trade]);

    const opts = swapOptions({});
    const params = SwapRouter.swapCallParameters(routerTrade, opts);

    const ethBalance = await provider.getBalance(RECIPIENT);
    const usdcBalance = await usdcContract.balanceOf(RECIPIENT);
    const wethBalance = await wethContract.balanceOf(RECIPIENT);

    console.log("---before");
    console.log("ETH balance:", hardhat.ethers.utils.formatEther(ethBalance));
    console.log("USDC balance:", hardhat.ethers.utils.formatUnits(usdcBalance, 6));
    console.log("WETH balance:", hardhat.ethers.utils.formatUnits(wethBalance, 18));

    try {
        const tx = await signer.sendTransaction({
            data: params.calldata,
            to: "0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B",
            value: params.value,
            from: RECIPIENT,
        });

        const receipt = await tx.wait();

        console.log("----success");
        console.log("status", receipt.status);
    } catch (error) {
        console.error("Transaction failed:", error);
    }

    // console.log(WETH_USDC_V3);
    // console.log(routerTrade);
    // console.log(trade);
    // console.log(opts);
    // console.log(params);

    const finalEthBalance = await provider.getBalance(RECIPIENT);
    const finalUsdcBalance = await usdcContract.balanceOf(RECIPIENT);
    const finalWethBalance = await wethContract.balanceOf(RECIPIENT);

    console.log("---after");
    console.log("ETH balance:", hardhat.ethers.utils.formatEther(finalEthBalance));
    console.log("USDC balance:", hardhat.ethers.utils.formatUnits(finalUsdcBalance, 6));
    console.log("WETH balance:", hardhat.ethers.utils.formatUnits(finalWethBalance, 18));
}

// node scripts/deploy.js

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
