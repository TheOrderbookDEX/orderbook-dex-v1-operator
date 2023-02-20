import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { is } from '@frugalwizard/contract-test-helper';
import { placeSellOrderScenarios } from './scenarios/placeSellOrder';
import { OrderType } from './state/OrderType';
import { Failed, PlacedSellOrderV1, SoldAtMarketV1 } from '../src/OperatorV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('placeSellOrder', () => {
    for (const [ description, scenarios ] of Object.entries(placeSellOrderScenarios)) {
        describe(description, () => {
            for (const scenario of scenarios) {
                scenario.describe(({ it }) => {
                    if (scenario.expectedError) {
                        it('should fail', async (test) => {
                            await expect(test.execute())
                                .to.be.rejected;
                        });

                        it(`should fail with ${scenario.expectedError.name}`, async (test) => {
                            await expect(test.executeStatic())
                                .to.be.rejected.and.eventually.be.deep.equal(scenario.expectedError);
                        });

                    } else if (scenario.expectedErrorInResult) {
                        const error = scenario.expectedErrorInResult;

                        it('should mark result as failed', async (test) => {
                            expect((await test.executeStatic()).failed)
                                .to.be.true;
                        });

                        it('should return error', async (test) => {
                            expect((await test.executeStatic()).error)
                                .to.be.equal(error.encode());
                        });

                        it('should emit a Failed event', async (test) => {
                            const events = (await test.execute()).events.filter(is(Failed));
                            expect(events.length).to.be.equal(1);
                            expect(events[0].error)
                                .to.be.equal(error.encode());
                        });

                        it('should not take tradedToken from operator', async (test) => {
                            const { tradedToken, operator } = test;
                            const prevBalance = await tradedToken.balanceOf(operator);
                            await test.execute();
                            expect(await tradedToken.balanceOf(operator))
                                .to.be.equal(prevBalance);
                        });

                        it('should not take baseToken from orderbook', async (test) => {
                            const { baseToken, orderbook } = test;
                            const prevBalance = await baseToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await baseToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance);
                        });

                        it('should leave tradedToken allowance at 0', async (test) => {
                            const { tradedToken, operator, orderbook } = test;
                            await test.execute();
                            expect(await tradedToken.allowance(operator, orderbook))
                                .to.be.equal(0n);
                        });

                    } else {
                        it('should return amount sold', async (test) => {
                            expect((await test.executeStatic()).amountSold)
                                .to.be.equal(scenario.amountSold);
                        });

                        it('should return amount received', async (test) => {
                            expect((await test.executeStatic()).amountReceived)
                                .to.be.equal(scenario.amountReceived);
                        });

                        it('should return collected fee', async (test) => {
                            expect((await test.executeStatic()).fee)
                                .to.be.equal(scenario.collectedFee);
                        });

                        it('should return amount placed', async (test) => {
                            expect((await test.executeStatic()).amountPlaced)
                                .to.be.equal(scenario.amountPlaced);
                        });

                        it('should return order id', async (test) => {
                            expect((await test.executeStatic()).orderId)
                                .to.be.equal(scenario.orderId);
                        });

                        it('should not mark result as failed', async (test) => {
                            expect((await test.executeStatic()).failed)
                                .to.be.false;
                        });

                        if (scenario.amountSold) {
                            it('should emit a SoldAtMarket event', async (test) => {
                                const events = (await test.execute()).events.filter(is(SoldAtMarketV1));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].amountSold)
                                    .to.be.equal(scenario.amountSold);
                                expect(events[0].amountReceived)
                                    .to.be.equal(scenario.amountReceived);
                                expect(events[0].fee)
                                    .to.be.equal(scenario.collectedFee);
                            });
                        }

                        if (scenario.amountPlaced) {
                            it('should emit a PlacedSellOrder event', async (test) => {
                                const events = (await test.execute()).events.filter(is(PlacedSellOrderV1));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].amount)
                                    .to.be.equal(scenario.amountPlaced);
                                expect(events[0].orderId)
                                    .to.be.equal(scenario.orderId);
                            });

                            it('should create an order for the amount placed', async (test) => {
                                const { orderbook, addressBook, operator } = test;
                                const { price, amountPlaced, orderId } = scenario;
                                await test.execute();
                                const order = await orderbook.order(OrderType.SELL, price, orderId);
                                expect(order.amount)
                                    .to.be.equal(amountPlaced);
                                expect(await addressBook.addr(order.owner))
                                    .to.be.equal(operator.address);
                            });
                        }

                        it('should take the corresponding tradedToken from operator', async (test) => {
                            const { tradedToken, operator, orderbook } = test;
                            const { amountSold, amountPlaced } = scenario;
                            const prevBalance = await tradedToken.balanceOf(operator);
                            await test.execute();
                            expect(await tradedToken.balanceOf(operator))
                                .to.be.equal(prevBalance - (amountSold + amountPlaced) * await orderbook.contractSize());
                        });

                        it('should give the corresponding tradedToken to orderbook', async (test) => {
                            const { tradedToken, orderbook } = test;
                            const { amountSold, amountPlaced } = scenario;
                            const prevBalance = await tradedToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await tradedToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance + (amountSold + amountPlaced) * await orderbook.contractSize());
                        });

                        it('should take the corresponding baseToken from orderbook', async (test) => {
                            const { baseToken, orderbook } = test;
                            const { amountReceived, collectedFee } = scenario;
                            const prevBalance = await baseToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await baseToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance - (amountReceived - collectedFee));
                        });

                        it('should give the corresponding baseToken to operator', async (test) => {
                            const { baseToken, operator } = test;
                            const { amountReceived, collectedFee } = scenario;
                            const prevBalance = await baseToken.balanceOf(operator);
                            await test.execute();
                            expect(await baseToken.balanceOf(operator))
                                .to.be.equal(prevBalance + (amountReceived - collectedFee));
                        });

                        it('should leave tradedToken allowance at 0', async (test) => {
                            const { tradedToken, operator, orderbook } = test;
                            await test.execute();
                            expect(await tradedToken.allowance(operator, orderbook))
                                .to.be.equal(0n);
                        });
                    }
                });
            }
        });
    }
});
