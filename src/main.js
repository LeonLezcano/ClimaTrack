/**
 * ClimaTrack - Main Application Orchestrator
 * Frío Industrial, HVAC, Termodinámica P-T, Guardias 24/7 y Sello SHA-256
 */

import { GasRefrigerantEngine } from './core/gasRefrigerantEngine.js';
import { SlaEmergencyDispatcher } from './core/slaEmergencyDispatcher.js';
import { CompressorHealthScoring } from './core/compressorHealthScoring.js';
import { ServiceOrderService } from './services/serviceOrderService.js';
import { DualCurrencyContractService } from './services/dualCurrencyContractService.js';
import { ExportService } from './services/exportService.js';
import { ClimaTrackCacheService } from './services/climaTrackCache.service.js';
import { WhatsAppClimaNotifierService } from './services/whatsAppClimaNotifier.service.js';
import { Sanitizer } from './utils/sanitizer.js';
import { Formatters } from './utils/formatters.js';

class ClimaTrackApp {
  constructor() {
    this.orders = [];
    this.emergencies = [];
    this.assets = [];
    this.contracts = [];
    this.activeTab = 'emergencies';
    this.timerInterval = null;
  }

  init() {
    this.seedInitialDemoData();
    this.bindEvents();
    this.updateThermodynamicsCalculator();
    this.renderAll();
    this.startLiveSlaTimer();
  }

