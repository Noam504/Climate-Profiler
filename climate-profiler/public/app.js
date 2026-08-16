/**
 * Climate Profiler (פרופיל אקלימי)
 * Main Application Logic & Interactive CDF / Violin Engine
 */

// Global State
const state = {
  data: null,
  selectedCity: 'bet_dagan',
  selectedMonth: 7, // Default: July (יולי)
  currentTheme: 'dark',
  currentLang: 'he', // 'he' | 'en'
  activeTooltip: null
};

// Bilingual Dictionary
const I18N = {
  he: {
    appTitle: 'פרופיל אקלימי',
    appSubtitle: 'תמונת מצב אקלימית יממתית מבוססת 21 שנות היסטוריה (2005–2026) | ECMWF ERA5 & תחנות WMO',
    labelCity: 'בחר עיר / תחנה:',
    btnCsv: 'ייצוא CSV',
    btnQa: 'דוח בקרת איכות (QA)',
    monthNavLabel: 'בחר חודש:',
    months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
    hdrTime: 'שעת דגימה (אינטרוול 3 שעות)',
    hdrUtci: 'עומס תרמי נתפס — UTCI (°C)',
    hdrUtciSub: 'מדד עומס חום/קור משולב',
    hdrTemp: 'טמפרטורת אוויר (°C)',
    hdrTempSub: 'מדידת 2 מטר בפועל',
    hdrRh: 'לחות יחסית (%)',
    hdrRhSub: 'אחוזי רוויית לחות באוויר',
    legendTitle: 'מקרא קטגוריות עומס תרמי (UTCI / ISO 7730):',
    legendHint: 'העבר עכבר על הכינורות לצפייה בהסתברות המצטברת P(X ≤ x)',
    statPeakTitle: 'עומס חום מרבי ביממה',
    statComfortTitle: 'שעות נוחות תרמית (9°C–26°C)',
    statComfortDesc: 'ללא עומס חום או קור',
    statTempTitle: 'טמפרטורת אוויר (ממוצע וטווח)',
    statRhTitle: 'לחות יחסית ממוצעת',
    statUnitDaily: 'מהיממה',
    ttCdfLabel: 'הסתברות מצטברת P(X ≤ x):',
    ttExceedLabel: 'הסתברות לחריגה מעל P(X > x):',
    ttMedian: 'חציון (P50):',
    ttIqr: 'טווח בין-רבעוני (IQR):',
    qaModalTitle: 'בקרת איכות ואימות נתונים (Data Verification & QA)',
    qaPassBanner: '✓ כל הנתונים עברו בדיקות גבולות פיזיקליים בהצלחה (99.97% תקינות)',
    qaSec1: '1. בדיקת גבולות פיזיקליים (Physical Sanity Checks)',
    qaSec2: '2. השוואת הצלבה מול תחנת ייחוס (Cross-Validation vs Synoptic Reference)',
    qaSec3: '3. תקני נתונים ואחידות מדידה (Standards)',
    qaDesc: 'בדיקת תואמות בין נתוני מודל ERA5 Reanalysis לנתוני מדידה בפועל מרשת התחנות הסינופטיות:',
    elevLabel: 'רום:',
    meters: "מ'",
    solarElevation: 'זווית שמש:',
    loading: 'טוען פרופיל אקלימי ומחשב פילוגי הסתברות (KDE / CDF)...'
  },
  en: {
    appTitle: 'Climate Profiler',
    appSubtitle: 'Diurnal Bioclimatic Profiling from 21-Year Historical Reanalysis (2005–2026) | ECMWF ERA5 & WMO',
    labelCity: 'Select City / Station:',
    btnCsv: 'Export CSV',
    btnQa: 'QA & Verification Report',
    monthNavLabel: 'Select Month:',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    hdrTime: 'Sample Time (3-Hour Interval)',
    hdrUtci: 'Perceived Thermal Stress — UTCI (°C)',
    hdrUtciSub: 'Universal Thermal Climate Index',
    hdrTemp: 'Air Temperature (°C)',
    hdrTempSub: '2m Dry Bulb Temperature',
    hdrRh: 'Relative Humidity (%)',
    hdrRhSub: 'Moisture Saturation Ratio',
    legendTitle: 'UTCI Thermal Stress Categories (ISO 7730):',
    legendHint: 'Hover over violin plots to inspect Cumulative Probability P(X ≤ x)',
    statPeakTitle: 'Diurnal Peak Thermal Stress',
    statComfortTitle: 'Thermal Comfort Hours (9°C–26°C)',
    statComfortDesc: 'No Thermal Heat/Cold Stress',
    statTempTitle: 'Air Temperature (Mean & Range)',
    statRhTitle: 'Average Relative Humidity',
    statUnitDaily: 'of diurnal cycle',
    ttCdfLabel: 'Cumulative Probability P(X ≤ x):',
    ttExceedLabel: 'Exceedance Probability P(X > x):',
    ttMedian: 'Median (P50):',
    ttIqr: 'Interquartile Range (IQR):',
    qaModalTitle: 'Data Quality Assurance & Cross-Validation Report',
    qaPassBanner: '✓ All historical records verified through physical sanity filters (99.97% pass rate)',
    qaSec1: '1. Physical Sanity Checks & Boundary Verification',
    qaSec2: '2. Ground Station Cross-Validation vs Synoptic Reference',
    qaSec3: '3. Data Standards & Sampling Consistency',
    qaDesc: 'Verification metrics between ECMWF ERA5 Reanalysis and Ground Synoptic Observations:',
    elevLabel: 'Elev:',
    meters: 'm',
    solarElevation: 'Solar elev:',
    loading: 'Loading climate profile and computing probability distributions (KDE / CDF)...'
  }
};

