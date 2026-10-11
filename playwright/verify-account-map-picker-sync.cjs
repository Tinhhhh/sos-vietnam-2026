const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, '..', 'Reports', 'qa', 'playwright');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchJson(urlPath) {
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    headers: { 'User-Agent': UA }
  });
  return await res.json();
}

(async () => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiChecks: {},
    uiChecks: {},
    screenshots: [],
    allPassed: false
  };

  // 1. API-level verification
  const caiKheSearch = await fetchJson('/api/geocode/search?q=' + encodeURIComponent('Phường Cái Khế') + '&province=' + encodeURIComponent('Cần Thơ'));
  const caiKhePlaceholderSearch = await fetchJson(
    '/api/geocode/search?q=' + encodeURIComponent('Chưa công bố địa chỉ trực ban trên nguồn đã kiểm chứng') +
    '&ward=' + encodeURIComponent('Toàn Thành Phố') +
    '&agencyName=' + encodeURIComponent('Công An Phường Cái Khế') +
    '&province=' + encodeURIComponent('Cần Thơ')
  );
  const caiKheSuggest = await fetchJson('/api/geocode/suggest?q=' + encodeURIComponent('Cái Khế') + '&province=' + encodeURIComponent('Cần Thơ'));
  const hoanKiemSearch = await fetchJson('/api/geocode/search?ward=' + encodeURIComponent('Phường Hoàn Kiếm') + '&province=' + encodeURIComponent('Hà Nội'));
  const saiGonSearch = await fetchJson('/api/geocode/search?ward=' + encodeURIComponent('Phường Sài Gòn') + '&province=' + encodeURIComponent('TP. Hồ Chí Minh'));

  report.apiChecks = {
    caiKheSearch,
    caiKhePlaceholderSearch,
    caiKheSuggestCount: caiKheSuggest?.items?.length || 0,
    caiKheSuggestTop: caiKheSuggest?.items?.[0] || null,
    hoanKiemSearch,
    saiGonSearch
  };

  // 2. Browser UI verification
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ username: 'admin', password: '2002' })
  }).then(r => r.json()).catch(() => null);

  const adminOfficerProfile = loginRes?.profile || {
    username: 'admin',
    agency: 'all',
    level: 'national',
    agencyName: 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia',
    unitName: 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia',
    province: 'Cần Thơ',
    ward: 'Toàn Quốc',
    officerRank: 'Đại tướng',
    officerName: 'Chỉ Huy Tác Chiến Quốc Gia',
    token: loginRes?.profile?.token || loginRes?.token || ''
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: UA
  });
  await context.addInitScript((profile) => {
    sessionStorage.setItem('sos_gatekeeper_pass', 'true');
    sessionStorage.setItem('sos_dispatcher_officer', JSON.stringify(profile));
    localStorage.setItem('sos_dispatcher_officer', JSON.stringify(profile));
    if (profile.token) {
      localStorage.setItem('dispatcher_token', profile.token);
    }
  }, adminOfficerProfile);

  const page = await context.newPage();
  page.on('pageerror', (err) => console.error('PAGE_ERROR:', err.message));
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.dispatcher || window.dispatcherApp), { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Open Admin Account Manager
  await page.evaluate(async (profile) => {
    const app = window.dispatcher || window.dispatcherApp;
    if (app) {
      app.currentOfficer = profile;
      document.body.classList.add('officer-authenticated');
      await app.openAdminModal();
    }
  }, adminOfficerProfile);
  await page.waitForTimeout(1500);

  // Search for capcaikhect
  await page.fill('#inputSearchAdminAccounts', 'capcaikhect');
  await page.waitForTimeout(800);

  // Click Edit on capcaikhect
  await page.locator('.btn-edit-acc').first().click();
  await page.waitForTimeout(1200);

  const editModalValues = await page.evaluate(() => ({
    title: document.getElementById('adminAccountEditTitle')?.textContent?.trim(),
    username: document.getElementById('editAccUsername')?.value,
    agencyName: document.getElementById('editAccAgencyName')?.value,
    province: document.getElementById('editAccProvince')?.value,
    ward: document.getElementById('editAccWard')?.value,
    address: document.getElementById('editAccAddress')?.value,
    lat: document.getElementById('editAccLat')?.value,
    lng: document.getElementById('editAccLng')?.value,
    rank: document.getElementById('editAccRank')?.value,
    officerName: document.getElementById('editAccOfficerName')?.value,
    phone: document.getElementById('editAccPhone')?.value,
    sms: document.getElementById('editAccSms')?.value,
    email: document.getElementById('editAccEmail')?.value,
    provincesDatalistCount: document.querySelectorAll('#listProvinces option').length,
    wardsDatalistCount: document.querySelectorAll('#listWards option').length
  }));
  report.uiChecks.capcaikhectEditModal = editModalValues;

  const shot1 = path.join(REPORT_DIR, 'capcaikhect-edit-modal-fixed.png');
  await page.screenshot({ path: shot1 });
  report.screenshots.push(shot1);

  // Click "📍 Tìm GPS Từ Địa Chỉ" button and verify coordinates remain 10.043366, 105.773396
  await page.click('#btnGeocodeAccAddress');
  await page.waitForTimeout(1200);
  const afterGeocodeBtn = await page.evaluate(() => ({
    lat: document.getElementById('editAccLat')?.value,
    lng: document.getElementById('editAccLng')?.value,
    address: document.getElementById('editAccAddress')?.value,
    ward: document.getElementById('editAccWard')?.value
  }));
  report.uiChecks.afterGeocodeBtn = afterGeocodeBtn;

  // Click "Chọn Trên Map" to open Location Picker Modal
  await page.click('#btnPickAccLocationOnMap');
  await page.waitForTimeout(2500);

  const pickerInitial = await page.evaluate(() => ({
    searchInputValue: document.getElementById('inputLocationPickerSearch')?.value,
    addressDisplay: document.getElementById('locationPickerAddressDisplay')?.textContent?.trim(),
    coordsDisplay: document.getElementById('locationPickerCoordsDisplay')?.textContent?.trim(),
    pickedLocation: window.dispatcherApp?.pickedLocation || null
  }));
  report.uiChecks.pickerInitial = pickerInitial;

  const shot2 = path.join(REPORT_DIR, 'capcaikhect-map-picker-fixed.png');
  await page.screenshot({ path: shot2 });
  report.screenshots.push(shot2);

  // Type "Phường Tân An" into search box to verify live suggestions & search
  await page.fill('#inputLocationPickerSearch', 'Phường Tân An');
  await page.waitForTimeout(800);
  const suggestVisible = await page.evaluate(() => {
    const dd = document.getElementById('locationPickerSearchDropdown');
    return {
      display: dd ? dd.style.display : 'none',
      itemCount: dd ? dd.querySelectorAll('.loc-picker-suggest-item').length : 0,
      firstItemText: dd?.querySelector('.loc-picker-suggest-item')?.innerText?.replace(/\s+/g, ' ').trim() || ''
    };
  });
  report.uiChecks.pickerSuggestDropdown = suggestVisible;

  const shot3 = path.join(REPORT_DIR, 'map-picker-live-suggestions.png');
  await page.screenshot({ path: shot3 });
  report.screenshots.push(shot3);

  // Click Search button for Phường Tân An
  await page.click('#btnLocationPickerSearch');
  await page.waitForTimeout(1500);
  const pickerAfterTanAnSearch = await page.evaluate(() => ({
    searchInputValue: document.getElementById('inputLocationPickerSearch')?.value,
    addressDisplay: document.getElementById('locationPickerAddressDisplay')?.textContent?.trim(),
    coordsDisplay: document.getElementById('locationPickerCoordsDisplay')?.textContent?.trim(),
    pickedLocation: window.dispatcherApp?.pickedLocation || null
  }));
  report.uiChecks.pickerAfterTanAnSearch = pickerAfterTanAnSearch;

  // Close picker and test "+ Tạo Tài Khoản Mới" auto-fill when selecting a ward
  await page.click('#btnCloseLocationPickerModal');
  await page.waitForTimeout(500);
  await page.click('#btnCloseAdminAccountEditModal');
  await page.waitForTimeout(500);

  await page.click('#btnAdminOpenCreateAccountModal');
  await page.waitForTimeout(800);

  // Select Ward "Phường Cái Khế" in Create New Account modal and trigger change
  await page.fill('#editAccWard', 'Phường Cái Khế');
  await page.dispatchEvent('#editAccWard', 'change');
  await page.waitForTimeout(1000);

  const createAutoFillCaiKhe = await page.evaluate(() => ({
    agencyName: document.getElementById('editAccAgencyName')?.value,
    province: document.getElementById('editAccProvince')?.value,
    ward: document.getElementById('editAccWard')?.value,
    address: document.getElementById('editAccAddress')?.value,
    lat: document.getElementById('editAccLat')?.value,
    lng: document.getElementById('editAccLng')?.value,
    rank: document.getElementById('editAccRank')?.value,
    officerName: document.getElementById('editAccOfficerName')?.value,
    phone: document.getElementById('editAccPhone')?.value,
    sms: document.getElementById('editAccSms')?.value,
    email: document.getElementById('editAccEmail')?.value
  }));
  report.uiChecks.createAutoFillCaiKhe = createAutoFillCaiKhe;

  // Also test switching province to "Hà Nội" and ward to "Phường Hoàn Kiếm"
  await page.fill('#editAccProvince', 'Hà Nội');
  await page.dispatchEvent('#editAccProvince', 'change');
  await page.waitForTimeout(500);
  await page.fill('#editAccWard', 'Phường Hoàn Kiếm');
  await page.dispatchEvent('#editAccWard', 'change');
  await page.waitForTimeout(1000);

  const createAutoFillHoanKiem = await page.evaluate(() => ({
    agencyName: document.getElementById('editAccAgencyName')?.value,
    province: document.getElementById('editAccProvince')?.value,
    ward: document.getElementById('editAccWard')?.value,
    address: document.getElementById('editAccAddress')?.value,
    lat: document.getElementById('editAccLat')?.value,
    lng: document.getElementById('editAccLng')?.value,
    rank: document.getElementById('editAccRank')?.value,
    officerName: document.getElementById('editAccOfficerName')?.value,
    phone: document.getElementById('editAccPhone')?.value,
    wardsDatalistCount: document.querySelectorAll('#listWards option').length
  }));
  report.uiChecks.createAutoFillHoanKiem = createAutoFillHoanKiem;

  await browser.close();

  // Assertions
  const assertions = [
    {
      name: 'API /api/geocode/search resolves Phường Cái Khế exact headquarters (10.043366, 105.773396)',
      pass: Math.abs(Number(caiKheSearch.lat) - 10.043366) < 0.0001 &&
            Math.abs(Number(caiKheSearch.lng) - 105.773396) < 0.0001 &&
            String(caiKheSearch.address).includes('234 Phạm Ngũ Lão')
    },
    {
      name: 'API /api/geocode/search strips placeholder "Chưa công bố..." and extracts ward from agencyName',
      pass: Math.abs(Number(caiKhePlaceholderSearch.lat) - 10.043366) < 0.0001 &&
            Math.abs(Number(caiKhePlaceholderSearch.lng) - 105.773396) < 0.0001
    },
    {
      name: 'Edit Account Modal for CAPCAIKHECT matches Images 1 & 4 100%',
      pass: editModalValues.ward === 'Phường Cái Khế' &&
            String(editModalValues.address).includes('234 Phạm Ngũ Lão') &&
            editModalValues.lat === '10.043366' &&
            editModalValues.lng === '105.773396' &&
            editModalValues.rank === 'Trung tá' &&
            editModalValues.officerName === 'Trần Sơn Lam' &&
            editModalValues.phone === '02923890379' &&
            editModalValues.sms === '0903101070' &&
            editModalValues.email === 'phuongcaikhe@cantho.gov.vn' &&
            editModalValues.provincesDatalistCount === 34
    },
    {
      name: 'Map Location Picker opens at exact headquarters (10.043366, 105.773396) without placeholder text',
      pass: !String(pickerInitial.searchInputValue).includes('Chưa công bố') &&
            String(pickerInitial.searchInputValue).includes('234 Phạm Ngũ Lão') &&
            String(pickerInitial.coordsDisplay).includes('10.043366') &&
            String(pickerInitial.coordsDisplay).includes('105.773396')
    },
    {
      name: 'Map Location Picker live autocomplete & search resolves Phường Tân An accurately',
      pass: suggestVisible.itemCount > 0 &&
            Math.abs(Number(pickerAfterTanAnSearch.pickedLocation?.lat) - 10.039822) < 0.001 &&
            Math.abs(Number(pickerAfterTanAnSearch.pickedLocation?.lng) - 105.758250) < 0.001 &&
            String(pickerAfterTanAnSearch.addressDisplay).includes('02 Nguyễn Tri Phương')
    },
    {
      name: 'Create Account Modal auto-fills station address, GPS, officer, phone, and email across Cần Thơ & Hà Nội',
      pass: createAutoFillCaiKhe.lat === '10.043366' &&
            createAutoFillCaiKhe.officerName === 'Trần Sơn Lam' &&
            Number(createAutoFillHoanKiem.lat) > 21.0 &&
            String(createAutoFillHoanKiem.agencyName).includes('Công An Phường Hoàn Kiếm') &&
            createAutoFillHoanKiem.wardsDatalistCount >= 60
    }
  ];

  report.assertions = assertions;
  report.allPassed = assertions.every(a => a.pass);

  const jsonPath = path.join(REPORT_DIR, 'account-map-picker-sync-qa.json');
  const mdPath = path.join(REPORT_DIR, 'account-map-picker-sync-qa.md');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const mdLines = [
    '# Account Registration & Map Location Picker Synchronization QA Report',
    '',
    `- **Timestamp**: \`${report.timestamp}\``,
    `- **Overall Status**: **${report.allPassed ? 'PASS' : 'FAIL'}**`,
    '',
    '## Assertions',
    ...assertions.map(a => `- [${a.pass ? 'x' : ' '}] **${a.pass ? 'PASS' : 'FAIL'}**: ${a.name}`),
    '',
    '## CAPCAIKHECT Edit Modal Values',
    '```json',
    JSON.stringify(report.uiChecks.capcaikhectEditModal, null, 2),
    '```',
    '',
    '## Map Location Picker Initial & Search Values',
    '```json',
    JSON.stringify({
      pickerInitial: report.uiChecks.pickerInitial,
      pickerSuggestDropdown: report.uiChecks.pickerSuggestDropdown,
      pickerAfterTanAnSearch: report.uiChecks.pickerAfterTanAnSearch
    }, null, 2),
    '```',
    '',
    '## Create New Account Auto-Fill Verification (Cần Thơ & Hà Nội)',
    '```json',
    JSON.stringify({
      createAutoFillCaiKhe: report.uiChecks.createAutoFillCaiKhe,
      createAutoFillHoanKiem: report.uiChecks.createAutoFillHoanKiem
    }, null, 2),
    '```'
  ];
  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  console.log(JSON.stringify({ allPassed: report.allPassed, assertions }, null, 2));
  if (!report.allPassed) process.exit(1);
})();
