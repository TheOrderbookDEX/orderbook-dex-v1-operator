import { parseValue } from '@frugalwizard/abi2ts-lib';
import { Account, generatorChain, range, repeat } from '@frugalwizard/contract-test-helper';
import { InvalidOrderId, Unauthorized, InvalidAmount, InvalidPrice, OrderDeleted } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { createBuyAtMarketAction } from '../action/buyAtMarket';
import { createCancelOrderAction } from '../action/cancelOrder';
import { createClaimOrderAction } from '../action/claimOrder';
import { createPlaceBuyOrderAction } from '../action/placeBuyOrder';
import { createPlaceSellOrderAction } from '../action/placeSellOrder';
import { createSellAtMarketAction } from '../action/sellAtMarket';
import { createClaimOrderScenario } from '../scenario/claimOrder';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { applyActions } from '../utils/actions';

export const claimOrderScenarios = {
    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                hideOrderType: true,
                hidePrice: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                orderType,
                price: parseValue(1),
                orderId: 1n,
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
            const { price, setupActions, hidePrice } = props;
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price, maxAmount: 3n, hidePrice }) :
                        createPlaceSellOrderAction({ price, maxAmount: 3n, hidePrice })
                ],
            };

        }).then(function*(props) {
            yield props;

            const { setupActions, hidePrice } = props;
            const orders = applyActions(setupActions, new Orders());
            for (const maxAmount of range(1n, orders.totalAvailable(orderType))) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        orderType == OrderType.BUY ?
                            createSellAtMarketAction({ maxAmount, hidePrice }) :
                            createBuyAtMarketAction({ maxAmount, hidePrice })
                    ]
                };
            }

        }).then(function*(props) {
            yield props;

            const { setupActions, price, orderId, hideOrderType, hidePrice, hideOrderId } = props;
            const orders = applyActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            const unclaimed = order?.unclaimed ?? 0n;
            for (const maxAmount of range(1n, unclaimed - 1n)) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createClaimOrderAction({ orderType, price, orderId, maxAmount, hideOrderType, hidePrice, hideOrderId })
                    ]
                };
            }

        }).then(function*(props) {
            yield createClaimOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim ${describeOrderType(orderType)} orders using maxAmount`,
        generatorChain(function*() {
            yield {
                hideOrderType: true,
                hidePrice: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(props) {
            for (const maxAmount of range(1n, 3n)) {
                yield {
                    ...props,
                    maxAmount,
                };
            }

        }).then(function*(props) {
            const { price, setupActions, hidePrice } = props;
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price, maxAmount: 3n, hidePrice }) :
                        createPlaceSellOrderAction({ price, maxAmount: 3n, hidePrice }),
                    orderType == OrderType.BUY ?
                        createSellAtMarketAction({ maxAmount: 3n, hidePrice }) :
                        createBuyAtMarketAction({ maxAmount: 3n, hidePrice })
                ]
            }

        }).then(function*(props) {
            yield props;

            const { setupActions, price, orderId, hideOrderType, hidePrice, hideOrderId } = props;
            const orders = applyActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            const unclaimed = order?.unclaimed ?? 0n;
            for (const maxAmount of range(1n, unclaimed - 1n)) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createClaimOrderAction({ orderType, price, orderId, maxAmount, hideOrderType, hidePrice, hideOrderId })
                    ]
                };
            }

        }).then(function*(props) {
            yield createClaimOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim deleted ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                hideOrderType: true,
                hidePrice: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                expectedErrorInResult: new OrderDeleted(),
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(props) {
            const { price, setupActions, hideOrderType, hidePrice, hideOrderId } = props;
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price, maxAmount: 1n, hidePrice }) :
                        createPlaceSellOrderAction({ price, maxAmount: 1n, hidePrice }),
                    orderType == OrderType.BUY ?
                        createSellAtMarketAction({ maxAmount: 1n, hidePrice }) :
                        createBuyAtMarketAction({ maxAmount: 1n, hidePrice }),
                    createClaimOrderAction({ orderType, price, orderId: 1n, hideOrderType, hidePrice, hideOrderId }),
                ]
            }
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price, maxAmount: 1n, hidePrice }) :
                        createPlaceSellOrderAction({ price, maxAmount: 1n, hidePrice }),
                    createCancelOrderAction({ orderType, price, orderId: 1n, hideOrderType, hidePrice, hideOrderId }),
                ]
            }

        }).then(function*(props) {
            yield createClaimOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim invalid ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                hideOrderType: true,
                hidePrice: true,
                hideContractSize: true,
                hidePriceTick: true,
                expectedErrorInResult: new InvalidOrderId(),
                orderType,
                price: parseValue(1),
                setupActions: [],
            };

        }).then(function*(props) {
            for (const orderId of range(0n, 2n)) {
                yield {
                    ...props,
                    orderId,
                };
            }

        }).then(function*(props) {
            const { price, setupActions, orderId, hidePrice } = props;
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    ...repeat(Number(orderId - 1n), orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price, maxAmount: 1n, hidePrice }) :
                        createPlaceSellOrderAction({ price, maxAmount: 1n, hidePrice })),
                ]
            }

        }).then(function*(props) {
            yield createClaimOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                description: 'claim 0 contracts',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                maxAmount: 0n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                    orderType == OrderType.BUY ?
                        createSellAtMarketAction({ maxAmount: 1n }) :
                        createBuyAtMarketAction({ maxAmount: 1n }),
                ],
                expectedErrorInResult: new InvalidAmount(),
            };

            yield {
                description: 'claim order not owned by operator',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }),
                    orderType == OrderType.BUY ?
                        createSellAtMarketAction({ maxAmount: 1n }) :
                        createBuyAtMarketAction({ maxAmount: 1n }),
                ],
                expectedErrorInResult: new Unauthorized(),
            };

            yield {
                description: 'claim order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedErrorInResult: new InvalidPrice(),
            };

            yield {
                description: 'claim order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedErrorInResult: new InvalidPrice(),
            };

            yield {
                description: 'claim order using account that is not the operator owner',
                caller: Account.SECOND,
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                    orderType == OrderType.BUY ?
                        createSellAtMarketAction({ maxAmount: 1n }) :
                        createBuyAtMarketAction({ maxAmount: 1n }),
                ],
                expectedError: new Unauthorized(),
            };

        }).then(function*(props) {
            yield createClaimOrderScenario(props);
        })
    ])),
};
