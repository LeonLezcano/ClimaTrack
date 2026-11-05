/**
 * WhatsApp Clima Notifier Service
 * Enlaces directos E.164 para guardias 24/7 y partes técnicos sellados
 */

export class WhatsAppClimaNotifierService {
  /**
   * Genera enlace de alerta para despacho de técnico de guardia 24/7
   */
  static notifyEmergencyDispatch({ phone, facilityName, equipmentTag, severity, targetTemp, currentTemp, remainingMinutes }) {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const alertIcon = severity === 'CRITICA_ROTURA_FRIO' ? '🚨🚨' : '⚡';
    const text = `${alertIcon} *CLIMATRACK - ALERTA GUARDIA 24/7* ${alertIcon}\n\n` +
      `🏢 *Planta:* ${facilityName}\n` +
      `❄️ *Equipo:* ${equipmentTag}\n` +
      `⚠️ *Severidad:* ${severity}\n` +
      `🌡️ *Temp Actual:* ${currentTemp}°C (Consigna: ${targetTemp}°C)\n` +
      `⏳ *SLA Restante:* ${remainingMinutes} minutos\n\n` +
      `_Técnico en ruta: Por favor confirmar llegada in-situ desde la app para frenar reloj de SLA._`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Genera enlace de parte técnico finalizado con sello SHA-256
   */
  static notifyOrderCompletion({ phone, customerName, orderId, facilityName, equipmentTag, cryptoSeal }) {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const shortSeal = cryptoSeal ? cryptoSeal.slice(0, 16) + '...' : 'Pendiente';
    const text = `📋 *CLIMATRACK - Parte Técnico Certificado* ❄️\n\n` +
      `Estimado/a *${customerName}*:\n` +
      `La orden de servicio *${orderId}* en la planta *${facilityName}* (${equipmentTag}) ha sido concluida con éxito.\n\n` +
      `🔒 *Sello Forense SHA-256:* ${shortSeal}\n` +
      `✔ Parámetros de presión y temperatura balanceados.\n` +
      `Acta disponible para descarga en PDF.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}

export const WhatsAppClimaNotifier = WhatsAppClimaNotifierService;
