// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IOperatorBase }
    from "@theorderbookdex/orderbook-dex-operator/contracts/interfaces/IOperatorBase.sol";
import { IOrderbookV1 }
    from "@theorderbookdex/orderbook-dex-v1/contracts/interfaces/IOrderbookV1.sol";
import { IOperatorMarketTradeV1Events }
    from "./IOperatorMarketTradeV1Events.sol";

/**
 * Operator trade at market functionality for V1 orderbooks.
 */
interface IOperatorMarketTradeV1 is IOperatorBase, IOperatorMarketTradeV1Events {
    /**
     * Buy at market.
     *
     * Emits a BoughtAtMarket event if it manages to buy any amount.
     *
     * Emits a Failed event if there is an error when calling the orderbook contract.
     *
     * @param orderbook      the orderbook
     * @param maxAmount      the maximum amount of contracts to buy
     * @param maxPrice       the maximum price to pay for contract
     * @param maxPricePoints the maximum amount of price points to fill
     */
    function buyAtMarketV1(IOrderbookV1 orderbook, uint256 maxAmount, uint256 maxPrice, uint8 maxPricePoints)
        external returns (BuyAtMarketResultV1 memory result);

    /**
     * Sell at market.
     *
     * Emits a SoldAtMarket event if it manages to sell any amount.
     *
     * Emits a Failed event if there is an error when calling the orderbook contract.
     *
     * @param orderbook      the orderbook
     * @param maxAmount      the maximum amount of contracts to sell
     * @param minPrice       the minimum price to pay for contract
     * @param maxPricePoints the maximum amount of price points to fill
     */
    function sellAtMarketV1(IOrderbookV1 orderbook, uint256 maxAmount, uint256 minPrice, uint8 maxPricePoints)
        external returns (SellAtMarketResultV1 memory result);
}

/**
 * Return value of buyAtMarket call.
 */
struct BuyAtMarketResultV1 {
    /**
     * The amount of contracts bought.
     */
    uint256 amountBought;

    /**
     * The amount of base token paid.
     */
    uint256 amountPaid;

    /**
     * True if the operation failed.
     */
    bool failed;

    /**
     * The raw error data.
     */
    bytes error;
}

/**
 * Return value of sellAtMarket call.
 */
struct SellAtMarketResultV1 {
    /**
     * The amount of contracts sold.
     */
    uint256 amountSold;

    /**
     * The amount of traded token received.
     */
    uint256 amountReceived;

    /**
     * True if the operation failed.
     */
    bool failed;

    /**
     * The raw error data.
     */
    bytes error;
}
