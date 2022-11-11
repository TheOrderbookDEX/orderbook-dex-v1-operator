import { OperatorAction, OperatorActionProperties } from './OperatorAction';
import { Orders } from '../state/Orders';
import { Account } from '@frugal-wizard/contract-test-helper';
import { OperatorContext } from '../scenario/OperatorScenario';
import { decodeErrorData, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { OrderType } from '../state/OrderType';
import { OperatorV1 } from '../../src/OperatorV1';

export interface PlaceBuyOrderActionProperties extends OperatorActionProperties {
    readonly caller?: Account;
    readonly price: bigint;
    readonly maxAmount: bigint;
    readonly maxPricePoints?: number;
}

export class PlaceBuyOrderAction extends OperatorAction {
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
    }: PlaceBuyOrderActionProperties) {
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
        const { failed, error } = await operator.callStatic.placeBuyOrderV1(orderbook, maxAmount, price, MAX_UINT8, { from: caller });
        if (failed) throw decodeErrorData(error);
        await operator.placeBuyOrderV1(orderbook, maxAmount, price, this.maxPricePoints, { from: caller });
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const totalAvailableBefore = state.totalAvailable(OrderType.SELL);
            state.fill(OrderType.SELL, this.price, this.maxAmount, this.maxPricePoints);
            const amount = this.maxAmount - (totalAvailableBefore - state.totalAvailable(OrderType.SELL));
            try {
                state.add(`${this.caller}Operator`, OrderType.BUY, this.price, amount);
            } catch {
                // ignore
            }
            return state;
        } else {
            return state;
        }
    }
}
