import { OrderType } from '../state/OrderType';
import { OperatorAction } from './operator';
import { decodeErrorData, MAX_UINT32 } from '@frugalwizard/abi2ts-lib';
import { OperatorV1 } from '../../src/OperatorV1';
import { describeClaimOrderAction } from '../describe/claimOrder';

export function createClaimOrderAction({
    orderType,
    price,
    orderId,
    maxAmount = MAX_UINT32,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
    hideAmount = false,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideAmount?: boolean;
}): OperatorAction {

    return {
        description: describeClaimOrderAction({
            orderType,
            price,
            orderId,
            maxAmount,
            hideOrderType,
            hidePrice,
            hideOrderId,
            hideAmount,
        }),

        async execute({ addressBook, orderbook }) {
            const operator = OperatorV1.at(await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner));
            const from = await operator.owner();
            const { failed, error } = await operator.callStatic.claimOrderV1(orderbook, orderType, price, orderId, maxAmount, { from });
            if (failed) throw decodeErrorData(error);
            await operator.claimOrderV1(orderbook, orderType, price, orderId, maxAmount, { from });
        },

        apply(orders) {
            return orders.claim(orderType, price, orderId, maxAmount);
        },
    };
}