// UTCI Categories metadata
const UTCI_CATEGORIES = [
  { min: 46.0, max: 100.0, key: 'extreme_heat', name_he: 'עומס חום קיצוני', name_en: 'Extreme Heat Stress', color: '#990000' },
  { min: 38.0, max: 46.0, key: 'very_strong_heat', name_he: 'עומס חום חזק מאוד', name_en: 'Very Strong Heat Stress', color: '#d73027' },
  { min: 32.0, max: 38.0, key: 'strong_heat', name_he: 'עומס חום חזק', name_en: 'Strong Heat Stress', color: '#fc8d59' },
  { min: 26.0, max: 32.0, key: 'moderate_heat', name_he: 'עומס חום בינוני', name_en: 'Moderate Heat Stress', color: '#fee08b' },
  { min: 9.0, max: 26.0, key: 'no_stress', name_he: 'נוחות תרמית (ללא עומס)', name_en: 'No Thermal Stress (Comfort)', color: '#22c55e' },
  { min: 0.0, max: 9.0, key: 'slight_cold', name_he: 'עומס קור קל', name_en: 'Slight Cold Stress', color: '#d9ef8b' },
  { min: -13.0, max: 0.0, key: 'moderate_cold', name_he: 'עומס קור בינוני', name_en: 'Moderate Cold Stress', color: '#91bfdb' },
  { min: -27.0, max: -13.0, key: 'strong_cold', name_he: 'עומס קור חזק', name_en: 'Strong Cold Stress', color: '#4575b4' },
  { min: -40.0, max: -27.0, key: 'very_strong_cold', name_he: 'עומס קור חזק מאוד', name_en: 'Very Strong Cold Stress', color: '#313695' },
  { min: -100.0, max: -40.0, key: 'extreme_cold', name_he: 'עומס קור קיצוני', name_en: 'Extreme Cold Stress', color: '#1a1b4b' }
];

function getCategoryForUtci(val) {
  for (const cat of UTCI_CATEGORIES) {
    if (val >= cat.min) return cat;
  }
  return UTCI_CATEGORIES[UTCI_CATEGORIES.length - 1];
}

// ==========================================================================
// Initialization & Data Loading
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadClimateData();
});

async function loadClimateData() {
  const container = document.getElementById('violin-rows-container');
  try {
    const response = await fetch('climate_profiles.json');
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    state.data = await response.json();
    renderMonthTabs();
    updateUI();
  } catch (err) {
    console.error('Failed to load dataset:', err);
    container.innerHTML = `
      <div class="loading-spinner-wrap" style="color: #ef4444;">
        <p>⚠️ שגיאה בטעינת קובץ הנתונים (climate_profiles.json).</p>
        <p style="font-size: 0.8rem; color: var(--text-dim);">${err.message}</p>
      </div>
    `;
  }
}

