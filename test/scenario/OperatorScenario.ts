import { ContractError, formatValue, parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { OperatorFactory } from '@theorderbookdex/orderbook-dex-operator/dist/OperatorFactory';
import { OperatorV1 } from '../../src/OperatorV1';
import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './OrderbookScenario';

export interface OperatorContext extends OrderbookContext {
    readonly caller: string;
    readonly operatorFactory: OperatorFactory;
    readonly operator: OperatorV1;
}

export interface OperatorScenarioProperties extends OrderbookScenarioProperties<OperatorContext> {
    readonly caller?: Account;
    readonly expectedErrorInResult?: ContractError;
    readonly tradedTokenBalance?: bigint;
    readonly baseTokenBalance?: bigint;
}

export abstract class OperatorScenario<ExecuteResult, ExecuteStaticResult>
    extends OrderbookScenario<OperatorContext, ExecuteResult, ExecuteStaticResult>
{
    readonly caller: Account;
    readonly expectedErrorInResult?: ContractError;
    readonly tradedTokenBalance: bigint;
    readonly baseTokenBalance: bigint;

    constructor({
        caller = Account.MAIN,
        expectedErrorInResult,
        tradedTokenBalance = parseValue(1000000),
        baseTokenBalance = parseValue(1000000),
        ...rest
    }: OperatorScenarioProperties) {
        super(rest);
        this.caller = caller;
        this.expectedErrorInResult = expectedErrorInResult;
        this.tradedTokenBalance = tradedTokenBalance;
        this.baseTokenBalance = baseTokenBalance;
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
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OperatorContext> {
        const ctx = await super._setup();
        const { mainAccount, [this.caller]: caller, addressBook, tradedToken, baseToken } = ctx;
        const operatorFactory = await OperatorFactory.deploy(mainAccount, addressBook);
        await operatorFactory.registerVersion(10000n, await OperatorV1.deploy());
        const operatorAddress = await operatorFactory.callStatic.createOperator(10000n);
        await operatorFactory.createOperator(10000n);
        const operator = OperatorV1.at(operatorAddress);
        await tradedToken.give(operator, this.tradedTokenBalance);
        await baseToken.give(operator, this.baseTokenBalance);
        return { ...ctx, caller, operatorFactory, operator };
    }

    async setup() {
        return await this._setup();
    }
}
