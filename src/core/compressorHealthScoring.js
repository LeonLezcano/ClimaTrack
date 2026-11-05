/**
 * Motor Predictivo de Salud de Compresores, Grupos Electrógenos & Solar
 * AiAppFactory Engine #121 & #119 Standard
 */

export class CompressorHealthScoring {
  /**
   * Evalúa la salud de un compresor frigorífico o chiller (Escala 0 a 100)
   */
  static evaluateCompressorHealth({
    equipmentTag = 'CMP-01',
    model = 'Copeland Scroll 15HP',
    measuredAmps,
    ratedLoadAmpsRLA, // Amperaje nominal de placa
    oilAcidityLevel = 'NEUTRO', // NEUTRO, ACIDO_LEVE, ACIDO_SEVERO
    vibrationState = 'NORMAL', // NORMAL, VIBRACION_MODERADA, GOLPETEO_MECANICO
    filterDrierDeltaPsi = 1.0, // Caída de presión en filtro
    startsPerHour = 4 // Ciclos de arranque por hora
  }) {
    let score = 100;
    const deductions = [];

    // 1. Amperaje vs RLA
    const rla = Number(ratedLoadAmpsRLA) || 20;
    const amps = Number(measuredAmps) || rla;
    const loadFactor = amps / rla;

    if (loadFactor > 1.20) {
      score -= 30;
      deductions.push(`Sobreconsumo severo (${amps}A vs RLA ${rla}A, +${Math.round((loadFactor - 1) * 100)}%)`);
    } else if (loadFactor > 1.10) {
      score -= 15;
      deductions.push(`Consumo eléctrico elevado (+${Math.round((loadFactor - 1) * 100)}% de placa)`);
    }

    // 2. Acidez de Aceite (Prueba química con gotero)
    if (oilAcidityLevel === 'ACIDO_SEVERO') {
      score -= 40;
      deductions.push('Aceite altamente ácido: Riesgo inminente de quemadura de bobinado del motor');
    } else if (oilAcidityLevel === 'ACIDO_LEVE') {
      score -= 20;
      deductions.push('Acidez incipiente en cárter: Requiere cambio de filtro deshidratador antiácido');
    }

    // 3. Vibración y Ruido
    if (vibrationState === 'GOLPETEO_MECANICO') {
      score -= 35;
      deductions.push('Golpeteo mecánico interno: Posible rotura de platos de válvulas o biela');
    } else if (vibrationState === 'VIBRACION_MODERADA') {
      score -= 12;
      deductions.push('Vibración moderada: Verificar tacos antivibratorios y fijación a chasis');
    }

    // 4. Caída de presión en filtro deshidratador
    const deltaP = Number(filterDrierDeltaPsi) || 0;
    if (deltaP >= 4.0) {
      score -= 20;
      deductions.push(`Filtro deshidratador saturado (ΔP = ${deltaP} PSI)`);
    } else if (deltaP >= 2.5) {
      score -= 10;
      deductions.push(`Obstrucción parcial en filtro líquido (ΔP = ${deltaP} PSI)`);
    }

    // 5. Ciclado corto de arranques
    if (startsPerHour > 8) {
      score -= 15;
      deductions.push(`Ciclado corto excesivo (${startsPerHour} arranques/hora): Castiga bobinado y contactor`);
    }

    const finalScore = Math.max(0, Math.min(100, score));

    let riskLevel = 'BAJO';
    let recommendation = 'Compresor en estado óptimo de operación.';

    if (finalScore < 45) {
      riskLevel = 'CRITICO_PARADA_RECOMENDADA';
      recommendation = 'Intervención de emergencia inmediata. Programar reemplazo o recuperación antes de quemadura total.';
    } else if (finalScore < 70) {
      riskLevel = 'MEDIO_REQUIERE_MANTENIMIENTO';
      recommendation = 'Programar service correctivo en los próximos 7 días (reemplazo de filtro/aceite).';
    }

    return {
      equipmentTag,
      model,
      healthScore: finalScore,
      riskLevel,
      deductions,
      recommendation,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Evalúa grupo electrógeno y sistema solar de respaldo de emergencia
   */
  static evaluateBackupPower({
    generatorTag = 'GEN-01',
    fuelLevelPercentage = 85,
    batteryVoltageVolts = 26.4, // Banco 24V nominal
    atsAutomaticTransferPassed = true,
    lastRunHours = 120
  }) {
    let score = 100;
    const alerts = [];

    if (fuelLevelPercentage < 25) {
      score -= 35;
      alerts.push(`Combustible diésel crítico (${fuelLevelPercentage}%): Autonomía insuficiente ante apagón.`);
    } else if (fuelLevelPercentage < 50) {
      score -= 15;
      alerts.push(`Nivel de diésel bajo (${fuelLevelPercentage}%). Reaprovisionar tanque.`);
    }

    if (batteryVoltageVolts < 23.5) {
      score -= 40;
      alerts.push(`Batería de arranque baja (${batteryVoltageVolts}V): El motor de arranque puede no girar.`);
    }

    if (!atsAutomaticTransferPassed) {
      score -= 45;
      alerts.push('Falla en prueba de conmutador de transferencia automática (ATS). No entrará en emergencia.');
    }

    const finalScore = Math.max(0, Math.min(100, score));

    return {
      generatorTag,
      score: finalScore,
      readyForEmergency: finalScore >= 70,
      alerts
    };
  }
}
