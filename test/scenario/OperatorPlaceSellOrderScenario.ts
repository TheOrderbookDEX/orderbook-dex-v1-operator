import { formatValue, MAX_UINT8, Transaction } from '@frugal-wizard/abi2ts-lib';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { PlaceSellOrderResultV1 } from '../../src/OperatorV1';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorPlaceSellOrderScenarioProperties extends OperatorScenarioProperties {
    readonly maxAmount: bigint;
    readonly price: bigint;
    readonly maxPricePoints?: number;
}

export class OperatorPlaceSellOrderScenario extends OperatorScenario<Transaction, PlaceSellOrderResultV1> {
    readonly maxAmount: bigint;
    readonly price: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        price,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: OperatorPlaceSellOrderScenarioProperties) {
        super(rest);
        this.maxAmount = maxAmount
        this.price = price;
        this.maxPricePoints = maxPricePoints;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('maxAmount', String(this.maxAmount));
        addContext('price', formatValue(this.price));
        if (this.maxPricePoints != MAX_UINT8) {
            addContext('maxPricePoints', String(this.maxPricePoints));
        }
        super.addContext(addContext);
    }

    async execute({ caller, operator, orderbook }: OperatorContext) {
        return await operator.placeSellOrderV1(orderbook, this.maxAmount, this.price, this.maxPricePoints, { from: caller });
    }

    async executeStatic({ caller, operator, orderbook }: OperatorContext) {
        return await operator.callStatic.placeSellOrderV1(orderbook, this.maxAmount, this.price, this.maxPricePoints, { from: caller });
    }

    get ordersAfter(): Orders {
        let orders = this.ordersBefore;
        const totalAvailableBefore = orders.totalAvailable(OrderType.BUY);
        orders = new FillAction({ ...this, orderType: OrderType.BUY, maxPrice: this.price }).apply(orders);
        const amount = this.maxAmount - (totalAvailableBefore - orders.totalAvailable(OrderType.BUY));
        try {
            orders = new PlaceOrderAction({ ...this, orderType: OrderType.SELL, amount }).apply(orders);
        } catch {
            // ignore
        }
        return orders;
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

    get amountPlaced() {
        return this.ordersAfter.available(OrderType.SELL, this.price)
            - this.ordersBefore.available(OrderType.SELL, this.price);
    }

    get orderId() {
        if (this.amountPlaced) {
            return this.ordersAfter.lastOrderId(OrderType.SELL, this.price);
        } else {
            return 0n;
        }
    }

    get actualOrderId() {
        if (this.amountPlaced) {
            return this.ordersAfter.lastOrderId(OrderType.SELL, this.price);
        } else {
            return 0n;
        }
    }
}
