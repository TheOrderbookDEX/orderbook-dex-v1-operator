import { describeCaller } from './caller';
import { describeOperatorScenario } from './operator';
import { describeOrder } from './order';
import { describeSetup } from './setup';

export function describeTransferOrderAction({
    recipient,
    ...rest
}: {
    readonly recipient: string;
} & (
    Parameters<typeof describeOrder>[0]
)): string {

    return `transfer${
        describeOrder(rest)
    } to ${recipient}`;
}

export function describeTransferOrderScenario(scenario: (
    Parameters<typeof describeTransferOrderAction>[0] &
    Parameters<typeof describeCaller>[0] &
    Parameters<typeof describeSetup>[0] &
    Parameters<typeof describeOperatorScenario>[0]
)): string {

    return `${
        describeTransferOrderAction(scenario)
    }${
        describeCaller(scenario)
    }${
        describeSetup(scenario)
    }${
        describeOperatorScenario(scenario)
    }`;
}
