import { formatValue, MAX_UINT32, Transaction } from '@frugal-wizard/abi2ts-lib';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { CancelOrderResultV1 } from '../../src/OperatorV1';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { describeOrderType, OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorCancelOrderScenarioProperties extends OperatorScenarioProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
}

export class OperatorCancelOrderScenario extends OperatorScenario<Transaction, CancelOrderResultV1> {
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
    }: OperatorCancelOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType
        this.price = price;
        this.orderId = orderId;
        this.maxLastOrderId = maxLastOrderId
    }

    addContext(addContext: AddContextFunction) {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('orderId', String(this.orderId));
        if (this.maxLastOrderId != MAX_UINT32) {
            addContext('maxLastOrderId', String(this.maxLastOrderId));
        }
        super.addContext(addContext);
    }

    async execute({ caller, operator, orderbook }: OperatorContext) {
        return await operator.cancelOrderV1(orderbook, this.orderType, this.price, this.orderId, this.maxLastOrderId, { from: caller });
    }

    async executeStatic({ caller, operator, orderbook }: OperatorContext) {
        return await operator.callStatic.cancelOrderV1(orderbook, this.orderType, this.price, this.orderId, this.maxLastOrderId, { from: caller });
    }

    get ordersAfter() {
        return new CancelOrderAction(this).apply(this.ordersBefore);
    }

    get amountCanceled() {
        const order = this.ordersBefore.get(this.orderType, this.price, this.orderId);
        return order?.available ?? 0n;
    }

    get givenToken() {
        switch (this.orderType) {
            case OrderType.SELL:
                return 'tradedToken';
            case OrderType.BUY:
                return 'baseToken';
        }
    }

    get givenAmount() {
        const { amountCanceled } = this;
        switch (this.orderType) {
            case OrderType.SELL:
                return amountCanceled * this.contractSize;
            case OrderType.BUY:
                return amountCanceled * this.price;
        }
    }

    get deletesOrder() {
        const order = this.ordersAfter.get(this.orderType, this.price, this.orderId);
        return order?.deleted;
    }
}
