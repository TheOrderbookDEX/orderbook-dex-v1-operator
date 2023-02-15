import { formatValue, parseValue } from '@frugal-wizard/abi2ts-lib';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { OperatorFactory } from '@theorderbookdex/orderbook-dex-operator/dist/OperatorFactory';
import { OperatorV1 } from '../../src/OperatorV1';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { OrderbookV1 } from '@theorderbookdex/orderbook-dex-v1/dist/OrderbookV1';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';

export type OperatorScenario<Context> = EthereumScenario<Context> & {
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
};

export interface OperatorContext {
    readonly operatorFactory: OperatorFactory;
    readonly operator: OperatorV1;
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20Mock;
    readonly baseToken: ERC20Mock;
    readonly orderbook: OrderbookV1;
}

export const DEFAULT_BALANCE = parseValue(1000000);
export const DEFAULT_FEE = 0n;
export const DEFAULT_CONTRACT_SIZE = parseValue(10);
export const DEFAULT_PRICE_TICK = parseValue(1);

export function createOperatorScenario<Context>({
    only,
    description,
    tradedTokenBalance,
    baseTokenBalance,
    fee,
    contractSize,
    priceTick,
    setup,
}: {
    readonly only?: boolean;
    readonly description: string;
    readonly tradedTokenBalance: bigint;
    readonly baseTokenBalance: bigint;
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly setup: (ctx: TestSetupContext & EthereumSetupContext & OperatorContext) => Context | Promise<Context>;
}): OperatorScenario<Context> {

    return {
        fee,
        contractSize,
        priceTick,

        ...createEthereumScenario({
            only,
            description,

            async setup(ctx) {
                ctx.addContext('tradedTokenBalance', formatValue(tradedTokenBalance));
                ctx.addContext('baseTokenBalance', formatValue(baseTokenBalance));
                ctx.addContext('fee', formatValue(fee));
                ctx.addContext('contractSize', formatValue(contractSize));
                ctx.addContext('priceTick', formatValue(priceTick));

                const { mainAccount, accounts } = ctx;

                const treasury = await OrderbookDEXTeamTreasuryMock.deploy(fee);

                const addressBook = await AddressBook.deploy();
                for (const from of accounts.slice(0, 2)) {
                    await addressBook.register({ from });
                }

                const tradedToken = await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
                await tradedToken.giveMultiple(accounts.map(account => [ account, parseValue(1000000) ]));

                const baseToken = await ERC20Mock.deploy('Base Token', 'BASE', 18);
                await baseToken.giveMultiple(accounts.map(account => [ account, parseValue(1000000) ]));

                const orderbook = await OrderbookV1.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick);

                const operatorFactory = await OperatorFactory.deploy(mainAccount, addressBook);
                await operatorFactory.registerVersion(10000n, await OperatorV1.deploy());
                for (const from of accounts) {
                    const operatorAddress = await operatorFactory.callStatic.createOperator(10000n, { from });
                    await operatorFactory.createOperator(10000n, { from });
                    if (tradedTokenBalance) await tradedToken.give(operatorAddress, tradedTokenBalance);
                    if (baseTokenBalance) await baseToken.give(operatorAddress, baseTokenBalance);
                }

                const operator = OperatorV1.at(await operatorFactory.operator(mainAccount));

                return setup({
                    ...ctx,
                    operatorFactory,
                    operator,
                    treasury,
                    addressBook,
                    tradedToken,
                    baseToken,
                    orderbook
                });
            },
        })
    };
}
