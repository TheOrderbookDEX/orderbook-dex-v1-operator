import { describeCaller } from './caller';
import { describeMaxAmountOfContracts } from './maxAmount';
import { describeOperatorScenario } from './operator';
import { describeOrder } from './order';
import { describeSetup } from './setup';

export function describeClaimOrderAction(action: (
    Parameters<typeof describeMaxAmountOfContracts>[0] &
    Parameters<typeof describeOrder>[0]
)): string {

    return `claim${
        describeMaxAmountOfContracts(action)
    }${
        describeOrder(action, 'from')
    }`;
}

export function describeClaimOrderScenario(scenario: (
    Parameters<typeof describeClaimOrderAction>[0] &
    Parameters<typeof describeCaller>[0] &
    Parameters<typeof describeSetup>[0] &
    Parameters<typeof describeOperatorScenario>[0]
)): string {

    return `${
        describeClaimOrderAction(scenario)
    }${
        describeCaller(scenario)
    }${
        describeSetup(scenario)
    }${
        describeOperatorScenario(scenario)
    }`;
}
