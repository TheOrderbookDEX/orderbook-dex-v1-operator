import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { is } from '@frugal-wizard/contract-test-helper';
import { OrderType } from './state/OrderType';
import { BoughtAtMarketV1, Failed, PlacedBuyOrderV1 } from '../src/OperatorV1';
import { placeBuyOrderScenarios } from './scenarios/placeBuyOrder';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('placeBuyOrder', () => {
    for (const [ description, scenarios ] of Object.entries(placeBuyOrderScenarios)) {
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

                        it('should not take baseToken from operator', async (test) => {
                            const { baseToken, operator } = test;
                            const prevBalance = await baseToken.balanceOf(operator);
                            await test.execute();
                            expect(await baseToken.balanceOf(operator))
                                .to.be.equal(prevBalance);
                        });

                        it('should not take tradedTaken from orderbook', async (test) => {
                            const { tradedToken, orderbook } = test;
                            const prevBalance = await tradedToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await tradedToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance);
                        });

                        it('should leave baseToken allowance at 0', async (test) => {
                            const { baseToken, operator, orderbook } = test;
                            await test.execute();
                            expect(await baseToken.allowance(operator, orderbook))
                                .to.be.equal(0n);
                        });

                    } else {
                        it('should return amount bought', async (test) => {
                            expect((await test.executeStatic()).amountBought)
                                .to.be.equal(scenario.amountBought);
                        });

                        it('should return amount paid', async (test) => {
                            expect((await test.executeStatic()).amountPaid)
                                .to.be.equal(scenario.amountPaid);
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

                        if (scenario.amountBought) {
                            it('should emit a BoughtAtMarket event', async (test) => {
                                const events = (await test.execute()).events.filter(is(BoughtAtMarketV1));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].amountBought)
                                    .to.be.equal(scenario.amountBought);
                                expect(events[0].amountPaid)
                                    .to.be.equal(scenario.amountPaid);
                                expect(events[0].fee)
                                    .to.be.equal(scenario.collectedFee);
                            });
                        }

                        if (scenario.amountPlaced) {
                            it('should emit a PlacedBuyOrder event', async (test) => {
                                const events = (await test.execute()).events.filter(is(PlacedBuyOrderV1));
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
                                const order = await orderbook.order(OrderType.BUY, price, orderId);
                                expect(order.amount)
                                    .to.be.equal(amountPlaced);
                                expect(await addressBook.addr(order.owner))
                                    .to.be.equal(operator.address);
                            });
                        }

                        it('should take the corresponding baseToken from operator', async (test) => {
                            const { baseToken, operator } = test;
                            const { amountPaid, amountPlaced } = scenario;
                            const prevBalance = await baseToken.balanceOf(operator);
                            await test.execute();
                            expect(await baseToken.balanceOf(operator))
                                .to.be.equal(prevBalance - (amountPaid + amountPlaced * scenario.price));
                        });

                        it('should give the corresponding baseToken to orderbook', async (test) => {
                            const { baseToken, orderbook } = test;
                            const { amountPaid, amountPlaced } = scenario;
                            const prevBalance = await baseToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await baseToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance + (amountPaid + amountPlaced * scenario.price));
                        });

                        it('should take the corresponding tradedTaken from orderbook', async (test) => {
                            const { tradedToken, orderbook } = test;
                            const { amountBought, collectedFee } = scenario;
                            const prevBalance = await tradedToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await tradedToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance - (amountBought * await orderbook.contractSize() - collectedFee));
                        });

                        it('should give the corresponding tradedTaken to operator', async (test) => {
                            const { tradedToken, operator, orderbook } = test;
                            const { amountBought, collectedFee } = scenario;
                            const prevBalance = await tradedToken.balanceOf(operator);
                            await test.execute();
                            expect(await tradedToken.balanceOf(operator))
                                .to.be.equal(prevBalance + (amountBought * await orderbook.contractSize() - collectedFee));
                        });

                        it('should leave baseToken allowance at 0', async (test) => {
                            const { baseToken, operator, orderbook } = test;
                            await test.execute();
                            expect(await baseToken.allowance(operator, orderbook))
                                .to.be.equal(0n);
                        });
                    }
                });
            }
        });
    }
});
