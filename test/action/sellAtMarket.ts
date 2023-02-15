import { OrderType } from '../state/OrderType';
import { decodeErrorData, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { OperatorAction } from './operator';
import { describeSellAtMarketAction } from '../describe/sellAtMarket';

export function createSellAtMarketAction({
    maxAmount,
    minPrice = 0n,
    maxPricePoints = MAX_UINT8,
    hideAmount = false,
    hidePrice = false,
}: {
    readonly maxAmount: bigint;
    readonly minPrice?: bigint;
    readonly maxPricePoints?: number;
    readonly hideAmount?: boolean;
    readonly hidePrice?: boolean;
}): OperatorAction {

    return {
        description: describeSellAtMarketAction({
            maxAmount,
            minPrice,
            maxPricePoints,
            hideAmount,
            hidePrice,
        }),

        async execute({ orderbook, operator }) {
            const { failed, error } = await operator.callStatic.sellAtMarketV1(orderbook, maxAmount, minPrice, maxPricePoints);
            if (failed) throw decodeErrorData(error);
            await operator.sellAtMarketV1(orderbook, maxAmount, minPrice, maxPricePoints);
        },

        apply(orders) {
            return orders.fill(OrderType.BUY, minPrice, maxAmount, maxPricePoints);
        },
    };
}
