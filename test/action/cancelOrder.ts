import { OrderType } from '../state/OrderType';
import { OperatorAction } from './operator';
import { decodeErrorData, MAX_UINT32 } from '@frugalwizard/abi2ts-lib';
import { OperatorV1 } from '../../src/OperatorV1';
import { describeCancelOrderAction } from '../describe/cancelOrder';

export function createCancelOrderAction({
    orderType,
    price,
    orderId,
    maxLastOrderId = MAX_UINT32,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
}): OperatorAction {

    return {
        description: describeCancelOrderAction({
            orderType,
            price,
            orderId,
            hideOrderType,
            hidePrice,
            hideOrderId,
        }),

        async execute({ addressBook, orderbook }) {
            const operator = OperatorV1.at(await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner));
            const from = await operator.owner();
            const { failed, error } = await operator.callStatic.cancelOrderV1(orderbook, orderType, price, orderId, maxLastOrderId, { from });
            if (failed) throw decodeErrorData(error);
            await operator.cancelOrderV1(orderbook, orderType, price, orderId, maxLastOrderId, { from });
        },

        apply(orders) {
            return orders.cancel(orderType, price, orderId);
        },
    };
}
