// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

import { OperatorV0 }
    from "@theorderbookdex/orderbook-dex-operator/contracts/OperatorV0.sol";
import { OperatorMarketTradeV1 }
    from "./OperatorMarketTradeV1.sol";
import { OperatorLimitOrderV1 }
    from "./OperatorLimitOrderV1.sol";
import { OperatorOrderHandlingV1 }
    from "./OperatorOrderHandlingV1.sol";
import { OperatorPricePointsV1 }
    from "./OperatorPricePointsV1.sol";
import { IOperatorV1 }
    from "./interfaces/IOperatorV1.sol";

/**
 * Operator V1 functionality.
 */
contract OperatorV1 is OperatorV0, OperatorMarketTradeV1, OperatorLimitOrderV1, OperatorOrderHandlingV1,
    OperatorPricePointsV1, IOperatorV1
{
}
