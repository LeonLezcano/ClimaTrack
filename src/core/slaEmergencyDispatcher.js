/**
 * Despachador de Emergencias & Centinela de SLA Frío 24/7
 * AiAppFactory Engine #140 & #117 Standard
 */

export const SLA_TIERS = {
  CRITICA_ROTURA_FRIO: {
    name: 'Cámara Frigorífica / Cadena de Frío Crítica',
    maxMinutes: 120, // 2 horas de respuesta máxima
    penaltyPerHourArs: 45000,
    priorityRank: 1,
    requiresDualTechnician: true
  },
  ALTA_VRF_CONFORT: {
    name: 'Climatización Central VRF / Salas de Servidores',
    maxMinutes: 240, // 4 horas
    penaltyPerHourArs: 20000,
    priorityRank: 2,
    requiresDualTechnician: false
  },
  MEDIA_PREVENTIVO: {
    name: 'Mantenimiento Preventivo & Puesta a Punto Programada',
    maxMinutes: 1440, // 24 horas
    penaltyPerHourArs: 0,
    priorityRank: 3,
    requiresDualTechnician: false
  }
};

export class SlaEmergencyDispatcher {
  /**
   * Crea una solicitud de intervención con cálculo de SLA objetivo
   */
  static createDispatchTicket({
    ticketId = null,
    facilityName,
    facilityAddress,
    equipmentTag,
    severity = 'CRITICA_ROTURA_FRIO',
    chamberType = 'CARNE_CONGELADA', // CARNE_CONGELADA, LACTEOS, VACUNAS_FARMACIA, DATACENTER
    targetTempCelsius = -18,
    currentTempCelsius = -4,
    reportedAt = new Date().toISOString()
  }) {
    if (!facilityName || !facilityAddress || !equipmentTag) {
      throw new Error('Faltan datos obligatorios para crear el ticket de despacho');
    }

    const tier = SLA_TIERS[severity] || SLA_TIERS.CRITICA_ROTURA_FRIO;
    const reportedDate = new Date(reportedAt);
    const deadlineDate = new Date(reportedDate.getTime() + tier.maxMinutes * 60000);

    const id = ticketId || `EMG-${Date.now().toString(36).slice(-4)}-${Math.random().toString(36).slice(2, 6)}`;

    return {
      ticketId: id,
      facilityName,
      facilityAddress,
      equipmentTag,
      severity,
      chamberType,
      targetTempCelsius: Number(targetTempCelsius),
      currentTempCelsius: Number(currentTempCelsius),
      tempDeltaCelsius: Number((currentTempCelsius - targetTempCelsius).toFixed(1)),
      reportedAt,
      slaDeadline: deadlineDate.toISOString(),
      slaMaxMinutes: tier.maxMinutes,
      status: 'DESPACHADO', // DESPACHADO, EN_VIAJE, EN_PLANTA_TRABAJANDO, RESUELTO_CONFORME
      assignedTech: null,
      technicianArrivalTime: null,
      closureTime: null
    };
  }

  /**
   * Evalúa en tiempo real los minutos restantes y estado del SLA
   */
  static evaluateSlaStatus(ticket, currentTime = new Date()) {
    if (!ticket) throw new Error('Ticket no especificado');

    const now = new Date(currentTime);
    const deadline = new Date(ticket.slaDeadline);
    const diffMs = deadline.getTime() - now.getTime();
    const remainingMinutes = Math.round(diffMs / 60000);

    const isBreached = remainingMinutes < 0;
    let urgencyState = 'EN_TIEMPO';

    if (ticket.status === 'RESUELTO_CONFORME') {
      urgencyState = 'CUMPLIDO';
    } else if (isBreached) {
      urgencyState = 'SLA_VENCIDO';
    } else if (remainingMinutes <= 30) {
      urgencyState = 'PELIGRO_INMINENTE';
    } else if (remainingMinutes <= 60) {
      urgencyState = 'ALERTA_AMARILLA';
    }

    const tier = SLA_TIERS[ticket.severity] || SLA_TIERS.CRITICA_ROTURA_FRIO;
    const hoursOverdue = isBreached ? Math.ceil(Math.abs(remainingMinutes) / 60) : 0;
    const estimatedPenaltyArs = hoursOverdue * tier.penaltyPerHourArs;

    return {
      ticketId: ticket.ticketId,
      severity: ticket.severity,
      remainingMinutes,
      isBreached,
      urgencyState,
      hoursOverdue,
      estimatedPenaltyArs
    };
  }
}
