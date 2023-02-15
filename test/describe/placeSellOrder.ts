import { describeCaller } from './caller';
import { describeMaxAmountOfContracts } from './maxAmount';
import { describeMaxPricePoints } from './maxPricePoints';
import { describeOperatorScenario } from './operator';
import { describePriceLimit } from './price';
import { describeSetup } from './setup';

export function describePlaceSellOrderAction(action: (
    Parameters<typeof describeMaxAmountOfContracts>[0] &
    Parameters<typeof describePriceLimit>[0] &
    Parameters<typeof describeMaxPricePoints>[0] &
    Parameters<typeof describeCaller>[0]
)): string {

    return `place sell order${
        describeMaxAmountOfContracts(action, 'of')
    }${
        describePriceLimit(action)
    }${
        describeMaxPricePoints(action)
    }${
        describeCaller(action)
    }`;
}

export function describePlaceSellOrderScenario(scenario: (
    Parameters<typeof describePlaceSellOrderAction>[0] &
    Parameters<typeof describeSetup>[0] &
    Parameters<typeof describeOperatorScenario>[0]
)): string {

    return `${
        describePlaceSellOrderAction(scenario)
    }${
        describeSetup(scenario)
    }${
        describeOperatorScenario(scenario)
    }`;
}
