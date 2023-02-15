import { OperatorAction } from './operator';
import { Account } from '@frugal-wizard/contract-test-helper';
import { decodeErrorData, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { OrderType } from '../state/OrderType';
import { OperatorV1 } from '../../src/OperatorV1';
import { describePlaceBuyOrderAction } from '../describe/placeBuyOrder';

export function createPlaceBuyOrderAction({
    caller = Account.MAIN,
    price,
    maxAmount,
    maxPricePoints = MAX_UINT8,
    hideAmount = false,
    hidePrice = false,
}: {
    readonly caller?: Account;
    readonly price: bigint;
    readonly maxAmount: bigint;
    readonly maxPricePoints?: number;
    readonly hideAmount?: boolean;
    readonly hidePrice?: boolean;
}): OperatorAction {

    return {
        description: describePlaceBuyOrderAction({
            caller,
            price,
            maxAmount,
            maxPricePoints,
            hideAmount,
            hidePrice,
        }),

        async execute({ orderbook, operatorFactory, [caller]: callerAddress }) {
            const operator = OperatorV1.at(await operatorFactory.operator(callerAddress));
            const { failed, error } = await operator.callStatic.placeBuyOrderV1(orderbook, maxAmount, price, MAX_UINT8, { from: callerAddress });
            if (failed) throw decodeErrorData(error);
            await operator.placeBuyOrderV1(orderbook, maxAmount, price, maxPricePoints, { from: callerAddress });
        },

        apply(orders) {
            const totalAvailableBefore = orders.totalAvailable(OrderType.SELL);
            orders = orders.fill(OrderType.SELL, price, maxAmount, maxPricePoints);
            const amount = maxAmount - (totalAvailableBefore - orders.totalAvailable(OrderType.SELL));
            try {
                orders = orders.add(`${caller}Operator`, OrderType.BUY, price, amount);
            } catch {
                // ignore
            }
            return orders;
        },
    };
}
