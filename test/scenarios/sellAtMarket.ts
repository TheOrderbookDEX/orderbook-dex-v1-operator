import { DefaultError, parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain, range } from '@frugal-wizard/contract-test-helper';
import { InvalidAmount, InvalidArgument } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { Unauthorized } from '../../src/OperatorV1';
import { createPlaceBuyOrderAction } from '../action/placeBuyOrder';
import { EXHAUSTIVE } from '../config';
import { createSellAtMarketScenario } from '../scenario/sellAtMarket';

export const sellAtMarketScenarios = {
    'sell at market': generatorChain(function*() {
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
        yield createSellAtMarketScenario(props);
    }),

    'sell at market using maxPrice': generatorChain(function*() {
        yield {
            hideOrderId: true,
            hideContractSize: true,
            hidePriceTick: true,
            hideAmount: true,
        };

    }).then(function*(props) {
        yield {
            ...props,
            maxAmount: 3n,
            setupActions: [
                createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }),
                createPlaceBuyOrderAction({ price: parseValue(2), maxAmount: 1n }),
                createPlaceBuyOrderAction({ price: parseValue(3), maxAmount: 1n }),
            ],
        }

    }).then(function*(props) {
        for (const minPrice of [...range(1, 3)].map(v => parseValue(v))) {
            yield {
                ...props,
                minPrice,
            };
        }

    }).then(function*(props) {
        yield createSellAtMarketScenario(props);
    }),

    'sell at market using maxPricePoints': generatorChain(function*() {
        yield {
            hideOrderId: true,
            hideContractSize: true,
            hidePriceTick: true,
            hideAmount: true,
        };

    }).then(function*(props) {
        yield {
            ...props,
            maxAmount: 3n,
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
        yield createSellAtMarketScenario(props);
    }),

    'sell at market with common errors': generatorChain(function*() {
        yield {
            description: 'sell at market 0 contracts',
            maxAmount: 0n,
            setupActions: [
                createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new InvalidAmount(),
        };

        yield {
            description: 'sell at market without funds',
            maxAmount: 1n,
            tradedTokenBalance: 0n,
            setupActions: [
                createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };

        yield {
            description: 'sell at market using maxPricePoints 0',
            maxAmount: 1n,
            maxPricePoints: 0,
            setupActions: [
                createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }),
            ],
            expectedErrorInResult: new InvalidArgument(),
        };

        yield {
            description: 'sell at market using account that is not the operator owner',
            caller: Account.SECOND,
            maxAmount: 1n,
            setupActions: [
                createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }),
            ],
            expectedError: new Unauthorized(),
        };

    }).then(function*(props) {
        yield createSellAtMarketScenario(props);
    }),
};