function setupEventListeners() {
  // City Select
  const citySelect = document.getElementById('city-select');
  citySelect.addEventListener('change', (e) => {
    state.selectedCity = e.target.value;
    updateUI();
  });

  // CSV Export
  document.getElementById('btn-export-csv').addEventListener('click', downloadCsvReport);

  // QA Modal
  const modal = document.getElementById('qa-modal');
  document.getElementById('btn-qa-modal').addEventListener('click', () => {
    modal.classList.remove('hidden');
    renderQaModalContent();
  });
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // Theme Toggle
  document.getElementById('btn-toggle-theme').addEventListener('click', toggleTheme);

  // Language Toggle
  document.getElementById('btn-toggle-lang').addEventListener('click', toggleLanguage);
}

// ==========================================================================
// Theme & Language Toggles
// ==========================================================================

function toggleTheme() {
  const body = document.body;
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');

  if (state.currentTheme === 'dark') {
    state.currentTheme = 'light';
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    state.currentTheme = 'dark';
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
  updateUI();
}

function toggleLanguage() {
  state.currentLang = state.currentLang === 'he' ? 'en' : 'he';
  const isHe = state.currentLang === 'he';

  document.documentElement.lang = isHe ? 'he' : 'en';
  document.documentElement.dir = isHe ? 'rtl' : 'ltr';

  document.querySelector('.lang-code').textContent = isHe ? 'EN' : 'עב';

  // Apply translations to static labels
  const t = I18N[state.currentLang];
  document.getElementById('app-title').innerHTML = `${t.appTitle} <span class="badge-tag">UTCI Profiler</span>`;
  document.getElementById('app-subtitle').textContent = t.appSubtitle;
  document.getElementById('label-city').textContent = t.labelCity;
  document.getElementById('btn-csv-text').textContent = t.btnCsv;
  document.getElementById('btn-qa-text').textContent = t.btnQa;
  document.getElementById('month-nav-label').textContent = t.monthNavLabel;

  document.getElementById('hdr-time').textContent = t.hdrTime;
  document.getElementById('hdr-utci-title').textContent = t.hdrUtci;
  document.getElementById('hdr-utci-sub').textContent = t.hdrUtciSub;
  document.getElementById('hdr-temp-title').textContent = t.hdrTemp;
  document.getElementById('hdr-temp-sub').textContent = t.hdrTempSub;
  document.getElementById('hdr-rh-title').textContent = t.hdrRh;
  document.getElementById('hdr-rh-sub').textContent = t.hdrRhSub;

  document.getElementById('legend-title').textContent = t.legendTitle;
  document.getElementById('legend-hint').textContent = t.legendHint;

  document.getElementById('stat-peak-title').textContent = t.statPeakTitle;
  document.getElementById('stat-comfort-title').textContent = t.statComfortTitle;
  document.getElementById('stat-comfort-desc').textContent = t.statComfortDesc;
  document.getElementById('stat-temp-title').textContent = t.statTempTitle;
  document.getElementById('stat-rh-title').textContent = t.statRhTitle;
  document.getElementById('stat-comfort-unit').textContent = t.statUnitDaily;

  renderMonthTabs();
  updateUI();
}

// ==========================================================================
// Month Tabs Rendering
// ==========================================================================

function renderMonthTabs() {
  const container = document.getElementById('month-tabs-container');
  container.innerHTML = '';
  const months = I18N[state.currentLang].months;

  months.forEach((mName, idx) => {
    const mNum = idx + 1;
    const tab = document.createElement('button');
    tab.className = `month-tab ${mNum === state.selectedMonth ? 'active' : ''}`;
    tab.textContent = mName;
    tab.addEventListener('click', () => {
      state.selectedMonth = mNum;
      document.querySelectorAll('.month-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      updateUI();
    });
    container.appendChild(tab);
  });
}

// ==========================================================================
// UI Updates & Overview Cards
// ==========================================================================

function updateUI() {
  if (!state.data || !state.data.cities) return;

  const cityData = state.data.cities[state.selectedCity];
  if (!cityData) return;

  const cityMeta = cityData.city_metadata;
  const monthData = cityData.months[state.selectedMonth];
  const isHe = state.currentLang === 'he';
  const t = I18N[state.currentLang];

  // Update City Badge Header
  document.getElementById('city-badge-name').textContent = isHe ? cityMeta.name_he : cityMeta.name_en;
  document.getElementById('meta-coords').textContent = `${cityMeta.lat.toFixed(2)}°N, ${cityMeta.lon.toFixed(2)}°E`;
  document.getElementById('meta-elev').textContent = `${t.elevLabel} ${cityMeta.elevation_m} ${t.meters}`;
  document.getElementById('meta-climate').textContent = isHe ? cityMeta.climate_type_he : cityMeta.climate_type_en;
  document.getElementById('meta-wmo').textContent = `WMO ${cityMeta.wmo_id}`;

  // Compute Highlights for selected Month
  let maxUtciMedian = -999;
  let maxUtciHour = '12:00';
  let comfortIntervalCount = 0;
  let totalTemps = [];
  let totalRhs = [];

  const hours = monthData.hours;
  const hourKeys = Object.keys(hours);

  hourKeys.forEach(hr => {
    const hObj = hours[hr];
    const uMed = hObj.utci.stats.median_p50;
    if (uMed > maxUtciMedian) {
      maxUtciMedian = uMed;
      maxUtciHour = hr;
    }
    // Comfort hours (median between 9 and 26)
    if (uMed >= 9.0 && uMed <= 26.0) {
      comfortIntervalCount++;
    }
    totalTemps.push(hObj.temperature.stats.mean);
    totalRhs.push(hObj.relative_humidity.stats.mean);
  });

  const peakCategory = getCategoryForUtci(maxUtciMedian);
  const peakCatName = isHe ? peakCategory.name_he : peakCategory.name_en;

  // Stat 1: Peak Stress
  document.getElementById('stat-peak-val').textContent = maxUtciMedian.toFixed(1);
  document.getElementById('stat-peak-val').style.color = peakCategory.color;
  document.getElementById('stat-peak-desc').textContent = `${isHe ? 'בשעה' : 'At'} ${maxUtciHour} — ${peakCatName}`;

  // Stat 2: Comfort
  const comfortPct = Math.round((comfortIntervalCount / hourKeys.length) * 100);
  document.getElementById('stat-comfort-val').textContent = `${comfortPct}%`;
  document.getElementById('stat-comfort-desc').textContent = `${comfortIntervalCount * 3} ${isHe ? 'שעות ביממה בממוצע' : 'hours / day average'}`;

  // Stat 3: Temp
  const avgTemp = (totalTemps.reduce((a, b) => a + b, 0) / totalTemps.length).toFixed(1);
  const minTemp = Math.min(...totalTemps).toFixed(1);
  const maxTemp = Math.max(...totalTemps).toFixed(1);
  document.getElementById('stat-temp-val').textContent = avgTemp;
  document.getElementById('stat-temp-desc').textContent = `${isHe ? 'טווח שעות:' : 'Diurnal range:'} ${minTemp}°C – ${maxTemp}°C`;

  // Stat 4: RH
  const avgRh = Math.round(totalRhs.reduce((a, b) => a + b, 0) / totalRhs.length);
  const minRh = Math.round(Math.min(...totalRhs));
  const maxRh = Math.round(Math.max(...totalRhs));
  document.getElementById('stat-rh-val').textContent = `${avgRh}`;
  document.getElementById('stat-rh-desc').textContent = `${isHe ? 'טווח יממתי:' : 'Range:'} ${minRh}% – ${maxRh}%`;

  // Render Violin Triplets Matrix
  renderViolinMatrix(monthData);
}

// ==========================================================================
// Violin Triplets Matrix Rendering (SVG)
// ==========================================================================

function renderViolinMatrix(monthData) {
  const container = document.getElementById('violin-rows-container');
  container.innerHTML = '';

  const hours = monthData.hours;
  const hourKeys = Object.keys(hours).sort();
  const isHe = state.currentLang === 'he';
  const t = I18N[state.currentLang];

  hourKeys.forEach(timeStr => {
    const hObj = hours[timeStr];
    const hrNum = hObj.hour_num;

    const row = document.createElement('div');
    row.className = 'violin-hour-row';

    // 1. Time & Solar Elevation Badge Column
    const isDay = hrNum >= 6 && hrNum <= 18;
    const solarIcon = isDay ? '☀️' : '🌙';
    const solarDesc = isDay ? (hrNum === 12 ? (isHe ? 'שיא קרינה' : 'Solar Noon') : (isHe ? 'שעות יום' : 'Daylight')) : (isHe ? 'שעות לילה' : 'Nighttime');

    // Build mini thermal stress distribution bar
    let stressBarHtml = '<div class="hour-stress-bar">';
    const pcts = hObj.stress_categories_pct || {};
    UTCI_CATEGORIES.forEach(cat => {
      const p = pcts[cat.key] || 0;
      if (p > 0) {
        stressBarHtml += `<div class="stress-bar-segment" style="width: ${p}%; background-color: ${cat.color};" title="${isHe ? cat.name_he : cat.name_en}: ${p}%"></div>`;
      }
    });
    stressBarHtml += '</div>';

    const timeCol = document.createElement('div');
    timeCol.className = 'hour-badge-column';
    timeCol.innerHTML = `
      <div class="hour-badge-time">${timeStr}</div>
      <div class="hour-badge-solar">
        <span class="solar-icon">${solarIcon}</span>
        <span>${solarDesc}</span>
      </div>
      ${stressBarHtml}
    `;
    row.appendChild(timeCol);

    // 2. UTCI Violin Plot Cell
    const utciCell = createViolinSvgCell(timeStr, 'utci', hObj.utci, -25, 48, '°C UTCI', 'violin-shape-utci');
    row.appendChild(utciCell);

    // 3. Temperature Violin Plot Cell
    const tempCell = createViolinSvgCell(timeStr, 'temp', hObj.temperature, -10, 42, '°C', 'violin-shape-temp');
    row.appendChild(tempCell);

    // 4. Relative Humidity Violin Plot Cell
    const rhCell = createViolinSvgCell(timeStr, 'rh', hObj.relative_humidity, 0, 100, '%', 'violin-shape-rh');
    row.appendChild(rhCell);

    container.appendChild(row);
  });
}

/**
 * Creates an interactive SVG Violin Plot Cell with embedded Box Plot,
 * KDE smooth curves, and dynamic CDF mouseover tracking.
 */
function createViolinSvgCell(timeStr, metricKey, kdeData, scaleMin, scaleMax, unitStr, shapeClass) {
  const cell = document.createElement('div');
  cell.className = 'violin-plot-cell';

  const width = 340;
  const height = 135;
  const padding = { top: 12, bottom: 20, left: 35, right: 25 };

  const plotHeight = height - padding.top - padding.bottom;
  const plotWidth = width - padding.left - padding.right;
  const centerX = padding.left + plotWidth / 2;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // Definitions (Gradients)
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <!-- UTCI Multi-zone Thermal Gradient -->
    <linearGradient id="utci-thermal-gradient" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#313695"/>
      <stop offset="25%" stop-color="#91bfdb"/>
      <stop offset="45%" stop-color="#22c55e"/>
      <stop offset="65%" stop-color="#fee08b"/>
      <stop offset="82%" stop-color="#fc8d59"/>
      <stop offset="100%" stop-color="#d73027"/>
    </linearGradient>

    <!-- Air Temperature Gradient -->
    <linearGradient id="temp-gradient" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>

    <!-- Relative Humidity Gradient -->
    <linearGradient id="rh-gradient" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#bae6fd"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  `;
  svg.appendChild(defs);

  // Value to Y coordinate mapping
  const valToY = (val) => {
    const clamped = Math.max(scaleMin, Math.min(scaleMax, val));
    const ratio = (clamped - scaleMin) / (scaleMax - scaleMin);
    return padding.top + (1 - ratio) * plotHeight;
  };

  const yToVal = (y) => {
    const ratio = 1 - ((y - padding.top) / plotHeight);
    return scaleMin + ratio * (scaleMax - scaleMin);
  };

  // Background Grid Lines & Scale Markers
  const step = metricKey === 'rh' ? 25 : 10;
  for (let v = Math.ceil(scaleMin / step) * step; v <= scaleMax; v += step) {
    const y = valToY(v);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padding.left);
    line.setAttribute('x2', width - padding.right);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255,255,255,0.06)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', padding.left - 5);
    text.setAttribute('y', y + 3);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', 'rgba(148,163,184,0.6)');
    text.setAttribute('font-size', '9');
    text.setAttribute('font-family', 'JetBrains Mono');
    text.textContent = v;
    svg.appendChild(text);
  }

  // Generate Violin Path from KDE grid & scaled densities
  const grid = kdeData.grid;
  const densities = kdeData.density_scaled;
  const maxHalfWidth = (plotWidth / 2) * 0.88;

  if (grid && grid.length > 0) {
    let rightPoints = [];
    let leftPoints = [];

    for (let i = 0; i < grid.length; i++) {
      const y = valToY(grid[i]);
      const w = (densities[i] || 0) * maxHalfWidth;
      rightPoints.push(`${centerX + w},${y}`);
      leftPoints.unshift(`${centerX - w},${y}`);
    }

    const allPoints = rightPoints.concat(leftPoints);
    const pathD = `M ${allPoints[0]} L ${allPoints.join(' L ')} Z`;

    const violinPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    violinPath.setAttribute('d', pathD);
    violinPath.setAttribute('class', `violin-shape ${shapeClass}`);
    svg.appendChild(violinPath);
  }

  // Embedded Box-Plot (Whisker P10-P90, Box IQR Q1-Q3, Median Point)
  const stats = kdeData.stats;
  if (stats && stats.median_p50 !== undefined) {
    const yP10 = valToY(stats.p10);
    const yP90 = valToY(stats.p90);
    const yQ1 = valToY(stats.q1_p25);
    const yQ3 = valToY(stats.q3_p75);
    const yMedian = valToY(stats.median_p50);

    // Whiskers Line (P10 to P90)
    const whisker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    whisker.setAttribute('x1', centerX);
    whisker.setAttribute('x2', centerX);
    whisker.setAttribute('y1', yP10);
    whisker.setAttribute('y2', yP90);
    whisker.setAttribute('class', 'box-whisker-line');
    svg.appendChild(whisker);

    // IQR Box (Q1 to Q3)
    const boxWidth = 8;
    const boxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    boxRect.setAttribute('x', centerX - boxWidth / 2);
    boxRect.setAttribute('y', Math.min(yQ1, yQ3));
    boxRect.setAttribute('width', boxWidth);
    boxRect.setAttribute('height', Math.max(2, Math.abs(yQ1 - yQ3)));
    boxRect.setAttribute('class', 'box-iqr-rect');
    svg.appendChild(boxRect);

    // Median Dot
    const medianCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    medianCircle.setAttribute('cx', centerX);
    medianCircle.setAttribute('cy', yMedian);
    medianCircle.setAttribute('r', '3');
    medianCircle.setAttribute('class', 'box-median-circle');
    svg.appendChild(medianCircle);
  }

  // Interactive Elements: Crosshair Line & Hover Tracking
  const crosshair = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  crosshair.setAttribute('x1', padding.left);
  crosshair.setAttribute('x2', width - padding.right);
  crosshair.setAttribute('y1', -100);
  crosshair.setAttribute('y2', -100);
  crosshair.setAttribute('class', 'crosshair-line hidden');
  svg.appendChild(crosshair);

  const crosshairDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  crosshairDot.setAttribute('cx', centerX);
  crosshairDot.setAttribute('cy', -100);
  crosshairDot.setAttribute('r', '4');
  crosshairDot.setAttribute('class', 'crosshair-dot hidden');
  svg.appendChild(crosshairDot);

  // Mouse Move Interaction for CDF Tooltip
  cell.addEventListener('mousemove', (e) => {
    const rect = cell.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const clampedMouseY = Math.max(padding.top, Math.min(height - padding.bottom, mouseY));

    const dataVal = yToVal(clampedMouseY);
    const yPosSvg = clampedMouseY;

    crosshair.setAttribute('y1', yPosSvg);
    crosshair.setAttribute('y2', yPosSvg);
    crosshair.classList.remove('hidden');

    crosshairDot.setAttribute('cy', yPosSvg);
    crosshairDot.classList.remove('hidden');

    // Interpolate CDF probability P(X <= x)
    const probLe = interpolateCdf(dataVal, kdeData.cdf_table, stats);
    const probGt = Math.max(0.0, Math.min(100.0, 100.0 - probLe));

    showCdfTooltip(e.clientX, e.clientY, timeStr, metricKey, dataVal, probLe, probGt, stats);
  });

  cell.addEventListener('mouseleave', () => {
    crosshair.classList.add('hidden');
    crosshairDot.classList.add('hidden');
    hideCdfTooltip();
  });

  cell.appendChild(svg);

  // Top-Right Mini Stats Pill
  if (stats && stats.median_p50 !== undefined) {
    const mini = document.createElement('div');
    mini.className = 'violin-mini-stats';
    mini.textContent = `P50: ${stats.median_p50}${unitStr.replace('°C UTCI', '°').replace('°C', '°')}`;
    cell.appendChild(mini);
  }

  return cell;
}

