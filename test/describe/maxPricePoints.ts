import { MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';

export function describeMaxPricePoints({
    maxPricePoints
}: {
    readonly maxPricePoints: number;
}): string {

    if (maxPricePoints == MAX_UINT8) return '';
    return ` for at most ${maxPricePoints} price point${maxPricePoints!=1?'s':''}`;
}
