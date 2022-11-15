import { OrderType } from '../state/OrderType';
import { OperatorAction, OperatorActionProperties } from './Operator';
import { Orders } from '../state/Orders';
import { decodeErrorData, MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';
import { OperatorContext } from '../scenario/Operator';
import { OperatorV1 } from '../../src/OperatorV1';

export interface CancelOrderActionProperties extends OperatorActionProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
}

export class CancelOrderAction extends OperatorAction {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId: bigint;

    constructor({
        orderType,
        price,
        orderId,
        maxLastOrderId = MAX_UINT32,
        ...rest
    }: CancelOrderActionProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.maxLastOrderId = maxLastOrderId;
    }

    async execute(ctx: OperatorContext) {
        const { addressBook, orderbook } = ctx;
        const { orderType, price, orderId, maxLastOrderId } = this;
        const operator = OperatorV1.at(await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner));
        const from = await operator.owner();
        const { failed, error } = await operator.callStatic.cancelOrderV1(orderbook, orderType, price, orderId, maxLastOrderId, { from });
        if (failed) throw decodeErrorData(error);
        await operator.cancelOrderV1(orderbook, orderType, price, orderId, maxLastOrderId, { from });
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const { orderType, price, orderId } = this;
            return state.cancel(orderType, price, orderId);
        } else {
            return state;
        }
    }
}
