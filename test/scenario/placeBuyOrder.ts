import { ContractError, formatValue, MAX_UINT8, parseValue, Transaction } from '@frugalwizard/abi2ts-lib';
import { Account, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { PlaceBuyOrderResultV1 } from '../../src/OperatorV1';
import { OperatorAction } from '../action/operator';
import { createPlaceBuyOrderAction } from '../action/placeBuyOrder';
import { describePlaceBuyOrderScenario } from '../describe/placeBuyOrder';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { applyActions, applyActionThatMightFail } from '../utils/actions';
import { createOperatorScenario, DEFAULT_BALANCE, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OperatorContext, OperatorScenario } from './operator';

export type PlaceBuyOrderScenario = OperatorScenario<TestSetupContext & EthereumSetupContext & OperatorContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<PlaceBuyOrderResultV1>;
}> & {
    readonly maxAmount: bigint;
    readonly price: bigint;
    readonly maxPricePoints: number;
    readonly amountBought: bigint;
    readonly amountPaid: bigint;
    readonly collectedFee: bigint;
    readonly amountPlaced: bigint;
    readonly orderId: bigint;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
};

export function createPlaceBuyOrderScenario({
    only,
    description,
    maxAmount,
    price,
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
    readonly price: bigint;
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
}): PlaceBuyOrderScenario {

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createPlaceBuyOrderAction({
        maxAmount,
        price,
        maxPricePoints,
    }), ordersBefore);

    const amountBought = ordersBefore.totalAvailable(OrderType.SELL) - ordersAfter.totalAvailable(OrderType.SELL);

    const amountPaid = ordersBefore.totalAmount(OrderType.SELL) - ordersAfter.totalAmount(OrderType.SELL);

    const collectedFee = amountBought * contractSize * fee / parseValue(1);

    const amountPlaced = ordersAfter.available(OrderType.BUY, price) - ordersBefore.available(OrderType.BUY, price);

    const orderId = amountPlaced ? ordersAfter.lastOrderId(OrderType.BUY, price) : 0n;

    return {
        maxAmount,
        price,
        maxPricePoints,
        amountBought,
        amountPaid,
        collectedFee,
        amountPlaced,
        orderId,
        expectedError,
        expectedErrorInResult,

        ...createOperatorScenario({
            only,
            description: description ?? describePlaceBuyOrderScenario({
                maxAmount,
                price,
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
                ctx.addContext('price', formatValue(price));
                ctx.addContext('maxPricePoints', maxPricePoints == MAX_UINT8 ? 'MAX' : maxPricePoints);
                ctx.addContext('caller', caller);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.operator.placeBuyOrderV1(ctx.orderbook, maxAmount, price, maxPricePoints, { from: ctx[caller] }),
                    executeStatic: () => ctx.operator.callStatic.placeBuyOrderV1(ctx.orderbook, maxAmount, price, maxPricePoints, { from: ctx[caller] }),
                };
            },
        }),
    };
}
