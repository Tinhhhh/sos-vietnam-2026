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
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  });

  try {
    // Test 1: Verify TURN credentials API endpoint
    console.log('\n--- 1. Testing GET /api/turn/credentials ---');
    const apiRes = await context.request.get('http://localhost:3000/api/turn/credentials');
    const apiJson = await apiRes.json();
    const isApiOk = apiRes.status() === 200 && apiJson.ok === false && apiJson.reason === 'TURN not configured';
    addTest('TURN Endpoint Responds with STUN Fallback Status', isApiOk, { status: apiRes.status(), body: apiJson });

    // Test 2: Verify Citizen UI & Picture-in-Picture Remote Video Element
    console.log('\n--- 2. Testing Citizen UI & PiP Elements on http://localhost:3000 ---');
    const citizenPage = await context.newPage();
    await citizenPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await citizenPage.waitForTimeout(1000);

    const remoteVideoCount = await citizenPage.locator('#citizenRemoteVideoElement').count();
    const remoteLabelCount = await citizenPage.locator('#citizenRemoteVideoLabel').count();
    const labelText = remoteLabelCount > 0 ? await citizenPage.locator('#citizenRemoteVideoLabel').textContent() : '';
    const voiceStatusText = await citizenPage.locator('#citizenVoiceCallStatusText').textContent();

    addTest('Citizen PiP Remote Video Element Exists', remoteVideoCount === 1, { remoteVideoCount });
    addTest('Citizen PiP Label is "TRỰC BAN"', remoteLabelCount === 1 && labelText.includes('TRỰC BAN'), { labelText });
    addTest('Typo "đàm thoại thoại" is fixed', !voiceStatusText.includes('đàm thoại thoại'), { voiceStatusText: voiceStatusText?.trim() });

    const citizenScreenshot = path.join(ARTIFACT_DIR, 'verify_3000_pip_patched.png');
    await citizenPage.screenshot({ path: citizenScreenshot });

    // Test 3: Verify Dispatcher Gatekeeper and Passcode removal
    console.log('\n--- 3. Testing Dispatcher Gatekeeper on http://localhost:3000/dispatcher.html ---');
    const dispatcherPage = await context.newPage();
    await dispatcherPage.goto('http://localhost:3000/dispatcher.html', { waitUntil: 'domcontentloaded' });
    await dispatcherPage.waitForTimeout(1000);

    const toggleLabel = await dispatcherPage.locator('label:has(#toggleGatekeeperSecurity)').textContent();
    const hasExposedPasscode = toggleLabel.includes('(Pass: 2002)');
    addTest('Dispatcher Gatekeeper Label Hides Passcode', !hasExposedPasscode, { toggleLabel: toggleLabel?.trim() });

    // Enter passcode 2002 and unlock
    const pinInput = dispatcherPage.locator('#gatekeeperPinInput');
    if (await pinInput.isVisible()) {
      await pinInput.fill('2002');
      await dispatcherPage.locator('#btnSubmitGatekeeperPin').click();
      await dispatcherPage.waitForTimeout(1500);
      const stageVisible = await dispatcherPage.locator('#cosmicPortalStage').isVisible();
      addTest('Gatekeeper Unlocks Successfully with 2002', stageVisible, { stageVisible });
    }

    const dispatcherScreenshot = path.join(ARTIFACT_DIR, 'verify_3000_dispatcher_patched.png');
    await dispatcherPage.screenshot({ path: dispatcherScreenshot });

    // Test 4: Verify React Vite frontend on port 5173
    console.log('\n--- 4. Testing React Vite frontend on http://localhost:5173 ---');
    const fePage = await context.newPage();
    let feConsoleErrors = [];
    fePage.on('console', msg => {
      if (msg.type() === 'error') feConsoleErrors.push(msg.text());
    });
    await fePage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await fePage.waitForTimeout(1500);

    const feTitle = await fePage.title();
    const hasSosRoot = await fePage.locator('#root').count();
    addTest('Vite React Frontend Loads on Port 5173', hasSosRoot === 1, { title: feTitle, consoleErrors: feConsoleErrors });

    const feScreenshot = path.join(ARTIFACT_DIR, 'verify_5173_fe_patched.png');
    await fePage.screenshot({ path: feScreenshot });

  } catch (err) {
    console.error('Test execution error:', err);
    addTest('Fatal execution error', false, { error: err.message, stack: err.stack });
  } finally {
    await browser.close();
  }

  // Save QA Reports
  const jsonReportPath = path.join(REPORTS_DIR, '2026-10-13-muse-ai-turn-pip-patch.json');
  const mdReportPath = path.join(REPORTS_DIR, '2026-10-13-muse-ai-turn-pip-patch.md');

  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf8');

  const mdContent = `# QA Report: Muse AI WebRTC TURN & SSE Resilience Patch Verification

**Timestamp:** ${results.timestamp}
**Total Tests:** ${results.summary.total}
**Passed:** ${results.summary.passed}
**Failed:** ${results.summary.failed}
**Success Rate:** ${Math.round((results.summary.passed / results.summary.total) * 100)}%

## Test Details

| Test Name | Status | Details |
|---|---|---|
${results.tests.map(t => `| ${t.name} | ${t.passed ? '✅ PASSED' : '❌ FAILED'} | \`${JSON.stringify(t.details)}\` |`).join('\n')}

## Visual Evidence Artifacts
- Citizen View (Port 3000): \`verify_3000_pip_patched.png\`
- Dispatcher Console (Port 3000): \`verify_3000_dispatcher_patched.png\`
- React Frontend (Port 5173): \`verify_5173_fe_patched.png\`
`;

  fs.writeFileSync(mdReportPath, mdContent, 'utf8');
  console.log(`\nReports generated:\n- ${jsonReportPath}\n- ${mdReportPath}`);
  return results;
}

runVerification().then(res => {
  if (res.summary.failed > 0) process.exit(1);
  else process.exit(0);
});
