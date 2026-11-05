/**
 * Servicio de Órdenes de Mantenimiento Frigorífico & Doble Firma ePOD
 * AiAppFactory Engine #245 & #159 Standard
 */

import { CryptoSeal } from '../utils/cryptoSeal.js';
import { GasRefrigerantEngine } from '../core/gasRefrigerantEngine.js';

export class ServiceOrderService {
  /**
   * Crea una orden de servicio técnico
   */
  static createOrder({
    customerId,
    customerName,
    facilityName,
    facilityAddress,
    equipmentTag,
    orderType = 'EMERGENCIA_FRIO', // EMERGENCIA_FRIO, MANTENIMIENTO_PREVENTIVO, CARGA_GAS
    technicianName = 'Técnico Frigorista Certificado',
    gasType = 'R404A',
    measurements = {
      suctionPressurePsi: 28,
      suctionTempCelsius: -12,
      dischargePressurePsi: 245,
      liquidLineTempCelsius: 38,
      motorCurrentAmps: 18.5
    },
    gasChargedKg = 0,
    partsReplaced = [],
    pricing = {
      laborArs: 85000,
      partsUsd: 120,
      exchangeRate: 1250
    }
  }) {
    if (!customerName || !facilityName || !equipmentTag) {
      throw new Error('Faltan datos obligatorios para crear la orden de servicio');
    }

    const orderId = `OT-${Date.now().toString(36).slice(-4)}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();

    // Análisis termodinámico del circuito
    const sh = GasRefrigerantEngine.calculateSuperheat({
      gasType,
      suctionPressurePsi: measurements.suctionPressurePsi,
      suctionTempCelsius: measurements.suctionTempCelsius
    });

    const sc = GasRefrigerantEngine.calculateSubcooling({
      gasType,
      dischargePressurePsi: measurements.dischargePressurePsi,
      liquidLineTempCelsius: measurements.liquidLineTempCelsius
    });

    const diagnosis = GasRefrigerantEngine.diagnoseCircuit({
      superheatResult: sh,
      subcoolingResult: sc
    });

    const totalArs = pricing.laborArs + (pricing.partsUsd * pricing.exchangeRate);

    return {
      orderId,
      customerId,
      customerName,
      facilityName,
      facilityAddress,
      equipmentTag,
      orderType,
      technicianName,
      gasType,
      measurements,
      thermodynamics: {
        superheat: sh,
        subcooling: sc,
        diagnosis
      },
      gasChargedKg: Number(gasChargedKg) || 0,
      partsReplaced,
      pricing: {
        laborArs: pricing.laborArs,
        partsUsd: pricing.partsUsd,
        exchangeRate: pricing.exchangeRate,
        totalConvertedArs: totalArs
      },
      status: 'EN_PROCESO', // EN_PROCESO, FINALIZADA_SELLADA
      createdAt,
      closedAt: null,
      technicianSignature: null,
      clientConformitySignature: null,
      cryptoSeal: null
    };
  }

  /**
   * Cierra la orden con doble firma digital ePOD y Sello Criptográfico Inmutable SHA-256
   */
  static sealOrder(order, { technicianSignature, clientSignature, clientSupervisorName }) {
    if (!order) throw new Error('Orden no especificada');
    if (!technicianSignature || !clientSignature) {
      throw new Error('Se requiere doble firma (Técnico Frigorista y Responsable de Planta)');
    }

    const closedAt = new Date().toISOString();

    const sealPayload = {
      orderId: order.orderId,
      customerId: order.customerId,
      facilityName: order.facilityName,
      equipmentTag: order.equipmentTag,
      gasType: order.gasType,
      suctionPsi: order.measurements.suctionPressurePsi,
      dischargePsi: order.measurements.dischargePressurePsi,
      gasChargedKg: order.gasChargedKg,
      totalArs: order.pricing.totalConvertedArs,
      signatures: {
        tech: technicianSignature,
        client: clientSignature,
        supervisor: clientSupervisorName || 'Jefe de Mantenimiento'
      },
      closedAt
    };

    const cryptoSeal = CryptoSeal.generate(sealPayload);

    return {
      ...order,
      status: 'FINALIZADA_SELLADA',
      closedAt,
      technicianSignature,
      clientConformitySignature: {
        signature: clientSignature,
        supervisorName: clientSupervisorName || 'Jefe de Mantenimiento'
      },
      cryptoSeal
    };
  }

  /**
   * Valida la integridad del sello SHA-256 del acta técnica
   */
  static verifySeal(order) {
    if (!order || !order.cryptoSeal || !order.clientConformitySignature) return false;

    const sealPayload = {
      orderId: order.orderId,
      customerId: order.customerId,
      facilityName: order.facilityName,
      equipmentTag: order.equipmentTag,
      gasType: order.gasType,
      suctionPsi: order.measurements.suctionPressurePsi,
      dischargePsi: order.measurements.dischargePressurePsi,
      gasChargedKg: order.gasChargedKg,
      totalArs: order.pricing.totalConvertedArs,
      signatures: {
        tech: order.technicianSignature,
        client: order.clientConformitySignature.signature,
        supervisor: order.clientConformitySignature.supervisorName
      },
      closedAt: order.closedAt
    };

    return CryptoSeal.verify(sealPayload, order.cryptoSeal);
  }
}