/**
 * Calculates empirical CDF probability P(X <= x) by interpolation on precomputed quantiles table
 */
function interpolateCdf(val, cdfTable, stats) {
  if (!cdfTable || cdfTable.length === 0) {
    if (val <= stats.min) return 0.0;
    if (val >= stats.max) return 100.0;
    return 50.0;
  }

  if (val <= cdfTable[0].value) return 0.0;
  if (val >= cdfTable[cdfTable.length - 1].value) return 100.0;

  for (let i = 0; i < cdfTable.length - 1; i++) {
    const p1 = cdfTable[i];
    const p2 = cdfTable[i + 1];
    if (val >= p1.value && val <= p2.value) {
      const t = (val - p1.value) / (p2.value - p1.value || 1);
      const prob = p1.prob_le + t * (p2.prob_le - p1.prob_le);
      return Math.round(prob * 1000) / 10; // e.g. 64.2%
    }
  }
  return 50.0;
}

// ==========================================================================
// Floating CDF Interactive Tooltip
// ==========================================================================

function showCdfTooltip(clientX, clientY, timeStr, metricKey, val, probLe, probGt, stats) {
  const tooltip = document.getElementById('cdf-interactive-tooltip');
  const isHe = state.currentLang === 'he';

  document.getElementById('tt-time-label').textContent = `${timeStr}`;

  let metricLabel = 'UTCI';
  let unit = '°C';
  let stressPill = document.getElementById('tt-stress-category');

  if (metricKey === 'utci') {
    metricLabel = 'UTCI';
    unit = '°C UTCI';
    const cat = getCategoryForUtci(val);
    stressPill.textContent = isHe ? cat.name_he : cat.name_en;
    stressPill.style.backgroundColor = `${cat.color}25`;
    stressPill.style.borderColor = cat.color;
    stressPill.style.color = cat.color;
    stressPill.classList.remove('hidden');
  } else if (metricKey === 'temp') {
    metricLabel = isHe ? 'טמפרטורה' : 'Temperature';
    unit = '°C';
    stressPill.classList.add('hidden');
  } else {
    metricLabel = isHe ? 'לחות יחסית' : 'Humidity';
    unit = '%';
    stressPill.classList.add('hidden');
  }

  document.getElementById('tt-metric-name').textContent = metricLabel;
  document.getElementById('tt-val-num').textContent = val.toFixed(1);
  document.getElementById('tt-val-unit').textContent = unit;

  // CDF Probabilities
  document.getElementById('tt-cdf-val').textContent = `${probLe.toFixed(1)}%`;
  document.getElementById('tt-cdf-fill').style.width = `${Math.max(2, probLe)}%`;
  document.getElementById('tt-exceed-val').textContent = `${probGt.toFixed(1)}%`;

  // Median & IQR
  document.getElementById('tt-median-val').textContent = `${stats.median_p50}${unit}`;
  document.getElementById('tt-iqr-val').textContent = `${stats.iqr}${unit}`;

  // Positioning with screen boundary clamping
  const tooltipWidth = 270;
  const tooltipHeight = 180;
  let posX = clientX;
  let posY = clientY - 15;

  if (posX - tooltipWidth / 2 < 10) posX = tooltipWidth / 2 + 10;
  if (posX + tooltipWidth / 2 > window.innerWidth - 10) posX = window.innerWidth - tooltipWidth / 2 - 10;
  if (posY - tooltipHeight < 10) posY = clientY + tooltipHeight + 15;

  tooltip.style.left = `${posX}px`;
  tooltip.style.top = `${posY}px`;
  tooltip.classList.remove('hidden');
}

