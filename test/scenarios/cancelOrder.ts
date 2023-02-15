import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain, range, repeat } from '@frugal-wizard/contract-test-helper';
import { AlreadyFilled, InvalidOrderId, OverMaxLastOrderId, Unauthorized, InvalidPrice, OrderDeleted } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { createBuyAtMarketAction } from '../action/buyAtMarket';
import { createCancelOrderAction } from '../action/cancelOrder';
import { createClaimOrderAction } from '../action/claimOrder';
import { createPlaceBuyOrderAction } from '../action/placeBuyOrder';
import { createPlaceSellOrderAction } from '../action/placeSellOrder';
import { createSellAtMarketAction } from '../action/sellAtMarket';
import { createCancelOrderScenario } from '../scenario/cancelOrder';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { applyActions } from '../utils/actions';

export const cancelOrderScenarios = {
    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel ${describeOrderType(orderType)} orders`,
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
            for (const maxAmount of range(1n, orders.totalAvailable(orderType) - 1n)) {
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
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel deleted ${describeOrderType(orderType)} orders`,
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
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel invalid ${describeOrderType(orderType)} orders`,
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
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel ${describeOrderType(orderType)} orders already filled`,
        generatorChain(function*() {
            yield {
                hideOrderType: true,
                hidePrice: true,
                hideContractSize: true,
                hidePriceTick: true,
                expectedErrorInResult: new AlreadyFilled(),
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(props) {
            const { price, setupActions, hidePrice } = props;
            for (const maxAmount of range(1n, 3n)) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        orderType == OrderType.BUY ?
                            createPlaceBuyOrderAction({ price, maxAmount, hidePrice }) :
                            createPlaceSellOrderAction({ price, maxAmount, hidePrice }),
                        orderType == OrderType.BUY ?
                            createSellAtMarketAction({ maxAmount, hidePrice }) :
                            createBuyAtMarketAction({ maxAmount, hidePrice }),
                    ]
                }
            }

        }).then(function*(props) {
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                description: 'stop cancel order when order has been placed after it',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                maxLastOrderId: 1n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                ],
                expectedErrorInResult: new OverMaxLastOrderId(),
            };

            yield {
                description: 'cancel order not owned by operator',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }),
                ],
                expectedErrorInResult: new Unauthorized(),
            };

            yield {
                description: 'cancel order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedErrorInResult: new InvalidPrice(),
            };

            yield {
                description: 'cancel order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedErrorInResult: new InvalidPrice(),
            };

            yield {
                description: 'cancel order using account that is not the operator owner',
                caller: Account.SECOND,
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                ],
                expectedError: new Unauthorized(),
            };

        }).then(function*(props) {
            yield createCancelOrderScenario(props);
        })
    ])),
}
