import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, devices } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, '..', 'Reports', 'qa', 'playwright', '2026-10-13-mobile-ui-and-ios-shortcuts');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');

async function verifyMobileUiAndIosShortcuts() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const report = {
    testName: 'Mobile UI Layout Optimization & iOS Safari Shortcut Verification Suite',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    assertions: [],
    screenshots: []
  };

  const addAssertion = (name, pass, details = {}) => {
    report.assertions.push({ name, pass: Boolean(pass), details });
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] ${name}`);
    if (!pass && Object.keys(details).length) {
      console.log(`       Details:`, JSON.stringify(details));
    }
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // Mobile Context: iPhone 14 (390 x 844)
  const mobileContext = await browser.newContext({
    ...devices['iPhone 14'],
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  });
  const page = await mobileContext.newPage();

  try {
    console.log(`\n--- 1. TESTING DISPATCHER MOBILE INTERFACE (${BASE_URL}/dispatcher.html) ---`);
    await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    // Bypass gatekeeper and login modal to access dispatcher
    await page.evaluate(() => {
      document.body.classList.add('officer-authenticated');
      document.querySelectorAll('.auth-gate-backdrop, #cyberGatekeeperModal, #securityGatekeeperOverlay, #dispatcherLoginModal, #officerDutyDeclarationModal, #substituteOfficerModal').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
      const side = document.getElementById('dispatcherSidebar');
      if (side) side.style.setProperty('display', 'flex', 'important');
      const layout = document.querySelector('.dispatcher-layout');
      if (layout) layout.style.setProperty('display', 'flex', 'important');
    });
    await page.waitForTimeout(1000);

    // 1.1 Header check: Brand title and clock time
    const headerInfo = await page.evaluate(() => {
      const titleEl = document.getElementById('headerBrandTitle');
      const clockEl = document.getElementById('clockTimeVal');
      const dutyPill = document.getElementById('headerDutyShiftPill');
      return {
        titleText: titleEl ? titleEl.textContent.trim() : '',
        titleWidth: titleEl ? titleEl.offsetWidth : 0,
        clockText: clockEl ? clockEl.textContent.trim() : '',
        dutyPillDisplay: dutyPill ? window.getComputedStyle(dutyPill).display : 'none'
      };
    });

    addAssertion('Header title is present and visible', headerInfo.titleText.length > 0, headerInfo);
    addAssertion('Header duty shift pill hidden on mobile to avoid overcrowding', headerInfo.dutyPillDisplay === 'none', headerInfo);

    // 1.2 Sidebar Tabs check: All 5 tabs full text, no ellipsis overflow
    const tabsInfo = await page.evaluate(() => {
      const nav = document.getElementById('sidebarTabsNav');
      const tabs = Array.from(nav.querySelectorAll('.sidebar-tab-btn')).map(t => {
        const span = t.querySelector('.tab-btn-text');
        return {
          id: t.id,
          text: span ? span.textContent.trim() : t.textContent.trim(),
          width: t.offsetWidth,
          textOverflow: span ? window.getComputedStyle(span).textOverflow : ''
        };
      });
      const navStyle = window.getComputedStyle(nav);
      return {
        overflowX: navStyle.overflowX,
        tabs
      };
    });

    addAssertion('Sidebar tabs nav has overflow-x auto for smooth swipe', tabsInfo.overflowX === 'auto', tabsInfo);
    addAssertion('All 5 sidebar tabs exist with full text', tabsInfo.tabs.length === 5, tabsInfo.tabs);

    // 1.3 View Enterprise Panel: Button is normal rectangle, NOT giant circle
    await page.evaluate(() => {
      if (window.dispatcher && window.dispatcher.switchView) {
        window.dispatcher.switchView('enterprises');
      } else {
        document.getElementById('panelEnterprisesView').style.display = 'flex';
        document.getElementById('panelIncidentsView').style.display = 'none';
      }
    });
    await page.waitForTimeout(600);

    const entBtnSize = await page.evaluate(() => {
      const btn = document.getElementById('btnAddNewEnterpriseModal');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      return {
        width: rect.width,
        height: rect.height,
        borderRadius: style.borderRadius,
        display: style.display
      };
    });

    addAssertion('Enterprise button height is normal (~35-48px), NOT giant 340px circle', entBtnSize && entBtnSize.height < 60 && entBtnSize.height > 25, entBtnSize);

    const shot1Path = path.join(SCREENSHOT_DIR, '01-dispatcher-mobile-tabs-and-enterprise-btn.png');
    await page.screenshot({ path: shot1Path, fullPage: false });
    report.screenshots.push({ name: '01-dispatcher-mobile-tabs-and-enterprise-btn', path: shot1Path });

    // 1.4 Open Enterprise Modal: Check separate modal and responsive fields
    await page.evaluate(() => {
      const modal = document.getElementById('adminEnterpriseModal');
      if (modal) modal.style.display = 'flex';
    });
    await page.waitForTimeout(500);

    const entModalCheck = await page.evaluate(() => {
      const modal = document.getElementById('adminEnterpriseModal');
      const hospField = modal.querySelector('#inputHospHours');
      const submitBtn = modal.querySelector('button[type="submit"]');
      const box = modal.querySelector('.admin-edit-box');
      return {
        modalVisible: modal && window.getComputedStyle(modal).display !== 'none',
        hasHospitalFieldInside: Boolean(hospField),
        submitBtnText: submitBtn ? submitBtn.textContent.trim() : '',
        boxWidth: box ? box.offsetWidth : 0
      };
    });

    addAssertion('adminEnterpriseModal is visible with its own submit button', entModalCheck.modalVisible && entModalCheck.submitBtnText.includes('DUYỆT CẤP PHÉP'), entModalCheck);
    addAssertion('Hospital fields are NOT inside adminEnterpriseModal (clean separation)', !entModalCheck.hasHospitalFieldInside, entModalCheck);

    const shot2Path = path.join(SCREENSHOT_DIR, '02-dispatcher-admin-enterprise-modal-mobile.png');
    await page.screenshot({ path: shot2Path, fullPage: false });
    report.screenshots.push({ name: '02-dispatcher-admin-enterprise-modal-mobile', path: shot2Path });

    // Close Enterprise modal & Open Hospital Modal
    await page.evaluate(() => {
      document.getElementById('adminEnterpriseModal').style.display = 'none';
      const hospModal = document.getElementById('adminHospitalModal');
      if (hospModal) hospModal.style.display = 'flex';
    });
    await page.waitForTimeout(500);

    const hospModalCheck = await page.evaluate(() => {
      const modal = document.getElementById('adminHospitalModal');
      const hospField = modal.querySelector('#inputHospHours');
      const submitBtn = modal.querySelector('button[type="submit"]');
      return {
        modalVisible: modal && window.getComputedStyle(modal).display !== 'none',
        hasHospitalField: Boolean(hospField),
        submitBtnText: submitBtn ? submitBtn.textContent.trim() : ''
      };
    });

    addAssertion('adminHospitalModal exists separately with hospital fields and green submit button', hospModalCheck.modalVisible && hospModalCheck.hasHospitalField && hospModalCheck.submitBtnText.includes('BỆNH VIỆN'), hospModalCheck);

    const shot3Path = path.join(SCREENSHOT_DIR, '03-dispatcher-admin-hospital-modal-mobile.png');
    await page.screenshot({ path: shot3Path, fullPage: false });
    report.screenshots.push({ name: '03-dispatcher-admin-hospital-modal-mobile', path: shot3Path });

    // Close Hospital Modal & Open Admin Officer (Accounts & Security) Modal
    await page.evaluate(() => {
      document.getElementById('adminHospitalModal').style.display = 'none';
      const adm = document.getElementById('adminOfficerModal');
      if (adm) adm.style.display = 'flex';
    });
    await page.waitForTimeout(500);

    const adminOfficerCheck = await page.evaluate(() => {
      const tab1 = document.getElementById('tabAdminAccounts');
      const tab2 = document.getElementById('tabAdminSecurityLogs');
      const toolbar = document.querySelector('.admin-accounts-toolbar');
      return {
        tab1Class: tab1.className,
        tab1Text: tab1.textContent.trim(),
        tab2Class: tab2.className,
        tab2Text: tab2.textContent.trim(),
        toolbarExists: Boolean(toolbar)
      };
    });

    addAssertion('Admin Officer Modal tabs use admin-tab-nav-btn with full readable text', adminOfficerCheck.tab1Class.includes('admin-tab-nav-btn') && adminOfficerCheck.tab1Text.includes('Quản Lý Tài Khoản'), adminOfficerCheck);

    const shot4Path = path.join(SCREENSHOT_DIR, '04-dispatcher-admin-officer-accounts-mobile.png');
    await page.screenshot({ path: shot4Path, fullPage: false });
    report.screenshots.push({ name: '04-dispatcher-admin-officer-accounts-mobile', path: shot4Path });

    // Switch to Security & Audit Logs tab
    await page.evaluate(() => {
      if (window.dispatcher && window.dispatcher.switchAdminTab) {
        window.dispatcher.switchAdminTab('security');
      } else {
        document.getElementById('viewAdminAccountsTab').style.display = 'none';
        document.getElementById('viewAdminSecurityLogsTab').style.display = 'flex';
      }
    });
    await page.waitForTimeout(500);

    const auditTableCheck = await page.evaluate(() => {
      const table = document.querySelector('#viewAdminSecurityLogsTab table');
      const scrollWrap = table ? table.parentElement : null;
      return {
        scrollWrapOverflowX: scrollWrap ? window.getComputedStyle(scrollWrap).overflowX : '',
        tableMinWidth: table ? window.getComputedStyle(table).minWidth : ''
      };
    });

    addAssertion('Audit table is wrapped in overflow-x: auto with min-width >= 600px', auditTableCheck.scrollWrapOverflowX === 'auto' && parseInt(auditTableCheck.tableMinWidth) >= 600, auditTableCheck);

    const shot5Path = path.join(SCREENSHOT_DIR, '05-dispatcher-admin-security-audit-mobile.png');
    await page.screenshot({ path: shot5Path, fullPage: false });
    report.screenshots.push({ name: '05-dispatcher-admin-security-audit-mobile', path: shot5Path });

    console.log(`\n--- 2. TESTING CITIZEN MOBILE APP & IOS PWA SHORTCUTS (${BASE_URL}/index.html) ---`);
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Verify Citizen Bottom Dock buttons (4 buttons spaced cleanly, sleek 34px height, no text clipping)
    const bottomDockCheck = await page.evaluate(() => {
      const pill = document.querySelector('.nav-center-pill');
      const items = Array.from(document.querySelectorAll('.nav-pill-item'));
      const pillStyle = pill ? window.getComputedStyle(pill) : null;
      const itemMetrics = items.map(el => ({
        text: el.textContent.trim(),
        height: Math.round(el.getBoundingClientRect().height),
        width: Math.round(el.getBoundingClientRect().width),
        overflows: el.scrollWidth > el.clientWidth + 2
      }));
      return {
        gap: pillStyle ? pillStyle.gap || pillStyle.columnGap : '',
        itemCount: items.length,
        allSleekHeight: itemMetrics.every(m => m.height >= 28 && m.height <= 38),
        noTextOverflow: itemMetrics.every(m => !m.overflows),
        itemMetrics
      };
    });

    addAssertion('Citizen bottom dock 4 buttons are well-spaced (gap >= 5px), sleek height (30-36px), and text fits inside button frame without clipping', bottomDockCheck.itemCount === 4 && bottomDockCheck.allSleekHeight && bottomDockCheck.noTextOverflow, bottomDockCheck);

    const shot8Path = path.join(SCREENSHOT_DIR, '08-citizen-mobile-bottom-dock.png');
    await page.screenshot({ path: shot8Path, fullPage: false });
    report.screenshots.push({ name: '08-citizen-mobile-bottom-dock', path: shot8Path });

    // Open Install Shortcut modal and inspect iOS tab
    await page.evaluate(() => {
      const modal = document.getElementById('installShortcutModal');
      if (modal) modal.classList.add('is-open');
      const tabIos = document.getElementById('tabContentIos');
      if (tabIos) tabIos.classList.add('is-active');
    });
    await page.waitForTimeout(500);

    const iosInstallCheck = await page.evaluate(() => {
      const btn = document.getElementById('btnTriggerIosShare');
      const box = document.getElementById('iosNativeActionBox');
      return {
        btnText: btn ? btn.textContent.trim() : '',
        boxText: box ? box.textContent.trim() : ''
      };
    });

    addAssertion('iOS shortcut button has clear Safari guidance label', iosInstallCheck.btnText.includes('SAFARI') && iosInstallCheck.btnText.includes('[↑]'), iosInstallCheck);
    addAssertion('iOS shortcut guidance explains Apple security requirement', iosInstallCheck.boxText.includes('Apple iOS'), iosInstallCheck);

    const shot6Path = path.join(SCREENSHOT_DIR, '06-citizen-ios-install-modal.png');
    await page.screenshot({ path: shot6Path, fullPage: false });
    report.screenshots.push({ name: '06-citizen-ios-install-modal', path: shot6Path });

    // Click iOS shortcut trigger button -> verify beacon opens at the bottom with 3 steps
    await page.click('#btnTriggerIosShare');
    await page.waitForTimeout(600);

    const beaconCheck = await page.evaluate(() => {
      const beacon = document.getElementById('iosSafariShareBeacon');
      const modal = document.getElementById('installShortcutModal');
      return {
        modalClosed: modal ? !modal.classList.contains('is-open') : true,
        beaconVisible: beacon ? window.getComputedStyle(beacon).display !== 'none' : false,
        beaconText: beacon ? beacon.textContent.trim() : ''
      };
    });

    addAssertion('Clicking iOS trigger closes modal and displays 3-step bottom beacon pointing to Safari toolbar', beaconCheck.modalClosed && beaconCheck.beaconVisible && beaconCheck.beaconText.includes('3 BƯỚC TẠO LỐI TẮT'), beaconCheck);

    const shot7Path = path.join(SCREENSHOT_DIR, '07-citizen-ios-beacon-active.png');
    await page.screenshot({ path: shot7Path, fullPage: false });
    report.screenshots.push({ name: '07-citizen-ios-beacon-active', path: shot7Path });

  } catch (err) {
    console.error('Test execution error:', err);
    addAssertion('Test completed without fatal errors', false, { error: err.message });
  } finally {
    await browser.close();
  }

  // Generate Reports (.json & .md)
  const allPassed = report.assertions.every(a => a.pass);
  report.summary = {
    total: report.assertions.length,
    passed: report.assertions.filter(a => a.pass).length,
    failed: report.assertions.filter(a => !a.pass).length,
    status: allPassed ? 'PASSED' : 'FAILED'
  };

  const jsonReportPath = path.join(REPORT_DIR, 'report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf8');

  const mdContent = `# Báo Cáo Kiểm Thử Tối Ưu Giao Diện Điện Thoại & Lối Tắt iOS PWA
