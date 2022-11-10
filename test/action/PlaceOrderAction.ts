import { OrderType } from '../state/OrderType';
import { OrderbookAction, OrderbookActionProperties } from './OrderbookAction';
import { Orders } from '../state/Orders';
import { Account } from '@frugal-wizard/contract-test-helper';
import { OrderbookContext } from '../scenario/OrderbookScenario';

export interface PlaceOrderActionProperties extends OrderbookActionProperties {
    readonly caller?: Account;
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
}

export class PlaceOrderAction extends OrderbookAction {
    readonly caller: Account;
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;

    constructor({
        caller = Account.MAIN,
        orderType,
        price,
        amount,
        ...rest
    }: PlaceOrderActionProperties) {
        super(rest);
        this.caller = caller;
        this.orderType = orderType;
        this.price = price;
        this.amount = amount;
    }

    async execute(ctx: OrderbookContext) {
        const { caller, orderType, price, amount } = this;
        const { tradedToken, baseToken, orderbook, [caller]: from } = ctx;
        switch (orderType) {
            case OrderType.SELL:
                await tradedToken.approve(orderbook, amount * await orderbook.contractSize(), { from });
                break;
            case OrderType.BUY:
                await baseToken.approve(orderbook, amount * price, { from });
                break;
        }
        await orderbook.placeOrder(orderType, price, amount, { from });
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            return state.add(this.caller, this.orderType, this.price, this.amount);
        } else {
            return state;
        }
    }
}
