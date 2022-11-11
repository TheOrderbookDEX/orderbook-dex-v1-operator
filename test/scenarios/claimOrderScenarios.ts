import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, applySetupActions, generatorChain, range, repeat } from '@frugal-wizard/contract-test-helper';
import { InvalidOrderId, Unauthorized, InvalidAmount, InvalidPrice, OrderDeleted } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { BuyAtMarketAction } from '../action/BuyAtMarketAction';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { PlaceBuyOrderAction } from '../action/PlaceBuyOrderAction';
import { PlaceSellOrderAction } from '../action/PlaceSellOrderAction';
import { SellAtMarketAction } from '../action/SellAtMarketAction';
import { describer } from '../describer/describer';
import { ClaimOrderScenario } from '../scenario/ClaimOrderScenario';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';

export const claimOrderScenarios: [string, Iterable<ClaimOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    claimOrderScenarios.push([
        `claim ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: true,
                    hideOrderId: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                }),
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(properties) {
            const { describer, price, setupActions } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price, maxAmount: 3n }) :
                        new PlaceSellOrderAction({ describer, price, maxAmount: 3n })
                ],
            };

        }).then(function*(properties) {
            yield properties;

            const { describer, setupActions } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            for (const maxAmount of range(1n, orders.totalAvailable(orderType))) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        orderType == OrderType.BUY ?
                            new SellAtMarketAction({ describer, maxAmount }) :
                            new BuyAtMarketAction({ describer, maxAmount })
                    ]
                };
            }

        }).then(function*(properties) {
            yield properties;

            const { describer, setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            const unclaimed = order?.unclaimed ?? 0n;
            for (const maxAmount of range(1n, unclaimed - 1n)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new ClaimOrderAction({ describer, orderType, price, orderId, maxAmount })
                    ]
                };
            }

        }).then(function*(properties) {
            yield new ClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    claimOrderScenarios.push([
        `claim ${describeOrderType(orderType)} orders using maxAmount`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: true,
                    hideOrderId: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                }),
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(properties) {
            for (const maxAmount of range(1n, 3n)) {
                yield {
                    ...properties,
                    maxAmount,
                };
            }

        }).then(function*(properties) {
            const { describer, price, setupActions } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price, maxAmount: 3n }) :
                        new PlaceSellOrderAction({ describer, price, maxAmount: 3n }),
                    orderType == OrderType.BUY ?
                        new SellAtMarketAction({ describer, maxAmount: 3n }) :
                        new BuyAtMarketAction({ describer, maxAmount: 3n })
                ]
            }

        }).then(function*(properties) {
            yield properties;

            const { describer, setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            const unclaimed = order?.unclaimed ?? 0n;
            for (const maxAmount of range(1n, unclaimed - 1n)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new ClaimOrderAction({ describer, orderType, price, orderId, maxAmount })
                    ]
                };
            }

        }).then(function*(properties) {
            yield new ClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    claimOrderScenarios.push([
        `claim deleted ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: true,
                    hideOrderId: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                }),
                expectedErrorInResult: new OrderDeleted(),
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(properties) {
            const { describer, price, setupActions } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price, maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price, maxAmount: 1n }),
                    orderType == OrderType.BUY ?
                        new SellAtMarketAction({ describer, maxAmount: 1n }) :
                        new BuyAtMarketAction({ describer, maxAmount: 1n }),
                    new ClaimOrderAction({ describer, orderType, price, orderId: 1n }),
                ]
            }
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price, maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price, maxAmount: 1n }),
                    new CancelOrderAction({ describer, orderType, price, orderId: 1n }),
                ]
            }

        }).then(function*(properties) {
            yield new ClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    claimOrderScenarios.push([
        `claim invalid ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                }),
                expectedErrorInResult: new InvalidOrderId(),
                orderType,
                price: parseValue(1),
                setupActions: [],
            };

        }).then(function*(properties) {
            for (const orderId of range(0n, 2n)) {
                yield {
                    ...properties,
                    orderId,
                };
            }

        }).then(function*(properties) {
            const { describer, price, setupActions, orderId } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    ...repeat(Number(orderId - 1n), orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price, maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price, maxAmount: 1n })),
                ]
            }

        }).then(function*(properties) {
            yield new ClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    claimOrderScenarios.push([
        `claim ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                describer: 'claim 0 contracts',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                maxAmount: 0n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
                    orderType == OrderType.BUY ?
                        new SellAtMarketAction({ describer, maxAmount: 1n }) :
                        new BuyAtMarketAction({ describer, maxAmount: 1n }),
                ],
                expectedErrorInResult: new InvalidAmount(),
            };
            yield {
                describer: 'claim order not owned by operator',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }),
                    orderType == OrderType.BUY ?
                        new SellAtMarketAction({ describer, maxAmount: 1n }) :
                        new BuyAtMarketAction({ describer, maxAmount: 1n }),
                ],
                expectedErrorInResult: new Unauthorized(),
            };
            yield {
                describer: 'claim order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedErrorInResult: new InvalidPrice(),
            };
            yield {
                describer: 'claim order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedErrorInResult: new InvalidPrice(),
            };
            yield {
                describer: 'claim order using account that is not the operator owner',
                caller: Account.SECOND,
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
                    orderType == OrderType.BUY ?
                        new SellAtMarketAction({ describer, maxAmount: 1n }) :
                        new BuyAtMarketAction({ describer, maxAmount: 1n }),
                ],
                expectedError: Unauthorized,
            };

        }).then(function*(properties) {
            yield new ClaimOrderScenario(properties);
        })
    ]);
}
