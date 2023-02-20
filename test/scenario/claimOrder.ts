import { ContractError, formatValue, MAX_UINT32, parseValue, Transaction } from '@frugalwizard/abi2ts-lib';
import { Account, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { ClaimOrderResultV1 } from '../../src/OperatorV1';
import { createClaimOrderAction } from '../action/claimOrder';
import { OperatorAction } from '../action/operator';
import { describeClaimOrderScenario } from '../describe/claimOrder';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { Token } from '../state/Token';
import { applyActions, applyActionThatMightFail } from '../utils/actions';
import { createOperatorScenario, DEFAULT_BALANCE, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OperatorContext, OperatorScenario } from './operator';

export type ClaimOrderScenario = OperatorScenario<TestSetupContext & EthereumSetupContext & OperatorContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<ClaimOrderResultV1>;
}> & {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount: bigint;
    readonly amountClaimed: bigint;
    readonly deletesOrder: boolean;
    readonly givenToken: Token;
    readonly givenAmount: bigint;
    readonly collectedFee: bigint;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
};

export function createClaimOrderScenario({
    only,
    description,
    orderType,
    price,
    orderId,
    maxAmount = MAX_UINT32,
    caller = Account.MAIN,
    tradedTokenBalance = DEFAULT_BALANCE,
    baseTokenBalance = DEFAULT_BALANCE,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
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
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
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
}): ClaimOrderScenario {

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createClaimOrderAction({
        orderType,
        price,
        orderId,
        maxAmount,
    }), ordersBefore);

    const amountClaimed = (ordersAfter.get(orderType, price, orderId)?.claimed ?? 0n) - (ordersBefore.get(orderType, price, orderId)?.claimed ?? 0n);

    const deletesOrder = ordersAfter.get(orderType, price, orderId)?.deleted ?? false;

    const givenToken = orderType == OrderType.SELL ? Token.BASE : Token.TRADED;

    const givenAmount = orderType == OrderType.SELL ? amountClaimed * price : amountClaimed * contractSize;

    const collectedFee = givenAmount * fee / parseValue(1);

    return {
        orderType,
        price,
        orderId,
        maxAmount,
        amountClaimed,
        deletesOrder,
        givenToken,
        givenAmount,
        collectedFee,
        expectedError,
        expectedErrorInResult,

        ...createOperatorScenario({
            only,
            description: description ?? describeClaimOrderScenario({
                orderType,
                price,
                orderId,
                maxAmount,
                caller,
                fee,
                contractSize,
                priceTick,
                hideOrderType,
                hidePrice,
                hideOrderId,
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
                ctx.addContext('orderType', describeOrderType(orderType));
                ctx.addContext('price', formatValue(price));
                ctx.addContext('orderId', orderId);
                ctx.addContext('maxAmount', maxAmount == MAX_UINT32 ? 'MAX' : maxAmount);
                ctx.addContext('caller', caller);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.operator.claimOrderV1(ctx.orderbook, orderType, price, orderId, maxAmount, { from: ctx[caller] }),
                    executeStatic: () => ctx.operator.callStatic.claimOrderV1(ctx.orderbook, orderType, price, orderId, maxAmount, { from: ctx[caller] }),
                };
            },
        }),
    };
}
