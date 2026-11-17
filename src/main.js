/**
 * ClimaTrack - Main Application Orchestrator
 * Frío Industrial, HVAC, Termodinámica P-T, Guardias 24/7 y Sello SHA-256
 */

import { GasRefrigerantEngine, REFRIGERANT_CATALOG } from './core/gasRefrigerantEngine.js';
import { SlaEmergencyDispatcher, SLA_TIERS } from './core/slaEmergencyDispatcher.js';
import { CompressorHealthScoring } from './core/compressorHealthScoring.js';
import { ServiceOrderService } from './services/serviceOrderService.js';
import { DualCurrencyContractService } from './services/dualCurrencyContractService.js';
import { ExportService } from './services/exportService.js';
import { ClimaTrackCacheService } from './services/climaTrackCache.service.js';
import { WhatsAppClimaNotifierService } from './services/whatsAppClimaNotifier.service.js';
import { Sanitizer } from './utils/sanitizer.js';
import { Formatters } from './utils/formatters.js';

const ICON_PIN = '<svg aria-hidden="true" class="w-3.5 h-3.5 shrink-0 text-[#94add1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const ICON_CHAT = '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>';
const ICON_CHECK = '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
const ICON_WARN = '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>';
const ICON_BOLT = '<svg aria-hidden="true" class="w-4 h-4 shrink-0 text-[#34d399]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';

class ClimaTrackApp {
  constructor() {
    this.orders = [];
    this.emergencies = [];
    this.assets = [];
    this.contracts = [];
    this.activeTab = 'emergencies';
    this.timerInterval = null;
    this.lastFocusedEl = null;
  }

  init() {
    this.loadOrSeedData();
    this.bindEvents();
    this.initNetworkMonitor();
    this.syncVersionLabel();
    this.updateThermodynamicsCalculator();
    this.renderAll();
    this.startLiveSlaTimer();
  }

  loadOrSeedData() {
    const cachedOrders = ClimaTrackCacheService.getOrders();
    const cachedTickets = ClimaTrackCacheService.getTickets();
    const cachedContracts = ClimaTrackCacheService.getContracts();
    const cachedAssets = ClimaTrackCacheService.getAssets();

    const hasCachedData =
      cachedOrders.length > 0 ||
      cachedTickets.length > 0 ||
      cachedContracts.length > 0 ||
      cachedAssets.length > 0;

    if (hasCachedData) {
      this.orders = cachedOrders;
      this.emergencies = cachedTickets;
      this.contracts = cachedContracts;
      this.assets = cachedAssets;
      return;
    }

    this.seedInitialDemoData();
  }

