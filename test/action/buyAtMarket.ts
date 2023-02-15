import { OrderType } from '../state/OrderType';
import { MAX_UINT8, MAX_UINT256, decodeErrorData } from '@frugal-wizard/abi2ts-lib';
import { OperatorAction } from './operator';
import { describeBuyAtMarketAction } from '../describe/buyAtMarket';

export function createBuyAtMarketAction({
    maxAmount,
    maxPrice = MAX_UINT256,
    maxPricePoints = MAX_UINT8,
    hideAmount = false,
    hidePrice = false,
}: {
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
    readonly hideAmount?: boolean;
    readonly hidePrice?: boolean;
}): OperatorAction {

    return {
        description: describeBuyAtMarketAction({
            maxAmount,
            maxPrice,
            maxPricePoints,
            hideAmount,
            hidePrice,
        }),

        async execute({ orderbook, operator }) {
            const { failed, error } = await operator.callStatic.buyAtMarketV1(orderbook, maxAmount, maxPrice, maxPricePoints);
            if (failed) throw decodeErrorData(error);
            await operator.buyAtMarketV1(orderbook, maxAmount, maxPrice, maxPricePoints);
        },

        apply(orders) {
            return orders.fill(OrderType.SELL, maxPrice, maxAmount, maxPricePoints);
        },
    };
}