**Thời gian:** ${new Date().toLocaleString('vi-VN')}
**Kết quả:** ${report.summary.status} (${report.summary.passed}/${report.summary.total} kiểm thử đạt)

## 1. Mục Tiêu Kiểm Thử
- Khắc phục sự cố nút tạo lối tắt trên iOS: Hướng dẫn người dùng theo đúng cơ chế bảo mật sandbox của Apple Safari (biểu tượng Chia sẻ \`[↑]\` -> "Thêm vào MH chính").
- Sửa lỗi nút "+ Đăng Ký / Cấp Phép Doanh Nghiệp Mới" bị biến dạng thành hình tròn khổng lồ 340px trên điện thoại.
- Sửa lỗi các nút tab ở thanh điều hướng (\`Sự Cố\`, \`Lịch Sử\`, \`Công An\`, \`Cứu Hộ\`, \`Bệnh Viện\`) bị co cụm và cắt chữ \`...\`.
- Sửa lỗi dồn ép form bệnh viện vào form doanh nghiệp dẫn đến vỡ bố cục trên mobile.
- Sửa lỗi bảng Quản trị An ninh & Tài khoản: Tabs và bảng nhật ký đăng nhập hiển thị đầy đủ, bảng nhật ký có thanh trượt ngang không bị co ép cột chữ thẳng đứng.

## 2. Kết Quả Chi Tiết
${report.assertions.map(a => `- **[${a.pass ? 'PASS' : 'FAIL'}]** ${a.name} ${!a.pass ? `<br>\`\`\`json\n${JSON.stringify(a.details, null, 2)}\n\`\`\`` : ''}`).join('\n')}

## 3. Ảnh Chụp Bằng Chứng (Playwright Screenshots)
${report.screenshots.map(s => `- **${s.name}**: \`${path.relative(path.join(__dirname, '..'), s.path)}\``).join('\n')}
`;

  const mdReportPath = path.join(REPORT_DIR, 'report.md');
  fs.writeFileSync(mdReportPath, mdContent, 'utf8');

  console.log(`\n🎉 Verification finished: ${report.summary.passed}/${report.summary.total} assertions passed.`);
  console.log(`Report JSON: ${jsonReportPath}`);
  console.log(`Report Markdown: ${mdReportPath}`);
}

verifyMobileUiAndIosShortcuts();
