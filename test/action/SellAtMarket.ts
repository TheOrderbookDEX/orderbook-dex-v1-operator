import { OrderType } from '../state/OrderType';
import { Orders } from '../state/Orders';
import { decodeErrorData, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { OperatorAction, OperatorActionProperties } from './Operator';
import { OperatorContext } from '../scenario/Operator';

export interface SellAtMarketActionProperties extends OperatorActionProperties {
    readonly maxAmount: bigint;
    readonly minPrice?: bigint;
    readonly maxPricePoints?: number;
}

export class SellAtMarketAction extends OperatorAction {
    readonly maxAmount: bigint;
    readonly minPrice: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        minPrice = 0n,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: SellAtMarketActionProperties) {
        super(rest);
        this.maxAmount = maxAmount;
        this.minPrice = minPrice;
        this.maxPricePoints = maxPricePoints;
    }

    async execute(ctx: OperatorContext) {
        const { orderbook, operator } = ctx;
        const { minPrice, maxAmount, maxPricePoints } = this;
        const { failed, error } = await operator.callStatic.sellAtMarketV1(orderbook, maxAmount, minPrice, maxPricePoints);
        if (failed) throw decodeErrorData(error);
        await operator.sellAtMarketV1(orderbook, maxAmount, minPrice, maxPricePoints);
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const { minPrice, maxAmount, maxPricePoints } = this;
            return state.fill(OrderType.BUY, minPrice, maxAmount, maxPricePoints);
        } else {
            return state;
        }
    }
}
