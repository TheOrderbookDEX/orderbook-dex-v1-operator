import { describeCaller } from './caller';
import { describeOperatorScenario } from './operator';
import { describeOrder } from './order';
import { describeSetup } from './setup';

export function describeCancelOrderAction(action: (
    Parameters<typeof describeOrder>[0]
)): string {

    return `cancel${
        describeOrder(action)
    }`;
}

export function describeCancelOrderScenario(scenario: (
    Parameters<typeof describeCancelOrderAction>[0] &
    Parameters<typeof describeCaller>[0] &
    Parameters<typeof describeSetup>[0] &
    Parameters<typeof describeOperatorScenario>[0]
)): string {

    return `${
        describeCancelOrderAction(scenario)
    }${
        describeCaller(scenario)
    }${
        describeSetup(scenario)
    }${
        describeOperatorScenario(scenario)
    }`;
}
