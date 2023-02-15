import { describeCaller } from './caller';
import { describeMaxAmountOfContracts } from './maxAmount';
import { describeMaxPricePoints } from './maxPricePoints';
import { describeOperatorScenario } from './operator';
import { describePriceLimit } from './price';
import { describeSetup } from './setup';

export function describePlaceBuyOrderAction(action: (
    Parameters<typeof describeMaxAmountOfContracts>[0] &
    Parameters<typeof describePriceLimit>[0] &
    Parameters<typeof describeMaxPricePoints>[0] &
    Parameters<typeof describeCaller>[0]
)): string {

    return `place buy order${
        describeMaxAmountOfContracts(action, 'of')
    }${
        describePriceLimit(action)
    }${
        describeMaxPricePoints(action)
    }${
        describeCaller(action)
    }`;
}

export function describePlaceBuyOrderScenario(scenario: (
    Parameters<typeof describePlaceBuyOrderAction>[0] &
    Parameters<typeof describeSetup>[0] &
    Parameters<typeof describeOperatorScenario>[0]
)): string {

    return `${
        describePlaceBuyOrderAction(scenario)
    }${
        describeSetup(scenario)
    }${
        describeOperatorScenario(scenario)
    }`;
}
