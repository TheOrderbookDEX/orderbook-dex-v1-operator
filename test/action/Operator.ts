import { TestSetupAction, TestSetupActionProperties } from '@frugal-wizard/contract-test-helper';
import { OperatorContext } from '../scenario/Operator';

export type OperatorActionProperties = TestSetupActionProperties;

export abstract class OperatorAction extends TestSetupAction<OperatorContext> {
}
