import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describeError, is } from '@frugal-wizard/contract-test-helper';
import { sellAtMarketScenarios } from './scenarios/SellAtMarket';
import { Failed, SoldAtMarketV1 } from '../src/OperatorV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

// TODO test fees

describe('SellAtMarket', () => {
    for (const [ description, scenarios ] of sellAtMarketScenarios) {
        describe(description, () => {
            for (const scenario of scenarios) {
                scenario.describe(({ it }) => {
                    if (scenario.expectedError) {
                        it('should fail', async (test) => {
                            await expect(test.execute())
                                .to.be.rejected;
                        });

                        it(`should fail with ${describeError(scenario.expectedError)}`, async (test) => {
                            await expect(test.executeStatic())
                                .to.be.rejectedWith(scenario.expectedError as typeof Error);
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
                            });
                        }

                        it('should take the corresponding tradedToken from operator', async (test) => {
                            const { tradedToken, operator, orderbook } = test;
                            const { amountSold } = scenario;
                            const prevBalance = await tradedToken.balanceOf(operator);
                            await test.execute();
                            expect(await tradedToken.balanceOf(operator))
                                .to.be.equal(prevBalance - amountSold * await orderbook.contractSize());
                        });

                        it('should give the corresponding tradedToken to orderbook', async (test) => {
                            const { tradedToken, orderbook } = test;
                            const { amountSold } = scenario;
                            const prevBalance = await tradedToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await tradedToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance + amountSold * await orderbook.contractSize());
                        });

                        it('should take the corresponding baseToken from orderbook', async (test) => {
                            const { baseToken, orderbook } = test;
                            const { amountReceived } = scenario;
                            const prevBalance = await baseToken.balanceOf(orderbook);
                            await test.execute();
                            expect(await baseToken.balanceOf(orderbook))
                                .to.be.equal(prevBalance - amountReceived);
                        });

                        it('should give the corresponding baseToken to operator', async (test) => {
                            const { baseToken, operator } = test;
                            const { amountReceived } = scenario;
                            const prevBalance = await baseToken.balanceOf(operator);
                            await test.execute();
                            expect(await baseToken.balanceOf(operator))
                                .to.be.equal(prevBalance + amountReceived);
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
