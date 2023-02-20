import { ContractError, formatValue, MAX_UINT256, MAX_UINT8, parseValue, Transaction } from '@frugalwizard/abi2ts-lib';
import { Account, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { BuyAtMarketResultV1 } from '../../src/OperatorV1';
import { createBuyAtMarketAction } from '../action/buyAtMarket';
import { OperatorAction } from '../action/operator';
import { describeBuyAtMarketScenario } from '../describe/buyAtMarket';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { applyActions, applyActionThatMightFail } from '../utils/actions';
import { createOperatorScenario, DEFAULT_BALANCE, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OperatorContext, OperatorScenario } from './operator';

export type BuyAtMarketScenario = OperatorScenario<TestSetupContext & EthereumSetupContext & OperatorContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<BuyAtMarketResultV1>;
}> & {
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;
    readonly amountBought: bigint;
    readonly amountPaid: bigint;
    readonly collectedFee: bigint;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
};

export function createBuyAtMarketScenario({
    only,
    description,
    maxAmount,
    maxPrice = MAX_UINT256,
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
    readonly maxPrice?: bigint;
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
}): BuyAtMarketScenario {

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createBuyAtMarketAction({
        maxAmount,
        maxPrice,
        maxPricePoints,
    }), ordersBefore);

    const amountBought = ordersBefore.totalAvailable(OrderType.SELL) - ordersAfter.totalAvailable(OrderType.SELL);

    const amountPaid = ordersBefore.totalAmount(OrderType.SELL) - ordersAfter.totalAmount(OrderType.SELL);

    const collectedFee = amountBought * contractSize * fee / parseValue(1);

    return {
        maxAmount,
        maxPrice,
        maxPricePoints,
        amountBought,
        amountPaid,
        collectedFee,
        expectedError,
        expectedErrorInResult,

        ...createOperatorScenario({
            only,
            description: description ?? describeBuyAtMarketScenario({
                maxAmount,
                maxPrice,
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
                ctx.addContext('maxPrice', maxPrice == MAX_UINT256 ? 'MAX' : formatValue(maxPrice));
                ctx.addContext('maxPricePoints', maxPricePoints == MAX_UINT8 ? 'MAX' : maxPricePoints);
                ctx.addContext('caller', caller);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.operator.buyAtMarketV1(ctx.orderbook, maxAmount, maxPrice, maxPricePoints, { from: ctx[caller] }),
                    executeStatic: () => ctx.operator.callStatic.buyAtMarketV1(ctx.orderbook, maxAmount, maxPrice, maxPricePoints, { from: ctx[caller] }),
                };
            },
        }),
    };
}
