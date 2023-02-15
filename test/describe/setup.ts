export function describeSetup({
    setupActions,
    hideSetup,
}: {
    readonly setupActions: readonly { description: string }[];
    readonly hideSetup: boolean;
}): string {

    if (hideSetup || !setupActions.length) return ''
    return ` after ${setupActions.map(({ description }) => description).join(' and ')}`;
}
