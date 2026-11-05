# ❄️ ClimaTrack — Frío Industrial, Cámaras Frigoríficas, HVAC & Mantenimiento de Energía Solar / Grupos Electrógenos

> **Versión:** `v1.0.00`  
> **Arquetipo:** Critical Cold-Chain Logistics, Industrial Refrigeration & Backup Energy Maintenance  
> **Estándar:** AiAppFactory Invariants, Thermodynamic P-T Physics, Pure Cryptographic Seals (SHA-256) & Zero-Sink DOM Security

---

## 🚀 Resumen del Sistema

**ClimaTrack** es la plataforma integral de gestión técnica y guardia operativa 24/7 para empresas mantenedoras e instaladoras de frío comercial/industrial, plantas frigoríficas, climatización central VRF/chillers y sistemas de energía de respaldo (grupos electrógenos diésel y parques solares).

El sistema protege activamente la cadena de frío contra pérdidas millonarias por descomposición de mercaderías (carnes, lácteos, medicamentos y vacunas) mediante:
- **Despachador de Guardias 24/7 con Centinela SLA < 120 minutos:** Cuenta regresiva en tiempo real y cálculo de penalidades por hora de atraso.
- **Motor Termodinámico de Gases Refrigerantes (P-T):** Tablas Presión-Temperatura para R-404A, R-410A, R-134a y R-22 con cálculo instantáneo de Recalentamiento Útil (*Superheat*) y Subenfriamiento (*Subcooling*) y diagnóstico de circuito (falta de gas, sobrecarga, condensador sucio, evaporador congelado).
- **Control de Balanza de Cilindros:** Registro de peso inicial, final y kilos netos cargados o recuperados.
- **Health Scoring Predictivo de Compresores (0-100):** Detección de sobreconsumo de corriente eléctrica vs RLA de placa, prueba química de acidez de aceite en cárter, vibración/ruido anómalo y caída de presión en filtro deshidratador.
- **Chequeo de Grupos Electrógenos & Solar:** Estado de baterías de arranque de 24V, nivel de diésel y prueba del conmutador de transferencia automática (ATS).
- **Abonos Bimonetarios (ARS / USD):** Mano de obra facturada en pesos argentinos y fondo de repuestos importados (compresores Bitzer, Copeland, Danfoss) en dólares.
- **Doble Firma ePOD & Sello Criptográfico Inmutable SHA-256:** Conformidad in-situ entre el técnico frigorista y el jefe de planta del cliente con blindaje criptográfico contra adulteraciones.

---

## 🛡️ Pilares Tecnológicos & Algorítmicos

### 1. 🌡️ Termodinámica de Refrigeración & Ecuaciones P-T
- **Modelado Polinomial de Saturación:**
  $$T_{\text{sat}}(P) = a + b \cdot P + c \cdot P^2$$
- **Recalentamiento Útil (Línea de Succión):**
  $$\text{Superheat} = T_{\text{succión}} - T_{\text{evaporación\_sat}}$$
  *Alerta Crítica:* Si $\text{Superheat} < 2^\circ\text{C}$, riesgo inminente de golpe de líquido en compresor.
- **Subenfriamiento (Línea de Líquido):**
  $$\text{Subcooling} = T_{\text{condensación\_sat}} - T_{\text{líquido}}$$
  *Alerta:* Si $\text{Subcooling} < 2^\circ\text{C}$, presencia de *flash gas* ante la válvula de expansión.

### 2. 🚨 Despacho de Emergencias & Centinela SLA
- `CRITICA_ROTURA_FRIO`: SLA máximo 120 min (cámaras de carne, congelados, vacunas).
- `ALTA_VRF_CONFORT`: SLA máximo 240 min (datacenters, oficinas corporativas).
- `MEDIA_PREVENTIVO`: SLA programado 1440 min (mantenimiento y filtros).

### 3. ⚙️ Health Scoring de Compresores Frigoríficos
- Pondera consumo Amperes / RLA, acidez de aceite, caída de presión en filtro ($\Delta P$ PSI) y ciclado corto (arranques por hora).

### 4. 💵 Contratos Bimonetarios (ARS / USD)
- Resuelve la brecha cambiaria: cuota fija mensual de mano de obra en ARS indexada y provisión de repuestos a valor de reposición en USD oficial/MEP.

---

## 🧪 Arnés de Pruebas Multi-Capa (66 Tests — 100% PASS)

```bash
# Ejecución de la suite completa de pruebas
pnpm test
# o alternativamente:
node tests/run_tests.js
```

1. **Capa 1: Unitarias & Termodinámica de Gases:** Tablas P-T para 4 gases, superheat, subcooling, balanza de cilindros, health scoring de compresores y respaldo diésel/solar.
2. **Capa 2: Integración & Cadena de Custodia:** Órdenes de servicio técnico, sellado ePOD con hash SHA-256 (64 hex), verificación de manipulación de lecturas de presión y temperatura, contratos bimonetarios y CSV con BOM UTF-8.
3. **Capa 3: Componentes & Formateadores:** Formateo de temperaturas ($^\circ\text{C}$), presiones (PSI), corriente (A), monedas ARS/USD, insignias SLA y desinfección Zero-Sink DOM.
4. **Capa 4: Seguridad, CSP & Firestore Rules:** Reglas de RBAC para frigoristas y supervisores, órdenes selladas inmutables y CSP cualitativa en `firebase.json` sin `unsafe-eval`.
5. **Capa 5: E2E Fluido & Operatividad de Guardia:** Ciclo de vida completo de guardia, reloj de SLA con cálculo de penalidades, persistencia offline-first con prevención de siembras fantasma y notificaciones WhatsApp E.164.

---

## 🛡️ Auditoría de Seguridad (AppSec Guardian)

```bash
node ../AiAppFactory/tools/security-guardian/index.mjs .
# o con pnpm:
pnpm run security:full
```

- **Puntaje Obtenido:** **100/100**
- **Vulnerabilidades:** 0 Críticas | 0 Altas | 0 Medias | 0 Bajas

---

## 📱 Operatividad Móvil Verificada (Playwright MCP)

- Probado bajo viewport de smartphone (`393x852` px) con áreas táctiles $\ge 44 \times 44$ px.
- **Tolerancia Cero en Consola:** **0 Errores** reportados en navegación y flujos operativos.
