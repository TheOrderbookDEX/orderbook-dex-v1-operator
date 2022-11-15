import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain, range } from '@frugal-wizard/contract-test-helper';
import { PlaceBuyOrderAction } from '../action/PlaceBuyOrder';
import { PlaceSellOrderAction } from '../action/PlaceSellOrder';
import { describer } from '../describer/describer';
import { PricePointsScenario } from '../scenario/PricePoints';

export const pricePointsScenarios = generatorChain(function*() {
    yield {
        describer: describer.clone().configure({
            hideContractSize: true,
            hidePriceTick: true,
            hideSetup: true,
        }),
    };

}).then(function*(properties) {
    yield {
        ...properties,
        setupActions: [
            ...[...range( 1, 10)].map(n =>  new PlaceBuyOrderAction({ describer, price: parseValue(n), maxAmount: BigInt(n) })),
            ...[...range(11, 20)].map(n => new PlaceSellOrderAction({ describer, price: parseValue(n), maxAmount: BigInt(n) })),
        ],
    };

}).then(function*(properties) {
    yield properties;

    yield {
        ...properties,
        sellPricesLimit: 5,
    };

    yield {
        ...properties,
        buyPricesLimit: 5,
    };

    yield {
        ...properties,
        sellPricesLimit: 5,
        buyPricesLimit: 5,
    };

    yield {
        ...properties,
        prevSellPrice: parseValue(15),
    };

    yield {
        ...properties,
        prevBuyPrice: parseValue(5),
    };

    yield {
        ...properties,
        caller: Account.SECOND,
    };

    yield {
        ...properties,
        useOperatorImplementation: true,
    };

}).then(function*(properties) {
    yield new PricePointsScenario(properties);
});
