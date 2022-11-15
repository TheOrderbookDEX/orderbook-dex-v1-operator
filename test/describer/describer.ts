import { formatValue, MAX_UINT256, MAX_UINT32, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { Account, ConfigurableDescriber } from '@frugal-wizard/contract-test-helper';
import { BuyAtMarketAction } from '../action/BuyAtMarket';
import { CancelOrderAction } from '../action/CancelOrder';
import { ClaimOrderAction } from '../action/ClaimOrder';
import { PlaceBuyOrderAction } from '../action/PlaceBuyOrder';
import { PlaceSellOrderAction } from '../action/PlaceSellOrder';
import { SellAtMarketAction } from '../action/SellAtMarket';
import { BuyAtMarketScenario } from '../scenario/BuyAtMarket';
import { CancelOrderScenario } from '../scenario/CancelOrder';
import { ClaimOrderScenario } from '../scenario/ClaimOrder';
import { PlaceBuyOrderScenario } from '../scenario/PlaceBuyOrder';
import { PlaceSellOrderScenario } from '../scenario/PlaceSellOrder';
import { PricePointsScenario } from '../scenario/PricePoints';
import { SellAtMarketScenario } from '../scenario/SellAtMarket';
import { TransferOrderScenario } from '../scenario/TransferOrder';
import { describeOrderType, OrderType } from '../state/OrderType';

export interface OrderbookTestDescriberConfig {
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideAmount?: boolean;
    readonly hideSetup?: boolean;
}

export const describer = new ConfigurableDescriber<OrderbookTestDescriberConfig>();

function describeSetup(description: string[], scenario: { setupActions: readonly { description: string }[] }, config: { hideSetup?: boolean }) {
    const { setupActions } = scenario;
    const { hideSetup } = config;
    if (hideSetup) return;
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

describer.addDescriber(BuyAtMarketAction, (action, config = {}) => {
    const description = ['buy at market'];
    describeMaxAmountOfContracts(description, action, config);
    describeMaxPrice(description, action, config);
    describeMaxPricePoints(description, action);
    return description.join(' ');
});

describer.addDescriber(SellAtMarketAction, (action, config = {}) => {
    const description = ['buy at market'];
    describeMaxAmountOfContracts(description, action, config);
    describeMinPrice(description, action, config);
    describeMaxPricePoints(description, action);
    return description.join(' ');
});

describer.addDescriber(PlaceBuyOrderAction, (action, config = {}) => {
    const description = ['place buy order'];
    describeMaxAmountOfContracts(description, action, config, 'of');
    describePriceLimit(description, action, config);
    describeCaller(description, action);
    return description.join(' ');
});

describer.addDescriber(PlaceSellOrderAction, (action, config = {}) => {
    const description = ['place sell order'];
    describeMaxAmountOfContracts(description, action, config, 'of');
    describePriceLimit(description, action, config);
    describeCaller(description, action);
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

describer.addDescriber(BuyAtMarketScenario, (scenario, config = {}) => {
    const description = ['buy at market'];
    describeMaxAmountOfContracts(description, scenario, config);
    describeMaxPrice(description, scenario, config);
    describeMaxPricePoints(description, scenario);
    describeCaller(description, scenario);
    describeSetup(description, scenario, config);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(SellAtMarketScenario, (scenario, config = {}) => {
    const description = ['sell at market'];
    describeMaxAmountOfContracts(description, scenario, config);
    describeMinPrice(description, scenario, config);
    describeMaxPricePoints(description, scenario);
    describeCaller(description, scenario);
    describeSetup(description, scenario, config);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(PlaceBuyOrderScenario, (scenario, config = {}) => {
    const description = ['place buy order'];
    describeMaxAmountOfContracts(description, scenario, config, 'of');
    describePriceLimit(description, scenario, config);
    describeMaxPricePoints(description, scenario);
    describeCaller(description, scenario);
    describeSetup(description, scenario, config);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(PlaceSellOrderScenario, (scenario, config = {}) => {
    const description = ['place sell order'];
    describeMaxAmountOfContracts(description, scenario, config, 'of');
    describePriceLimit(description, scenario, config);
    describeMaxPricePoints(description, scenario);
    describeCaller(description, scenario);
    describeSetup(description, scenario, config);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(ClaimOrderScenario, (scenario, config = {}) => {
    const description = ['claim'];
    describeMaxAmountOfContracts(description, scenario, config);
    description.push('from');
    describeOrder(description, scenario, config);
    describeCaller(description, scenario);
    describeSetup(description, scenario, config);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(TransferOrderScenario, (scenario, config = {}) => {
    const description = ['transfer'];
    describeOrder(description, scenario, config);
    description.push(`to ${scenario.recipient}`);
    describeCaller(description, scenario);
    describeSetup(description, scenario, config);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(CancelOrderScenario, (scenario, config = {}) => {
    const description = ['cancel'];
    describeOrder(description, scenario, config);
    describeCaller(description, scenario);
    describeSetup(description, scenario, config);
    describeScenario(description, scenario, config);
    return description.join(' ');
});

describer.addDescriber(PricePointsScenario, (scenario, config = {}) => {
    const description = ['get price points'];
    const { prevSellPrice, sellPricesLimit, prevBuyPrice, buyPricesLimit, useOperatorImplementation } = scenario;
    if (useOperatorImplementation) {
        description.push('using operator implementation');
    }
    if (prevSellPrice || prevBuyPrice) {
        description.push('after');
        description.push([
            ...prevSellPrice ? [`sell at ${formatValue(prevSellPrice)}`] : [],
            ...prevBuyPrice ? [`buy at ${formatValue(prevBuyPrice)}`] : [],
        ].join(' and '));
    }
    if (sellPricesLimit < MAX_UINT8 || buyPricesLimit < MAX_UINT8) {
        description.push('limited to');
        description.push([
            ...sellPricesLimit < MAX_UINT8 ? [`${sellPricesLimit} sell prices`] : [],
            ...buyPricesLimit < MAX_UINT8 ? [`${buyPricesLimit} buy prices`] : [],
        ].join(' and '));
    }
    describeCaller(description, scenario);
    describeSetup(description, scenario, config);
    describeScenario(description, scenario, config);
    return description.join(' ');
});
