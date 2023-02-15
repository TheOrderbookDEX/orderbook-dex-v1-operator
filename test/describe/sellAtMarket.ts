import { describeCaller } from './caller';
import { describeMaxAmountOfContracts } from './maxAmount';
import { describeMaxPricePoints } from './maxPricePoints';
import { describeMinPrice } from './minPrice';
import { describeOperatorScenario } from './operator';
import { describeSetup } from './setup';

export function describeSellAtMarketAction(action: (
    Parameters<typeof describeMaxAmountOfContracts>[0] &
    Parameters<typeof describeMinPrice>[0] &
    Parameters<typeof describeMaxPricePoints>[0]
)): string {

    return `sell at market${
        describeMaxAmountOfContracts(action)
    }${
        describeMinPrice(action)
    }${
        describeMaxPricePoints(action)
    }`;
}

export function describeSellAtMarketScenario(scenario: (
    Parameters<typeof describeSellAtMarketAction>[0] &
    Parameters<typeof describeCaller>[0] &
    Parameters<typeof describeSetup>[0] &
    Parameters<typeof describeOperatorScenario>[0]
)): string {

    return `${
        describeSellAtMarketAction(scenario)
    }${
        describeCaller(scenario)
    }${
        describeSetup(scenario)
    }${
        describeOperatorScenario(scenario)
    }`;
}
