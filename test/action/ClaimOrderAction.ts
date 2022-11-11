import { OrderType } from '../state/OrderType';
import { OperatorAction, OperatorActionProperties } from './OperatorAction';
import { Orders } from '../state/Orders';
import { decodeErrorData, MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';
import { OperatorContext } from '../scenario/OperatorScenario';
import { OperatorV1 } from '../../src/OperatorV1';

export interface ClaimOrderActionProperties extends OperatorActionProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
}

export class ClaimOrderAction extends OperatorAction {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount: bigint;

    constructor({
        orderType,
        price,
        orderId,
        maxAmount = MAX_UINT32,
        ...rest
    }: ClaimOrderActionProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.maxAmount = maxAmount;
    }

    async execute(ctx: OperatorContext) {
        const { addressBook, orderbook } = ctx;
        const { orderType, price, orderId, maxAmount } = this;
        const operator = OperatorV1.at(await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner));
        const from = await operator.owner();
        const { failed, error } = await operator.callStatic.claimOrderV1(orderbook, orderType, price, orderId, maxAmount, { from });
        if (failed) throw decodeErrorData(error);
        await operator.claimOrderV1(orderbook, orderType, price, orderId, maxAmount, { from });
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const { orderType, price, orderId, maxAmount } = this;
            return state.claim(orderType, price, orderId, maxAmount);
        } else {
            return state;
        }
    }
}
