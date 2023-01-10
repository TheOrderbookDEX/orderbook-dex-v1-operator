// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

/**
 * Operator trade at market functionality for V1 orderbooks.
 */
interface IOperatorMarketTradeV1Events {
    /**
     * Event emitted to provide feedback after a buyAtMarket call.
     *
     * @param amountBought the amount of contracts bought
     * @param amountPaid   the amount of base token paid
     * @param fee          the amount of traded token taken as fee
     */
    event BoughtAtMarketV1(uint256 amountBought, uint256 amountPaid, uint256 fee);

    /**
     * Event emitted to provide feedback after a sellAtMarket call.
     *
     * @param amountSold     the amount of contracts sold
     * @param amountReceived the amount of base token received
     * @param fee            the amount of base token taken as fee
     */
    event SoldAtMarketV1(uint256 amountSold, uint256 amountReceived, uint256 fee);
}
