import { EthereumSetupContext, SetupAction } from '@frugalwizard/contract-test-helper';
import { OperatorContext } from '../scenario/operator';
import { Orders } from '../state/Orders';

export type OperatorAction = SetupAction<EthereumSetupContext & OperatorContext> & {
    apply(orders: Orders): Orders;
};