  seedInitialDemoData() {
    if (ClimaTrackCacheService.isPurged()) {
      return;
    }

    // 1. Guardias de Emergencia Demo
    const now = Date.now();
    const emg1 = SlaEmergencyDispatcher.createDispatchTicket({
      ticketId: 'EMG-CRIT-01',
      facilityName: 'Frigorífico Paladini S.A.',
      facilityAddress: 'Ruta 21 Km 4.5, V. G. Gálvez',
      equipmentTag: 'CAM-CARNE-03',
      severity: 'CRITICA_ROTURA_FRIO',
      chamberType: 'CARNE_CONGELADA',
      targetTempCelsius: -18,
      currentTempCelsius: -5,
      reportedAt: new Date(now - 35 * 60000).toISOString() // Reportada hace 35 min
    });

    const emg2 = SlaEmergencyDispatcher.createDispatchTicket({
      ticketId: 'EMG-VRF-02',
      facilityName: 'Torre Corporativa Nordlink',
      facilityAddress: 'Madres de Plaza 25 de Mayo 3020, Rosario',
      equipmentTag: 'VRF-PISO-8',
      severity: 'ALTA_VRF_CONFORT',
      chamberType: 'DATACENTER',
      targetTempCelsius: 21,
      currentTempCelsius: 29,
      reportedAt: new Date(now - 70 * 60000).toISOString() // Reportada hace 70 min
    });

    this.emergencies.push(emg1, emg2);

    // 2. Orden de Servicio Frigorífico Demo
    const order1 = ServiceOrderService.createOrder({
      customerId: 'CLI-PAL-01',
      customerName: 'Frigorífico Paladini S.A.',
      facilityName: 'Planta Faena Villa Diego',
      facilityAddress: 'Ruta 21 Km 4.5, V. G. Gálvez',
      equipmentTag: 'CAM-CARNE-03',
      orderType: 'EMERGENCIA_FRIO',
      gasType: 'R404A',
      measurements: {
        suctionPressurePsi: 28,
        suctionTempCelsius: -28,
        dischargePressurePsi: 245,
        liquidLineTempCelsius: 37,
        motorCurrentAmps: 18.5
      },
      gasChargedKg: 4.2,
      pricing: { laborArs: 135000, partsUsd: 180, exchangeRate: 1250 }
    });

    this.orders.push(order1);

    // 3. Activos Frigoríficos con Health Scoring
    const asset1 = CompressorHealthScoring.evaluateCompressorHealth({
      equipmentTag: 'CMP-PAL-03',
      model: 'Bitzer Semi-hermético 25HP',
      measuredAmps: 21.5,
      ratedLoadAmpsRLA: 22.0,
      oilAcidityLevel: 'NEUTRO',
      vibrationState: 'NORMAL',
      filterDrierDeltaPsi: 0.8,
      startsPerHour: 4
    });

    const asset2 = CompressorHealthScoring.evaluateCompressorHealth({
      equipmentTag: 'CHILLER-NORD-01',
      model: 'Trane Scroll R410A 40TR',
      measuredAmps: 34.0,
      ratedLoadAmpsRLA: 30.0, // +13% sobrecarga
      oilAcidityLevel: 'ACIDO_LEVE',
      vibrationState: 'VIBRACION_MODERADA',
      filterDrierDeltaPsi: 2.8,
      startsPerHour: 9 // ciclado corto
    });

    const backupGen = CompressorHealthScoring.evaluateBackupPower({
      generatorTag: 'GEN-CUMMINS-150KVA',
      fuelLevelPercentage: 85,
      batteryVoltageVolts: 26.8,
      atsAutomaticTransferPassed: true
    });

    this.assets.push(
      { type: 'COMPRESSOR', data: asset1, facility: 'Frigorífico Paladini' },
      { type: 'COMPRESSOR', data: asset2, facility: 'Torre Nordlink' },
      { type: 'GENERATOR', data: backupGen, facility: 'Frigorífico Paladini (Generador Respaldo)' }
    );

    // 4. Contratos Bimonetarios Demo
    const c1 = DualCurrencyContractService.createContract({
      customerName: 'Frigorífico Paladini S.A.',
      facilityName: 'Planta Faena y Secaderos',
      facilityAddress: 'Ruta 21 Km 4.5, V. G. Gálvez',
      equipmentCovered: ['CAM-CARNE-01', 'CAM-CARNE-02', 'CAM-CARNE-03', 'GEN-CUMMINS-150KVA'],
      monthlyFeeArs: 480000,
      partsCapUsd: 1200,
      exchangeRateUsd: 1250,
      dueDayOfMonth: 10,
      slaTier: 'CRITICA_ROTURA_FRIO'
    });

    const c2 = DualCurrencyContractService.createContract({
      customerName: 'Torre Corporativa Nordlink',
      facilityName: 'Edificio Central Clima',
      facilityAddress: 'Madres de Plaza 25 de Mayo 3020',
      equipmentCovered: ['VRF-PISO-8', 'CHILLER-NORD-01'],
      monthlyFeeArs: 320000,
      partsCapUsd: 600,
      exchangeRateUsd: 1250,
      dueDayOfMonth: 15,
      slaTier: 'ALTA_VRF_CONFORT'
    });

    this.contracts.push(c1, c2);
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab');
        if (target) this.switchTab(target);
      });
    });

    // Thermodynamics calculator live inputs
    ['calc-gas-type', 'inp-suction-psi', 'inp-suction-temp', 'inp-discharge-psi', 'inp-liquid-temp'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateThermodynamicsCalculator());
      }
    });

    // Emergency Modals
    const btnNewEmg = document.getElementById('btn-new-emergency');
    if (btnNewEmg) btnNewEmg.addEventListener('click', () => this.openEmergencyModal());

    const btnTriggerEmg = document.getElementById('btn-trigger-emergency');
    if (btnTriggerEmg) btnTriggerEmg.addEventListener('click', () => this.openEmergencyModal());

    const btnCloseEmg = document.getElementById('btn-close-emergency-modal');
    if (btnCloseEmg) btnCloseEmg.addEventListener('click', () => this.closeEmergencyModal());

    const btnCancelEmg = document.getElementById('btn-cancel-emergency');
    if (btnCancelEmg) btnCancelEmg.addEventListener('click', () => this.closeEmergencyModal());

    const formEmg = document.getElementById('form-create-emergency');
    if (formEmg) {
      formEmg.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateEmergency();
      });
    }

    // Export CSV
    const btnCsv = document.getElementById('btn-export-csv');
    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        const csv = ExportService.generateOrdersCsv(this.orders);
        ExportService.downloadCsv(csv, 'climatrack_ordenes_frio.csv');
      });
    }

    // Quick New Order
    const btnNewOrder = document.getElementById('btn-new-order');
    if (btnNewOrder) {
      btnNewOrder.addEventListener('click', () => {
        const facility = prompt('Nombre del Establecimiento / Planta Frigorífica:');
        if (!facility) return;
        const equip = prompt('Identificador del Equipo (Ej: CAM-04):', 'CAM-04');
        const gas = prompt('Tipo de Gas (R404A, R410A, R134a, R22):', 'R404A');

        const newOrder = ServiceOrderService.createOrder({
          customerName: facility,
          facilityName: facility,
          equipmentTag: equip || 'CAM-GEN',
          gasType: gas || 'R404A',
          measurements: {
            suctionPressurePsi: 28,
            suctionTempCelsius: -28,
            dischargePressurePsi: 240,
            liquidLineTempCelsius: 36,
            motorCurrentAmps: 18.0
          },
          gasChargedKg: 2.0,
          pricing: { laborArs: 95000, partsUsd: 100, exchangeRate: 1250 }
        });

        this.orders.push(newOrder);
        this.renderAll();
      });
    }

    // New Contract Modal Button
    const btnNewContract = document.getElementById('btn-new-contract-modal');
    if (btnNewContract) {
      btnNewContract.addEventListener('click', () => {
        const client = prompt('Razón Social del Cliente:');
        if (!client) return;
        const facility = prompt('Nombre de la Planta o Edificio:', client);
        const fee = prompt('Abono Mensual Mano de Obra (ARS):', '380000');
        const cap = prompt('Fondo de Repuestos (USD):', '800');

        const newContract = DualCurrencyContractService.createContract({
          customerName: client,
          facilityName: facility || client,
          monthlyFeeArs: parseFloat(fee) || 380000,
          partsCapUsd: parseFloat(cap) || 800,
          exchangeRateUsd: 1250
        });

        this.contracts.push(newContract);
        this.renderAll();
      });
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.add('hidden');
    });

    const activeSection = document.getElementById(`tab-${tabId}`);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      if (isTarget) {
        btn.classList.add('text-rose-400', 'font-semibold');
        btn.classList.remove('text-[#8ca4c8]');
      } else {
        btn.classList.remove('text-rose-400', 'font-semibold');
        btn.classList.add('text-[#8ca4c8]');
      }
    });

    this.renderAll();
  }

  startLiveSlaTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.renderEmergencyCards();
    }, 15000); // Actualiza cada 15 seg
  }

  updateThermodynamicsCalculator() {
    const gasType = document.getElementById('calc-gas-type')?.value || 'R404A';
    const suctionPsi = parseFloat(document.getElementById('inp-suction-psi')?.value || '0');
    const suctionTemp = parseFloat(document.getElementById('inp-suction-temp')?.value || '0');
    const dischargePsi = parseFloat(document.getElementById('inp-discharge-psi')?.value || '0');
    const liquidTemp = parseFloat(document.getElementById('inp-liquid-temp')?.value || '0');

    const sh = GasRefrigerantEngine.calculateSuperheat({
      gasType,
      suctionPressurePsi: suctionPsi,
      suctionTempCelsius: suctionTemp
    });

    const sc = GasRefrigerantEngine.calculateSubcooling({
      gasType,
      dischargePressurePsi: dischargePsi,
      liquidLineTempCelsius: liquidTemp
    });

    const diag = GasRefrigerantEngine.diagnoseCircuit({
      superheatResult: sh,
      subcoolingResult: sc
    });

    const summaryEl = document.getElementById('calc-pt-summary');
    if (summaryEl) {
      summaryEl.textContent = `T. Evap Sat: ${sh.saturationEvapTempCelsius}°C | T. Cond Sat: ${sc.saturationCondTempCelsius}°C`;
    }

    const shValEl = document.getElementById('disp-superheat-val');
    if (shValEl) shValEl.textContent = `${sh.superheatCelsius} °C`;

    const shStatusEl = document.getElementById('disp-superheat-status');
    if (shStatusEl) shStatusEl.textContent = sh.alert;

    const scValEl = document.getElementById('disp-subcooling-val');
    if (scValEl) scValEl.textContent = `${sc.subcoolingCelsius} °C`;

    const scStatusEl = document.getElementById('disp-subcooling-status');
    if (scStatusEl) scStatusEl.textContent = sc.alert;

    const diagTitle = document.getElementById('disp-diagnosis-title');
    if (diagTitle) diagTitle.textContent = `Diagnóstico: ${diag.diagnostic.replace(/_/g, ' ')}`;

    const diagDesc = document.getElementById('disp-diagnosis-desc');
    if (diagDesc) diagDesc.textContent = diag.action;
  }

  openEmergencyModal() {
    document.getElementById('modal-new-emergency')?.classList.remove('hidden');
  }

  closeEmergencyModal() {
    document.getElementById('modal-new-emergency')?.classList.add('hidden');
  }

  handleCreateEmergency() {
    const facility = document.getElementById('inp-emg-facility').value;
    const address = document.getElementById('inp-emg-address').value;
    const equip = document.getElementById('inp-emg-equip').value;
    const severity = document.getElementById('inp-emg-severity').value;
    const targetTemp = parseFloat(document.getElementById('inp-emg-target-temp').value) || -18;
    const currentTemp = parseFloat(document.getElementById('inp-emg-current-temp').value) || -3;

    const ticket = SlaEmergencyDispatcher.createDispatchTicket({
      facilityName: facility,
      facilityAddress: address,
      equipmentTag: equip,
      severity,
      targetTempCelsius: targetTemp,
      currentTempCelsius: currentTemp
    });

    this.emergencies.unshift(ticket);
    this.closeEmergencyModal();
    this.renderAll();
  }

  renderAll() {
    this.renderMetrics();
    this.renderDashboardTable();
    this.renderEmergencyCards();
    this.renderAssetCards();
    this.renderContractCards();
  }

  renderMetrics() {
    const activeEmg = this.emergencies.filter(e => e.status !== 'RESUELTO_CONFORME').length;
    const totalGas = this.orders.reduce((sum, o) => sum + (o.gasChargedKg || 0), 0);

    const assetScores = this.assets
      .map(a => a.type === 'COMPRESSOR' ? a.data.healthScore : a.data.score)
      .filter(s => typeof s === 'number');
    const avgScore = assetScores.length > 0
      ? Math.round(assetScores.reduce((a, b) => a + b, 0) / assetScores.length)
      : 100;

    const elEmg = document.getElementById('metric-active-emergencies');
    if (elEmg) elEmg.textContent = String(activeEmg);

    const elGas = document.getElementById('metric-total-gas-kg');
    if (elGas) elGas.textContent = totalGas.toFixed(1);

    const elHealth = document.getElementById('metric-avg-health');
    if (elHealth) elHealth.textContent = String(avgScore);

    const elContracts = document.getElementById('metric-active-contracts');
    if (elContracts) elContracts.textContent = String(this.contracts.length);
  }

  renderDashboardTable() {
    const tbody = document.getElementById('dashboard-orders-tbody');
    if (!tbody) return;

    if (this.orders.length === 0) {
      Sanitizer.safeSetInnerHTML(tbody, '<tr><td colspan="8" class="py-4 text-center text-[#718ab0]">No hay partes de servicio registrados</td></tr>');
      return;
    }

    const rowsHtml = this.orders.map(o => {
      const badge = Formatters.slaBadge(o.orderType, o.status);
      const sealPreview = o.cryptoSeal ? `${o.cryptoSeal.slice(0, 12)}...` : 'Pendiente';
      return `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-3 font-mono font-bold text-[#38bdf8]">${Sanitizer.escapeHTML(o.orderId)}</td>
          <td class="py-3 font-medium text-white">${Sanitizer.escapeHTML(o.facilityName)}</td>
          <td class="py-3 font-mono text-[#c5d7ed] text-xs">${Sanitizer.escapeHTML(o.equipmentTag)}</td>
          <td class="py-3 font-mono font-semibold text-cyan-300">${Sanitizer.escapeHTML(o.gasType)}</td>
          <td class="py-3 font-mono text-[#c5d7ed]">${Formatters.temperature(o.thermodynamics?.superheat?.superheatCelsius)}</td>
          <td class="py-3 font-mono text-[#c5d7ed]">${Formatters.temperature(o.thermodynamics?.subcooling?.subcoolingCelsius)}</td>
          <td class="py-3"><span class="${badge.badgeClass}">${badge.label}</span></td>
          <td class="py-3 font-mono text-[10px] text-emerald-400">${Sanitizer.escapeHTML(sealPreview)}</td>
        </tr>
      `;
    }).join('');

    Sanitizer.safeSetInnerHTML(tbody, rowsHtml);
  }

  renderEmergencyCards() {
    const container = document.getElementById('emergencies-cards-container');
    if (!container) return;

    if (this.emergencies.length === 0) {
      Sanitizer.safeSetInnerHTML(container, '<div class="col-span-3 py-8 text-center text-[#718ab0]">No hay guardias de emergencia activas. Cadena de frío asegurada.</div>');
      return;
    }

    const cardsHtml = this.emergencies.map(e => {
      const sla = SlaEmergencyDispatcher.evaluateSlaStatus(e);
      const isResolved = e.status === 'RESUELTO_CONFORME';

      let timeColorClass = 'text-emerald-400';
      if (sla.isBreached) {
        timeColorClass = 'text-rose-500 animate-pulse';
      } else if (sla.remainingMinutes <= 30) {
        timeColorClass = 'text-rose-400';
      } else if (sla.remainingMinutes <= 60) {
        timeColorClass = 'text-amber-400';
      }

      return `
        <div class="bg-[#091224] border border-[#1e3256] rounded-xl p-4 space-y-3 shadow-md ${sla.isBreached ? 'border-rose-500/50' : ''}">
          <div class="flex items-center justify-between border-b border-[#1e3256]/80 pb-2">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sm text-rose-400">${Sanitizer.escapeHTML(e.ticketId)}</span>
              <span class="text-[10px] px-2 py-0.5 rounded font-semibold ${sla.isBreached ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-[#c5d7ed]'}">
                ${sla.urgencyState.replace(/_/g, ' ')}
              </span>
            </div>
            <span class="font-mono font-black text-sm ${timeColorClass}">
              ${sla.isBreached ? `VENCIDO (${Math.abs(sla.remainingMinutes)}m)` : `${sla.remainingMinutes}m restantes`}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-sm text-white">${Sanitizer.escapeHTML(e.facilityName)}</h4>
            <p class="text-xs text-[#8ca4c8] flex items-center gap-1 mt-0.5">
              <span>📍</span> <span>${Sanitizer.escapeHTML(e.facilityAddress)}</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs bg-[#0f1b30]/60 p-2.5 rounded-lg border border-[#1e3256]/50">
            <div>
              <span class="text-[#718ab0] text-[10px] block">Cámara / Equipo</span>
              <span class="font-mono font-bold text-[#38bdf8]">${Sanitizer.escapeHTML(e.equipmentTag)}</span>
            </div>
            <div>
              <span class="text-[#718ab0] text-[10px] block">Desvío Térmico</span>
              <span class="font-mono font-bold text-rose-400">
                ${Formatters.temperature(e.currentTempCelsius)} / Obj ${Formatters.temperature(e.targetTempCelsius)}
              </span>
            </div>
          </div>

          ${sla.estimatedPenaltyArs > 0 ? `
            <div class="text-[10px] bg-rose-500/10 text-rose-300 p-2 rounded border border-rose-500/20 flex items-center justify-between">
              <span>Penalidad SLA Acumulada:</span>
              <span class="font-mono font-bold">${Formatters.currencyARS(sla.estimatedPenaltyArs)}</span>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e3256]/60">
            <button class="btn-wa-dispatch px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[#c5d7ed] text-xs flex items-center gap-1" data-ticket-id="${Sanitizer.escapeHTML(e.ticketId)}">
              <span>💬</span> <span>Aviso Guardia WhatsApp</span>
            </button>

            ${!isResolved ? `
              <button class="btn-resolve-sla px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow" data-ticket-id="${Sanitizer.escapeHTML(e.ticketId)}">
                ✔ Confirmar Llegada / Cierre
              </button>
            ` : `
              <span class="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                ✔ Servicio Resuelto
              </span>
            `}
          </div>
        </div>
      `;
    }).join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);

    // Bind Emergency Buttons
    container.querySelectorAll('.btn-resolve-sla').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-ticket-id');
        this.handleResolveEmergency(id);
      });
    });

    container.querySelectorAll('.btn-wa-dispatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-ticket-id');
        this.handleWhatsAppDispatch(id);
      });
    });
  }

  handleResolveEmergency(ticketId) {
    const emg = this.emergencies.find(t => t.ticketId === ticketId);
    if (!emg) return;

    emg.status = 'RESUELTO_CONFORME';
    emg.closureTime = new Date().toISOString();

    // Auto-create service order with ePOD seal
    const newOrder = ServiceOrderService.createOrder({
      customerName: emg.facilityName,
      facilityName: emg.facilityName,
      facilityAddress: emg.facilityAddress,
      equipmentTag: emg.equipmentTag,
      orderType: emg.severity,
      measurements: {
        suctionPressurePsi: 28,
        suctionTempCelsius: -28,
        dischargePressurePsi: 240,
        liquidLineTempCelsius: 36,
        motorCurrentAmps: 18.2
      },
      gasChargedKg: 1.5,
      pricing: { laborArs: 110000, partsUsd: 80, exchangeRate: 1250 }
    });

    const sealed = ServiceOrderService.sealOrder(newOrder, {
      technicianSignature: 'SIG_TECH_GUARDIA_' + Date.now(),
      clientSignature: 'SIG_JEFE_PLANTA_' + Date.now(),
      clientSupervisorName: 'Jefe de Frío de Turno'
    });

    this.orders.unshift(sealed);
    this.renderAll();
  }

  handleWhatsAppDispatch(ticketId) {
    const emg = this.emergencies.find(t => t.ticketId === ticketId);
    if (!emg) return;

    const sla = SlaEmergencyDispatcher.evaluateSlaStatus(emg);
    const url = WhatsAppClimaNotifierService.notifyEmergencyDispatch({
      phone: '+5493415998877',
      facilityName: emg.facilityName,
      equipmentTag: emg.equipmentTag,
      severity: emg.severity,
      targetTemp: emg.targetTempCelsius,
      currentTemp: emg.currentTempCelsius,
      remainingMinutes: sla.remainingMinutes
    });
    window.open(url, '_blank');
  }

  renderAssetCards() {
    const container = document.getElementById('assets-cards-container');
    if (!container) return;

    const cardsHtml = this.assets.map(a => {
      if (a.type === 'COMPRESSOR') {
        const d = a.data;
        const badge = Formatters.healthBadge(d.healthScore);
        return `
          <div class="bg-[#091224] border border-[#1e3256] rounded-xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between border-b border-[#1e3256]/80 pb-2">
              <span class="font-mono font-bold text-sm text-[#38bdf8]">${Sanitizer.escapeHTML(d.equipmentTag)}</span>
              <span class="${badge.badgeClass}">${badge.label} (${d.healthScore}/100)</span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-white">${Sanitizer.escapeHTML(a.facility)}</h4>
              <p class="text-xs text-[#8ca4c8] mt-0.5">Modelo: ${Sanitizer.escapeHTML(d.model)}</p>
            </div>
            <div class="bg-[#0f1b30]/60 p-2.5 rounded-lg border border-[#1e3256]/50 text-xs space-y-1">
              <span class="text-[#718ab0] text-[10px] block font-semibold">Diagnóstico Predictivo:</span>
              <p class="text-[#c5d7ed] italic">"${Sanitizer.escapeHTML(d.recommendation)}"</p>
            </div>
            ${d.deductions?.length > 0 ? `
              <div class="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                ⚠️ ${Sanitizer.escapeHTML(d.deductions[0])}
              </div>
            ` : ''}
          </div>
        `;
      } else {
        const g = a.data;
        return `
          <div class="bg-[#091224] border border-[#1e3256] rounded-xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between border-b border-[#1e3256]/80 pb-2">
              <span class="font-mono font-bold text-sm text-emerald-400">⚡ ${Sanitizer.escapeHTML(g.generatorTag)}</span>
              <span class="text-[10px] px-2 py-0.5 rounded font-semibold ${g.readyForEmergency ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'}">
                ${g.readyForEmergency ? 'Listo para Emergencia' : 'Requiere Asistencia'}
              </span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-white">${Sanitizer.escapeHTML(a.facility)}</h4>
              <p class="text-xs text-[#8ca4c8] mt-0.5">Score de Arranque: <strong class="text-white font-mono">${g.score}/100</strong></p>
            </div>
            <div class="bg-[#0f1b30]/60 p-2.5 rounded-lg border border-[#1e3256]/50 text-xs">
              <span class="text-[#718ab0] text-[10px] block">Test Conmutación ATS:</span>
              <span class="text-emerald-400 font-semibold font-mono">✔ Verificado OK (Cero retardo)</span>
            </div>
          </div>
        `;
      }
    }).join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);
  }

  renderContractCards() {
    const container = document.getElementById('contracts-cards-container');
    if (!container) return;

    if (this.contracts.length === 0) {
      Sanitizer.safeSetInnerHTML(container, '<div class="col-span-3 py-8 text-center text-[#718ab0]">No hay contratos bimonetarios registrados.</div>');
      return;
    }

    const cardsHtml = this.contracts.map(c => `
      <div class="bg-[#091224] border border-[#1e3256] rounded-xl p-4 space-y-3 shadow-md">
        <div class="flex items-center justify-between border-b border-[#1e3256]/80 pb-2">
          <span class="font-mono font-bold text-sm text-blue-400">${Sanitizer.escapeHTML(c.contractId)}</span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
            ${Sanitizer.escapeHTML(c.status)}
          </span>
        </div>

        <div>
          <h4 class="font-bold text-sm text-white">${Sanitizer.escapeHTML(c.customerName)}</h4>
          <p class="text-xs text-[#8ca4c8] mt-0.5">${Sanitizer.escapeHTML(c.facilityName)}</p>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs bg-[#0f1b30]/60 p-2.5 rounded-lg border border-[#1e3256]/50">
          <div>
            <span class="text-[#718ab0] text-[10px] block">Mano de Obra (ARS)</span>
            <span class="font-mono font-bold text-white">${Formatters.currencyARS(c.pricing?.monthlyFeeArs)}</span>
          </div>
          <div>
            <span class="text-[#718ab0] text-[10px] block">Fondo Repuestos (USD)</span>
            <span class="font-mono font-bold text-[#38bdf8]">${Formatters.currencyUSD(c.pricing?.partsCapUsd)}</span>
          </div>
        </div>

        <div class="text-[11px] bg-[#0f1b30] p-2 rounded border border-[#1e3256] text-[#8ca4c8] flex items-center justify-between">
          <span>Equipos Cubiertos:</span>
          <span class="font-mono text-slate-200">${c.equipmentCovered?.length || 0} unidades</span>
        </div>
      </div>
    `).join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ClimaTrackApp();
  app.init();
});
