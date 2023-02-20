import { MAX_UINT8 } from '@frugalwizard/abi2ts-lib';
import { Account, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { OperatorV1, PricePointsResultV1 } from '../../src/OperatorV1';
import { OperatorAction } from '../action/operator';
import { describePricePointsScenario } from '../describe/pricePoints';
import { createOperatorScenario, DEFAULT_BALANCE, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OperatorContext, OperatorScenario } from './operator';

export type PricePointsScenario = OperatorScenario<TestSetupContext & EthereumSetupContext & OperatorContext & {
    execute(): Promise<PricePointsResultV1>;
}> & {
    readonly prevSellPrice: bigint;
    readonly sellPricesLimit: number;
    readonly prevBuyPrice: bigint;
    readonly buyPricesLimit: number;
    readonly useOperatorImplementation: boolean;
};

export function createPricePointsScenario({
    only,
    description,
    prevSellPrice = 0n,
    sellPricesLimit = MAX_UINT8,
    prevBuyPrice = 0n,
    buyPricesLimit = MAX_UINT8,
    useOperatorImplementation = false,
    caller = Account.MAIN,
    tradedTokenBalance = DEFAULT_BALANCE,
    baseTokenBalance = DEFAULT_BALANCE,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideContractSize = false,
    hidePriceTick = false,
    hideSetup = false,
    setupActions = [],
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly prevSellPrice?: bigint;
    readonly sellPricesLimit?: number;
    readonly prevBuyPrice?: bigint;
    readonly buyPricesLimit?: number;
    readonly useOperatorImplementation?: boolean;
    readonly caller?: Account;
    readonly tradedTokenBalance?: bigint;
    readonly baseTokenBalance?: bigint;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideAmount?: boolean;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly hideSetup?: boolean;
    readonly setupActions?: OperatorAction[];
}): PricePointsScenario {

    return {
        prevSellPrice,
        sellPricesLimit,
        prevBuyPrice,
        buyPricesLimit,
        useOperatorImplementation,

        ...createOperatorScenario({
            only,
            description: description ?? describePricePointsScenario({
                prevSellPrice,
                sellPricesLimit,
                prevBuyPrice,
                buyPricesLimit,
                useOperatorImplementation,
                caller,
                fee,
                contractSize,
                priceTick,
                hideContractSize,
                hidePriceTick,
                hideSetup,
                setupActions,
            }),
            tradedTokenBalance,
            baseTokenBalance,
            fee,
            contractSize,
            priceTick,

            async setup(ctx) {
                ctx.addContext('prevSellPrice', prevSellPrice);
                ctx.addContext('sellPricesLimit', sellPricesLimit == MAX_UINT8 ? 'MAX' : sellPricesLimit);
                ctx.addContext('prevBuyPrice', prevBuyPrice);
                ctx.addContext('buyPricesLimit', buyPricesLimit == MAX_UINT8 ? 'MAX' : buyPricesLimit);
                ctx.addContext('useOperatorImplementation', useOperatorImplementation);
                ctx.addContext('caller', caller);

                await executeSetupActions(setupActions, ctx);

                const operator = useOperatorImplementation ? OperatorV1.at(await ctx.operatorFactory.versionImplementation(10000n)) : ctx.operator;

                return {
                    ...ctx,
                    operator,
                    execute: () => ctx.operator.pricePointsV1(ctx.orderbook, prevSellPrice, sellPricesLimit, prevBuyPrice, buyPricesLimit, { from: ctx[caller] }),
                };
            },
        }),
    };
}
