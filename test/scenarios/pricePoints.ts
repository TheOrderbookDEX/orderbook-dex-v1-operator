import { parseValue } from '@frugalwizard/abi2ts-lib';
import { Account, generatorChain, range } from '@frugalwizard/contract-test-helper';
import { createPlaceBuyOrderAction } from '../action/placeBuyOrder';
import { createPlaceSellOrderAction } from '../action/placeSellOrder';
import { createPricePointsScenario } from '../scenario/pricePoints';

export const pricePointsScenarios = generatorChain(function*() {
    yield {
        hideContractSize: true,
        hidePriceTick: true,
        hideSetup: true,
    };

}).then(function*(props) {
    yield {
        ...props,
        setupActions: [
            ...[...range( 1, 10)].map(n => createPlaceBuyOrderAction({ price: parseValue(n), maxAmount: BigInt(n) })),
            ...[...range(11, 20)].map(n => createPlaceSellOrderAction({ price: parseValue(n), maxAmount: BigInt(n) })),
        ],
    };

}).then(function*(props) {
    yield props;

    yield {
        ...props,
        sellPricesLimit: 5,
    };

    yield {
        ...props,
        buyPricesLimit: 5,
    };

    yield {
        ...props,
        sellPricesLimit: 5,
        buyPricesLimit: 5,
    };

    yield {
        ...props,
        prevSellPrice: parseValue(15),
    };

    yield {
        ...props,
        prevBuyPrice: parseValue(5),
    };

    yield {
        ...props,
        caller: Account.SECOND,
    };

    yield {
        ...props,
        useOperatorImplementation: true,
    };

}).then(function*(props) {
    yield createPricePointsScenario(props);
});
