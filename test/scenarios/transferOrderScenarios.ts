import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { NotRegistered } from '@frugal-wizard/addressbook/dist/utils/AddressBookUtil';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { InvalidOrderId, InvalidPrice, OrderDeleted, Unauthorized } from '@theorderbookdex/orderbook-dex-v1/dist/interfaces/IOrderbookV1';
import { BuyAtMarketAction } from '../action/BuyAtMarketAction';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { PlaceBuyOrderAction } from '../action/PlaceBuyOrderAction';
import { PlaceSellOrderAction } from '../action/PlaceSellOrderAction';
import { SellAtMarketAction } from '../action/SellAtMarketAction';
import { describer } from '../describer/describer';
import { TransferOrderScenario } from '../scenario/TransferOrderScenario';
import { describeOrderType, OrderType } from '../state/OrderType';

export const transferOrderScenarios: [string, Iterable<TransferOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    transferOrderScenarios.push([
        `transfer ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: 'transfer order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n })
                ],
            };
            yield {
                describer: 'transfer order to not registered account',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.THIRD,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n })
                ],
                expectedErrorInResult: new NotRegistered(),
            };
            yield {
                describer: 'transfer invalid order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [],
                expectedErrorInResult: new InvalidOrderId(),
            };
            yield {
                describer: 'transfer canceled order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
                    new CancelOrderAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedErrorInResult: new OrderDeleted(),
            };
            yield {
                describer: 'transfer fully claimed order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
                    orderType == OrderType.BUY ?
                        new SellAtMarketAction({ describer, maxAmount: 1n }) :
                        new BuyAtMarketAction({ describer, maxAmount: 1n }),
                    new ClaimOrderAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedErrorInResult: new OrderDeleted(),
            };
            yield {
                describer: 'transfer order not owned by operator',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n, caller: Account.SECOND }),
                ],
                expectedErrorInResult: new Unauthorized(),
            };
            yield {
                describer: 'transfer order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                recipient: Account.SECOND,
                expectedErrorInResult: new InvalidPrice(),
            };
            yield {
                describer: 'transfer order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                priceTick: parseValue(10),
                expectedErrorInResult: new InvalidPrice(),
            };
            yield {
                describer: 'transfer order using account that is not the operator owner',
                caller: Account.SECOND,
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    orderType == OrderType.BUY ?
                        new PlaceBuyOrderAction({ describer, price: parseValue(1), maxAmount: 1n }) :
                        new PlaceSellOrderAction({ describer, price: parseValue(1), maxAmount: 1n }),
                ],
                expectedError: Unauthorized,
            };

        }).then(function*(properties) {
            yield new TransferOrderScenario(properties);
        })
    ]);
}
