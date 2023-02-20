import { formatValue } from '@frugalwizard/abi2ts-lib';

export function describeMinPrice({
    minPrice,
    hidePrice,
}: {
    readonly minPrice: bigint;
    readonly hidePrice: boolean;
}): string {

    if (hidePrice && !minPrice) return '';
    return ` at ${formatValue(minPrice)} or better`;
}
