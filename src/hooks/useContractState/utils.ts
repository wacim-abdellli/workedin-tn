import type { ContractData } from './types';

export function getCounterpartyId(
    contract: ContractData | null,
    userRole: 'client' | 'freelancer',
): string | null {
    if (!contract) return null;
    return userRole === 'client' ? contract.freelancer_id : contract.client_id;
}
