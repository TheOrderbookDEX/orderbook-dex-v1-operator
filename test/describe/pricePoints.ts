import { formatValue, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { describeOperatorScenario } from './operator';
import { describeSetup } from './setup';

export function describePricePointsScenario({
    prevSellPrice,
    sellPricesLimit,
    prevBuyPrice,
    buyPricesLimit,
    useOperatorImplementation,
    ...rest
}: {
    readonly prevSellPrice: bigint;
    readonly sellPricesLimit: number;
    readonly prevBuyPrice: bigint;
    readonly buyPricesLimit: number;
    readonly useOperatorImplementation: boolean;
} & (
    Parameters<typeof describeSetup>[0] &
    Parameters<typeof describeOperatorScenario>[0]
)): string {

    return `get price points${
        useOperatorImplementation ? ` using operator implementation` : ''
    }${
        prevSellPrice || prevBuyPrice ? ` after ${[
            ...prevSellPrice ? [`sell at ${formatValue(prevSellPrice)}`] : [],
            ...prevBuyPrice ? [`buy at ${formatValue(prevBuyPrice)}`] : [],
        ].join(' and ')}` : ''
    }${
        sellPricesLimit != MAX_UINT8 || buyPricesLimit != MAX_UINT8 ? ` limited to ${[
            ...sellPricesLimit != MAX_UINT8 ? [`${sellPricesLimit} sell prices`] : [],
            ...buyPricesLimit != MAX_UINT8 ? [`${buyPricesLimit} buy prices`] : [],
        ].join(' and ')}` : ''
    }${
        describeSetup(rest)
    }${
        describeOperatorScenario(rest)
    }`;
}
