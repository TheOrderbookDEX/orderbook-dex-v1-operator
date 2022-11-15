import { MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { OperatorV1, PricePointsResultV1 } from '../../src/OperatorV1';
import { Orders } from '../state/Orders';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface PricePointsScenarioProperties extends OperatorScenarioProperties {
    readonly prevSellPrice?: bigint;
    readonly sellPricesLimit?: number;
    readonly prevBuyPrice?: bigint;
    readonly buyPricesLimit?: number;
    readonly useOperatorImplementation?: boolean;
}

export class PricePointsScenario extends OperatorScenario<PricePointsResultV1, PricePointsResultV1> {
    readonly prevSellPrice: bigint;
    readonly sellPricesLimit: number;
    readonly prevBuyPrice: bigint;
    readonly buyPricesLimit: number;
    readonly useOperatorImplementation: boolean;

    constructor({
        prevSellPrice = 0n,
        sellPricesLimit = MAX_UINT8,
        prevBuyPrice = 0n,
        buyPricesLimit = MAX_UINT8,
        useOperatorImplementation = false,
        ...rest
    }: PricePointsScenarioProperties) {
        super(rest);
        this.prevSellPrice = prevSellPrice
        this.sellPricesLimit = sellPricesLimit;
        this.prevBuyPrice = prevBuyPrice;
        this.buyPricesLimit = buyPricesLimit;
        this.useOperatorImplementation = useOperatorImplementation;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.prevSellPrice != 0n) {
            addContext('prevSellPrice', String(this.prevSellPrice));
        }
        if (this.sellPricesLimit != MAX_UINT8) {
            addContext('sellPricesLimit', String(this.sellPricesLimit));
        }
        if (this.prevBuyPrice != 0n) {
            addContext('prevBuyPrice', String(this.prevBuyPrice));
        }
        if (this.buyPricesLimit != MAX_UINT8) {
            addContext('buyPricesLimit', String(this.buyPricesLimit));
        }
        if (this.useOperatorImplementation) {
            addContext('useOperatorImplementation', 'true');
        }
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OperatorContext> {
        const ctx = await super._setup();
        if (this.useOperatorImplementation) {
            const { operatorFactory } = ctx;
            const operator = OperatorV1.at(await operatorFactory.versionImplementation(10000n));
            return { ...ctx, operator };
        } else {
            return ctx;
        }
    }

    async execute({ caller, operator, orderbook }: OperatorContext) {
        return await operator.pricePointsV1(orderbook, this.prevSellPrice, this.sellPricesLimit, this.prevBuyPrice, this.buyPricesLimit, { from: caller });
    }

    async executeStatic({ caller, operator, orderbook }: OperatorContext) {
        return await operator.callStatic.pricePointsV1(orderbook, this.prevSellPrice, this.sellPricesLimit, this.prevBuyPrice, this.buyPricesLimit, { from: caller });
    }

    get ordersAfter(): Orders {
        return this.ordersBefore;
    }
}
