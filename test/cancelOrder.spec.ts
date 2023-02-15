import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { is } from '@frugal-wizard/contract-test-helper';
import { cancelOrderScenarios } from './scenarios/cancelOrder';
import { Failed, OrderCanceledV1 } from '../src/OperatorV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('cancelOrder', () => {
    for (const [ description, scenarios ] of Object.entries(cancelOrderScenarios)) {
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

                        it('should not change amount of contracts of the order', async (test) => {
                            const { orderbook } = test;
                            const { orderType, price, orderId } = scenario;
                            const { amount: prevAmount } = await orderbook.order(orderType, price, orderId);
                            await test.execute();
                            const { amount } = await orderbook.order(orderType, price, orderId);
                            expect(amount)
                                .to.be.equal(prevAmount);
                        });

                        it(`should not take ${scenario.givenToken} from orderbook`, async (test) => {
                            const { [scenario.givenToken]: givenToken, orderbook } = test;
                            const prevBalance = await givenToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await givenToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance);
                        });

                    } else {
                        it('should return amount canceled', async (test) => {
                            expect((await test.executeStatic()).amountCanceled)
                                .to.be.equal(scenario.amountCanceled);
                        });

                        it('should not mark result as failed', async (test) => {
                            expect((await test.executeStatic()).failed)
                                .to.be.false;
                        });

                        if (scenario.amountCanceled) {
                            it('should emit a OrderClaimed event', async (test) => {
                                const events = (await test.execute()).events.filter(is(OrderCanceledV1));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].amount)
                                    .to.be.equal(scenario.amountCanceled);
                            });
                        }

                        if (scenario.deletesOrder) {
                            it('should delete order', async (test) => {
                                const { orderbook } = test;
                                const { orderType, price, orderId } = scenario;
                                await test.execute();
                                expect((await orderbook.order(orderType, price, orderId)).owner)
                                    .to.be.equal(0n);
                            });

                        } else {
                            it('should update amount of contracts of the order', async (test) => {
                                const { orderbook } = test;
                                const { orderType, price, orderId, amountCanceled } = scenario;
                                const { amount: prevAmount } = await orderbook.order(orderType, price, orderId);
                                await test.execute();
                                const { amount } = await orderbook.order(orderType, price, orderId);
                                expect(amount)
                                    .to.be.equal(prevAmount - amountCanceled);
                            });
                        }

                        it(`should take the corresponding ${scenario.givenToken} from orderbook`, async (test) => {
                            const { [scenario.givenToken]: givenToken, orderbook } = test;
                            const { givenAmount } = scenario;
                            const prevBalance = await givenToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await givenToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance - givenAmount);
                        });

                        it(`should give the corresponding ${scenario.givenToken} to operator`, async (test) => {
                            const { [scenario.givenToken]: givenToken, operator } = test;
                            const { givenAmount } = scenario;
                            const prevBalance = await givenToken.balanceOf(operator);
                            await test.execute();
                            expect(await givenToken.balanceOf(operator))
                                .to.be.equal(prevBalance + givenAmount);
                        });
                    }
                });
            }
        });
    }
});
