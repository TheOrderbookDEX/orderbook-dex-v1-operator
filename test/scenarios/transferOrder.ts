import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { NotRegistered } from '@frugal-wizard/addressbook/dist/utils/AddressBookUtil';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { InvalidOrderId, InvalidPrice, OrderDeleted, Unauthorized } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { createBuyAtMarketAction } from '../action/buyAtMarket';
import { createCancelOrderAction } from '../action/cancelOrder';
import { createClaimOrderAction } from '../action/claimOrder';
import { createPlaceBuyOrderAction } from '../action/placeBuyOrder';
import { createPlaceSellOrderAction } from '../action/placeSellOrder';
import { createSellAtMarketAction } from '../action/sellAtMarket';
import { createTransferOrderScenario } from '../scenario/transferOrder';
import { describeOrderType, OrderType } from '../state/OrderType';

export const transferOrderScenarios = {
    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `transfer ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                description: 'transfer order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n })
                ],
            };

            yield {
                description: 'transfer order to not registered account',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.THIRD,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n })
                ],
                expectedErrorInResult: new NotRegistered(),
            };

            yield {
                description: 'transfer invalid order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [],
                expectedErrorInResult: new InvalidOrderId(),
            };

            yield {
                description: 'transfer canceled order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                    createCancelOrderAction({ orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedErrorInResult: new OrderDeleted(),
            };

            yield {
                description: 'transfer fully claimed order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                    orderType == OrderType.BUY ?
                        createSellAtMarketAction({ maxAmount: 1n }) :
                        createBuyAtMarketAction({ maxAmount: 1n }),
                    createClaimOrderAction({ orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedErrorInResult: new OrderDeleted(),
            };

            yield {
                description: 'transfer order not owned by operator',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }),
                ],
                expectedErrorInResult: new Unauthorized(),
            };

            yield {
                description: 'transfer order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                recipient: Account.SECOND,
                expectedErrorInResult: new InvalidPrice(),
            };
            yield {
                description: 'transfer order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                priceTick: parseValue(10),
                expectedErrorInResult: new InvalidPrice(),
            };

            yield {
                description: 'transfer order using account that is not the operator owner',
                caller: Account.SECOND,
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        createPlaceBuyOrderAction({ price: parseValue(1), maxAmount: 1n }) :
                        createPlaceSellOrderAction({ price: parseValue(1), maxAmount: 1n }),
                ],
                expectedError: new Unauthorized(),
            };

        }).then(function*(props) {
            yield createTransferOrderScenario(props);
        })
    ])),
};
