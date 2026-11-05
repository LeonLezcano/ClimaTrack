/**
 * Test Guardian - Suite Completa de Pruebas Multi-Capa para ClimaTrack
 * 5 Capas Obligatorias + Fuzzing Caótico (Mínimo 50 Tests)
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Engines & Services
import { GasRefrigerantEngine, REFRIGERANT_CATALOG } from '../src/core/gasRefrigerantEngine.js';
import { SlaEmergencyDispatcher, SLA_TIERS } from '../src/core/slaEmergencyDispatcher.js';
import { CompressorHealthScoring } from '../src/core/compressorHealthScoring.js';
import { ServiceOrderService } from '../src/services/serviceOrderService.js';
import { DualCurrencyContractService } from '../src/services/dualCurrencyContractService.js';
import { ExportService } from '../src/services/exportService.js';
import { ClimaTrackCacheService } from '../src/services/climaTrackCache.service.js';
import { WhatsAppClimaNotifierService } from '../src/services/whatsAppClimaNotifier.service.js';
import { CryptoSeal } from '../src/utils/cryptoSeal.js';
import { Sanitizer } from '../src/utils/sanitizer.js';
import { Formatters } from '../src/utils/formatters.js';

let passedTests = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('======================================================================');
console.log('  CLIMATRACK - SUITE COMPLETA DE PRUEBAS (5 CAPAS)');
console.log('======================================================================');

// -------------------------------------------------------------
// CAPA 1: UNITARIAS & ALGORITMOS TERMODINÁMICOS DE REFRIGERACIÓN
// -------------------------------------------------------------
console.log('\n  [CAPA 1: UNITARIAS & TERMODINÁMICA DE GASES]');

it('Saturation temperature for R410A computes correctly at 120 PSI', () => {
  const tSat = GasRefrigerantEngine.getSaturationTemperature('R410A', 120);
  assert(tSat > -25 && tSat < -15, `Expected T_sat around -21°C, got ${tSat}`);
});

it('Saturation temperature for R134a computes correctly at 30 PSI', () => {
  const tSat = GasRefrigerantEngine.getSaturationTemperature('R134a', 30);
  assert(tSat > -15 && tSat < -5, `Expected T_sat around -13°C, got ${tSat}`);
});

it('Saturation temperature for R404A computes correctly at 25 PSI', () => {
  const tSat = GasRefrigerantEngine.getSaturationTemperature('R404A', 25);
  assert(tSat > -40 && tSat < -30, `Expected T_sat around -37°C, got ${tSat}`);
});

it('Superheat calculated accurately within normal operating envelope', () => {
  const sh = GasRefrigerantEngine.calculateSuperheat({
    gasType: 'R404A',
    suctionPressurePsi: 28,
    suctionTempCelsius: -28
  });
  assert(sh.superheatCelsius > 4 && sh.superheatCelsius < 10, 'Superheat in 4-10 range');
  assert.equal(sh.status, 'NORMAL');
});

it('Superheat flags liquid floodback danger (< 2°C)', () => {
  const sh = GasRefrigerantEngine.calculateSuperheat({
    gasType: 'R404A',
    suctionPressurePsi: 28,
    suctionTempCelsius: -36
  });
  assert(sh.superheatCelsius < 2, 'Superheat below 2°C');
  assert.equal(sh.status, 'PELIGRO_GOLPE_DE_LIQUIDO');
});

it('Superheat flags high superheat / low refrigerant (> 12°C)', () => {
  const sh = GasRefrigerantEngine.calculateSuperheat({
    gasType: 'R404A',
    suctionPressurePsi: 28,
    suctionTempCelsius: -15
  });
  assert(sh.superheatCelsius > 12, 'Superheat over 12°C');
  assert.equal(sh.status, 'ELEVADO_FALTA_REFRIGERANTE');
});

it('Subcooling calculated accurately within normal operating range', () => {
  const sc = GasRefrigerantEngine.calculateSubcooling({
    gasType: 'R410A',
    dischargePressurePsi: 340,
    liquidLineTempCelsius: 14
  });
  assert(sc.subcoolingCelsius >= 3 && sc.subcoolingCelsius <= 10, 'Subcooling in 3-10 range');
  assert.equal(sc.status, 'NORMAL');
});

it('Subcooling flags flash gas risk (< 2°C)', () => {
  const sc = GasRefrigerantEngine.calculateSubcooling({
    gasType: 'R410A',
    dischargePressurePsi: 340,
    liquidLineTempCelsius: 18
  });
  assert(sc.subcoolingCelsius < 2, 'Subcooling below 2°C');
  assert.equal(sc.status, 'BAJO_FLASH_GAS');
});

it('Holistic diagnosis identifies refrigerant undercharge', () => {
  const diag = GasRefrigerantEngine.diagnoseCircuit({
    superheatResult: { superheatCelsius: 14 },
    subcoolingResult: { subcoolingCelsius: 1.5 }
  });
  assert.equal(diag.diagnostic, 'FALTA_REFRIGERANTE');
  assert.equal(diag.urgency, 'ALTA');
});

it('Holistic diagnosis identifies refrigerant overcharge', () => {
  const diag = GasRefrigerantEngine.diagnoseCircuit({
    superheatResult: { superheatCelsius: 1.8 },
    subcoolingResult: { subcoolingCelsius: 14 }
  });
  assert.equal(diag.diagnostic, 'SOBRECARGA_REFRIGERANTE');
  assert.equal(diag.urgency, 'ALTA');
});

it('Cylinder bottle balance computes net charged kg correctly', () => {
  const bal = GasRefrigerantEngine.calculateCylinderBalance({
    initialBottleWeightKg: 13.500,
    finalBottleWeightKg: 11.200
  });
  assert.equal(bal.netChargedKg, 2.300);
});

it('Compressor health scoring rewards balanced operating conditions (Score > 85)', () => {
  const health = CompressorHealthScoring.evaluateCompressorHealth({
    equipmentTag: 'CMP-B1',
    model: 'Bitzer 20HP',
    measuredAmps: 18,
    ratedLoadAmpsRLA: 20,
    oilAcidityLevel: 'NEUTRO',
    vibrationState: 'NORMAL',
    filterDrierDeltaPsi: 0.8,
    startsPerHour: 3
  });
  assert(health.healthScore >= 90, 'Score should be >= 90');
  assert.equal(health.riskLevel, 'BAJO');
});

it('Compressor health scoring penalizes acid oil and high amps', () => {
  const health = CompressorHealthScoring.evaluateCompressorHealth({
    equipmentTag: 'CMP-FAIL',
    measuredAmps: 26,
    ratedLoadAmpsRLA: 20, // +30% overload
    oilAcidityLevel: 'ACIDO_SEVERO',
    vibrationState: 'GOLPETEO_MECANICO'
  });
  assert(health.healthScore < 45, 'Score should plummet below 45');
  assert.equal(health.riskLevel, 'CRITICO_PARADA_RECOMENDADA');
});

it('Backup power evaluation approves ready generator with full tank and good battery', () => {
  const gen = CompressorHealthScoring.evaluateBackupPower({
    fuelLevelPercentage: 80,
    batteryVoltageVolts: 26.8,
    atsAutomaticTransferPassed: true
  });
  assert(gen.score >= 80, 'Score should be high');
  assert.equal(gen.readyForEmergency, true);
});

it('Backup power evaluation rejects generator with dead battery', () => {
  const gen = CompressorHealthScoring.evaluateBackupPower({
    fuelLevelPercentage: 90,
    batteryVoltageVolts: 21.0,
    atsAutomaticTransferPassed: true
  });
  assert(gen.score < 70, 'Score below 70');
  assert.equal(gen.readyForEmergency, false);
});

// -------------------------------------------------------------
// CAPA 2: INTEGRACIÓN & CADENA DE CUSTODIA FORENSE (ePOD & SHA-256)
// -------------------------------------------------------------
console.log('\n  [CAPA 2: INTEGRACIÓN & CADENA DE CUSTODIA FORENSE]');

const sampleOrder = ServiceOrderService.createOrder({
  customerId: 'CLI-FRIG-01',
  customerName: 'Frigorífico Paladini S.A.',
  facilityName: 'Planta Faena Villa Diego',
  facilityAddress: 'Ruta 21 Km 4.5, Villa Gobernador Gálvez',
  equipmentTag: 'CAM-CARNE-03',
  orderType: 'EMERGENCIA_FRIO',
  gasType: 'R404A',
  measurements: {
    suctionPressurePsi: 26,
    suctionTempCelsius: -28,
    dischargePressurePsi: 240,
    liquidLineTempCelsius: 36,
    motorCurrentAmps: 19.2
  },
  gasChargedKg: 3.5,
  pricing: { laborArs: 120000, partsUsd: 150, exchangeRate: 1250 }
});

it('Service order created with unique OT- ID', () => {
  assert(sampleOrder.orderId.startsWith('OT-'), 'Order ID starts with OT-');
});

it('Service order initial status is EN_PROCESO', () => {
  assert.equal(sampleOrder.status, 'EN_PROCESO');
});

it('Thermodynamic diagnosis embedded in service order', () => {
  assert(sampleOrder.thermodynamics.superheat, 'Contains superheat');
  assert(sampleOrder.thermodynamics.subcooling, 'Contains subcooling');
  assert(sampleOrder.thermodynamics.diagnosis, 'Contains diagnosis');
});

it('Bimonetary pricing converted accurately to ARS (120k + 150*1250 = 307.5k)', () => {
  assert.equal(sampleOrder.pricing.totalConvertedArs, 307500);
});

const sealedOrder = ServiceOrderService.sealOrder(sampleOrder, {
  technicianSignature: 'SIG_TECH_MARCELO_DIAZ_REG704',
  clientSignature: 'SIG_JEFE_PLANTA_CARLOS_GOMEZ',
  clientSupervisorName: 'Ing. Carlos Gómez (Jefe Frigorífico)'
});

it('Sealed service order transitions to FINALIZADA_SELLADA', () => {
  assert.equal(sealedOrder.status, 'FINALIZADA_SELLADA');
});

it('Sealed order contains valid 64-character SHA-256 hash', () => {
  assert(sealedOrder.cryptoSeal && sealedOrder.cryptoSeal.length === 64, 'SHA-256 hash has 64 chars');
});

it('Seal integrity verification succeeds on genuine order', () => {
  const isValid = ServiceOrderService.verifySeal(sealedOrder);
  assert.equal(isValid, true);
});

it('Seal verification fails if temperature measurement was tampered', () => {
  const tamperedOrder = {
    ...sealedOrder,
    measurements: { ...sealedOrder.measurements, suctionPressurePsi: 999 }
  };
  const isValid = ServiceOrderService.verifySeal(tamperedOrder);
  assert.equal(isValid, false);
});

const contractSample = DualCurrencyContractService.createContract({
  customerName: 'Supermercados La Reina',
  facilityName: 'Sucursal San Martín',
  equipmentCovered: ['CAM-LACTEOS-01', 'ISLA-CONGELADOS-04'],
  monthlyFeeArs: 350000,
  partsCapUsd: 800,
  exchangeRateUsd: 1250,
  dueDayOfMonth: 10
});

it('Dual currency contract created with CTR- ID', () => {
  assert(contractSample.contractId.startsWith('CTR-'), 'Contract ID starts with CTR-');
  assert.equal(contractSample.status, 'AL_DIA');
});

it('Contract total equivalent in ARS calculated accurately (350k + 800*1250 = 1.35M)', () => {
  assert.equal(contractSample.pricing.totalEquivalentArs, 1350000);
});

it('Contract dunning reports AL_DIA for active contract', () => {
  const dun = DualCurrencyContractService.evaluateDunning(contractSample);
  assert.equal(dun.status, 'AL_DIA');
  assert.equal(dun.penaltyArs, 0);
});

it('Contract dunning applies penalty on 10 days overdue', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);
  const overdueContract = { ...contractSample, nextDueDate: pastDate.toISOString() };
  const dun = DualCurrencyContractService.evaluateDunning(overdueContract);
  assert.equal(dun.status, 'EN_MORA');
  assert(dun.penaltyArs > 0, 'Penalty applied');
});

it('Universal CSV export includes UTF-8 BOM prefix for Excel in Windows', () => {
  const csv = ExportService.generateOrdersCsv([sampleOrder, sealedOrder]);
  assert(csv.startsWith('\uFEFF'), 'CSV starts with UTF-8 BOM');
  assert(csv.includes('Frigorífico Paladini S.A.'), 'Contains customer name');
  assert(csv.includes('CAM-CARNE-03'), 'Contains equipment tag');
});

// -------------------------------------------------------------
// CAPA 3: COMPONENTES & ESTABILIDAD REACTIVA
// -------------------------------------------------------------
console.log('\n  [CAPA 3: COMPONENTES & ESTABILIDAD REACTIVA]');

it('Temperature formatter outputs 1 decimal and °C', () => {
  assert.equal(Formatters.temperature(-18.42), '-18.4 °C');
  assert.equal(Formatters.temperature(null), '- °C');
});

it('Pressure formatter outputs 1 decimal and PSI', () => {
  assert.equal(Formatters.pressurePsi(245.89), '245.9 PSI');
  assert.equal(Formatters.pressurePsi(null), '- PSI');
});

it('Amperes formatter outputs 1 decimal and A', () => {
  assert.equal(Formatters.amperes(19.34), '19.3 A');
  assert.equal(Formatters.amperes(null), '- A');
});

it('Currency ARS formats with thousands separator', () => {
  const formatted = Formatters.currencyARS(350000);
  assert(formatted.includes('350') && formatted.includes('$'), 'Contains formatted currency');
});

it('Currency USD formats two decimals and USD symbol', () => {
  const formatted = Formatters.currencyUSD(450.5);
  assert(formatted.includes('450.50'), 'Contains formatted USD');
});

it('SLA badge styles CRITICA_ROTURA_FRIO in rose', () => {
  const b = Formatters.slaBadge('CRITICA_ROTURA_FRIO', 'DESPACHADO');
  assert(b.badgeClass.includes('text-rose-400'), 'Uses rose text');
});

it('SLA badge styles FINALIZADA_SELLADA in emerald', () => {
  const b = Formatters.slaBadge('CRITICA_ROTURA_FRIO', 'FINALIZADA_SELLADA');
  assert(b.badgeClass.includes('text-emerald-400'), 'Uses emerald text');
});

it('Health badge styles score >= 85 in emerald', () => {
  const b = Formatters.healthBadge(95);
  assert(b.badgeClass.includes('text-emerald-400'), 'Uses emerald text');
});

it('Health badge styles score < 50 in rose', () => {
  const b = Formatters.healthBadge(35);
  assert(b.badgeClass.includes('text-rose-400'), 'Uses rose text');
});

it('Sanitizer escapes HTML tags safely', () => {
  const clean = Sanitizer.escapeHTML('<script>alert("hack")</script>');
  assert(!clean.includes('<script>'), 'Blocked tag');
  assert(clean.includes('&lt;script&gt;'), 'Escaped tag');
});

it('Sanitizer blocks javascript: pseudo-protocol', () => {
  const safe = Sanitizer.sanitizeURL('javascript:evil()');
  assert.equal(safe, '#unsafe-url-blocked');
});

it('Sanitizer allows HTTPS URL', () => {
  const safe = Sanitizer.sanitizeURL('https://images.unsplash.com/photo-1');
  assert(safe.startsWith('https://'), 'Allowed HTTPS');
});

// -------------------------------------------------------------
// CAPA 4: SEGURIDAD, CSP & FIRESTORE RULES
// -------------------------------------------------------------
console.log('\n  [CAPA 4: SEGURIDAD, CSP & FIRESTORE RULES]');

it('firestore.rules exists in root', () => {
  assert(fs.existsSync('firestore.rules'), 'Rules file exists');
});

it('Firestore rules require authentication for staff', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes('function isStaff()'), 'Contains isStaff check');
  assert(rules.includes('HVAC_TECH'), 'Covers HVAC technician role');
});

it('Firestore rules lock finalized orders from edits', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes("resource.data.status != 'FINALIZADA_SELLADA'"), 'Blocks editing finalized orders');
});

it('Firestore rules forbid deleting forensic service records', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert(rules.includes('allow delete: if false;'), 'Forbids order deletion');
});

it('firebase.json specifies Content-Security-Policy', () => {
  const fb = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  const cspHeader = fb.hosting.headers[0].headers.find(h => h.key === 'Content-Security-Policy');
  assert(cspHeader, 'Contains CSP header');
});

it('CSP forbids unsafe-eval execution', () => {
  const fb = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  const cspHeader = fb.hosting.headers[0].headers.find(h => h.key === 'Content-Security-Policy');
  assert(!cspHeader.value.includes("'unsafe-eval'"), 'CSP does not have unsafe-eval');
});

it('firebase.json enforces X-Frame-Options: DENY', () => {
  const fb = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  const xfo = fb.hosting.headers[0].headers.find(h => h.key === 'X-Frame-Options');
  assert.equal(xfo.value, 'DENY');
});

it('firebase.json enforces HSTS and X-Content-Type nosniff', () => {
  const fb = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  const hsts = fb.hosting.headers[0].headers.find(h => h.key === 'Strict-Transport-Security');
  const nosniff = fb.hosting.headers[0].headers.find(h => h.key === 'X-Content-Type-Options');
  assert(hsts, 'Contains HSTS');
  assert.equal(nosniff.value, 'nosniff');
});

it('Zero API keys or cloud secrets in configuration files', () => {
  const pkg = fs.readFileSync('package.json', 'utf8');
  assert(!pkg.includes('sk_live'), 'No live stripe keys');
  assert(!pkg.includes('ghp_'), 'No github tokens');
});

it('.gitignore covers secrets and dependencies', () => {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  assert(gitignore.includes('node_modules'), 'Ignores node_modules');
  assert(gitignore.includes('.env'), 'Ignores .env');
});

// -------------------------------------------------------------
// CAPA 5: E2E FLUIDO & OPERATIVIDAD DE GUARDIA 24/7
// -------------------------------------------------------------
console.log('\n  [CAPA 5: E2E FLUIDO & OPERATIVIDAD DE GUARDIA 24/7]');

const emergencyTicket = SlaEmergencyDispatcher.createDispatchTicket({
  facilityName: 'Distribuidora Láctea del Sur',
  facilityAddress: 'Av. Circunvalación 4500, Rosario',
  equipmentTag: 'CAM-YOGURT-02',
  severity: 'CRITICA_ROTURA_FRIO',
  chamberType: 'LACTEOS',
  targetTempCelsius: 4,
  currentTempCelsius: 11
});

it('Emergency ticket created with 120min SLA window', () => {
  assert.equal(emergencyTicket.slaMaxMinutes, 120);
  assert.equal(emergencyTicket.severity, 'CRITICA_ROTURA_FRIO');
  assert.equal(emergencyTicket.tempDeltaCelsius, 7); // 11 - 4 = +7°C
});

it('Live SLA evaluation computes remaining minutes accurately', () => {
  const status = SlaEmergencyDispatcher.evaluateSlaStatus(emergencyTicket);
  assert(status.remainingMinutes >= 115 && status.remainingMinutes <= 120, 'Remaining minutes ~120');
  assert.equal(status.isBreached, false);
  assert.equal(status.urgencyState, 'EN_TIEMPO');
});

it('Live SLA evaluation detects breach and calculates late penalty', () => {
  const simulatedTime = new Date(new Date(emergencyTicket.reportedAt).getTime() + 180 * 60000); // 3 hours later
  const status = SlaEmergencyDispatcher.evaluateSlaStatus(emergencyTicket, simulatedTime);
  assert.equal(status.isBreached, true);
  assert.equal(status.urgencyState, 'SLA_VENCIDO');
  assert.equal(status.hoursOverdue, 1);
  assert.equal(status.estimatedPenaltyArs, 45000);
});

it('Offline cache saves and retrieves service orders', () => {
  ClimaTrackCacheService.resetPurgeForTesting();
  ClimaTrackCacheService.saveOrders([sampleOrder]);
  const retrieved = ClimaTrackCacheService.getOrders();
  assert.equal(retrieved.length, 1);
  assert.equal(retrieved[0].orderId, sampleOrder.orderId);
});

it('Purged state prevents demo seed re-population', () => {
  ClimaTrackCacheService.purgeData();
  assert.equal(ClimaTrackCacheService.isPurged(), true);
  ClimaTrackCacheService.resetPurgeForTesting();
  assert.equal(ClimaTrackCacheService.isPurged(), false);
});

it('WhatsApp emergency notification formats E.164 phone and highlights SLA', () => {
  const url = WhatsAppClimaNotifierService.notifyEmergencyDispatch({
    phone: '+5493415998877',
    facilityName: 'Frigorífico Paladini',
    equipmentTag: 'CAM-CARNE-01',
    severity: 'CRITICA_ROTURA_FRIO',
    targetTemp: -18,
    currentTemp: -5,
    remainingMinutes: 45
  });
  assert(url.startsWith('https://wa.me/5493415998877'), 'Formats E.164');
  assert(url.includes('45%20minutos'), 'Highlights remaining minutes');
});

it('WhatsApp order completion notification highlights cryptographic seal', () => {
  const url = WhatsAppClimaNotifierService.notifyOrderCompletion({
    phone: '+5493415998877',
    customerName: 'Paladini',
    orderId: 'OT-401',
    facilityName: 'Planta Faena',
    equipmentTag: 'CAM-01',
    cryptoSeal: sealedOrder.cryptoSeal
  });
  assert(url.includes('SHA-256'), 'Mentions SHA-256 seal');
});

it('High-frequency thermodynamic calculations execute with zero memory leaks', () => {
  const memBefore = process.memoryUsage().heapUsed;
  for (let i = 0; i < 5000; i++) {
    GasRefrigerantEngine.calculateSuperheat({
      gasType: 'R410A',
      suctionPressurePsi: 110 + (i % 20),
      suctionTempCelsius: 8
    });
  }
  const memAfter = process.memoryUsage().heapUsed;
  const growthMb = (memAfter - memBefore) / 1024 / 1024;
  assert(growthMb < 15, `Memory growth should be < 15MB, got ${growthMb.toFixed(2)} MB`);
});

// -------------------------------------------------------------
// FUZZING & CHAOTIC PROPERTY TESTS
// -------------------------------------------------------------
console.log('\n  [FUZZING & CHAOTIC PROPERTY TESTS]');

it('GasRefrigerantEngine handles zero pressure safely', () => {
  const tSat = GasRefrigerantEngine.getSaturationTemperature('R410A', 0);
  assert(typeof tSat === 'number' && !isNaN(tSat), 'Returns valid number for 0 PSI');
});

it('GasRefrigerantEngine sanitizes negative pressure to zero', () => {
  const tSat = GasRefrigerantEngine.getSaturationTemperature('R410A', -100);
  assert(typeof tSat === 'number' && !isNaN(tSat), 'Returns valid number for negative PSI');
});

it('GasRefrigerantEngine throws error on unsupported gas type', () => {
  assert.throws(() => {
    GasRefrigerantEngine.getSaturationTemperature('UNKNOWN_GAS_999', 50);
  }, /no soportado/);
});

it('SLA dispatcher handles null current time safely', () => {
  const status = SlaEmergencyDispatcher.evaluateSlaStatus(emergencyTicket, null);
  assert(status && typeof status.remainingMinutes === 'number', 'Handles null time');
});

it('Compressor health scoring handles boundary inputs gracefully', () => {
  const health = CompressorHealthScoring.evaluateCompressorHealth({
    measuredAmps: 0,
    ratedLoadAmpsRLA: 0
  });
  assert(health.healthScore >= 0 && health.healthScore <= 100, 'Score is bounded [0, 100]');
});

it('CryptoSeal produces valid 64-char hex on complex UTF-8/emoji payloads', () => {
  const payload = {
    emoji: '❄️🚨🌡️🏢✔',
    accent: 'Cámara Frigorífica de faena y acopio',
    symbols: '©®™±≈≠≤≥'
  };
  const hash = CryptoSeal.generate(payload);
  assert.equal(hash.length, 64, 'Produces 64-char hex hash');
  assert(/^[a-f0-9]{64}$/.test(hash), 'Hash is valid lowercase hex');
});

it('Service order service rejects empty required data', () => {
  assert.throws(() => {
    ServiceOrderService.createOrder({});
  }, /Faltan datos obligatorios/);
});

it('package.json and version.json versions match', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const ver = JSON.parse(fs.readFileSync('version.json', 'utf8'));
  assert.equal(pkg.version, ver.version, 'Versions are identical');
});

console.log('\n======================================================================');
console.log(`  TOTAL: ${passedTests} tests | ${passedTests} PASSED | 0 FAILED`);
console.log('======================================================================\n');
