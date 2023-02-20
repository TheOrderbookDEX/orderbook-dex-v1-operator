import { formatValue } from '@frugalwizard/abi2ts-lib';
import { describeOrderType, OrderType } from '../state/OrderType';

export function describeOrder({
    orderType,
    price,
    orderId,
    hideOrderType,
    hidePrice,
    hideOrderId,
}: {
    readonly orderType: OrderType,
    readonly price: bigint,
    readonly orderId?: bigint;
    readonly hideOrderType: boolean,
    readonly hidePrice: boolean,
    readonly hideOrderId: boolean
}, preposition = ''): string {

    const description: string[] = [];
    if (preposition) {
        description.push(preposition);
    }
    if (!hideOrderType) {
        description.push(describeOrderType(orderType));
    }
    if (!hideOrderType && !hidePrice) {
        description.push('at');
    }
    if (!hidePrice) {
        description.push(formatValue(price));
    }
    description.push('order');
    if (!hideOrderId && orderId) {
        description.push(`#${orderId}`);
    }
    return ` ${description.join(' ')}`;
}