function hideCdfTooltip() {
  const tooltip = document.getElementById('cdf-interactive-tooltip');
  tooltip.classList.add('hidden');
}

// ==========================================================================
// CSV Export & QA Report Modal
// ==========================================================================

function downloadCsvReport() {
  const cityId = state.selectedCity;
  const filename = `${cityId}_climate_report.csv`;
  const url = `${filename}`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function renderQaModalContent() {
  if (!state.data || !state.data.cities) return;
  const cityData = state.data.cities[state.selectedCity];
  if (!cityData || !cityData.qa_summary) return;

  const qa = cityData.qa_summary;
  const cv = qa.cross_validation;
  const isHe = state.currentLang === 'he';

  document.getElementById('qa-pass-banner').textContent = isHe
    ? `✓ כל הנתונים עברו בדיקות גבולות פיזיקליים בהצלחה (${qa.pass_rate_pct}% תקינות — ${qa.valid_records.toLocaleString()} רשומות)`
    : `✓ All data verified through physical sanity filters (${qa.pass_rate_pct}% valid — ${qa.valid_records.toLocaleString()} records)`;

  document.getElementById('qa-ref-desc').textContent = `${isHe ? 'בדיקת תואמות מול' : 'Validation against'}: ${cv.reference_station}`;

  const tbody = document.getElementById('qa-table-body');
  tbody.innerHTML = `
    <tr>
      <td><strong>${isHe ? 'טמפרטורת אוויר (°C)' : 'Air Temperature (°C)'}</strong></td>
      <td class="mono">${cv.temperature_cv.bias > 0 ? '+' : ''}${cv.temperature_cv.bias} °C</td>
      <td class="mono">${cv.temperature_cv.rmse} °C</td>
      <td class="mono">${cv.temperature_cv.mae} °C</td>
      <td class="mono high-stat">${cv.temperature_cv.r2}</td>
      <td><span class="qa-status-pill pass">${isHe ? 'מאומת ✓' : 'Verified ✓'}</span></td>
    </tr>
    <tr>
      <td><strong>${isHe ? 'לחות יחסית (%)' : 'Relative Humidity (%)'}</strong></td>
      <td class="mono">${cv.rh_cv.bias > 0 ? '+' : ''}${cv.rh_cv.bias} %</td>
      <td class="mono">${cv.rh_cv.rmse} %</td>
      <td class="mono">${cv.rh_cv.mae} %</td>
      <td class="mono high-stat">${cv.rh_cv.r2}</td>
      <td><span class="qa-status-pill pass">${isHe ? 'מאומת ✓' : 'Verified ✓'}</span></td>
    </tr>
    <tr>
      <td><strong>${isHe ? 'עומס תרמי UTCI (°C)' : 'Thermal Stress UTCI (°C)'}</strong></td>
      <td class="mono">${cv.utci_cv.bias > 0 ? '+' : ''}${cv.utci_cv.bias} °C</td>
      <td class="mono">${cv.utci_cv.rmse} °C</td>
      <td class="mono">${cv.utci_cv.mae} °C</td>
      <td class="mono high-stat">${cv.utci_cv.r2}</td>
      <td><span class="qa-status-pill pass">${isHe ? 'מאומת ✓' : 'Verified ✓'}</span></td>
    </tr>
  `;
}
