import { DefaultError, parseValue } from '@frugalwizard/abi2ts-lib';
import { Account, generatorChain, range } from '@frugalwizard/contract-test-helper';
import { InvalidAmount, InvalidPrice } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { Unauthorized } from '../../src/OperatorV1';
import { createPlaceBuyOrderAction } from '../action/placeBuyOrder';
import { EXHAUSTIVE } from '../config';
import { createPlaceSellOrderScenario } from '../scenario/placeSellOrder';

export const placeSellOrderScenarios = {
    'place sell order': generatorChain(function*() {
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
                    createPlaceBuyOrderAction({ price: parseValue(1), maxAmount })
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
                    createPlaceBuyOrderAction({ price: parseValue(2), maxAmount })
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
                    createPlaceBuyOrderAction({ price: parseValue(3), maxAmount })
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
        yield createPlaceSellOrderScenario(props);
    }),

    'place sell order using maxPricePoints': generatorChain(function*() {
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
            price: parseValue(1),
            setupActions: [
                createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }),
                createPlaceBuyOrderAction({ price: parseValue(2), maxAmount: 1n }),
                createPlaceBuyOrderAction({ price: parseValue(3), maxAmount: 1n }),
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
        yield createPlaceSellOrderScenario(props);
    }),

    'place sell order with common errors': generatorChain(function*() {
        yield {
            description: 'place sell order of 0 contracts',
            maxAmount: 0n,
            price: parseValue(1),
            expectedErrorInResult: new InvalidAmount(),
        };

        yield {
            description: 'place sell order of 0 contracts (on bid price)',
            maxAmount: 0n,
            price: parseValue(1),
            setupActions: [
                createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new InvalidAmount(),
        };

        yield {
            description: 'place sell order without funds',
            maxAmount: 1n,
            price: parseValue(1),
            tradedTokenBalance: 0n,
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };

        yield {
            description: 'place sell order without funds (on bid price)',
            maxAmount: 1n,
            price: parseValue(1),
            tradedTokenBalance: 0n,
            setupActions: [
                createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };

        yield {
            description: 'place sell order at price 0',
            maxAmount: 1n,
            price: parseValue(0),
            expectedErrorInResult: new InvalidPrice(),
        };

        yield {
            description: 'place sell order at price not divisible by price tick',
            maxAmount: 1n,
            price: parseValue(1),
            priceTick: parseValue(10),
            expectedErrorInResult: new InvalidPrice(),
        };

        yield {
            description: 'place sell order using account that is not the operator owner',
            caller: Account.SECOND,
            maxAmount: 1n,
            price: parseValue(1),
            expectedError: new Unauthorized(),
        };

    }).then(function*(props) {
        yield createPlaceSellOrderScenario(props);
    }),
};
