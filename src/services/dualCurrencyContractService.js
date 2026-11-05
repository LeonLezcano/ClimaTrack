/**
 * Servicio de Contratos de Mantenimiento Bimonetarios (ARS / USD)
 * AiAppFactory Engine #161 Standard
 */

export class DualCurrencyContractService {
  /**
   * Crea un contrato de abono preventivo bimonetario
   */
  static createContract({
    contractId = null,
    customerName,
    facilityName,
    facilityAddress,
    equipmentCovered = [], // Array de tags: ['CAM-01', 'VRF-EDIF-01', 'GEN-DIESEL-01']
    monthlyFeeArs = 250000,
    partsCapUsd = 500,
    exchangeRateUsd = 1250,
    dueDayOfMonth = 10,
    slaTier = 'CRITICA_ROTURA_FRIO'
  }) {
    if (!customerName || !facilityName) {
      throw new Error('Faltan datos obligatorios para crear el contrato');
    }

    const id = contractId || `CTR-${Date.now().toString(36).slice(-4)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const nextDue = new Date(now.getFullYear(), now.getMonth(), dueDayOfMonth).toISOString();

    return {
      contractId: id,
      customerName,
      facilityName,
      facilityAddress,
      equipmentCovered,
      pricing: {
        monthlyFeeArs: Number(monthlyFeeArs),
        partsCapUsd: Number(partsCapUsd),
        exchangeRateUsd: Number(exchangeRateUsd),
        totalEquivalentArs: Number(monthlyFeeArs) + (Number(partsCapUsd) * Number(exchangeRateUsd))
      },
      nextDueDate: nextDue,
      slaTier,
      status: 'AL_DIA', // AL_DIA, EN_MORA, SUSPENDIDO
      createdAt: now.toISOString()
    };
  }

  /**
   * Evalúa mora en el abono mensual
   */
  static evaluateDunning(contract, currentDate = new Date()) {
    if (!contract) throw new Error('Contrato no especificado');
    const now = new Date(currentDate);
    const due = new Date(contract.nextDueDate);
    const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { status: 'AL_DIA', daysOverdue: 0, penaltyArs: 0 };
    }

    if (diffDays <= 15) {
      const penalty = Math.round(contract.pricing.monthlyFeeArs * 0.05); // 5% interés
      return { status: 'EN_MORA', daysOverdue: diffDays, penaltyArs: penalty };
    }

    const penaltySevere = Math.round(contract.pricing.monthlyFeeArs * 0.12);
    return { status: 'SUSPENDIDO', daysOverdue: diffDays, penaltyArs: penaltySevere };
  }
}
