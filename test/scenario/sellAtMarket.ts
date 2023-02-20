import { ContractError, formatValue, MAX_UINT8, parseValue, Transaction } from '@frugalwizard/abi2ts-lib';
import { Account, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { SellAtMarketResultV1 } from '../../src/OperatorV1';
import { OperatorAction } from '../action/operator';
import { createSellAtMarketAction } from '../action/sellAtMarket';
import { describeSellAtMarketScenario } from '../describe/sellAtMarket';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { applyActions, applyActionThatMightFail } from '../utils/actions';
import { createOperatorScenario, DEFAULT_BALANCE, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OperatorContext, OperatorScenario } from './operator';

export type SellAtMarketScenario = OperatorScenario<TestSetupContext & EthereumSetupContext & OperatorContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<SellAtMarketResultV1>;
}> & {
    readonly maxAmount: bigint;
    readonly minPrice: bigint;
    readonly maxPricePoints: number;
    readonly amountSold: bigint;
    readonly amountReceived: bigint;
    readonly collectedFee: bigint;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
};

export function createSellAtMarketScenario({
    only,
    description,
    maxAmount,
    minPrice = 0n,
    maxPricePoints = MAX_UINT8,
    caller = Account.MAIN,
    tradedTokenBalance = DEFAULT_BALANCE,
    baseTokenBalance = DEFAULT_BALANCE,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hidePrice = false,
    hideAmount = false,
    hideContractSize = false,
    hidePriceTick = false,
    hideSetup = false,
    expectedError,
    expectedErrorInResult,
    setupActions = [],
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly maxAmount: bigint;
    readonly minPrice?: bigint;
    readonly maxPricePoints?: number;
    readonly caller?: Account;
    readonly tradedTokenBalance?: bigint;
    readonly baseTokenBalance?: bigint;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly hideSetup?: boolean;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
    readonly setupActions?: OperatorAction[];
}): SellAtMarketScenario {

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createSellAtMarketAction({
        maxAmount,
        minPrice,
        maxPricePoints,
    }), ordersBefore);

    const amountSold = ordersBefore.totalAvailable(OrderType.BUY) - ordersAfter.totalAvailable(OrderType.BUY);

    const amountReceived = ordersBefore.totalAmount(OrderType.BUY) - ordersAfter.totalAmount(OrderType.BUY);

    const collectedFee = amountReceived * fee / parseValue(1);

    return {
        maxAmount,
        minPrice,
        maxPricePoints,
        amountSold,
        amountReceived,
        collectedFee,
        expectedError,
        expectedErrorInResult,

        ...createOperatorScenario({
            only,
            description: description ?? describeSellAtMarketScenario({
                maxAmount,
                minPrice,
                maxPricePoints,
                caller,
                fee,
                contractSize,
                priceTick,
                hidePrice,
                hideAmount,
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
                ctx.addContext('maxAmount', maxAmount);
                ctx.addContext('minPrice', formatValue(minPrice));
                ctx.addContext('maxPricePoints', maxPricePoints == MAX_UINT8 ? 'MAX' : maxPricePoints);
                ctx.addContext('caller', caller);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.operator.sellAtMarketV1(ctx.orderbook, maxAmount, minPrice, maxPricePoints, { from: ctx[caller] }),
                    executeStatic: () => ctx.operator.callStatic.sellAtMarketV1(ctx.orderbook, maxAmount, minPrice, maxPricePoints, { from: ctx[caller] }),
                };
            },
        }),
    };
}
