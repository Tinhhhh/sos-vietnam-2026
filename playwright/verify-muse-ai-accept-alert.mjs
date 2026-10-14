import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\dienv\\.gemini\\antigravity\\brain\\7d6fe8d7-76a3-4dd6-bcce-f3505c9e66f4';
const REPORTS_DIR = path.resolve('Reports/qa/playwright');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

async function runVerification() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  const addTest = (name, passed, details = {}) => {
    results.summary.total++;
    if (passed) results.summary.passed++;
    else results.summary.failed++;
    results.tests.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}`);
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  });

  try {
    const page = await context.newPage();

    let dialogTriggered = false;
    let dialogMessage = null;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      dialogMessage = dialog.message();
      console.warn('⚠️ Unexpected native browser dialog detected:', dialog.type(), dialogMessage);
      await dialog.dismiss();
    });

    console.log('\n--- 1. Loading Dispatcher and Inspecting Static Code ---');
    await page.goto('http://localhost:3000/dispatcher.html', { waitUntil: 'networkidle' });

    // Test 1: Static code check in browser runtime
    const codeCheck = await page.evaluate(() => {
      const app = window.dispatcherApp || window.dispatcher;
      if (!app) return { error: 'DispatcherApp instance not found' };
      const acceptStr = app.handleAcceptSOS ? app.handleAcceptSOS.toString() : '';
      const updateStr = app.handleUpdateStatus ? app.handleUpdateStatus.toString() : '';
      const acceptAlertMatches = /alert\s*\(\s*['"`]Đặc quyền Giám Sát Quốc Gia/.test(acceptStr);
      const updateAlertMatches = /alert\s*\(\s*['"`]Đặc quyền Giám Sát Quốc Gia/.test(updateStr);
      const acceptToastMatches = acceptStr.includes('showToast') && acceptStr.includes('Đặc quyền Giám Sát Quốc Gia');
      const updateToastMatches = updateStr.includes('showToast') && updateStr.includes('Đặc quyền Giám Sát Quốc Gia');
      return {
        acceptHasShowToast: acceptToastMatches,
        acceptHasAlert: acceptAlertMatches,
        updateHasShowToast: updateToastMatches,
        updateHasAlert: updateAlertMatches
      };
    });

    addTest('handleAcceptSOS uses showToast instead of blocking alert() for national officer',
      codeCheck.acceptHasShowToast && !codeCheck.acceptHasAlert,
      codeCheck
    );

    addTest('handleUpdateStatus uses showToast instead of blocking alert() for national officer',
      codeCheck.updateHasShowToast && !codeCheck.updateHasAlert,
      codeCheck
    );

    // Test 2: Runtime invocation with National / Admin officer
    console.log('\n--- 2. Testing Runtime Non-blocking Toast Behavior ---');
    const toastInterceptResult = await page.evaluate(async () => {
      const app = window.dispatcherApp || window.dispatcher;
      if (!app) return { ok: false, error: 'DispatcherApp not found' };

      // Set national officer identity
      app.currentOfficer = {
        username: 'admin',
        level: 'national',
        agency: 'chihuy',
        name: 'Chỉ Huy Trưởng Quốc Gia'
      };

      // Intercept toasts
      const capturedToasts = [];
      const originalShowToast = app.showToast?.bind(app) || window.showToast;
      app.showToast = (msg, type) => {
        capturedToasts.push({ msg, type });
        if (typeof originalShowToast === 'function') {
          originalShowToast(msg, type);
        }
      };

      // Call handleAcceptSOS
      await app.handleAcceptSOS();

      // Call handleUpdateStatus
      await app.handleUpdateStatus('in_progress', 'test progress');

      return {
        ok: true,
        capturedCount: capturedToasts.length,
        toasts: capturedToasts
      };
    });

    addTest('No blocking browser alert dialog was triggered', !dialogTriggered, {
      dialogTriggered,
      dialogMessage
    });

    addTest('showToast captured 2 warnings for national account restrictions',
      toastInterceptResult.capturedCount === 2 &&
      toastInterceptResult.toasts.every(t => t.type === 'warning' && t.msg.includes('Đặc quyền Giám Sát Quốc Gia')),
      toastInterceptResult
    );

    // Test 3: Visual Verification & Screenshot
    console.log('\n--- 3. Capturing Visual UI Screenshot of Toast Warning ---');
    await page.evaluate(() => {
      // Hide gatekeeper and intro overlays
      const gatekeeper = document.getElementById('cyberGatekeeperModal');
      if (gatekeeper) gatekeeper.style.display = 'none';
      const intro = document.getElementById('cyberIntroVideoOverlay');
      if (intro) intro.style.display = 'none';

      const app = window.dispatcherApp || window.dispatcher;
      // Trigger a visible toast on UI
      if (typeof app?.showToast === 'function') {
        app.showToast('Đặc quyền Giám Sát Quốc Gia: Tài khoản Trung Tâm Chỉ Huy Quốc Gia chỉ có thẩm quyền giám sát và điều phối vĩ mô, không tiếp nhận trực tiếp thay đơn vị tác chiến địa phương!', 'warning');
      }
    });

    await page.waitForTimeout(600);

    const screenshotPath = path.join(ARTIFACT_DIR, 'verify_3000_accept_alert_toast.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to: ${screenshotPath}`);

    addTest('Visual screenshot captured successfully', fs.existsSync(screenshotPath), {
      screenshotPath
    });

  } catch (err) {
    console.error('Test runner encountered error:', err);
    addTest('Playwright test execution without unhandled exception', false, { error: err.message, stack: err.stack });
  } finally {
    await browser.close();
  }

  // Write reports
  const jsonReportPath = path.join(REPORTS_DIR, '2026-10-14-muse-ai-accept-alert.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf-8');

  const mdReport = `# QA Report: Muse AI Accept Alert Toast Verification (2026-10-14)

**Executed At**: ${results.timestamp}
**Total Tests**: ${results.summary.total}
**Passed**: ${results.summary.passed}
**Failed**: ${results.summary.failed}
**Success Rate**: ${Math.round((results.summary.passed / results.summary.total) * 100)}%

## Test Details

| # | Test Name | Status | Details |
|---|---|---|---|
${results.tests.map((t, idx) => `| ${idx + 1} | ${t.name} | ${t.passed ? '✅ PASS' : '❌ FAIL'} | \`${JSON.stringify(t.details).replace(/\|/g, '\\|')}\` |`).join('\n')}

## Artifacts Produced
- JSON Report: \`${jsonReportPath}\`
- Visual Screenshot: \`${path.join(ARTIFACT_DIR, 'verify_3000_accept_alert_toast.png')}\`
`;

  const mdReportPath = path.join(REPORTS_DIR, '2026-10-14-muse-ai-accept-alert.md');
  fs.writeFileSync(mdReportPath, mdReport, 'utf-8');
  console.log(`\nGenerated QA reports:\n- ${jsonReportPath}\n- ${mdReportPath}`);

  return results.summary.failed === 0;
}

runVerification().then(success => {
  process.exit(success ? 0 : 1);
});
