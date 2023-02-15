import { ContractError, formatValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { TransferOrderResultV1 } from '../../src/OperatorV1';
import { OperatorAction } from '../action/operator';
import { describeTransferOrderScenario } from '../describe/transferOrder';
import { describeOrderType, OrderType } from '../state/OrderType';
import { createOperatorScenario, DEFAULT_BALANCE, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OperatorContext, OperatorScenario } from './operator';

export type TransferOrderScenario = OperatorScenario<TestSetupContext & EthereumSetupContext & OperatorContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<TransferOrderResultV1>;
}> & {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly recipient: Account;
    readonly expectedError?: ContractError;
    readonly expectedErrorInResult?: ContractError;
};

export function createTransferOrderScenario({
    only,
    description,
    orderType,
    price,
    orderId,
    recipient,
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
    readonly recipient: Account;
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
}): TransferOrderScenario {

    return {
        orderType,
        price,
        orderId,
        recipient,
        expectedError,
        expectedErrorInResult,

        ...createOperatorScenario({
            only,
            description: description ?? describeTransferOrderScenario({
                orderType,
                price,
                orderId,
                recipient,
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
                ctx.addContext('recipient', recipient);
                ctx.addContext('caller', caller);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.operator.transferOrderV1(ctx.orderbook, orderType, price, orderId, ctx[recipient], { from: ctx[caller] }),
                    executeStatic: () => ctx.operator.callStatic.transferOrderV1(ctx.orderbook, orderType, price, orderId, ctx[recipient], { from: ctx[caller] }),
                };
            },
        }),
    };
}
