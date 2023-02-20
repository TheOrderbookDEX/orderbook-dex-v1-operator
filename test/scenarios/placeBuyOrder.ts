import { DefaultError, parseValue } from '@frugalwizard/abi2ts-lib';
import { Account, generatorChain, range } from '@frugalwizard/contract-test-helper';
import { InvalidAmount, InvalidPrice } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { Unauthorized } from '../../src/OperatorV1';
import { createPlaceSellOrderAction } from '../action/placeSellOrder';
import { EXHAUSTIVE } from '../config';
import { createPlaceBuyOrderScenario } from '../scenario/placeBuyOrder';

export const placeBuyOrderScenarios = {
    'place buy order': generatorChain(function*() {
        yield {
            hideOrderId: true,
            hideContractSize: true,
            hidePriceTick: true,
            setupActions: [],
        };

    }).then(function*(props) {
        for (const fee of [ 0n, parseValue('0.0001') ]) {
            yield {
                ...props,
                fee,
            };
        }

    }).then(function*(props) {
        for (const maxAmount of range(1n, EXHAUSTIVE ? 6n : 3n)) {
            yield {
                ...props,
                maxAmount,
            }
        }

    }).then(function*(props) {
        yield props;

        const { setupActions } = props;
        for (const maxAmount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    createPlaceSellOrderAction({ price: parseValue(1), maxAmount })
                ],
            };
        }

    }).then(function*(props) {
        yield props;

        const { setupActions } = props;
        for (const maxAmount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    createPlaceSellOrderAction({ price: parseValue(2), maxAmount })
                ],
            };
        }

    }).then(function*(props) {
        yield props;

        const { setupActions } = props;
        for (const maxAmount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    createPlaceSellOrderAction({ price: parseValue(3), maxAmount })
                ],
            };
        }

    }).then(function*(props) {
        for (const price of [...range(1, 3)].map(v => parseValue(v))) {
            yield {
                ...props,
                price,
            };
        }

    }).then(function*(props) {
        yield createPlaceBuyOrderScenario(props);
    }),

    'place buy order using maxPricePoints': generatorChain(function*() {
        yield {
            hideOrderId: true,
            hideContractSize: true,
            hidePriceTick: true,
            hideAmount: true,
        };

    }).then(function*(props) {
        yield {
            ...props,
            maxAmount: 4n,
            price: parseValue(3),
            setupActions: [
                createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                createPlaceSellOrderAction({ price: parseValue(2), maxAmount: 1n }),
                createPlaceSellOrderAction({ price: parseValue(3), maxAmount: 1n }),
            ],
        }

    }).then(function*(props) {
        for (const maxPricePoints of range(1, 3)) {
            yield {
                ...props,
                maxPricePoints,
            };
        }

    }).then(function*(props) {
        yield createPlaceBuyOrderScenario(props);
    }),

    'place buy order with common errors': generatorChain(function*() {
        yield {
            description: 'place buy order of 0 contracts',
            maxAmount: 0n,
            price: parseValue(1),
            expectedErrorInResult: new InvalidAmount(),
        };

        yield {
            description: 'place buy order of 0 contracts (on ask price)',
            maxAmount: 0n,
            price: parseValue(1),
            setupActions: [
                createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new InvalidAmount(),
        };

        yield {
            description: 'place buy order without funds',
            maxAmount: 1n,
            price: parseValue(1),
            baseTokenBalance: 0n,
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };

        yield {
            description: 'place buy order without funds (on ask price)',
            maxAmount: 1n,
            price: parseValue(1),
            baseTokenBalance: 0n,
            setupActions: [
                createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };

        yield {
            description: 'place buy order at price 0',
            maxAmount: 1n,
            price: parseValue(0),
            expectedErrorInResult: new InvalidPrice(),
        };

        yield {
            description: 'place buy order at price not divisible by price tick',
            maxAmount: 1n,
            price: parseValue(1),
            priceTick: parseValue(10),
            expectedErrorInResult: new InvalidPrice(),
        };

        yield {
            description: 'place buy order using account that is not the operator owner',
            caller: Account.SECOND,
            maxAmount: 1n,
            price: parseValue(1),
            expectedError: new Unauthorized(),
        };

    }).then(function*(props) {
        yield createPlaceBuyOrderScenario(props);
    }),
};
