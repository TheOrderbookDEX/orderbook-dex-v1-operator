import { formatValue, MAX_UINT8, parseValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { SellAtMarketResultV1 } from '../../src/OperatorV1';
import { SellAtMarketAction } from '../action/SellAtMarket';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './Operator';

export interface SellAtMarketScenarioProperties extends OperatorScenarioProperties {
    readonly maxAmount: bigint;
    readonly minPrice?: bigint;
    readonly maxPricePoints?: number;
}

export class SellAtMarketScenario extends OperatorScenario<Transaction, SellAtMarketResultV1> {
    readonly maxAmount: bigint;
    readonly minPrice: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        minPrice = 0n,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: SellAtMarketScenarioProperties) {
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

    async execute({ caller, operator, orderbook }: OperatorContext) {
        return await operator.sellAtMarketV1(orderbook, this.maxAmount, this.minPrice, this.maxPricePoints, { from: caller });
    }

    async executeStatic({ caller, operator, orderbook }: OperatorContext) {
        return await operator.callStatic.sellAtMarketV1(orderbook, this.maxAmount, this.minPrice, this.maxPricePoints, { from: caller });
    }

    get ordersAfter(): Orders {
        return new SellAtMarketAction(this).apply(this.ordersBefore);
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

    get collectedFee() {
        return this.amountReceived * this.fee / parseValue(1);
    }
}
