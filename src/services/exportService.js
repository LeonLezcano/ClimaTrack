/**
 * Servicio de Exportación Universal CSV con BOM UTF-8
 * Cumple con Regla Inquebrantable #17
 */

export class ExportService {
  /**
   * Genera y descarga archivo CSV con BOM UTF-8 para Excel en Windows
   */
  static generateOrdersCsv(orders = []) {
    const BOM = '\uFEFF';
    const headers = [
      'ID Orden',
      'Cliente / Empresa',
      'Planta / Local',
      'Equipo Frigorífico',
      'Tipo de Gas',
      'Presión Succión (PSI)',
      'Presión Descarga (PSI)',
      'Recalentamiento (°C)',
      'Subenfriamiento (°C)',
      'Diagnóstico Termodinámico',
      'Gas Cargado (kg)',
      'Total Mano de Obra (ARS)',
      'Total Repuestos (USD)',
      'Estado',
      'Sello SHA-256'
    ];

    const rows = orders.map(o => [
      o.orderId,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.facilityName || '').replace(/"/g, '""')}"`,
      `"${(o.equipmentTag || '').replace(/"/g, '""')}"`,
      o.gasType || '-',
      o.measurements?.suctionPressurePsi ?? 0,
      o.measurements?.dischargePressurePsi ?? 0,
      o.thermodynamics?.superheat?.superheatCelsius ?? 0,
      o.thermodynamics?.subcooling?.subcoolingCelsius ?? 0,
      `"${(o.thermodynamics?.diagnosis?.diagnostic || '').replace(/"/g, '""')}"`,
      o.gasChargedKg ?? 0,
      o.pricing?.laborArs ?? 0,
      o.pricing?.partsUsd ?? 0,
      o.status || '-',
      o.cryptoSeal || 'PENDIENTE'
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    return BOM + csvContent;
  }

  static downloadCsv(csvString, filename = 'climatrack_ordenes.csv') {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return csvString;
    }

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
}
