import { formatValue, MAX_UINT256, MAX_UINT8, Transaction } from '@frugal-wizard/abi2ts-lib';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { BuyAtMarketResultV1 } from '../../src/OperatorV1';
import { BuyAtMarketAction } from '../action/BuyAtMarketAction';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface BuyAtMarketScenarioProperties extends OperatorScenarioProperties {
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
}

export class BuyAtMarketScenario extends OperatorScenario<Transaction, BuyAtMarketResultV1> {
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        maxPrice = MAX_UINT256,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: BuyAtMarketScenarioProperties) {
        super(rest);
        this.maxAmount = maxAmount
        this.maxPrice = maxPrice;
        this.maxPricePoints = maxPricePoints;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('maxAmount', String(this.maxAmount));
        if (this.maxPrice != MAX_UINT256) {
            addContext('maxPrice', formatValue(this.maxPrice));
        }
        if (this.maxPricePoints != MAX_UINT8) {
            addContext('maxPricePoints', String(this.maxPricePoints));
        }
        super.addContext(addContext);
    }

    async execute({ caller, operator, orderbook }: OperatorContext) {
        return await operator.buyAtMarketV1(orderbook, this.maxAmount, this.maxPrice, this.maxPricePoints, { from: caller });
    }

    async executeStatic({ caller, operator, orderbook }: OperatorContext) {
        return await operator.callStatic.buyAtMarketV1(orderbook, this.maxAmount, this.maxPrice, this.maxPricePoints, { from: caller });
    }

    get ordersAfter(): Orders {
        return new BuyAtMarketAction(this).apply(this.ordersBefore);
    }

    get amountBought() {
        return this.ordersBefore.totalAvailable(OrderType.SELL)
            - this.ordersAfter.totalAvailable(OrderType.SELL);
    }

    get amountPaid() {
        let amountPaid = 0n;
        const { ordersBefore, ordersAfter } = this;
        for (const price of ordersBefore.prices(OrderType.SELL)) {
            const amount =
                  ordersBefore.available(OrderType.SELL, price)
                - ordersAfter.available(OrderType.SELL, price);
            if (amount) {
                amountPaid += price * amount;
            } else {
                break;
            }
        }
        return amountPaid;
    }
}
