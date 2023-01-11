import { ContractError, formatValue, parseValue } from '@frugal-wizard/abi2ts-lib';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { Account, AddContextFunction, applySetupActions, BaseTestContext, TestScenario, TestScenarioProperties } from '@frugal-wizard/contract-test-helper';
import { OperatorFactory } from '@theorderbookdex/orderbook-dex-operator/dist/OperatorFactory';
import { OperatorV1 } from '../../src/OperatorV1';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { Orders } from '../state/Orders';
import { OrderbookV1 } from '@theorderbookdex/orderbook-dex-v1/dist/OrderbookV1';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';

type ERC20MockInterface = Pick<ERC20Mock, keyof ERC20Mock>;

export interface OperatorContext extends BaseTestContext {
    readonly caller: string;
    readonly operatorFactory: OperatorFactory;
    readonly operator: OperatorV1;
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20MockInterface;
    readonly baseToken: ERC20MockInterface;
    readonly orderbook: OrderbookV1;
}

export interface OperatorScenarioProperties extends TestScenarioProperties<OperatorContext> {
    readonly caller?: Account;
    readonly expectedErrorInResult?: ContractError;
    readonly tradedTokenBalance?: bigint;
    readonly baseTokenBalance?: bigint;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
}

export abstract class OperatorScenario<ExecuteResult, ExecuteStaticResult>
    extends TestScenario<OperatorContext, ExecuteResult, ExecuteStaticResult>
{
    readonly caller: Account;
    readonly expectedErrorInResult?: ContractError;
    readonly tradedTokenBalance: bigint;
    readonly baseTokenBalance: bigint;
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;

    constructor({
        caller = Account.MAIN,
        expectedErrorInResult,
        tradedTokenBalance = parseValue(1000000),
        baseTokenBalance = parseValue(1000000),
        fee = 0n,
        contractSize = parseValue(10),
        priceTick = parseValue(1),
        ...rest
    }: OperatorScenarioProperties) {
        super(rest);
        this.caller = caller;
        this.expectedErrorInResult = expectedErrorInResult;
        this.tradedTokenBalance = tradedTokenBalance;
        this.baseTokenBalance = baseTokenBalance;
        this.fee = fee;
        this.contractSize = contractSize;
        this.priceTick = priceTick;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('caller', this.caller);
        if (this.expectedErrorInResult) {
            addContext('expectedErrorInResult', this.expectedErrorInResult.message);
        }
        if (this.tradedTokenBalance != parseValue(1000000)) {
            addContext('tradedTokenBalance', formatValue(this.tradedTokenBalance));
        }
        if (this.baseTokenBalance != parseValue(1000000)) {
            addContext('baseTokenBalance', formatValue(this.baseTokenBalance));
        }
        if (this.fee) {
            addContext('fee', formatValue(this.fee));
        }
        addContext('contractSize', formatValue(this.contractSize));
        addContext('priceTick', formatValue(this.priceTick));
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OperatorContext> {
        const ctx = await super._setup();
        const { mainAccount, accounts, [this.caller]: caller } = ctx;
        const treasury = await OrderbookDEXTeamTreasuryMock.deploy(this.fee);
        const addressBook = await AddressBook.deploy();
        for (const from of accounts.slice(0, 2)) {
            await addressBook.register({ from });
        }
        const tradedToken = await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
        await tradedToken.giveMultiple(accounts.map(account => [ account, parseValue(1000000) ]));
        const baseToken = await ERC20Mock.deploy('Base Token', 'BASE', 18);
        await baseToken.giveMultiple(accounts.map(account => [ account, parseValue(1000000) ]));
        const { contractSize, priceTick } = this;
        const orderbook = await OrderbookV1.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick);
        const operatorFactory = await OperatorFactory.deploy(mainAccount, addressBook);
        await operatorFactory.registerVersion(10000n, await OperatorV1.deploy());
        for (const from of accounts) {
            const operatorAddress = await operatorFactory.callStatic.createOperator(10000n, { from });
            await operatorFactory.createOperator(10000n, { from });
            if (this.tradedTokenBalance) await tradedToken.give(operatorAddress, this.tradedTokenBalance);
            if (this.baseTokenBalance) await baseToken.give(operatorAddress, this.baseTokenBalance);
        }
        const operator = OperatorV1.at(await operatorFactory.operator(mainAccount));
        return { ...ctx, caller, operatorFactory, operator, treasury, addressBook, tradedToken, baseToken, orderbook };
    }

    async setup() {
        return await this._setup();
    }

    get ordersBefore() {
        return applySetupActions(this.setupActions, new Orders());
    }

    abstract get ordersAfter(): Orders;
}
