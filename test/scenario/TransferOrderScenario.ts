import { formatValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { TransferOrderResultV1 } from '../../src/OperatorV1';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface TransferOrderScenarioProperties extends OperatorScenarioProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly recipient: Account;
}

export class TransferOrderScenario extends OperatorScenario<Transaction, TransferOrderResultV1> {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly recipient: Account;

    constructor({
        orderType,
        price,
        orderId,
        recipient,
        ...rest
    }: TransferOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType
        this.price = price;
        this.orderId = orderId;
        this.recipient = recipient;
    }

    addContext(addContext: AddContextFunction) {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('orderId', String(this.orderId));
        addContext('recipient', this.recipient);
        super.addContext(addContext);
    }

    async execute({ caller, operator, orderbook, [this.recipient]: recipient }: OperatorContext) {
        return await operator.transferOrderV1(orderbook, this.orderType, this.price, this.orderId, recipient, { from: caller });
    }

    async executeStatic({ caller, operator, orderbook, [this.recipient]: recipient }: OperatorContext) {
        return await operator.callStatic.transferOrderV1(orderbook, this.orderType, this.price, this.orderId, recipient, { from: caller });
    }

    get ordersAfter(): Orders {
        const orders = this.ordersBefore;
        orders.get(this.orderType, this.price, this.orderId)?.transfer(this.recipient);
        return orders;
    }
}