  seedInitialDemoData() {
    if (ClimaTrackCacheService.isPurged()) {
      return;
    }

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
      reportedAt: new Date(now - 35 * 60000).toISOString()
    });
    emg1.contactPhone = '+5493415000101';
    emg1.symptomDescription = 'Alarma por alta temperatura en cámara de congelados.';
    emg1.isDemo = true;

    const emg2 = SlaEmergencyDispatcher.createDispatchTicket({
      ticketId: 'EMG-VRF-02',
      facilityName: 'Torre Corporativa Nordlink',
      facilityAddress: 'Madres de Plaza 25 de Mayo 3020, Rosario',
      equipmentTag: 'VRF-PISO-8',
      severity: 'ALTA_VRF_CONFORT',
      chamberType: 'DATACENTER',
      targetTempCelsius: 21,
      currentTempCelsius: 29,
      reportedAt: new Date(now - 70 * 60000).toISOString()
    });
    emg2.contactPhone = '+5493415000202';
    emg2.symptomDescription = 'Caída de presión en unidad exterior VRF.';
    emg2.isDemo = true;

    this.emergencies.push(emg1, emg2);

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
    order1.isDemo = true;
    this.orders.push(order1);

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
      ratedLoadAmpsRLA: 30.0,
      oilAcidityLevel: 'ACIDO_LEVE',
      vibrationState: 'VIBRACION_MODERADA',
      filterDrierDeltaPsi: 2.8,
      startsPerHour: 9
    });

    const backupGen = CompressorHealthScoring.evaluateBackupPower({
      generatorTag: 'GEN-CUMMINS-150KVA',
      fuelLevelPercentage: 85,
      batteryVoltageVolts: 26.8,
      atsAutomaticTransferPassed: true
    });

    this.assets.push(
      { type: 'COMPRESSOR', data: asset1, facility: 'Frigorífico Paladini', isDemo: true },
      { type: 'COMPRESSOR', data: asset2, facility: 'Torre Nordlink', isDemo: true },
      { type: 'GENERATOR', data: backupGen, facility: 'Frigorífico Paladini (Generador Respaldo)', isDemo: true }
    );

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
    c1.isDemo = true;

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
    c2.isDemo = true;

    this.contracts.push(c1, c2);
    this.persistAll();
  }

  persistAll() {
    ClimaTrackCacheService.saveOrders(this.orders);
    ClimaTrackCacheService.saveTickets(this.emergencies);
    ClimaTrackCacheService.saveContracts(this.contracts);
    ClimaTrackCacheService.saveAssets(this.assets);
  }

  initNetworkMonitor() {
    const updateStatus = () => {
      const badge = document.getElementById('network-badge');
      if (!badge) return;
      const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
      if (isOnline) {
        badge.textContent = 'En línea';
        badge.className = 'text-xs font-mono px-2.5 py-0.5 rounded bg-[#0b291d] text-[#34d399] border border-[#14523b] font-semibold';
      } else {
        badge.textContent = 'Sin conexión (Local)';
        badge.className = 'text-xs font-mono px-2.5 py-0.5 rounded bg-[#291f0b] text-[#fbbf24] border border-[#664d14] font-semibold';
      }
    };

    updateStatus();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        updateStatus();
        this.showToast('Conexión restablecida.', 'success');
      });
      window.addEventListener('offline', () => {
        updateStatus();
        this.showToast('Modo sin conexión activo. Los cambios se guardan en caché local.', 'warning');
      });
    }
  }

  syncVersionLabel() {
    if (typeof fetch !== 'function') return;
    fetch('./version.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const el = document.getElementById('app-version-label');
        if (el && data?.version) {
          el.textContent = `Versión ${data.version}`;
        }
      })
      .catch(() => {
        // Offline fallback conserva versión impresa en el DOM
      });
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

    // Modal triggers & close buttons
    document.getElementById('btn-new-emergency')?.addEventListener('click', (e) => this.openModal('modal-new-emergency', 'inp-emg-facility', e.currentTarget));
    document.getElementById('btn-trigger-emergency')?.addEventListener('click', (e) => this.openModal('modal-new-emergency', 'inp-emg-facility', e.currentTarget));
    document.getElementById('btn-close-emergency-modal')?.addEventListener('click', () => this.closeModal('modal-new-emergency'));
    document.getElementById('btn-cancel-emergency')?.addEventListener('click', () => this.closeModal('modal-new-emergency'));

    document.getElementById('btn-new-order')?.addEventListener('click', (e) => this.openModal('modal-new-order', 'inp-ord-customer', e.currentTarget));
    document.getElementById('btn-close-order-modal')?.addEventListener('click', () => this.closeModal('modal-new-order'));
    document.getElementById('btn-cancel-order')?.addEventListener('click', () => this.closeModal('modal-new-order'));

    document.getElementById('btn-close-resolve-modal')?.addEventListener('click', () => this.closeModal('modal-resolve-emergency'));
    document.getElementById('btn-cancel-resolve')?.addEventListener('click', () => this.closeModal('modal-resolve-emergency'));

    document.getElementById('btn-new-contract-modal')?.addEventListener('click', (e) => this.openModal('modal-new-contract', 'inp-ctr-customer', e.currentTarget));
    document.getElementById('btn-close-contract-modal')?.addEventListener('click', () => this.closeModal('modal-new-contract'));
    document.getElementById('btn-cancel-contract')?.addEventListener('click', () => this.closeModal('modal-new-contract'));

    document.getElementById('btn-close-wa-modal')?.addEventListener('click', () => this.closeModal('modal-whatsapp-dispatch'));
    document.getElementById('btn-cancel-wa')?.addEventListener('click', () => this.closeModal('modal-whatsapp-dispatch'));

    document.getElementById('btn-purge-demo')?.addEventListener('click', (e) => this.openModal('modal-confirm-purge', 'btn-confirm-purge', e.currentTarget));
    document.getElementById('btn-close-purge-modal')?.addEventListener('click', () => this.closeModal('modal-confirm-purge'));
    document.getElementById('btn-cancel-purge')?.addEventListener('click', () => this.closeModal('modal-confirm-purge'));
    document.getElementById('btn-confirm-purge')?.addEventListener('click', () => this.handlePurgeDemo());

    // Form Submissions
    document.getElementById('form-create-emergency')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateEmergency();
    });

    document.getElementById('form-create-order')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateOrder();
    });

    document.getElementById('form-resolve-emergency')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleResolveEmergencySubmit();
    });

    document.getElementById('form-create-contract')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateContract();
    });

    document.getElementById('form-whatsapp-dispatch')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleWhatsAppSubmit();
    });

    // Export CSV
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      if (this.orders.length === 0) {
        this.showToast('No hay órdenes registradas para exportar.', 'warning');
        return;
      }
      const csv = ExportService.generateOrdersCsv(this.orders);
      ExportService.downloadCsv(csv, 'climatrack_ordenes_frio.csv');
      this.showToast(`CSV exportado (${this.orders.length} órdenes).`, 'success');
    });

    // Backdrop click & Escape key closing for all modals
    document.querySelectorAll('[role="dialog"]').forEach((dialog) => {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          this.closeModal(dialog.id);
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openDialog = Array.from(document.querySelectorAll('[role="dialog"]')).find(
          (el) => !el.classList.contains('hidden')
        );
        if (openDialog) {
          this.closeModal(openDialog.id);
        }
      }
    });
  }

  openModal(modalId, focusTargetId, triggerEl = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    this.lastFocusedEl = triggerEl || document.activeElement;
    modal.querySelectorAll('[role="alert"]').forEach((el) => {
      el.classList.add('hidden');
      el.textContent = '';
    });
    modal.classList.remove('hidden');
    if (focusTargetId) {
      document.getElementById(focusTargetId)?.focus();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    if (this.lastFocusedEl && typeof this.lastFocusedEl.focus === 'function') {
      this.lastFocusedEl.focus();
      this.lastFocusedEl = null;
    }
  }

  setFormError(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!message) {
      el.classList.add('hidden');
      el.textContent = '';
      return;
    }
    el.textContent = message;
    el.classList.remove('hidden');
  }

  showToast(message, tone = 'info') {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const toneClasses = {
      success: 'bg-[#0b291d] border-[#14523b] text-[#34d399]',
      warning: 'bg-[#291f0b] border-[#664d14] text-[#fbbf24]',
      error: 'bg-[#29131a] border-[#541f2d] text-[#fda4af]',
      info: 'bg-[#0f1b30] border-[#1e3256] text-[#f0f6ff]'
    };
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto border rounded-lg px-4 py-3 text-xs font-semibold shadow-lg ${toneClasses[tone] || toneClasses.info}`;
    toast.textContent = String(message);
    region.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
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
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      if (isTarget) {
        btn.classList.add('text-[#fda4af]', 'bg-[#29131a]', 'font-bold');
        btn.classList.remove('text-[#c5d7ed]', 'font-medium');
      } else {
        btn.classList.remove('text-[#fda4af]', 'bg-[#29131a]', 'font-bold');
        btn.classList.add('text-[#c5d7ed]', 'font-medium');
      }
    });

    this.renderAll();
  }

  startLiveSlaTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.renderEmergencyCards();
    }, 15000);
  }

  updateThermodynamicsCalculator() {
    const gasType = document.getElementById('calc-gas-type')?.value || 'R404A';
    const rawSuctionPsi = document.getElementById('inp-suction-psi')?.value ?? '';
    const rawSuctionTemp = document.getElementById('inp-suction-temp')?.value ?? '';
    const rawDischargePsi = document.getElementById('inp-discharge-psi')?.value ?? '';
    const rawLiquidTemp = document.getElementById('inp-liquid-temp')?.value ?? '';

    const suctionPsi = Number(rawSuctionPsi);
    const suctionTemp = Number(rawSuctionTemp);
    const dischargePsi = Number(rawDischargePsi);
    const liquidTemp = Number(rawLiquidTemp);

    const errBanner = document.getElementById('calc-error-banner');
    const isEmpty = [rawSuctionPsi, rawSuctionTemp, rawDischargePsi, rawLiquidTemp].some((v) => String(v).trim() === '');
    const hasInvalidNum = [suctionPsi, suctionTemp, dischargePsi, liquidTemp].some((n) => !Number.isFinite(n));
    const outOfPressureRange = suctionPsi < 0 || suctionPsi > 650 || dischargePsi < 0 || dischargePsi > 650;

    if (!REFRIGERANT_CATALOG[gasType] || isEmpty || hasInvalidNum || outOfPressureRange) {
      if (errBanner) {
        errBanner.textContent = outOfPressureRange
          ? 'Las presiones manométricas deben estar entre 0 y 650 PSI.'
          : 'Complete los cuatro campos numéricos con valores válidos para calcular Superheat y Subcooling.';
        errBanner.classList.remove('hidden');
      }
      const summaryEl = document.getElementById('calc-pt-summary');
      if (summaryEl) summaryEl.textContent = 'T. Evap Sat: - °C | T. Cond Sat: - °C';
      const shValEl = document.getElementById('disp-superheat-val');
      if (shValEl) shValEl.textContent = '- °C';
      const scValEl = document.getElementById('disp-subcooling-val');
      if (scValEl) scValEl.textContent = '- °C';
      const diagTitle = document.getElementById('disp-diagnosis-title');
      if (diagTitle) diagTitle.textContent = 'Diagnóstico: Datos incompletos o fuera de rango';
      const diagDesc = document.getElementById('disp-diagnosis-desc');
      if (diagDesc) diagDesc.textContent = 'Corrija las lecturas ingresadas para obtener el diagnóstico del circuito.';
      return;
    }

    if (errBanner) {
      errBanner.classList.add('hidden');
      errBanner.textContent = '';
    }

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
      summaryEl.textContent = `T. Evap Sat: ${sh.saturationEvapTempCelsius} °C | T. Cond Sat: ${sc.saturationCondTempCelsius} °C`;
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

  handleCreateEmergency() {
    const facility = document.getElementById('inp-emg-facility')?.value.trim() || '';
    const address = document.getElementById('inp-emg-address')?.value.trim() || '';
    const equip = document.getElementById('inp-emg-chamber')?.value.trim() || '';
    const severity = document.getElementById('inp-emg-severity')?.value || 'CRITICA_ROTURA_FRIO';
    const rawTarget = document.getElementById('inp-emg-target-temp')?.value ?? '';
    const rawCurrent = document.getElementById('inp-emg-current-temp')?.value ?? '';
    const phone = document.getElementById('inp-emg-phone')?.value.trim() || '';
    const symptom = document.getElementById('inp-emg-desc')?.value.trim() || '';

    const targetTemp = Number(rawTarget);
    const currentTemp = Number(rawCurrent);

    if (!facility || !address || !equip || !symptom) {
      this.setFormError('err-emergency-form', 'Complete planta, dirección, cámara/equipo y síntoma reportado.');
      return;
    }

    if (!SLA_TIERS[severity]) {
      this.setFormError('err-emergency-form', 'Seleccione una severidad SLA válida.');
      return;
    }

    if (String(rawTarget).trim() === '' || String(rawCurrent).trim() === '' || !Number.isFinite(targetTemp) || !Number.isFinite(currentTemp)) {
      this.setFormError('err-emergency-form', 'Ingrese temperaturas numéricas válidas (consigna y actual).');
      return;
    }

    if (phone.replace(/\D/g, '').length < 8) {
      this.setFormError('err-emergency-form', 'Ingrese un número de WhatsApp válido (mínimo 8 dígitos en formato E.164).');
      return;
    }

    const ticket = SlaEmergencyDispatcher.createDispatchTicket({
      facilityName: facility,
      facilityAddress: address,
      equipmentTag: equip,
      severity,
      targetTempCelsius: targetTemp,
      currentTempCelsius: currentTemp
    });
    ticket.contactPhone = phone;
    ticket.symptomDescription = symptom;
    ticket.isDemo = false;

    this.emergencies.unshift(ticket);
    this.persistAll();
    document.getElementById('form-create-emergency')?.reset();
    this.closeModal('modal-new-emergency');
    this.renderAll();
    this.showToast(`Guardia ${ticket.ticketId} despachada (${ticket.slaMaxMinutes} min SLA).`, 'success');
  }

  handleCreateOrder() {
    const customer = document.getElementById('inp-ord-customer')?.value.trim() || '';
    const facility = document.getElementById('inp-ord-facility')?.value.trim() || '';
    const equip = document.getElementById('inp-ord-equip')?.value.trim() || '';
    const gas = document.getElementById('inp-ord-gas')?.value || 'R404A';
    const suctionPsi = Number(document.getElementById('inp-ord-suction-psi')?.value);
    const suctionTemp = Number(document.getElementById('inp-ord-suction-temp')?.value);
    const dischargePsi = Number(document.getElementById('inp-ord-discharge-psi')?.value);
    const liquidTemp = Number(document.getElementById('inp-ord-liquid-temp')?.value);
    const amps = Number(document.getElementById('inp-ord-amps')?.value);
    const gasKg = Number(document.getElementById('inp-ord-gas-kg')?.value);
    const laborArs = Number(document.getElementById('inp-ord-labor-ars')?.value);
    const partsUsd = Number(document.getElementById('inp-ord-parts-usd')?.value);
    const exchangeRate = Number(document.getElementById('inp-ord-rate')?.value);

    if (!customer || !facility || !equip) {
      this.setFormError('err-order-form', 'Complete cliente, planta y tag del equipo.');
      return;
    }

    const nums = [suctionPsi, suctionTemp, dischargePsi, liquidTemp, amps, gasKg, laborArs, partsUsd, exchangeRate];
    if (nums.some((n) => !Number.isFinite(n)) || suctionPsi < 0 || dischargePsi < 0 || amps < 0 || gasKg < 0 || laborArs < 0 || partsUsd < 0 || exchangeRate <= 0) {
      this.setFormError('err-order-form', 'Verifique que las mediciones e importes sean números válidos positivos.');
      return;
    }

    const newOrder = ServiceOrderService.createOrder({
      customerId: `CLI-${Date.now().toString(36).toUpperCase()}`,
      customerName: customer,
      facilityName: facility,
      equipmentTag: equip,
      gasType: gas,
      measurements: {
        suctionPressurePsi: suctionPsi,
        suctionTempCelsius: suctionTemp,
        dischargePressurePsi: dischargePsi,
        liquidLineTempCelsius: liquidTemp,
        motorCurrentAmps: amps
      },
      gasChargedKg: gasKg,
      pricing: { laborArs, partsUsd, exchangeRate }
    });
    newOrder.isDemo = false;

    this.orders.unshift(newOrder);
    this.persistAll();
    document.getElementById('form-create-order')?.reset();
    this.closeModal('modal-new-order');
    this.renderAll();
    this.showToast(`Orden ${newOrder.orderId} registrada en caché local.`, 'success');
  }

  openResolveModal(ticketId, triggerEl) {
    const emg = this.emergencies.find(t => t.ticketId === ticketId);
    if (!emg) return;
    const idInput = document.getElementById('inp-resolve-ticket-id');
    if (idInput) idInput.value = ticketId;
    const summaryEl = document.getElementById('resolve-ticket-summary');
    if (summaryEl) {
      summaryEl.textContent = `${emg.ticketId} | ${emg.facilityName} | Equipo ${emg.equipmentTag}`;
    }
    this.openModal('modal-resolve-emergency', 'inp-res-suction-psi', triggerEl);
  }

  handleResolveEmergencySubmit() {
    const ticketId = document.getElementById('inp-resolve-ticket-id')?.value || '';
    const emg = this.emergencies.find(t => t.ticketId === ticketId);
    if (!emg) {
      this.setFormError('err-resolve-form', 'No se encontró la guardia seleccionada.');
      return;
    }

    const gasType = document.getElementById('inp-res-gas')?.value || 'R404A';
    const suctionPsi = Number(document.getElementById('inp-res-suction-psi')?.value);
    const suctionTemp = Number(document.getElementById('inp-res-suction-temp')?.value);
    const dischargePsi = Number(document.getElementById('inp-res-discharge-psi')?.value);
    const liquidTemp = Number(document.getElementById('inp-res-liquid-temp')?.value);
    const gasKg = Number(document.getElementById('inp-res-gas-kg')?.value);
    const amps = Number(document.getElementById('inp-res-amps')?.value);
    const laborArs = Number(document.getElementById('inp-res-labor-ars')?.value);
    const partsUsd = Number(document.getElementById('inp-res-parts-usd')?.value);
    const techName = document.getElementById('inp-res-tech-name')?.value.trim() || '';
    const techSig = document.getElementById('inp-res-tech-sig')?.value.trim() || '';
    const supervisorName = document.getElementById('inp-res-supervisor-name')?.value.trim() || '';
    const clientSig = document.getElementById('inp-res-client-sig')?.value.trim() || '';

    const nums = [suctionPsi, suctionTemp, dischargePsi, liquidTemp, gasKg, amps, laborArs, partsUsd];
    if (nums.some((n) => !Number.isFinite(n)) || suctionPsi < 0 || dischargePsi < 0 || gasKg < 0 || amps < 0 || laborArs < 0 || partsUsd < 0) {
      this.setFormError('err-resolve-form', 'Todas las mediciones e importes deben ser valores numéricos válidos.');
      return;
    }

    if (!techName || !techSig || !supervisorName || !clientSig) {
      this.setFormError('err-resolve-form', 'Se requieren los datos y firmas reales del técnico y del responsable de planta para emitir el sello SHA-256.');
      return;
    }

    emg.status = 'RESUELTO_CONFORME';
    emg.closureTime = new Date().toISOString();

    const newOrder = ServiceOrderService.createOrder({
      customerId: `CLI-${emg.ticketId}`,
      customerName: emg.facilityName,
      facilityName: emg.facilityName,
      facilityAddress: emg.facilityAddress,
      equipmentTag: emg.equipmentTag,
      orderType: emg.severity,
      technicianName: techName,
      gasType,
      measurements: {
        suctionPressurePsi: suctionPsi,
        suctionTempCelsius: suctionTemp,
        dischargePressurePsi: dischargePsi,
        liquidLineTempCelsius: liquidTemp,
        motorCurrentAmps: amps
      },
      gasChargedKg: gasKg,
      pricing: { laborArs, partsUsd, exchangeRate: 1250 }
    });

    const sealed = ServiceOrderService.sealOrder(newOrder, {
      technicianSignature: techSig,
      clientSignature: clientSig,
      clientSupervisorName: supervisorName
    });
    sealed.isDemo = false;

    this.orders.unshift(sealed);
    this.persistAll();
    document.getElementById('form-resolve-emergency')?.reset();
    this.closeModal('modal-resolve-emergency');
    this.renderAll();
    this.showToast(`Guardia cerrada y sellada (${sealed.cryptoSeal.slice(0, 12)}...).`, 'success');
  }

  openWhatsAppModal(ticketId, triggerEl) {
    const emg = this.emergencies.find(t => t.ticketId === ticketId);
    if (!emg) return;
    const idInput = document.getElementById('inp-wa-ticket-id');
    if (idInput) idInput.value = ticketId;
    const phoneInput = document.getElementById('inp-wa-phone');
    if (phoneInput) phoneInput.value = emg.contactPhone || '';
    const summaryEl = document.getElementById('wa-ticket-summary');
    if (summaryEl) {
      summaryEl.textContent = `${emg.facilityName} (${emg.equipmentTag})${emg.isDemo ? ' [DEMO]' : ''}`;
    }
    this.openModal('modal-whatsapp-dispatch', 'inp-wa-phone', triggerEl);
  }

  handleWhatsAppSubmit() {
    const ticketId = document.getElementById('inp-wa-ticket-id')?.value || '';
    const phone = document.getElementById('inp-wa-phone')?.value.trim() || '';
    const emg = this.emergencies.find(t => t.ticketId === ticketId);
    if (!emg) return;

    if (phone.replace(/\D/g, '').length < 8) {
      this.setFormError('err-wa-form', 'Ingrese un teléfono válido con código de país (ej: +5493415000101).');
      return;
    }

    emg.contactPhone = phone;
    this.persistAll();

    const sla = SlaEmergencyDispatcher.evaluateSlaStatus(emg);
    const url = WhatsAppClimaNotifierService.notifyEmergencyDispatch({
      phone,
      facilityName: emg.facilityName,
      equipmentTag: emg.equipmentTag,
      severity: emg.severity,
      targetTemp: emg.targetTempCelsius,
      currentTemp: emg.currentTempCelsius,
      remainingMinutes: sla.remainingMinutes
    });

    this.closeModal('modal-whatsapp-dispatch');
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  handleCreateContract() {
    const customer = document.getElementById('inp-ctr-customer')?.value.trim() || '';
    const facility = document.getElementById('inp-ctr-facility')?.value.trim() || '';
    const equipRaw = document.getElementById('inp-ctr-equipment')?.value.trim() || '';
    const feeArs = Number(document.getElementById('inp-ctr-fee-ars')?.value);
    const partsUsd = Number(document.getElementById('inp-ctr-parts-usd')?.value);
    const rate = Number(document.getElementById('inp-ctr-rate')?.value);
    const slaTier = document.getElementById('inp-ctr-sla')?.value || 'CRITICA_ROTURA_FRIO';

    if (!customer || !facility) {
      this.setFormError('err-contract-form', 'Complete la razón social y el nombre de la planta o edificio.');
      return;
    }

    if (!Number.isFinite(feeArs) || !Number.isFinite(partsUsd) || !Number.isFinite(rate) || feeArs < 0 || partsUsd < 0 || rate <= 0) {
      this.setFormError('err-contract-form', 'Ingrese valores monetarios y tipo de cambio válidos.');
      return;
    }

    const equipmentCovered = equipRaw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const newContract = DualCurrencyContractService.createContract({
      customerName: customer,
      facilityName: facility,
      equipmentCovered,
      monthlyFeeArs: feeArs,
      partsCapUsd: partsUsd,
      exchangeRateUsd: rate,
      slaTier
    });
    newContract.isDemo = false;

    this.contracts.unshift(newContract);
    this.persistAll();
    document.getElementById('form-create-contract')?.reset();
    this.closeModal('modal-new-contract');
    this.renderAll();
    this.showToast(`Abono ${newContract.contractId} creado.`, 'success');
  }

  handlePurgeDemo() {
    this.orders = this.orders.filter(o => !o.isDemo);
    this.emergencies = this.emergencies.filter(e => !e.isDemo);
    this.assets = this.assets.filter(a => !a.isDemo);
    this.contracts = this.contracts.filter(c => !c.isDemo);

    ClimaTrackCacheService.purgeData();
    if (this.orders.length > 0 || this.emergencies.length > 0 || this.contracts.length > 0 || this.assets.length > 0) {
      this.persistAll();
    }

    this.closeModal('modal-confirm-purge');
    this.renderAll();
    this.showToast('Registros de demostración eliminados y resiembra bloqueada.', 'success');
  }

  renderAll() {
    this.updatePurgeButtonVisibility();
    this.renderMetrics();
    this.renderDashboardTable();
    this.renderEmergencyCards();
    this.renderAssetCards();
    this.renderContractCards();
  }

  updatePurgeButtonVisibility() {
    const btn = document.getElementById('btn-purge-demo');
    if (!btn) return;
    const hasDemo =
      this.orders.some(o => o.isDemo) ||
      this.emergencies.some(e => e.isDemo) ||
      this.assets.some(a => a.isDemo) ||
      this.contracts.some(c => c.isDemo);
    btn.classList.toggle('hidden', !hasDemo);
  }

  renderMetrics() {
    const activeEmg = this.emergencies.filter(e => e.status !== 'RESUELTO_CONFORME').length;
    const totalGas = this.orders.reduce((sum, o) => sum + (o.gasChargedKg || 0), 0);

    const assetScores = this.assets
      .map(a => a.type === 'COMPRESSOR' ? a.data.healthScore : a.data.score)
      .filter(s => typeof s === 'number');
    const avgScore = assetScores.length > 0
      ? Math.round(assetScores.reduce((a, b) => a + b, 0) / assetScores.length)
      : 0;

    const elEmg = document.getElementById('metric-active-emergencies');
    if (elEmg) elEmg.textContent = String(activeEmg);

    const elGas = document.getElementById('metric-total-gas-kg');
    if (elGas) elGas.textContent = totalGas.toFixed(1);

    const elHealth = document.getElementById('metric-avg-health');
    if (elHealth) elHealth.textContent = assetScores.length > 0 ? String(avgScore) : '-';

    const elContracts = document.getElementById('metric-active-contracts');
    if (elContracts) elContracts.textContent = String(this.contracts.length);
  }

  renderDashboardTable() {
    const tbody = document.getElementById('dashboard-orders-tbody');
    if (!tbody) return;

    const storageLabel = document.getElementById('orders-storage-label');
    if (storageLabel) {
      storageLabel.textContent = `Caché local (${this.orders.length} partes)`;
    }

    if (this.orders.length === 0) {
      Sanitizer.safeSetInnerHTML(
        tbody,
        '<tr><td colspan="8" class="py-8 text-center text-xs text-[#94add1]">No hay partes de servicio registrados. Use "Nueva Orden" para cargar una intervención.</td></tr>'
      );
      return;
    }

    const rowsHtml = this.orders.map(o => {
      const badge = Formatters.slaBadge(o.orderType, o.status);
      const sealPreview = o.cryptoSeal ? `${o.cryptoSeal.slice(0, 12)}...` : 'Pendiente';
      const demoTag = o.isDemo ? '<span class="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-[#14233c] text-[#94add1] text-xs font-mono">[DEMO]</span>' : '';
      return `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-3 pr-3 font-mono font-bold text-[#38bdf8]">${Sanitizer.escapeHTML(o.orderId)}${demoTag}</td>
          <td class="py-3 pr-3 font-medium text-[#f0f6ff]">${Sanitizer.escapeHTML(o.facilityName)}</td>
          <td class="py-3 pr-3 font-mono text-[#c5d7ed] text-xs">${Sanitizer.escapeHTML(o.equipmentTag)}</td>
          <td class="py-3 pr-3 font-mono font-semibold text-[#38bdf8]">${Sanitizer.escapeHTML(o.gasType)}</td>
          <td class="py-3 pr-3 font-mono text-[#c5d7ed]">${Formatters.temperature(o.thermodynamics?.superheat?.superheatCelsius)}</td>
          <td class="py-3 pr-3 font-mono text-[#c5d7ed]">${Formatters.temperature(o.thermodynamics?.subcooling?.subcoolingCelsius)}</td>
          <td class="py-3 pr-3"><span class="${badge.badgeClass}">${Sanitizer.escapeHTML(badge.label)}</span></td>
          <td class="py-3 font-mono text-xs text-[#34d399]">${Sanitizer.escapeHTML(sealPreview)}</td>
        </tr>
      `;
    }).join('');

    Sanitizer.safeSetInnerHTML(tbody, rowsHtml);
  }

  renderEmergencyCards() {
    const container = document.getElementById('emergencies-cards-container');
    if (!container) return;

    if (this.emergencies.length === 0) {
      Sanitizer.safeSetInnerHTML(
        container,
        '<div class="col-span-full bg-[#0f1b30] border border-[#1e3256] rounded-xl p-8 text-center text-xs text-[#94add1]">No hay guardias de emergencia activas. Cadena de frío sin alertas pendientes.</div>'
      );
      return;
    }

    const cardsHtml = this.emergencies.map(e => {
      const sla = SlaEmergencyDispatcher.evaluateSlaStatus(e);
      const isResolved = e.status === 'RESUELTO_CONFORME';
      const demoTag = e.isDemo ? '<span class="px-2 py-0.5 rounded bg-[#14233c] text-[#94add1] text-xs font-mono">[DEMO]</span>' : '';

      let timeColorClass = 'text-[#34d399]';
      if (sla.isBreached && !isResolved) {
        timeColorClass = 'text-[#fb7185]';
      } else if (sla.remainingMinutes <= 30 && !isResolved) {
        timeColorClass = 'text-[#fb7185]';
      } else if (sla.remainingMinutes <= 60 && !isResolved) {
        timeColorClass = 'text-[#fbbf24]';
      }

      return `
        <article class="print-surface bg-[#0f1b30] border ${sla.isBreached && !isResolved ? 'border-[#881337]' : 'border-[#1e3256]'} rounded-xl p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e3256] pb-2.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono font-bold text-sm text-[#fb7185]">${Sanitizer.escapeHTML(e.ticketId)}</span>
              ${demoTag}
              <span class="text-xs px-2 py-0.5 rounded font-semibold ${sla.isBreached && !isResolved ? 'bg-[#29131a] text-[#fda4af] border border-[#541f2d]' : 'bg-[#14233c] text-[#c5d7ed]'}">
                ${Sanitizer.escapeHTML(sla.urgencyState.replace(/_/g, ' '))}
              </span>
            </div>
            <span class="font-mono font-bold text-xs tabular-nums ${timeColorClass}">
              ${isResolved ? 'CERRADO' : (sla.isBreached ? `VENCIDO (${Math.abs(sla.remainingMinutes)}m)` : `${sla.remainingMinutes}m restantes`)}
            </span>
          </div>

          <div>
            <h3 class="font-bold text-base text-[#f0f6ff]">${Sanitizer.escapeHTML(e.facilityName)}</h3>
            <p class="text-xs text-[#c5d7ed] flex items-center gap-1.5 mt-1">
              ${ICON_PIN} <span>${Sanitizer.escapeHTML(e.facilityAddress)}</span>
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-[#1e3256] pt-3">
            <div>
              <span class="text-[#94add1] text-xs block">Cámara / Equipo</span>
              <span class="font-mono font-bold text-[#38bdf8]">${Sanitizer.escapeHTML(e.equipmentTag)}</span>
            </div>
            <div>
              <span class="text-[#94add1] text-xs block">Desvío Térmico</span>
              <span class="font-mono font-bold text-[#fb7185] tabular-nums">
                ${Formatters.temperature(e.currentTempCelsius)} / Obj ${Formatters.temperature(e.targetTempCelsius)}
              </span>
            </div>
          </div>

          ${sla.estimatedPenaltyArs > 0 && !isResolved ? `
            <div class="text-xs text-[#fda4af] border-t border-[#541f2d] pt-2.5 flex items-center justify-between gap-2">
              <span>Penalidad SLA acumulada:</span>
              <span class="font-mono font-bold tabular-nums">${Formatters.currencyARS(sla.estimatedPenaltyArs)}</span>
            </div>
          ` : ''}

          <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1e3256]">
            <button type="button" class="btn-wa-dispatch touch-target px-3 py-2 rounded-lg bg-[#14233c] hover:bg-[#1a2f52] text-[#d6e4f7] text-xs font-semibold border border-[#233b63] flex items-center gap-1.5" data-ticket-id="${Sanitizer.escapeHTML(e.ticketId)}">
              ${ICON_CHAT} <span>Aviso WhatsApp</span>
            </button>

            ${!isResolved ? `
              <button type="button" class="btn-resolve-sla touch-target px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5" data-ticket-id="${Sanitizer.escapeHTML(e.ticketId)}">
                ${ICON_CHECK} <span>Confirmar y Sellar</span>
              </button>
            ` : `
              <span class="text-xs font-semibold text-[#34d399] flex items-center gap-1.5">
                ${ICON_CHECK} <span>Servicio Resuelto</span>
              </span>
            `}
          </div>
        </article>
      `;
    }).join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);

    container.querySelectorAll('.btn-resolve-sla').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-ticket-id');
        this.openResolveModal(id, e.currentTarget);
      });
    });

    container.querySelectorAll('.btn-wa-dispatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-ticket-id');
        this.openWhatsAppModal(id, e.currentTarget);
      });
    });
  }

  renderAssetCards() {
    const container = document.getElementById('assets-cards-container');
    if (!container) return;

    if (this.assets.length === 0) {
      Sanitizer.safeSetInnerHTML(
        container,
        '<div class="col-span-full bg-[#0f1b30] border border-[#1e3256] rounded-xl p-8 text-center text-xs text-[#94add1]">No hay compresores ni generadores de respaldo registrados en caché local.</div>'
      );
      return;
    }

    const cardsHtml = this.assets.map(a => {
      const demoTag = a.isDemo ? '<span class="px-2 py-0.5 rounded bg-[#14233c] text-[#94add1] text-xs font-mono">[DEMO]</span>' : '';
      if (a.type === 'COMPRESSOR') {
        const d = a.data;
        const badge = Formatters.healthBadge(d.healthScore);
        return `
          <article class="print-surface bg-[#0f1b30] border border-[#1e3256] rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e3256] pb-2.5">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-sm text-[#38bdf8]">${Sanitizer.escapeHTML(d.equipmentTag)}</span>
                ${demoTag}
              </div>
              <span class="${badge.badgeClass}">${Sanitizer.escapeHTML(badge.label)} (${d.healthScore}/100)</span>
            </div>
            <div>
              <h2 class="font-bold text-base text-[#f0f6ff]">${Sanitizer.escapeHTML(a.facility)}</h2>
              <p class="text-xs text-[#94add1] mt-0.5">Modelo: ${Sanitizer.escapeHTML(d.model)}</p>
            </div>
            <div class="border-t border-[#1e3256] pt-3 text-xs space-y-1">
              <span class="text-[#94add1] block font-semibold">Diagnóstico Predictivo:</span>
              <p class="text-[#c5d7ed]">${Sanitizer.escapeHTML(d.recommendation)}</p>
            </div>
            ${d.deductions?.length > 0 ? `
              <div class="border-t border-[#1e3256] pt-2.5 text-xs text-[#fbbf24] flex items-start gap-1.5">
                ${ICON_WARN}
                <span>${Sanitizer.escapeHTML(d.deductions[0])}</span>
              </div>
            ` : ''}
          </article>
        `;
      } else {
        const g = a.data;
        const atsKnown = typeof g.atsAutomaticTransferPassed === 'boolean';
        const atsText = !atsKnown
          ? 'Sin verificación ATS registrada'
          : (g.atsAutomaticTransferPassed ? 'Transferencia ATS verificada' : 'Falla en transferencia ATS');
        const atsClass = !atsKnown
          ? 'text-[#94add1]'
          : (g.atsAutomaticTransferPassed ? 'text-[#34d399]' : 'text-[#fb7185]');
        return `
          <article class="print-surface bg-[#0f1b30] border border-[#1e3256] rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e3256] pb-2.5">
              <div class="flex items-center gap-2">
                ${ICON_BOLT}
                <span class="font-mono font-bold text-sm text-[#34d399]">${Sanitizer.escapeHTML(g.generatorTag)}</span>
                ${demoTag}
              </div>
              <span class="text-xs px-2.5 py-0.5 rounded font-semibold ${g.readyForEmergency ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}">
                ${g.readyForEmergency ? 'Listo para Emergencia' : 'Requiere Asistencia'}
              </span>
            </div>
            <div>
              <h2 class="font-bold text-base text-[#f0f6ff]">${Sanitizer.escapeHTML(a.facility)}</h2>
              <p class="text-xs text-[#c5d7ed] mt-0.5">Score de Arranque: <strong class="text-[#f0f6ff] font-mono tabular-nums">${g.score}/100</strong></p>
            </div>
            <div class="border-t border-[#1e3256] pt-3 text-xs space-y-1">
              <span class="text-[#94add1] block">Test Conmutación ATS:</span>
              <span class="${atsClass} font-semibold font-mono">${Sanitizer.escapeHTML(atsText)}</span>
            </div>
          </article>
        `;
      }
    }).join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);
  }

  renderContractCards() {
    const container = document.getElementById('contracts-cards-container');
    if (!container) return;

    if (this.contracts.length === 0) {
      Sanitizer.safeSetInnerHTML(
        container,
        '<div class="col-span-full bg-[#0f1b30] border border-[#1e3256] rounded-xl p-8 text-center text-xs text-[#94add1]">No hay contratos bimonetarios registrados. Use "Nuevo Abono Bimonetario" para agregar uno.</div>'
      );
      return;
    }

    const cardsHtml = this.contracts.map(c => {
      const demoTag = c.isDemo ? '<span class="px-2 py-0.5 rounded bg-[#14233c] text-[#94add1] text-xs font-mono">[DEMO]</span>' : '';
      return `
        <article class="print-surface bg-[#0f1b30] border border-[#1e3256] rounded-xl p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e3256] pb-2.5">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sm text-[#60a5fa]">${Sanitizer.escapeHTML(c.contractId)}</span>
              ${demoTag}
            </div>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
              ${Sanitizer.escapeHTML(c.status)}
            </span>
          </div>

          <div>
            <h2 class="font-bold text-base text-[#f0f6ff]">${Sanitizer.escapeHTML(c.customerName)}</h2>
            <p class="text-xs text-[#94add1] mt-0.5">${Sanitizer.escapeHTML(c.facilityName)}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-[#1e3256] pt-3">
            <div>
              <span class="text-[#94add1] block">Mano de Obra (ARS)</span>
              <span class="font-mono font-bold text-[#f0f6ff] tabular-nums">${Formatters.currencyARS(c.pricing?.monthlyFeeArs)}</span>
            </div>
            <div>
              <span class="text-[#94add1] block">Fondo Repuestos (USD)</span>
              <span class="font-mono font-bold text-[#38bdf8] tabular-nums">${Formatters.currencyUSD(c.pricing?.partsCapUsd)}</span>
            </div>
          </div>

          <div class="text-xs border-t border-[#1e3256] pt-2.5 text-[#94add1] flex items-center justify-between">
            <span>Equipos Cubiertos:</span>
            <span class="font-mono text-[#f0f6ff] tabular-nums">${c.equipmentCovered?.length || 0} unidades</span>
          </div>
        </article>
      `;
    }).join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new ClimaTrackApp();
  app.init();
});
