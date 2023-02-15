import { ContractError, formatValue, MAX_UINT8, parseValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { PlaceSellOrderResultV1 } from '../../src/OperatorV1';
import { OperatorAction } from '../action/operator';
import { createPlaceSellOrderAction } from '../action/placeSellOrder';
import { describePlaceSellOrderScenario } from '../describe/placeSellOrder';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { applyActions, applyActionThatMightFail } from '../utils/actions';
import { createOperatorScenario, DEFAULT_BALANCE, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OperatorContext, OperatorScenario } from './operator';

export type PlaceSellOrderScenario = OperatorScenario<TestSetupContext & EthereumSetupContext & OperatorContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<PlaceSellOrderResultV1>;
}> & {
    readonly maxAmount: bigint;
    readonly price: bigint;
    readonly maxPricePoints: number;
    readonly amountSold: bigint;
    readonly amountReceived: bigint;
    readonly collectedFee: bigint;
    readonly amountPlaced: bigint;
    readonly orderId: bigint;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
};

export function createPlaceSellOrderScenario({
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
}): PlaceSellOrderScenario {

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createPlaceSellOrderAction({
        maxAmount,
        price,
        maxPricePoints,
    }), ordersBefore);

    const amountSold = ordersBefore.totalAvailable(OrderType.BUY) - ordersAfter.totalAvailable(OrderType.BUY);

    const amountReceived = ordersBefore.totalAmount(OrderType.BUY) - ordersAfter.totalAmount(OrderType.BUY);

    const collectedFee = amountReceived * fee / parseValue(1);

    const amountPlaced = ordersAfter.available(OrderType.SELL, price) - ordersBefore.available(OrderType.SELL, price);

    const orderId = amountPlaced ? ordersAfter.lastOrderId(OrderType.SELL, price) : 0n;

    return {
        maxAmount,
        price,
        maxPricePoints,
        amountSold,
        amountReceived,
        collectedFee,
        amountPlaced,
        orderId,
        expectedError,
        expectedErrorInResult,

        ...createOperatorScenario({
            only,
            description: description ?? describePlaceSellOrderScenario({
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
                    execute: () => ctx.operator.placeSellOrderV1(ctx.orderbook, maxAmount, price, maxPricePoints, { from: ctx[caller] }),
                    executeStatic: () => ctx.operator.callStatic.placeSellOrderV1(ctx.orderbook, maxAmount, price, maxPricePoints, { from: ctx[caller] }),
                };
            },
        }),
    };
}
