// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import { IOperatorLimitOrderV1, PlaceBuyOrderResultV1, PlaceSellOrderResultV1 }
    from "./interfaces/IOperatorLimitOrderV1.sol";
import { OperatorBase }
    from "@theorderbookdex/orderbook-dex-operator/contracts/OperatorBase.sol";
import { IOrderbook }
    from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbook.sol";
import { IOrderbookV1, OrderType }
    from "@theorderbookdex/orderbook-dex-v1/contracts/interfaces/IOrderbookV1.sol";
import { IERC20 }
    from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Operator place limit order functionality for V1 orderbooks.
 */
contract OperatorLimitOrderV1 is OperatorBase, IOperatorLimitOrderV1 {
    function placeBuyOrderV1(IOrderbookV1 orderbook, uint256 maxAmount, uint256 price, uint8 maxPricePoints)
        external onlyOwner returns (PlaceBuyOrderResultV1 memory result)
    {
        if (maxAmount > type(uint32).max) {
            maxAmount = type(uint32).max;
        }

        IERC20 baseToken = IERC20(orderbook.baseToken());
        baseToken.approve(address(orderbook), maxAmount * price);

        uint256 askPrice = orderbook.askPrice();

        if (askPrice == 0 || price < askPrice) {
            try orderbook.placeOrder(OrderType.BUY, price, uint32(maxAmount))
                returns (uint32 orderId)
            {
                result.amountPlaced = maxAmount;
                result.orderId = orderId;
                emit PlacedBuyOrderV1(maxAmount, orderId);

            } catch (bytes memory error) {
                result.failed = true;
                result.error = error;
                emit Failed(error);
            }

        } else {
            try orderbook.fill(OrderType.SELL, uint64(maxAmount), price, maxPricePoints)
                returns (uint64 amountBought, uint256 amountPaid, uint256 fee)
            {
                result.amountBought = amountBought;
                result.amountPaid = amountPaid;
                result.fee = fee;

                if (amountBought > 0) {
                    emit BoughtAtMarketV1(amountBought, amountPaid, fee);
                    maxAmount -= amountBought;
                }

                if (maxAmount != 0) {
                    askPrice = orderbook.askPrice();

                    if (askPrice == 0 || price < askPrice) {
                        try orderbook.placeOrder(OrderType.BUY, price, uint32(maxAmount))
                            returns (uint32 orderId)
                        {
                            result.amountPlaced = maxAmount;
                            result.orderId = orderId;
                            emit PlacedBuyOrderV1(maxAmount, orderId);

                        } catch (bytes memory error) {
                            result.failed = true;
                            result.error = error;
                            emit Failed(error);
                        }
                    }
                }

            } catch (bytes memory error) {
                result.failed = true;
                result.error = error;
                emit Failed(error);
            }
        }

        if (baseToken.allowance(address(this), address(orderbook)) != 0) {
            baseToken.approve(address(orderbook), 0);
        }
    }

    function placeSellOrderV1(IOrderbookV1 orderbook, uint256 maxAmount, uint256 price, uint8 maxPricePoints)
        external onlyOwner returns (PlaceSellOrderResultV1 memory result)
    {
        if (price == 0) {
            // We do this here because the error won't be caught later
            result.failed = true;
            result.error = abi.encodePacked(IOrderbookV1.InvalidPrice.selector);
            emit Failed(result.error);
            return result;
        }

        if (maxAmount > type(uint32).max) {
            maxAmount = type(uint32).max;
        }

        IERC20 tradedToken = IERC20(orderbook.tradedToken());
        tradedToken.approve(address(orderbook), maxAmount * orderbook.contractSize());

        uint256 bidPrice = orderbook.bidPrice();

        if (price > bidPrice) {
            try orderbook.placeOrder(OrderType.SELL, price, uint32(maxAmount))
                returns (uint32 orderId)
            {
                result.amountPlaced = maxAmount;
                result.orderId = orderId;
                emit PlacedSellOrderV1(maxAmount, orderId);

            } catch (bytes memory error) {
                result.failed = true;
                result.error = error;
                emit Failed(error);
            }

        } else {
            try orderbook.fill(OrderType.BUY, uint64(maxAmount), price, maxPricePoints)
                returns (uint64 amountSold, uint256 amountReceived, uint256 fee)
            {
                result.amountSold = amountSold;
                result.amountReceived = amountReceived;
                result.fee = fee;

                if (amountSold > 0) {
                    emit SoldAtMarketV1(amountSold, amountReceived, fee);
                    maxAmount -= amountSold;
                }

                if (maxAmount != 0) {
                    bidPrice = IOrderbookV1(orderbook).bidPrice();

                    if (price > bidPrice) {
                        try IOrderbookV1(orderbook).placeOrder(OrderType.SELL, price, uint32(maxAmount))
                            returns (uint32 orderId)
                        {
                            result.amountPlaced = maxAmount;
                            result.orderId = orderId;
                            emit PlacedSellOrderV1(maxAmount, orderId);

                        } catch (bytes memory error) {
                            result.failed = true;
                            result.error = error;
                            emit Failed(error);
                        }
                    }
                }

            } catch (bytes memory error) {
                result.failed = true;
                result.error = error;
                emit Failed(error);
            }
        }

        if (tradedToken.allowance(address(this), address(orderbook)) != 0) {
            tradedToken.approve(address(orderbook), 0);
        }
    }
}
