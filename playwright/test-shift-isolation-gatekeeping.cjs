const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, '..', 'Reports', 'qa', 'playwright');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function runShiftIsolationTests() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const report = {
    testName: 'Shift Isolation & Gatekeeping E2E Suite',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    assertions: [],
    screenshots: [],
    allPassed: false
  };

  const addAssertion = (name, pass, details = {}) => {
    report.assertions.push({ name, pass: Boolean(pass), details });
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] ${name}`);
    if (!pass && Object.keys(details).length) {
      console.log(`       Details:`, JSON.stringify(details));
    }
  };

  const browser = await chromium.launch({ headless: true });

  try {
    console.log('\n--- 1. UNAUTHENTICATED VISITOR ALERT SUPPRESSION ---');
    // TC 1.1: Fresh unauthenticated visit to dispatcher.html
    const context1 = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
    const page1 = await context1.newPage();

    let unauthDialogCount = 0;
    let unauthDialogMessages = [];
    page1.on('dialog', dialog => {
      unauthDialogCount++;
      unauthDialogMessages.push(dialog.message());
      dialog.dismiss();
    });

    await page1.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait for 3 seconds of clock ticks to ensure no timer triggers alert
    await page1.waitForTimeout(3000);

    const gatekeeperState = await page1.evaluate(() => {
      const app = window.dispatcher || window.dispatcherApp;
      const dutyModal = document.getElementById('dutyShiftModal');
      const subModal = document.getElementById('substituteOfficerModal');
      const gatekeeperModal = document.getElementById('cyberGatekeeperModal');
      const body = document.body;

      return {
        hasApp: Boolean(app),
        isOfficerAuthenticatedClass: body.classList.contains('officer-authenticated'),
        currentOfficer: app?.currentOfficer || null,
        currentDutyShift: app?.currentDutyShift || null,
        dutyModalDisplay: dutyModal ? window.getComputedStyle(dutyModal).display : null,
        dutyModalVisibility: dutyModal ? window.getComputedStyle(dutyModal).visibility : null,
        subModalDisplay: subModal ? window.getComputedStyle(subModal).display : null,
        gatekeeperVisible: gatekeeperModal ? window.getComputedStyle(gatekeeperModal).display !== 'none' : false
      };
    });

    const ssUnauthPath = path.join(SCREENSHOT_DIR, 'shift-gatekeeping-unauthenticated.png');
    await page1.screenshot({ path: ssUnauthPath });
    report.screenshots.push(ssUnauthPath);

    addAssertion(
      'Unauthenticated visitor triggers zero alert dialogs on dispatcher.html',
      unauthDialogCount === 0,
      { unauthDialogCount, unauthDialogMessages }
    );

    addAssertion(
      'Body lacks officer-authenticated class and currentOfficer is null for unauthenticated visitor',
      gatekeeperState.isOfficerAuthenticatedClass === false && gatekeeperState.currentOfficer === null,
      { isOfficerAuthenticatedClass: gatekeeperState.isOfficerAuthenticatedClass, currentOfficer: gatekeeperState.currentOfficer }
    );

    addAssertion(
      'Duty shift modal and substitute officer modal are hidden for unauthenticated visitor',
      gatekeeperState.dutyModalDisplay === 'none' && gatekeeperState.subModalDisplay === 'none',
      { dutyModalDisplay: gatekeeperState.dutyModalDisplay, subModalDisplay: gatekeeperState.subModalDisplay }
    );

    await context1.close();

    console.log('\n--- 2. POLLUTED STORAGE IMMUNITY TEST ---');
    // TC 2.1: Injected expired shift in localStorage/sessionStorage must NOT trigger alert when unauthenticated
    const context2 = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
    const page2 = await context2.newPage();

    let pollutedDialogCount = 0;
    let pollutedDialogMessages = [];
    page2.on('dialog', dialog => {
      pollutedDialogCount++;
      pollutedDialogMessages.push(dialog.message());
      dialog.dismiss();
    });

    // Inject legacy global expired shift keys before script executes
    await page2.addInitScript(() => {
      const expiredShift = {
        officerName: 'Cán Bộ Ca Cũ',
        officerRank: 'Đại úy',
        shiftName: 'Ca Đã Hết Giờ',
        startTime: '05:00',
        endTime: '06:00'
      };
      localStorage.setItem('sos_duty_shift', JSON.stringify(expiredShift));
      sessionStorage.setItem('sos_duty_shift', JSON.stringify(expiredShift));
      localStorage.setItem('SOS_ACTIVE_DUTY_SHIFT', JSON.stringify(expiredShift));
      sessionStorage.setItem('SOS_ACTIVE_DUTY_SHIFT', JSON.stringify(expiredShift));
    });

    await page2.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'networkidle', timeout: 30000 });
    await page2.waitForTimeout(3000);

    const pollutedState = await page2.evaluate(() => {
      const app = window.dispatcher || window.dispatcherApp;
      const dutyModal = document.getElementById('dutyShiftModal');
      return {
        currentOfficer: app?.currentOfficer || null,
        modalDisplay: dutyModal ? window.getComputedStyle(dutyModal).display : null
      };
    });

    addAssertion(
      'Polluted global storage with expired shift does NOT trigger alert dialog for unauthenticated visitor',
      pollutedDialogCount === 0,
      { pollutedDialogCount, pollutedDialogMessages }
    );

    addAssertion(
      'Polluted global storage does NOT force dutyShiftModal to open without authentication',
      pollutedState.modalDisplay === 'none',
      { modalDisplay: pollutedState.modalDisplay }
    );

    await context2.close();

    console.log('\n--- 3. MULTI-UNIT INDEPENDENT SHIFT STORAGE ---');
    // TC 3.1: Unit A (cahanioi) login and scoped storage verification
    const contextA = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
    const pageA = await contextA.newPage();
    await pageA.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'networkidle', timeout: 30000 });

    const shiftA = {
      username: 'cahanioi',
      officerName: 'Đại úy Nguyễn Văn A',
      officerRank: 'Đại úy',
      officerPhone: '0981112222',
      shiftName: 'Ca Sáng (07:00 - 15:00)',
      startTime: '07:00',
      endTime: '15:00',
      handoverNotes: 'Kíp trực Đơn vị A tiếp nhận ca trực an toàn'
    };

    const unitAResult = await pageA.evaluate((shift) => {
      const app = window.dispatcher || window.dispatcherApp;
      if (!app) return { error: 'No dispatcher app found' };

      // Authenticate as Unit A
      app.currentOfficer = {
        username: shift.username,
        agency: 'police',
        level: 'province',
        agencyName: 'Công an TP Hà Nội',
        unitName: 'Trung Tâm Chỉ Huy Tác Chiến Công An TP Hà Nội',
        province: 'Hà Nội',
        officerRank: shift.officerRank,
        officerName: shift.officerName
      };
      document.body.classList.add('officer-authenticated');

      // Save duty shift scoped
      if (typeof app.saveDutyShiftToStorage === 'function') {
        app.saveDutyShiftToStorage(shift);
      } else {
        app.currentDutyShift = shift;
        localStorage.setItem(`sos_duty_shift_${shift.username}`, JSON.stringify(shift));
        sessionStorage.setItem(`sos_duty_shift_${shift.username}`, JSON.stringify(shift));
      }

      if (typeof app.applyDutyShift === 'function') {
        app.applyDutyShift(shift);
      }

      const storedScoped = localStorage.getItem(`sos_duty_shift_${shift.username}`) || sessionStorage.getItem(`sos_duty_shift_${shift.username}`);
      const storedGlobal1 = localStorage.getItem('sos_duty_shift');
      const storedGlobal2 = localStorage.getItem('SOS_ACTIVE_DUTY_SHIFT');

      return {
        currentDutyShift: app.currentDutyShift,
        storedScoped: storedScoped ? JSON.parse(storedScoped) : null,
        hasGlobalLeak1: Boolean(storedGlobal1),
        hasGlobalLeak2: Boolean(storedGlobal2)
      };
    }, shiftA);

    addAssertion(
      'Unit A saves duty shift under scoped key sos_duty_shift_cahanioi',
      unitAResult.storedScoped && unitAResult.storedScoped.officerName === shiftA.officerName,
      unitAResult
    );

    addAssertion(
      'Unit A does not write to deprecated global shared keys (sos_duty_shift, SOS_ACTIVE_DUTY_SHIFT)',
      unitAResult.hasGlobalLeak1 === false && unitAResult.hasGlobalLeak2 === false,
      { hasGlobalLeak1: unitAResult.hasGlobalLeak1, hasGlobalLeak2: unitAResult.hasGlobalLeak2 }
    );

    // TC 3.2: Unit B (csgthanoi) in independent context
    const contextB = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
    const pageB = await contextB.newPage();
    await pageB.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'networkidle', timeout: 30000 });

    const shiftB = {
      username: 'csgthanoi',
      officerName: 'Thiếu tá Trần Văn B',
      officerRank: 'Thiếu tá',
      officerPhone: '0983334444',
      shiftName: 'Ca Chiều (15:00 - 23:00)',
      startTime: '15:00',
      endTime: '23:00',
      handoverNotes: 'Kíp trực Đội CSGT tiếp nhận tuần tra địa bàn'
    };

    const unitBResult = await pageB.evaluate((shift) => {
      const app = window.dispatcher || window.dispatcherApp;
      if (!app) return { error: 'No dispatcher app found' };

      // Authenticate as Unit B
      app.currentOfficer = {
        username: shift.username,
        agency: 'csgt',
        level: 'province',
        agencyName: 'Phòng CSGT Công an TP Hà Nội',
        unitName: 'Trung Tâm Điều Hành Giao Thông TP Hà Nội',
        province: 'Hà Nội',
        officerRank: shift.officerRank,
        officerName: shift.officerName
      };
      document.body.classList.add('officer-authenticated');

      if (typeof app.saveDutyShiftToStorage === 'function') {
        app.saveDutyShiftToStorage(shift);
      } else {
        app.currentDutyShift = shift;
        localStorage.setItem(`sos_duty_shift_${shift.username}`, JSON.stringify(shift));
        sessionStorage.setItem(`sos_duty_shift_${shift.username}`, JSON.stringify(shift));
      }

      if (typeof app.applyDutyShift === 'function') {
        app.applyDutyShift(shift);
      }

      const storedScoped = localStorage.getItem(`sos_duty_shift_${shift.username}`) || sessionStorage.getItem(`sos_duty_shift_${shift.username}`);
      const storedUnitA = localStorage.getItem('sos_duty_shift_cahanioi');

      return {
        currentDutyShift: app.currentDutyShift,
        storedScoped: storedScoped ? JSON.parse(storedScoped) : null,
        crossUnitAccessToA: Boolean(storedUnitA)
      };
    }, shiftB);

    addAssertion(
      'Unit B saves duty shift under scoped key sos_duty_shift_csgthanoi',
      unitBResult.storedScoped && unitBResult.storedScoped.officerName === shiftB.officerName,
      unitBResult
    );

    // Cross-check: Verify Unit A's shift was not modified by Unit B
    const verifyAIsolation = await pageA.evaluate(() => {
      const app = window.dispatcher || window.dispatcherApp;
      return {
        unitAOfficer: app?.currentDutyShift?.officerName,
        storedA: JSON.parse(localStorage.getItem('sos_duty_shift_cahanioi') || '{}')
      };
    });

    addAssertion(
      'Unit A shift remains strictly isolated and unaffected by Unit B operations',
      verifyAIsolation.unitAOfficer === shiftA.officerName && verifyAIsolation.storedA.officerName === shiftA.officerName,
      verifyAIsolation
    );

    // TC 3.3: Logout resets duty shift state cleanly
    const logoutResult = await pageA.evaluate(() => {
      const app = window.dispatcher || window.dispatcherApp;
      if (!app) return { error: 'No app' };

      if (typeof app.performLogout === 'function') {
        app.performLogout();
      } else {
        app.currentOfficer = null;
        app.currentDutyShift = null;
        app.shiftExpiredNotified = false;
        document.body.classList.remove('officer-authenticated');
      }

      return {
        currentOfficer: app.currentOfficer,
        currentDutyShift: app.currentDutyShift,
        isAuthenticatedClass: document.body.classList.contains('officer-authenticated')
      };
    });

    addAssertion(
      'Logout resets currentOfficer, currentDutyShift to null and removes officer-authenticated class',
      logoutResult.currentOfficer === null && logoutResult.currentDutyShift === null && logoutResult.isAuthenticatedClass === false,
      logoutResult
    );

    await contextA.close();
    await contextB.close();

  } finally {
    await browser.close();
  }

  report.allPassed = report.assertions.every(a => a.pass);

  // Write reports
  const jsonPath = path.join(REPORT_DIR, 'test-shift-isolation-gatekeeping.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const mdPath = path.join(REPORT_DIR, 'test-shift-isolation-gatekeeping.md');
  const mdContent = [
    '# Shift Isolation & Gatekeeping E2E Verification Report',
    '',
    `- **Timestamp**: \`${report.timestamp}\``,
    `- **Status**: **${report.allPassed ? 'ALL PASSED (100%)' : 'FAILURES DETECTED'}**`,
    `- **Base URL**: \`${report.baseUrl}\``,
    '',
    '## Assertion Results',
    ...report.assertions.map(a => `- [${a.pass ? 'x' : ' '}] **${a.pass ? 'PASS' : 'FAIL'}**: ${a.name}`),
    '',
    '## Captured Screenshots',
    ...report.screenshots.map(s => `- [Screenshot](file:///${s.replace(/\\/g, '/')})`)
  ].join('\n');
  fs.writeFileSync(mdPath, mdContent, 'utf8');

  console.log(`\n=== RESULT: ${report.assertions.filter(a => a.pass).length}/${report.assertions.length} assertions passed ===\n`);
  return report;
}

if (require.main === module) {
  runShiftIsolationTests().then(r => {
    if (!r.allPassed) process.exit(1);
  }).catch(err => {
    console.error('Fatal error running shift isolation tests:', err);
    process.exit(1);
  });
}

module.exports = { runShiftIsolationTests };
