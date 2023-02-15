import { MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';

export function describeMaxAmountOfContracts({
    maxAmount,
    hideAmount,
}: {
    readonly maxAmount: bigint;
    readonly hideAmount: boolean;
}, preposition = ''): string {

    if (hideAmount || maxAmount == MAX_UINT32) return '';
    return ` ${preposition && `${preposition} `}${maxAmount} or less contracts`;
}
