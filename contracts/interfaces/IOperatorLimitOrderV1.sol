// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IOperatorBase }
    from "@theorderbookdex/orderbook-dex-operator/contracts/interfaces/IOperatorBase.sol";
import { IOrderbookV1 }
    from "@theorderbookdex/orderbook-dex-v1/contracts/interfaces/IOrderbookV1.sol";
import { IOperatorMarketTradeV1Events }
    from "./IOperatorMarketTradeV1Events.sol";

/**
 * Operator place limit order functionality for V1 orderbooks.
 */
interface IOperatorLimitOrderV1 is IOperatorBase, IOperatorMarketTradeV1Events {
    /**
     * Event emitted to provide feedback after a placeBuyOrder call.
     *
     * @param amount  the amount of contracts of the placed order
     * @param orderId the order id
     */
    event PlacedBuyOrderV1(uint256 amount, uint32 orderId);

    /**
     * Event emitted to provide feedback after a placeSellOrder call.
     *
     * @param amount  the amount of contracts of the placed order
     * @param orderId the order id
     */
    event PlacedSellOrderV1(uint256 amount, uint32 orderId);

    /**
     * Place buy order.
     *
     * If the bid price is at or above the provided price, it will attempt to buy at market first, and place an
     * order for the remainder.
     *
     * Emits a BoughtAtMarket event if it manages to buy any amount.
     *
     * Emits a PlacedBuyOrder event if it manages to place an order.
     *
     * Emits a Failed event if there is an error when calling the orderbook contract.
     *
     * @param orderbook      the orderbook
     * @param maxAmount      the maximum amount of contracts to buy
     * @param price          the price to pay for contract
     * @param maxPricePoints the maximum amount of price points to fill
     */
    function placeBuyOrderV1(IOrderbookV1 orderbook, uint256 maxAmount, uint256 price, uint8 maxPricePoints)
        external returns (PlaceBuyOrderResultV1 memory result);

    /**
     * Place sell order.
     *
     * If the ask price is at or below the provided price, it will attempt to sell at market first, and place an
     * order for the remainder.
     *
     * Emits a SoldAtMarket event if it manages to sell any amount.
     *
     * Emits a PlacedSellOrder event if it manages to place an order.
     *
     * Emits a Failed event if there is an error when calling the orderbook contract.
     *
     * @param orderbook      the orderbook
     * @param maxAmount      the maximum amount of contracts to sell
     * @param price          the price to pay for contract
     * @param maxPricePoints the maximum amount of price points to fill
     */
    function placeSellOrderV1(IOrderbookV1 orderbook, uint256 maxAmount, uint256 price, uint8 maxPricePoints)
        external returns (PlaceSellOrderResultV1 memory result);
}

/**
 * Return value of placeBuyOrder call.
 */
struct PlaceBuyOrderResultV1 {
    /**
     * The amount of contracts bought.
     *
     * This might be non zero even if the operation fails, which means it managed to buy some
     * before failing.
     */
    uint256 amountBought;

    /**
     * The amount of base token paid.
     *
     * This might be non zero even if the operation fails, which means it managed to buy some
     * before failing.
     */
    uint256 amountPaid;

    /**
     * The amount of traded token taken as fee.
     *
     * This might be non zero even if the operation fails, which means it managed to buy some
     * before failing.
     */
    uint256 fee;

    /**
     * The amount of contracts of the placed order.
     */
    uint256 amountPlaced;

    /**
     * The order id.
     */
    uint32 orderId;

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
 * Return value of placeSellOrder call.
 */
struct PlaceSellOrderResultV1 {
    /**
     * The amount of contracts sold.
     *
     * This might be non zero even if the operation fails, which means it managed to sell some
     * before failing.
     */
    uint256 amountSold;

    /**
     * The amount of traded token received.
     *
     * This might be non zero even if the operation fails, which means it managed to sell some
     * before failing.
     */
    uint256 amountReceived;

    /**
     * The amount of base token taken as fee.
     *
     * This might be non zero even if the operation fails, which means it managed to buy some
     * before failing.
     */
    uint256 fee;

    /**
     * The amount of contracts of the placed order.
     */
    uint256 amountPlaced;

    /**
     * The order id.
     */
    uint32 orderId;

    /**
     * True if the operation failed.
     */
    bool failed;

    /**
     * The raw error data.
     */
    bytes error;
}
