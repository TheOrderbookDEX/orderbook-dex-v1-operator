import { OrderType } from '../state/OrderType';
import { OperatorAction } from './operator';
import { decodeErrorData } from '@frugal-wizard/abi2ts-lib';
import { OperatorV1 } from '../../src/OperatorV1';
import { describeTransferOrderAction } from '../describe/transferOrder';
import { Account } from '@frugal-wizard/contract-test-helper';

export function createTransferOrderAction({
    orderType,
    price,
    orderId,
    recipient,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly recipient: Account;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
}): OperatorAction {

    return {
        description: describeTransferOrderAction({
            orderType,
            price,
            orderId,
            recipient,
            hideOrderType,
            hidePrice,
            hideOrderId,
        }),

        async execute({ addressBook, orderbook, [recipient]: recipientAddress }) {
            const operator = OperatorV1.at(await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner));
            const from = await operator.owner();
            const { failed, error } = await operator.callStatic.transferOrderV1(orderbook, orderType, price, orderId, recipientAddress, { from });
            if (failed) throw decodeErrorData(error);
            await operator.transferOrderV1(orderbook, orderType, price, orderId, recipientAddress, { from });
        },

        apply(orders) {
            return orders.transfer(orderType, price, orderId, recipient);
        },
    };
}
