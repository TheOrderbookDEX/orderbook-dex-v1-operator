import { formatValue } from '@frugalwizard/abi2ts-lib';

export function describePriceLimit({
    price,
    hidePrice,
}: {
    readonly price: bigint;
    readonly hidePrice: boolean;
}): string {

    if (hidePrice) return '';
    return ` at ${formatValue(price)} or better`;
}
