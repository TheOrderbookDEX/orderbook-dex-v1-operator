import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describeError } from '@frugal-wizard/contract-test-helper';
import { OrderType } from './state/OrderType';
import { pricePointsScenarios } from './scenarios/PricePoints';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('PricePoints', () => {
    for (const scenario of pricePointsScenarios) {
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

            } else {
                it('should return expected sell price points', async (test) => {
                    const { prevSellPrice, sellPricesLimit } = scenario;
                    const { orderbook } = test;
                    let price = prevSellPrice;
                    const expectedPricePoints = [];
                    while (expectedPricePoints.length < sellPricesLimit) {
                        price = price ? await orderbook.nextSellPrice(price) : await orderbook.askPrice();
                        if (!price) break;
                        const { totalFilled, totalPlaced } = await orderbook.pricePoint(OrderType.SELL, price);
                        const available = totalPlaced - totalFilled;
                        expectedPricePoints.push([ price, available ]);
                    }
                    expect((await test.execute()).sell)
                        .to.be.deep.equal(expectedPricePoints);
                });

                it('should return expected buy price points', async (test) => {
                    const { prevBuyPrice, buyPricesLimit } = scenario;
                    const { orderbook } = test;
                    let price = prevBuyPrice;
                    const expectedPricePoints = [];
                    while (expectedPricePoints.length < buyPricesLimit) {
                        price = price ? await orderbook.nextBuyPrice(price) : await orderbook.bidPrice();
                        if (!price) break;
                        const { totalFilled, totalPlaced } = await orderbook.pricePoint(OrderType.BUY, price);
                        const available = totalPlaced - totalFilled;
                        expectedPricePoints.push([ price, available ]);
                    }
                    expect((await test.execute()).buy)
                        .to.be.deep.equal(expectedPricePoints);
                });
            }
        });
    }
});
