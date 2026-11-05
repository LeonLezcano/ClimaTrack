/**
 * Motor Termodinámico de Gases Refrigerantes & P-T
 * AiAppFactory Engine #115 & #119 Standard
 * Cumplimiento con buenas prácticas de refrigeración industrial
 */

export const REFRIGERANT_CATALOG = {
  R410A: {
    name: 'R-410A (HFC Blends VRF/Inverter)',
    ozoneDepletion: 0,
    gwp: 2088,
    // P-T polynomial constants for saturation temp in °C from gauge PSI
    ptConstants: { a: -52.4, b: 0.28, c: -0.00021 }
  },
  R134a: {
    name: 'R-134a (HFC Media Temperatura & Chillers)',
    ozoneDepletion: 0,
    gwp: 1430,
    ptConstants: { a: -26.1, b: 0.44, c: -0.00065 }
  },
  R404A: {
    name: 'R-404A (HFC Baja Temp / Congelados)',
    ozoneDepletion: 0,
    gwp: 3922,
    ptConstants: { a: -45.5, b: 0.32, c: -0.00030 }
  },
  R22: {
    name: 'R-22 (HCFC Transición / Equipos Legacy)',
    ozoneDepletion: 0.055,
    gwp: 1810,
    ptConstants: { a: -40.8, b: 0.38, c: -0.00048 }
  }
};

export class GasRefrigerantEngine {
  /**
   * Calcula la temperatura de saturación (°C) a partir de la presión manométrica (PSI)
   */
  static getSaturationTemperature(gasType, gaugePressurePsi) {
    const gas = REFRIGERANT_CATALOG[gasType];
    if (!gas) throw new Error(`Gas refrigerante '${gasType}' no soportado`);
    const p = Math.max(0, Number(gaugePressurePsi) || 0);
    const { a, b, c } = gas.ptConstants;
    const tSat = a + (b * p) + (c * p * p);
    return Number(tSat.toFixed(2));
  }

  /**
   * Calcula el Recalentamiento Útil (Superheat) en la línea de succión
   * Superheat = T_succión_medida - T_evaporación_saturada
   */
  static calculateSuperheat({ gasType, suctionPressurePsi, suctionTempCelsius }) {
    const tEvapSat = this.getSaturationTemperature(gasType, suctionPressurePsi);
    const superheat = Number((suctionTempCelsius - tEvapSat).toFixed(2));

    let status = 'NORMAL';
    let alert = 'Recalentamiento dentro de rango operativo seguro (4°C a 9°C)';

    if (superheat < 2) {
      status = 'PELIGRO_GOLPE_DE_LIQUIDO';
      alert = '¡Alerta Crítica! Recalentamiento casi nulo (<2°C). Riesgo inminente de retorno de líquido al compresor.';
    } else if (superheat > 12) {
      status = 'ELEVADO_FALTA_REFRIGERANTE';
      alert = 'Recalentamiento elevado (>12°C). Posible subalimentación de evaporador o fuga de gas.';
    }

    return {
      gasType,
      suctionPressurePsi,
      suctionTempCelsius,
      saturationEvapTempCelsius: tEvapSat,
      superheatCelsius: superheat,
      status,
      alert
    };
  }

  /**
   * Calcula el Subenfriamiento (Subcooling) en la línea de líquido
   * Subcooling = T_condensación_saturada - T_líquido_medida
   */
  static calculateSubcooling({ gasType, dischargePressurePsi, liquidLineTempCelsius }) {
    const tCondSat = this.getSaturationTemperature(gasType, dischargePressurePsi);
    const subcooling = Number((tCondSat - liquidLineTempCelsius).toFixed(2));

    let status = 'NORMAL';
    let alert = 'Subenfriamiento adecuado (4°C a 9°C). Sello de líquido pleno ante válvula de expansión.';

    if (subcooling < 2) {
      status = 'BAJO_FLASH_GAS';
      alert = 'Subenfriamiento insuficiente (<2°C). Formación de burbujas (flash gas) antes de expansión.';
    } else if (subcooling > 12) {
      status = 'ELEVADO_SOBRECARGA';
      alert = 'Subenfriamiento muy alto (>12°C). Posible exceso de gas o condensador anegado de líquido.';
    }

    return {
      gasType,
      dischargePressurePsi,
      liquidLineTempCelsius,
      saturationCondTempCelsius: tCondSat,
      subcoolingCelsius: subcooling,
      status,
      alert
    };
  }

  /**
   * Diagnóstico holístico combinando Superheat y Subcooling
   */
  static diagnoseCircuit({ superheatResult, subcoolingResult }) {
    const sh = superheatResult.superheatCelsius;
    const sc = subcoolingResult.subcoolingCelsius;

    if (sh > 10 && sc < 3) {
      return {
        diagnostic: 'FALTA_REFRIGERANTE',
        action: 'Buscar fugas en uniones flare / soldaduras y realizar carga controlada por peso.',
        urgency: 'ALTA'
      };
    }

    if (sh < 3 && sc > 10) {
      return {
        diagnostic: 'SOBRECARGA_REFRIGERANTE',
        action: 'Recuperar refrigerante a cilindro homologado hasta nivelar recalentamiento.',
        urgency: 'ALTA'
      };
    }

    if (sh > 10 && sc > 10) {
      return {
        diagnostic: 'OBSTRUCCION_VALVULA_O_FILTRO',
        action: 'Revisar caída de presión en filtro deshidratador y apertura de válvula de expansión.',
        urgency: 'MEDIA'
      };
    }

    if (sh < 3 && sc < 3) {
      return {
        diagnostic: 'VENTILACION_EVAPORADOR_DEFICIENTE',
        action: 'Revisar forzadores de evaporador, filtro de aire sucio o escarcha acumulada en serpentina.',
        urgency: 'MEDIA'
      };
    }

    return {
      diagnostic: 'CIRCUITO_BALANCEADO',
      action: 'Equipo operando con parámetros óptimos de intercambio térmico.',
      urgency: 'BAJA'
    };
  }

  /**
   * Control de balanza de garrafa de carga
   */
  static calculateCylinderBalance({ initialBottleWeightKg, finalBottleWeightKg }) {
    const init = Math.max(0, Number(initialBottleWeightKg) || 0);
    const finalW = Math.max(0, Number(finalBottleWeightKg) || 0);
    const netChargedKg = Math.max(0, Number((init - finalW).toFixed(3)));
    return {
      initialBottleWeightKg: init,
      finalBottleWeightKg: finalW,
      netChargedKg
    };
  }
}
