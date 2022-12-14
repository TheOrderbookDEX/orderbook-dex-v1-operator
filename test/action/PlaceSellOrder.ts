import { OperatorAction, OperatorActionProperties } from './Operator';
import { Orders } from '../state/Orders';
import { Account } from '@frugal-wizard/contract-test-helper';
import { OperatorContext } from '../scenario/Operator';
import { decodeErrorData, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { OrderType } from '../state/OrderType';
import { OperatorV1 } from '../../src/OperatorV1';

export interface PlaceSellOrderActionProperties extends OperatorActionProperties {
    readonly caller?: Account;
    readonly price: bigint;
    readonly maxAmount: bigint;
    readonly maxPricePoints?: number;
}

export class PlaceSellOrderAction extends OperatorAction {
    readonly caller: Account;
    readonly price: bigint;
    readonly maxAmount: bigint;
    readonly maxPricePoints: number;

    constructor({
        caller = Account.MAIN,
        price,
        maxAmount,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: PlaceSellOrderActionProperties) {
        super(rest);
        this.caller = caller;
        this.price = price;
        this.maxAmount = maxAmount;
        this.maxPricePoints = maxPricePoints;
    }

    async execute(ctx: OperatorContext) {
        const { price, maxAmount } = this;
        const { operatorFactory, orderbook, [this.caller]: caller } = ctx;
        const operator = OperatorV1.at(await operatorFactory.operator(caller));
        const { failed, error } = await operator.callStatic.placeSellOrderV1(orderbook, maxAmount, price, MAX_UINT8, { from: caller });
        if (failed) throw decodeErrorData(error);
        await operator.placeSellOrderV1(orderbook, maxAmount, price, this.maxPricePoints, { from: caller });
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const totalAvailableBefore = state.totalAvailable(OrderType.BUY);
            state.fill(OrderType.BUY, this.price, this.maxAmount, this.maxPricePoints);
            const amount = this.maxAmount - (totalAvailableBefore - state.totalAvailable(OrderType.BUY));
            try {
                state.add(`${this.caller}Operator`, OrderType.SELL, this.price, amount);
            } catch {
                // ignore
            }
            return state;
        } else {
            return state;
        }
    }
}
