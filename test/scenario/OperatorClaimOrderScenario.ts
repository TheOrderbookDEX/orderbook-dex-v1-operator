import { formatValue, MAX_UINT32, Transaction } from '@frugal-wizard/abi2ts-lib';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { ClaimOrderResultV1 } from '../../src/OperatorV1';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorClaimOrderScenarioProperties extends OperatorScenarioProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
}

export class OperatorClaimOrderScenario extends OperatorScenario<Transaction, ClaimOrderResultV1> {
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
    }: OperatorClaimOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType
        this.price = price;
        this.orderId = orderId;
        this.maxAmount = maxAmount
    }

    addContext(addContext: AddContextFunction) {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('orderId', String(this.orderId));
        if (this.maxAmount != MAX_UINT32) {
            addContext('maxAmount', String(this.maxAmount));
        }
        super.addContext(addContext);
    }

    async execute({ caller, operator, orderbook }: OperatorContext) {
        return await operator.claimOrderV1(orderbook, this.orderType, this.price, this.orderId, this.maxAmount, { from: caller });
    }

    async executeStatic({ caller, operator, orderbook }: OperatorContext) {
        return await operator.callStatic.claimOrderV1(orderbook, this.orderType, this.price, this.orderId, this.maxAmount, { from: caller });
    }

    get ordersAfter(): Orders {
        return new ClaimOrderAction(this).apply(this.ordersBefore);
    }

    get amountClaimed() {
        return (this.ordersAfter.get(this.orderType, this.price, this.orderId)?.claimed ?? 0n)
            - (this.ordersBefore.get(this.orderType, this.price, this.orderId)?.claimed ?? 0n);
    }

    get deletesOrder() {
        return this.ordersAfter.get(this.orderType, this.price, this.orderId)?.deleted ?? false;
    }

    get givenToken() {
        switch (this.orderType) {
            case OrderType.SELL:
                return 'baseToken';
            case OrderType.BUY:
                return 'tradedToken';
        }
    }

    get givenAmount() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.amountClaimed * this.price;
            case OrderType.BUY:
                return this.amountClaimed * this.contractSize;
        }
    }
}
