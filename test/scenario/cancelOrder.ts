import { ContractError, formatValue, MAX_UINT32, Transaction } from '@frugalwizard/abi2ts-lib';
import { Account, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { CancelOrderResultV1 } from '../../src/OperatorV1';
import { createCancelOrderAction } from '../action/cancelOrder';
import { OperatorAction } from '../action/operator';
import { describeCancelOrderScenario } from '../describe/cancelOrder';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { Token } from '../state/Token';
import { applyActions, applyActionThatMightFail } from '../utils/actions';
import { createOperatorScenario, DEFAULT_BALANCE, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OperatorContext, OperatorScenario } from './operator';

export type CancelOrderScenario = OperatorScenario<TestSetupContext & EthereumSetupContext & OperatorContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<CancelOrderResultV1>;
}> & {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId: bigint;
    readonly amountCanceled: bigint;
    readonly deletesOrder: boolean;
    readonly givenToken: Token;
    readonly givenAmount: bigint;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
};

export function createCancelOrderScenario({
    only,
    description,
    orderType,
    price,
    orderId,
    maxLastOrderId = MAX_UINT32,
    caller = Account.MAIN,
    tradedTokenBalance = DEFAULT_BALANCE,
    baseTokenBalance = DEFAULT_BALANCE,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
    hideContractSize = false,
    hidePriceTick = false,
    hideSetup = false,
    expectedError,
    expectedErrorInResult,
    setupActions = [],
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
    readonly caller?: Account;
    readonly tradedTokenBalance?: bigint;
    readonly baseTokenBalance?: bigint;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideAmount?: boolean;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly hideSetup?: boolean;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
    readonly setupActions?: OperatorAction[];
}): CancelOrderScenario {

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createCancelOrderAction({
        orderType,
        price,
        orderId,
        maxLastOrderId,
    }), ordersBefore);

    const amountCanceled = ordersBefore.get(orderType, price, orderId)?.available ?? 0n;

    const deletesOrder = ordersAfter.get(orderType, price, orderId)?.deleted ?? false;

    const givenToken = orderType == OrderType.SELL ? Token.TRADED : Token.BASE;

    const givenAmount = orderType == OrderType.SELL ? amountCanceled * contractSize : amountCanceled * price;

    return {
        orderType,
        price,
        orderId,
        maxLastOrderId,
        amountCanceled,
        deletesOrder,
        givenToken,
        givenAmount,
        expectedError,
        expectedErrorInResult,

        ...createOperatorScenario({
            only,
            description: description ?? describeCancelOrderScenario({
                orderType,
                price,
                orderId,
                caller,
                fee,
                contractSize,
                priceTick,
                hideOrderType,
                hidePrice,
                hideOrderId,
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
                ctx.addContext('orderType', describeOrderType(orderType));
                ctx.addContext('price', formatValue(price));
                ctx.addContext('orderId', orderId);
                ctx.addContext('maxLastOrderId', maxLastOrderId == MAX_UINT32 ? 'MAX' : maxLastOrderId);
                ctx.addContext('caller', caller);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.operator.cancelOrderV1(ctx.orderbook, orderType, price, orderId, maxLastOrderId, { from: ctx[caller] }),
                    executeStatic: () => ctx.operator.callStatic.cancelOrderV1(ctx.orderbook, orderType, price, orderId, maxLastOrderId, { from: ctx[caller] }),
                };
            },
        }),
    };
}
