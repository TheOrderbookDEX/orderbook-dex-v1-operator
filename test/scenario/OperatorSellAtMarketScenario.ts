import { formatValue, MAX_UINT8, Transaction } from '@frugal-wizard/abi2ts-lib';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { SellAtMarketResultV1 } from '../../src/OperatorV1';
import { FillAction } from '../action/FillAction';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorBuyAtMarketScenarioProperties extends OperatorScenarioProperties {
    readonly maxAmount: bigint;
    readonly minPrice?: bigint;
    readonly maxPricePoints?: number;
}

export class OperatorSellAtMarketScenario extends OperatorScenario<Transaction, SellAtMarketResultV1> {
    readonly maxAmount: bigint;
    readonly minPrice: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        minPrice = 0n,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: OperatorBuyAtMarketScenarioProperties) {
        super(rest);
        this.maxAmount = maxAmount
        this.minPrice = minPrice;
        this.maxPricePoints = maxPricePoints;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('maxAmount', String(this.maxAmount));
        if (this.minPrice != 0n) {
            addContext('minPrice', formatValue(this.minPrice));
        }
        if (this.maxPricePoints != MAX_UINT8) {
            addContext('maxPricePoints', String(this.maxPricePoints));
        }
        super.addContext(addContext);
    }

    async execute({ operator, orderbook }: OperatorContext) {
        return await operator.sellAtMarketV1(orderbook, this.maxAmount, this.minPrice, this.maxPricePoints);
    }

    async executeStatic({ operator, orderbook }: OperatorContext) {
        return await operator.callStatic.sellAtMarketV1(orderbook, this.maxAmount, this.minPrice, this.maxPricePoints);
    }

    get ordersAfter(): Orders {
        return new FillAction({ ...this, maxPrice: this.minPrice, orderType: OrderType.BUY }).apply(this.ordersBefore);
    }

    get amountSold() {
        return this.ordersBefore.totalAvailable(OrderType.BUY)
            - this.ordersAfter.totalAvailable(OrderType.BUY);
    }

    get amountReceived() {
        let amountReceived = 0n;
        const { ordersBefore, ordersAfter } = this;
        for (const price of ordersBefore.prices(OrderType.BUY)) {
            const amount =
                  ordersBefore.available(OrderType.BUY, price)
                - ordersAfter.available(OrderType.BUY, price);
            if (amount) {
                amountReceived += price * amount;
            } else {
                break;
            }
        }
        return amountReceived;
    }
}
