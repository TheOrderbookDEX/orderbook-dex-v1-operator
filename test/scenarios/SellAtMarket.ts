import { DefaultError, parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain, range } from '@frugal-wizard/contract-test-helper';
import { InvalidAmount, InvalidArgument } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { Unauthorized } from '../../src/OperatorV1';
import { PlaceBuyOrderAction } from '../action/PlaceBuyOrder';
import { EXHAUSTIVE } from '../config';
import { describer } from '../describer/describer';
import { SellAtMarketScenario } from '../scenario/SellAtMarket';

export const sellAtMarketScenarios: [string, Iterable<SellAtMarketScenario>][] = [];

sellAtMarketScenarios.push([
    'sell at market',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
            }),
            setupActions: [],
        };

    }).then(function*(properties) {
        for (const fee of [ 0n, parseValue('0.0001') ]) {
            yield {
                ...properties,
                fee,
            };
        }

    }).then(function*(properties) {
        for (const maxAmount of range(1n, EXHAUSTIVE ? 6n : 3n)) {
            yield {
                ...properties,
                maxAmount,
            }
        }

    }).then(function*(properties) {
        yield properties;

        const { describer, setupActions } = properties;
        for (const maxAmount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount })
                ],
            };
        }

    }).then(function*(properties) {
        yield properties;

        const { describer, setupActions } = properties;
        for (const maxAmount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceBuyOrderAction({ describer, price: parseValue(2), maxAmount })
                ],
            };
        }

    }).then(function*(properties) {
        yield properties;

        const { describer, setupActions } = properties;
        for (const maxAmount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceBuyOrderAction({ describer, price: parseValue(3), maxAmount })
                ],
            };
        }

    }).then(function*(properties) {
        yield new SellAtMarketScenario(properties);
    })
]);

sellAtMarketScenarios.push([
    'sell at market using maxPrice',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAmount: true,
            }),
        };

    }).then(function*(properties) {
        const { describer } = properties;
        yield {
            ...properties,
            maxAmount: 3n,
            setupActions: [
                new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
                new PlaceBuyOrderAction({ describer, price: parseValue(2), maxAmount: 1n }),
                new PlaceBuyOrderAction({ describer, price: parseValue(3), maxAmount: 1n }),
            ],
        }

    }).then(function*(properties) {
        for (const minPrice of [...range(1, 3)].map(v => parseValue(v))) {
            yield {
                ...properties,
                minPrice,
            };
        }

    }).then(function*(properties) {
        yield new SellAtMarketScenario(properties);
    })
]);

sellAtMarketScenarios.push([
    'sell at market using maxPricePoints',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAmount: true,
            }),
        };

    }).then(function*(properties) {
        const { describer } = properties;
        yield {
            ...properties,
            maxAmount: 3n,
            setupActions: [
                new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
                new PlaceBuyOrderAction({ describer, price: parseValue(2), maxAmount: 1n }),
                new PlaceBuyOrderAction({ describer, price: parseValue(3), maxAmount: 1n }),
            ],
        }

    }).then(function*(properties) {
        for (const maxPricePoints of range(1, 3)) {
            yield {
                ...properties,
                maxPricePoints,
            };
        }

    }).then(function*(properties) {
        yield new SellAtMarketScenario(properties);
    })
]);

sellAtMarketScenarios.push([
    'sell at market with common errors',
    generatorChain(function*() {
        yield {
            describer: 'sell at market 0 contracts',
            maxAmount: 0n,
            setupActions: [
                new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new InvalidAmount(),
        };
        yield {
            describer: 'sell at market without funds',
            maxAmount: 1n,
            tradedTokenBalance: 0n,
            setupActions: [
                new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };
        yield {
            describer: 'sell at market using maxPricePoints 0',
            maxAmount: 1n,
            maxPricePoints: 0,
            setupActions: [
                new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new InvalidArgument(),
        };
        yield {
            describer: 'sell at market using account that is not the operator owner',
            caller: Account.SECOND,
            maxAmount: 1n,
            setupActions: [
                new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
            ],
            expectedError: Unauthorized,
        };

    }).then(function*(properties) {
        yield new SellAtMarketScenario(properties);
    })
]);
