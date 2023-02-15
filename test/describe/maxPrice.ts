import { formatValue, MAX_UINT256 } from '@frugal-wizard/abi2ts-lib';

export function describeMaxPrice({
    maxPrice,
    hidePrice,
}: {
    readonly maxPrice: bigint;
    readonly hidePrice: boolean;
}): string {

    if (hidePrice || maxPrice == MAX_UINT256) return '';
    return ` at ${formatValue(maxPrice)} or better`;
}
