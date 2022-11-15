import { DefaultError, parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain, range } from '@frugal-wizard/contract-test-helper';
import { InvalidAmount, InvalidPrice } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { Unauthorized } from '../../src/OperatorV1';
import { PlaceSellOrderAction } from '../action/PlaceSellOrder';
import { EXHAUSTIVE } from '../config';
import { describer } from '../describer/describer';
import { PlaceBuyOrderScenario } from '../scenario/PlaceBuyOrder';

export const placeBuyOrderScenarios: [string, Iterable<PlaceBuyOrderScenario>][] = [];

placeBuyOrderScenarios.push([
    'place buy order',
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
                    new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount })
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
                    new PlaceSellOrderAction({ describer, price: parseValue(2), maxAmount })
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
                    new PlaceSellOrderAction({ describer, price: parseValue(3), maxAmount })
                ],
            };
        }

    }).then(function*(properties) {
        for (const price of [...range(1, 3)].map(v => parseValue(v))) {
            yield {
                ...properties,
                price,
            };
        }

    }).then(function*(properties) {
        yield new PlaceBuyOrderScenario(properties);
    })
]);

placeBuyOrderScenarios.push([
    'place buy order using maxPricePoints',
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
            maxAmount: 4n,
            price: parseValue(3),
            setupActions: [
                new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
                new PlaceSellOrderAction({ describer, price: parseValue(2), maxAmount: 1n }),
                new PlaceSellOrderAction({ describer, price: parseValue(3), maxAmount: 1n }),
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
        yield new PlaceBuyOrderScenario(properties);
    })
]);

placeBuyOrderScenarios.push([
    'place buy order with common errors',
    generatorChain(function*() {
        yield {
            describer: 'place buy order of 0 contracts',
            maxAmount: 0n,
            price: parseValue(1),
            expectedErrorInResult: new InvalidAmount(),
        };
        yield {
            describer: 'place buy order of 0 contracts (on ask price)',
            maxAmount: 0n,
            price: parseValue(1),
            setupActions: [
                new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new InvalidAmount(),
        };
        yield {
            describer: 'place buy order without funds',
            maxAmount: 1n,
            price: parseValue(1),
            baseTokenBalance: 0n,
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };
        yield {
            describer: 'place buy order without funds (on ask price)',
            maxAmount: 1n,
            price: parseValue(1),
            baseTokenBalance: 0n,
            setupActions: [
                new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };
        yield {
            describer: 'place buy order at price 0',
            maxAmount: 1n,
            price: parseValue(0),
            expectedErrorInResult: new InvalidPrice(),
        };
        yield {
            describer: 'place buy order at price not divisible by price tick',
            maxAmount: 1n,
            price: parseValue(1),
            priceTick: parseValue(10),
            expectedErrorInResult: new InvalidPrice(),
        };
        yield {
            describer: 'place buy order using account that is not the operator owner',
            caller: Account.SECOND,
            maxAmount: 1n,
            price: parseValue(1),
            expectedError: Unauthorized,
        };

    }).then(function*(properties) {
        yield new PlaceBuyOrderScenario(properties);
    })
]);
