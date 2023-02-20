import { formatValue } from '@frugalwizard/abi2ts-lib';

export function describeOperatorScenario({
    fee,
    contractSize,
    priceTick,
    hideContractSize,
    hidePriceTick,
}: {
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideContractSize: boolean;
    readonly hidePriceTick?: boolean;
}): string {

    const settings = [];
    if (fee) {
        settings.push(`fee = ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size = ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick = ${formatValue(priceTick)}`);
    }
    return settings.length ? ` with ${settings.join(' and ')}` : '';
}
