// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import { IOperatorOrderHandlingV1, ClaimOrderResultV1, TransferOrderResultV1, CancelOrderResultV1 }
    from "./interfaces/IOperatorOrderHandlingV1.sol";
import { OperatorBase }
    from "@theorderbookdex/orderbook-dex-operator/contracts/OperatorBase.sol";
import { IOrderbookV1, OrderType }
    from "@theorderbookdex/orderbook-dex-v1/contracts/interfaces/IOrderbookV1.sol";

/**
 * Operator order handling functionality for V1 orderbooks.
 */
contract OperatorOrderHandlingV1 is OperatorBase, IOperatorOrderHandlingV1 {
    function claimOrderV1(
        IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId, uint32 maxAmount
    ) external onlyOwner returns (ClaimOrderResultV1 memory result) {
        try orderbook.claimOrder(orderType, price, orderId, maxAmount)
            returns (uint32 amountClaimed)
        {
            result.amountClaimed = amountClaimed;
            emit OrderClaimedV1(amountClaimed);

        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }
    }

    function transferOrderV1(
        IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId, address recipient
    ) external onlyOwner returns (TransferOrderResultV1 memory result) {
        try orderbook.transferOrder(orderType, price, orderId, recipient) {
            emit OrderTransferedV1();
        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }
    }

    function cancelOrderV1(
        IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId, uint32 maxLastOrderId
    ) external onlyOwner returns (CancelOrderResultV1 memory result) {
        try orderbook.cancelOrder(orderType, price, orderId, maxLastOrderId)
            returns (uint32 amountCanceled)
        {
            result.amountCanceled = amountCanceled;
            emit OrderCanceledV1(amountCanceled);

        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }
    }
}
