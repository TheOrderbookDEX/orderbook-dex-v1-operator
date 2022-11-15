// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IOperatorV0 }
    from "@theorderbookdex/orderbook-dex-operator/contracts/interfaces/IOperatorV0.sol";
import { IOperatorMarketTradeV1 }
    from "./IOperatorMarketTradeV1.sol";
import { IOperatorLimitOrderV1 }
    from "./IOperatorLimitOrderV1.sol";
import { IOperatorOrderHandlingV1 }
    from "./IOperatorOrderHandlingV1.sol";
import { IOperatorPricePointsV1 }
    from "./IOperatorPricePointsV1.sol";

interface IOperatorV1 is IOperatorV0, IOperatorMarketTradeV1, IOperatorLimitOrderV1, IOperatorOrderHandlingV1,
    IOperatorPricePointsV1
{
}
