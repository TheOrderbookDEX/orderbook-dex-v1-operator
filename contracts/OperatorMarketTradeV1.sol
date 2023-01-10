// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import { IOperatorMarketTradeV1, BuyAtMarketResultV1, SellAtMarketResultV1 }
    from "./interfaces/IOperatorMarketTradeV1.sol";
import { OperatorBase }
    from "@theorderbookdex/orderbook-dex-operator/contracts/OperatorBase.sol";
import { IOrderbookV1, OrderType }
    from "@theorderbookdex/orderbook-dex-v1/contracts/interfaces/IOrderbookV1.sol";
import { IERC20 }
    from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Operator trade at market functionality for V1 orderbooks.
 */
contract OperatorMarketTradeV1 is OperatorBase, IOperatorMarketTradeV1 {
    function buyAtMarketV1(IOrderbookV1 orderbook, uint256 maxAmount, uint256 maxPrice, uint8 maxPricePoints)
        external onlyOwner returns (BuyAtMarketResultV1 memory result)
    {
        if (maxAmount > type(uint64).max) {
            maxAmount = type(uint64).max;
        }

        IERC20 baseToken = IERC20(orderbook.baseToken());
        if (maxPrice == type(uint256).max) {
            baseToken.approve(address(orderbook), maxPrice);
        } else {
            baseToken.approve(address(orderbook), maxAmount * maxPrice);
        }

        try IOrderbookV1(orderbook).fill(OrderType.SELL, uint64(maxAmount), maxPrice, maxPricePoints)
            returns (uint64 amountBought, uint256 amountPaid, uint256 fee)
        {
            result.amountBought = amountBought;
            result.amountPaid = amountPaid;
            result.fee = fee;

            if (amountBought > 0) {
                emit BoughtAtMarketV1(amountBought, amountPaid, fee);
            }

        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }

        if (baseToken.allowance(address(this), address(orderbook)) != 0) {
            baseToken.approve(address(orderbook), 0);
        }
    }

    function sellAtMarketV1(IOrderbookV1 orderbook, uint256 maxAmount, uint256 minPrice, uint8 maxPricePoints)
        external onlyOwner returns (SellAtMarketResultV1 memory result)
    {
        if (maxAmount > type(uint64).max) {
            maxAmount = type(uint64).max;
        }

        IERC20 tradedToken = IERC20(orderbook.tradedToken());
        tradedToken.approve(address(orderbook), maxAmount * orderbook.contractSize());

        try orderbook.fill(OrderType.BUY, uint64(maxAmount), minPrice, maxPricePoints)
            returns (uint64 amountSold, uint256 amountReceived, uint256 fee)
        {
            result.amountSold = amountSold;
            result.amountReceived = amountReceived;
            result.fee = fee;

            if (amountSold > 0) {
                emit SoldAtMarketV1(amountSold, amountReceived, fee);
            }

        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }

        if (tradedToken.allowance(address(this), address(orderbook)) != 0) {
            tradedToken.approve(address(orderbook), 0);
        }
    }
}
