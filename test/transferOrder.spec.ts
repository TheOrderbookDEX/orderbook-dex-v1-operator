import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { is } from '@frugal-wizard/contract-test-helper';
import { transferOrderScenarios } from './scenarios/transferOrder';
import { Failed, OrderTransferedV1 } from '../src/OperatorV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('transferOrder', () => {
    for (const [ description, scenarios ] of Object.entries(transferOrderScenarios)) {
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

                        it('should not change order owner', async (test) => {
                            const { orderType, price, orderId } = scenario;
                            const { orderbook } = test;
                            const { owner: prevOwner } = await orderbook.order(orderType, price, orderId);
                            await test.execute();
                            expect((await orderbook.order(orderType, price, orderId)).owner)
                                .to.be.equal(prevOwner);
                        });

                    } else {
                        it('should not mark result as failed', async (test) => {
                            expect((await test.executeStatic()).failed)
                                .to.be.false;
                        });

                        it('should emit a OrderTransfered event', async (test) => {
                            const events = (await test.execute()).events.filter(is(OrderTransferedV1));
                            expect(events.length).to.be.equal(1);
                        });

                        it('should update order owner', async (test) => {
                            const { orderType, price, orderId } = scenario;
                            const { orderbook, addressBook } = test;
                            await test.execute();
                            expect(await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner))
                                .to.be.equal(test[scenario.recipient]);
                        });
                    }
                });
            }
        });
    }
});
