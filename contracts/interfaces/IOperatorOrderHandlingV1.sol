// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IOperatorBase }
    from "@theorderbookdex/orderbook-dex-operator/contracts/interfaces/IOperatorBase.sol";
import { IOrderbookV1, OrderType }
    from "@theorderbookdex/orderbook-dex-v1/contracts/interfaces/IOrderbookV1.sol";

/**
 * Operator order handling functionality for V1 orderbooks.
 */
interface IOperatorOrderHandlingV1 is IOperatorBase {
    /**
     * Event emitted to provide feedback after a claimOrder call.
     *
     * @param amount the amount of contracts claimed
     */
    event OrderClaimedV1(uint256 amount);

    /**
     * Event emitted to provide feedback after a transferOrder call.
     */
    event OrderTransferedV1();

    /**
     * Event emitted to provide feedback after a cancelOrder call.
     *
     * @param amount the amount of contracts canceled
     */
    event OrderCanceledV1(uint256 amount);

    /**
     * Claim an order.
     *
     * Emits a OrderClaimed event if it manages to claim any amount.
     *
     * Emits a Failed event if there is an error when calling the orderbook contract.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the order id
     * @param maxAmount the maximum amount of contracts to claim
     */
    function claimOrderV1(
        IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId, uint32 maxAmount
    ) external returns (ClaimOrderResultV1 memory result);

    /**
     * Transfer an order.
     *
     * Emits a OrderTransfered event if it manages to transfer the order.
     *
     * Emits a Failed event if there is an error when calling the orderbook contract.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the order id
     * @param recipient the recipient of the transfer
     */
    function transferOrderV1(
        IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId, address recipient
    ) external returns (TransferOrderResultV1 memory result);

    /**
     * Cancel an order.
     *
     * Emits a OrderCanceled event if it manages to cancel the order.
     *
     * Emits a Failed event if there is an error when calling the orderbook contract.
     *
     * @param orderbook      the orderbook
     * @param orderType      the order type
     * @param price          the price point
     * @param orderId        the order id
     * @param maxLastOrderId the maximum last order id can be before stopping this operation
     */
    function cancelOrderV1(
        IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId, uint32 maxLastOrderId
    ) external returns (CancelOrderResultV1 memory result);
}

/**
 * Return value of claimOrder call.
 */
struct ClaimOrderResultV1 {
    /**
     * The amount of contracts claimed.
     */
    uint256 amountClaimed;

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
 * Return value of transferOrder call.
 */
struct TransferOrderResultV1 {
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
 * Return value of cancelOrder call.
 */
struct CancelOrderResultV1 {
    /**
     * The amount of contracts canceled.
     */
    uint256 amountCanceled;

    /**
     * True if the operation failed.
     */
    bool failed;

    /**
     * The raw error data.
     */
    bytes error;
}
