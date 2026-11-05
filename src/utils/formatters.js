/**
 * Formatters para ClimaTrack
 */

export const Formatters = {
  temperature(val) {
    if (val === null || val === undefined || isNaN(val)) return '- °C';
    return `${Number(val).toFixed(1)} °C`;
  },

  pressurePsi(val) {
    if (val === null || val === undefined || isNaN(val)) return '- PSI';
    return `${Number(val).toFixed(1)} PSI`;
  },

  amperes(val) {
    if (val === null || val === undefined || isNaN(val)) return '- A';
    return `${Number(val).toFixed(1)} A`;
  },

  currencyARS(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(num);
  },

  currencyUSD(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(num);
  },

  date(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  slaBadge(severity, status) {
    if (status === 'FINALIZADA_SELLADA') {
      return {
        label: 'Cerrada & Sellada ePOD',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        badgeClass: 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      };
    }

    const map = {
      'CRITICA_ROTURA_FRIO': {
        label: '🚨 Crítica (<120m SLA)',
        bg: 'bg-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/40'
      },
      'ALTA_VRF_CONFORT': {
        label: '⚡ Alta (<240m SLA)',
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/40'
      },
      'MEDIA_PREVENTIVO': {
        label: '📅 Preventivo Programado',
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/40'
      }
    };

    const b = map[severity] || {
      label: severity || 'Desconocido',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700'
    };

    return {
      ...b,
      badgeClass: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${b.bg} ${b.text} ${b.border}`
    };
  },

  healthBadge(score) {
    const num = Number(score) || 0;
    if (num >= 85) {
      return {
        label: 'Excelente',
        badgeClass: 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      };
    }
    if (num >= 70) {
      return {
        label: 'Bueno / Estable',
        badgeClass: 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border bg-blue-500/20 text-blue-400 border-blue-500/40'
      };
    }
    if (num >= 50) {
      return {
        label: 'Degradado / Alerta',
        badgeClass: 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border bg-amber-500/20 text-amber-400 border-amber-500/40'
      };
    }
    return {
      label: 'Riesgo de Falla',
      badgeClass: 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border bg-rose-500/20 text-rose-400 border-rose-500/40'
    };
  }
};
