// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import { IOperatorPricePointsV1, PricePointsResultV1, PricePointV1 }
    from "./interfaces/IOperatorPricePointsV1.sol";
import { OperatorBase }
    from "@theorderbookdex/orderbook-dex-operator/contracts/OperatorBase.sol";
import { IOrderbook }
    from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbook.sol";
import { IOrderbookV1, OrderType, PricePoint }
    from "@theorderbookdex/orderbook-dex-v1/contracts/interfaces/IOrderbookV1.sol";

/**
 * Operator price points observe functionality for V1 orderbooks.
 */
contract OperatorPricePointsV1 is OperatorBase, IOperatorPricePointsV1 {
    function pricePointsV1(
        IOrderbookV1 orderbook, uint256 prevSellPrice, uint8 sellPricesLimit, uint256 prevBuyPrice, uint8 buyPricesLimit
    ) external view returns (PricePointsResultV1 memory result) {
        result.sell = _sellPricePointsV1(orderbook, prevSellPrice, sellPricesLimit);
        result.buy = _buyPricePointsV1(orderbook, prevBuyPrice, buyPricesLimit);
    }

    function _sellPricePointsV1(IOrderbookV1 orderbook, uint256 prevPrice, uint8 limit)
        private view returns (PricePointV1[] memory)
    {
        PricePointV1[] memory pricePoints = new PricePointV1[](limit);

        if (limit == 0) {
            return pricePoints;
        }

        uint256 price;
        if (prevPrice == 0) {
            price = orderbook.askPrice();
        } else {
            price = orderbook.nextSellPrice(prevPrice);
        }

        uint8 index = 0;
        for (; index < limit; index++) {
            if (price == 0) break;
            pricePoints[index].price = price;
            PricePoint memory pricePoint = orderbook.pricePoint(OrderType.SELL, price);
            pricePoints[index].available = pricePoint.totalPlaced - pricePoint.totalFilled;
            price = orderbook.nextSellPrice(price);
        }

        if (index == limit) {
            return pricePoints;
        } else {
            return _slice(pricePoints, index);
        }
    }

    function _buyPricePointsV1(IOrderbookV1 orderbook, uint256 prevPrice, uint8 limit)
        private view returns (PricePointV1[] memory)
    {
        PricePointV1[] memory pricePoints = new PricePointV1[](limit);

        if (limit == 0) {
            return pricePoints;
        }

        uint256 price;
        if (prevPrice == 0) {
            price = orderbook.bidPrice();
        } else {
            price = orderbook.nextBuyPrice(prevPrice);
        }

        uint8 index = 0;
        for (; index < limit; index++) {
            if (price == 0) break;
            pricePoints[index].price = price;
            PricePoint memory pricePoint = orderbook.pricePoint(OrderType.BUY, price);
            pricePoints[index].available = pricePoint.totalPlaced - pricePoint.totalFilled;
            price = orderbook.nextBuyPrice(price);
        }

        if (index == limit) {
            return pricePoints;
        } else {
            return _slice(pricePoints, index);
        }
    }

    function _slice(PricePointV1[] memory pricePoints, uint8 limit) private pure returns (PricePointV1[] memory) {
        PricePointV1[] memory slice = new PricePointV1[](limit);
        for (uint8 i = 0; i < limit; i++) {
            slice[i] = pricePoints[i];
        }
        return slice;
    }
}
