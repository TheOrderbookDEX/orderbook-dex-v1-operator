import { OrderType } from '../state/OrderType';
import { Orders } from '../state/Orders';
import { MAX_UINT8, MAX_UINT256, decodeErrorData } from '@frugal-wizard/abi2ts-lib';
import { OperatorAction, OperatorActionProperties } from './OperatorAction';
import { OperatorContext } from '../scenario/OperatorScenario';

export interface BuyAtMarketActionProperties extends OperatorActionProperties {
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
}

export class BuyAtMarketAction extends OperatorAction {
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        maxPrice = MAX_UINT256,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: BuyAtMarketActionProperties) {
        super(rest);
        this.maxAmount = maxAmount;
        this.maxPrice = maxPrice;
        this.maxPricePoints = maxPricePoints;
    }

    async execute(ctx: OperatorContext) {
        const { orderbook, operator } = ctx;
        const { maxPrice, maxAmount, maxPricePoints } = this;
        const { failed, error } = await operator.callStatic.buyAtMarketV1(orderbook, maxAmount, maxPrice, maxPricePoints);
        if (failed) throw decodeErrorData(error);
        await operator.buyAtMarketV1(orderbook, maxAmount, maxPrice, maxPricePoints);
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const { maxPrice, maxAmount, maxPricePoints } = this;
            return state.fill(OrderType.SELL, maxPrice, maxAmount, maxPricePoints);
        } else {
            return state;
        }
    }
}
