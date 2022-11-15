// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IOperatorBase }
    from "@theorderbookdex/orderbook-dex-operator/contracts/interfaces/IOperatorBase.sol";
import { IOrderbookV1 }
    from "@theorderbookdex/orderbook-dex-v1/contracts/interfaces/IOrderbookV1.sol";

/**
 * Operator price points observe functionality for V1 orderbooks.
 */
interface IOperatorPricePointsV1 is IOperatorBase {
    /**
     * Get the available price points of an orderbook.
     *
     * This function can be called by anyone, even called using the implementation contract instead of the operator.
     *
     * @param orderbook       the orderbook
     * @param prevSellPrice   the previous sell price point (if 0 starts at ask price)
     * @param sellPricesLimit the max amount of sell price points to return
     * @param prevBuyPrice    the previous buy price point (if 0 starts at bid price)
     * @param buyPricesLimit  the max amount of buy price points to return
     */
    function pricePointsV1(
        IOrderbookV1 orderbook, uint256 prevSellPrice, uint8 sellPricesLimit, uint256 prevBuyPrice, uint8 buyPricesLimit
    ) external view returns (PricePointsResultV1 memory result);
}

/**
 * Return value of pricePoints call.
 */
struct PricePointsResultV1 {
    /**
     * The sell price point.
     */
    PricePointV1[] sell;

    /**
     * The buy price point.
     */
    PricePointV1[] buy;
}

/**
 * Price point data.
 */
struct PricePointV1 {
    /**
     * The price.
     */
    uint256 price;

    /**
     * The amount of contracts available.
     */
    uint256 available;
}
