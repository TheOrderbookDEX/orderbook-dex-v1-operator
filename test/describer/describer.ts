import { formatValue, MAX_UINT256, MAX_UINT32, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { Account, ConfigurableDescriber } from '@frugal-wizard/contract-test-helper';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { TransferOrderToOperatorAction } from '../action/TransferOrderToOperatorAction';
import { OperatorBuyAtMarketScenario } from '../scenario/OperatorBuyAtMarketScenario';
import { OperatorCancelOrderScenario } from '../scenario/OperatorCancelOrderScenario';
import { OperatorClaimOrderScenario } from '../scenario/OperatorClaimOrderScenario';
import { OperatorPlaceBuyOrderScenario } from '../scenario/OperatorPlaceBuyOrderScenario';
import { OperatorPlaceSellOrderScenario } from '../scenario/OperatorPlaceSellOrderScenario';
import { OperatorSellAtMarketScenario } from '../scenario/OperatorSellAtMarketScenario';
import { OperatorTransferOrderScenario } from '../scenario/OperatorTransferOrderScenario';
import { describeOrderType, OrderType } from '../state/OrderType';

export interface OrderbookTestDescriberConfig {
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideAmount?: boolean;
}

export const describer = new ConfigurableDescriber<OrderbookTestDescriberConfig>();

function describeSetup(description: string[], scenario: { setupActions: readonly { description: string }[] }) {
    const { setupActions } = scenario;
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
}

function describeCaller(description: string[], scenario: { caller: Account }) {
    const { caller } = scenario;
    if (caller != Account.MAIN) {
        description.push('using');
        description.push(caller);
    }
}

function describeMaxAmountOfContracts(description: string[], scenario: { maxAmount: bigint }, config: { hideAmount?: boolean }, preposition?: string) {
    const { maxAmount } = scenario;
    const { hideAmount } = config;
    if (!hideAmount && maxAmount < MAX_UINT32) {
        if (preposition) {
            description.push(preposition);
        }
        description.push(`${maxAmount} or less contracts`);
    }
}

function describeAmountOfContracts(description: string[], scenario: { amount: bigint }, config: { hideAmount?: boolean }, preposition?: string) {
    const { amount } = scenario;
    const { hideAmount } = config;
    if (!hideAmount) {
        if (preposition) {
            description.push(preposition);
        }
        description.push(`${amount} contract${ amount != 1n ? 's' : '' }`);
    }
}

function describeMaxPrice(description: string[], scenario: { maxPrice: bigint }, config: { hidePrice?: boolean }) {
    const { maxPrice } = scenario;
    const { hidePrice } = config;
    if (!hidePrice && maxPrice < MAX_UINT256) {
        description.push('at');
        description.push(formatValue(maxPrice));
        description.push('or better');
    }
}

function describeMinPrice(description: string[], scenario: { minPrice: bigint }, config: { hidePrice?: boolean }) {
    const { minPrice } = scenario;
    const { hidePrice } = config;
    if (!hidePrice && minPrice > 0n) {
        description.push('at');
        description.push(formatValue(minPrice));
        description.push('or better');
    }
}

function describePriceLimit(description: string[], scenario: { price: bigint }, config: { hidePrice?: boolean }) {
    const { price } = scenario;
    const { hidePrice } = config;
    if (!hidePrice) {
        description.push('at');
        description.push(formatValue(price));
        description.push('or better');
    }
}

function describeMaxPricePoints(description: string[], scenario: { maxPricePoints: number }) {
    const { maxPricePoints } = scenario;
    if (maxPricePoints != MAX_UINT8) {
        description.push(`for at most ${maxPricePoints} price point${maxPricePoints!=1?'s':''}`);
    }
}

function describeOrder(description: string[], scenario: { orderType: OrderType, price: bigint, orderId?: bigint }, config: { hideOrderType?: boolean, hidePrice?: boolean, hideOrderId?: boolean }) {
    const { orderType, price, orderId } = scenario;
    const { hideOrderType, hidePrice, hideOrderId } = config;
    if (!hideOrderType) {
        description.push(describeOrderType(orderType));
    }
    if (!hideOrderType && !hidePrice) {
        description.push('at');
    }
    if (!hidePrice) {
        description.push(formatValue(price));
    }
    description.push('order');
    if (!hideOrderId && orderId) {
        description.push(`#${orderId}`);
    }
}

function describeFillPricePoint(description: string[], scenario: { orderType: OrderType, maxPrice: bigint }, config: { hideOrderType?: boolean, hidePrice?: boolean }) {
    const { orderType, maxPrice } = scenario;
    const { hideOrderType, hidePrice } = config;
    if (!hideOrderType) {
        description.push(describeOrderType(orderType));
    }
    if (!hideOrderType && !hidePrice) {
        description.push('at');
    }
    if (!hidePrice
     && !(orderType == OrderType.SELL && maxPrice == MAX_UINT256)
     && !(orderType == OrderType.BUY && maxPrice == 0n)) {
        description.push(formatValue(maxPrice));
        description.push('or better');
    }
}

function describeScenario(description: string[], scenario: { contractSize: bigint, priceTick: bigint }, config: { hideContractSize?: boolean, hidePriceTick?: boolean }) {
    const { contractSize, priceTick } = scenario;
    const { hideContractSize, hidePriceTick } = config;
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
}

describer.addDescriber(PlaceOrderAction, (action, config = {}) => {
    const description = ['place'];
    describeOrder(description, action, config);
    describeAmountOfContracts(description, action, config, 'of');
    describeCaller(description, action);
    return description.join(' ');
});

describer.addDescriber(FillAction, (action, config = {}) => {
    const description = ['fill'];
    describeMaxAmountOfContracts(description, action, config);
    describeFillPricePoint(description, action, config);
    description.push('orders');
    describeMaxPricePoints(description, action);
    return description.join(' ');
});

describer.addDescriber(ClaimOrderAction, (action, config = {}) => {
    const description = ['claim'];
    describeMaxAmountOfContracts(description, action, config);
    describeOrder(description, action, config);
    return description.join(' ');
});

describer.addDescriber(CancelOrderAction, (action, config = {}) => {
    const description = ['cancel'];
    describeOrder(description, action, config);
    return description.join(' ');
});

describer.addDescriber(TransferOrderToOperatorAction, (action, config = {}) => {
    const description = ['transfer'];
    describeOrder(description, action, config);
    description.push('to operator');
    return description.join(' ');
});

describer.addDescriber(OperatorBuyAtMarketScenario, (scenario, config = {}) => {
    const description = ['buy at market'];
    describeMaxAmountOfContracts(description, scenario, config);
    describeMaxPrice(description, scenario, config);
    describeMaxPricePoints(description, scenario);
    describeCaller(description, scenario);
    describeSetup(description, scenario);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(OperatorSellAtMarketScenario, (scenario, config = {}) => {
    const description = ['sell at market'];
    describeMaxAmountOfContracts(description, scenario, config);
    describeMinPrice(description, scenario, config);
    describeMaxPricePoints(description, scenario);
    describeCaller(description, scenario);
    describeSetup(description, scenario);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(OperatorPlaceBuyOrderScenario, (scenario, config = {}) => {
    const description = ['place buy order'];
    describeMaxAmountOfContracts(description, scenario, config, 'of');
    describePriceLimit(description, scenario, config);
    describeMaxPricePoints(description, scenario);
    describeCaller(description, scenario);
    describeSetup(description, scenario);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(OperatorPlaceSellOrderScenario, (scenario, config = {}) => {
    const description = ['place sell order'];
    describeMaxAmountOfContracts(description, scenario, config, 'of');
    describePriceLimit(description, scenario, config);
    describeMaxPricePoints(description, scenario);
    describeCaller(description, scenario);
    describeSetup(description, scenario);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(OperatorClaimOrderScenario, (scenario, config = {}) => {
    const description = ['claim'];
    describeMaxAmountOfContracts(description, scenario, config);
    description.push('from');
    describeOrder(description, scenario, config);
    describeCaller(description, scenario);
    describeSetup(description, scenario);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(OperatorTransferOrderScenario, (scenario, config = {}) => {
    const description = ['transfer'];
    describeOrder(description, scenario, config);
    description.push(`to ${scenario.recipient}`);
    describeCaller(description, scenario);
    describeSetup(description, scenario);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(OperatorCancelOrderScenario, (scenario, config = {}) => {
    const description = ['cancel'];
    describeOrder(description, scenario, config);
    describeCaller(description, scenario);
    describeSetup(description, scenario);
    describeScenario(description, scenario, config);
    return description.join(' ');
});
