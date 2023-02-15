import { describeCaller } from './caller';
import { describeMaxAmountOfContracts } from './maxAmount';
import { describeMaxPrice } from './maxPrice';
import { describeMaxPricePoints } from './maxPricePoints';
import { describeOperatorScenario } from './operator';
import { describeSetup } from './setup';

export function describeBuyAtMarketAction(action: (
    Parameters<typeof describeMaxAmountOfContracts>[0] &
    Parameters<typeof describeMaxPrice>[0] &
    Parameters<typeof describeMaxPricePoints>[0]
)): string {

    return `buy at market${
        describeMaxAmountOfContracts(action)
    }${
        describeMaxPrice(action)
    }${
        describeMaxPricePoints(action)
    }`;
}

export function describeBuyAtMarketScenario(scenario: (
    Parameters<typeof describeBuyAtMarketAction>[0] &
    Parameters<typeof describeCaller>[0] &
    Parameters<typeof describeSetup>[0] &
    Parameters<typeof describeOperatorScenario>[0]
)): string {

    return `${
        describeBuyAtMarketAction(scenario)
    }${
        describeCaller(scenario)
    }${
        describeSetup(scenario)
    }${
        describeOperatorScenario(scenario)
    }`;
}
