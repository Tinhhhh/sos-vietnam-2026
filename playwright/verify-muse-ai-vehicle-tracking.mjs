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
    // Test 1: Verify MapController has addVehicleTrailPoint and clearVehicleTrail methods
    console.log('\n--- 1. Testing MapController Trail Methods ---');
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    const hasTrailMethods = await page.evaluate(async () => {
      try {
        const mod = await import('/js/map-controller.js');
        const MC = mod.MapController;
        return {
          hasModule: Boolean(MC),
          hasAddTrail: typeof MC?.prototype?.addVehicleTrailPoint === 'function',
          hasClearTrail: typeof MC?.prototype?.clearVehicleTrail === 'function'
        };
      } catch (e) {
        return { error: e.message, hasAddTrail: false, hasClearTrail: false };
      }
    });
    addTest('MapController exposes vehicle trail methods', hasTrailMethods.hasAddTrail && hasTrailMethods.hasClearTrail, hasTrailMethods);

    // Test 2: Authenticate as dispatcher officer
    console.log('\n--- 2. Authenticating Officer & Testing Vehicle Trail Buffering ---');
    const loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
      data: { username: 'admin', password: '2002' }
    });
    const loginJson = await loginRes.json();
    const token = loginJson.profile?.token;
    addTest('Dispatcher authentication successful', Boolean(token), { username: 'admin', hasToken: Boolean(token) });

    // Test 3: Create a test incident and stream vehicle locations
    const createRes = await context.request.post('http://localhost:3000/api/sos/create', {
      data: {
        agency: 'congan',
        description: 'Test Vehicle Tracking Incident',
        lat: 21.0285,
        lng: 105.8542,
        address: 'Hà Nội'
      }
    });
    const createJson = await createRes.json();
    const incidentId = createJson.incident?.id || createJson.id;
    addTest('Incident created successfully', Boolean(incidentId), { incidentId });

    if (incidentId && token) {
      // Send 3 distinct vehicle positions along a route (> 5m apart)
      const positions = [
        { lat: 21.0280, lng: 105.8540, etaMinutes: 5 },
        { lat: 21.0285, lng: 105.8545, etaMinutes: 4 },
        { lat: 21.0290, lng: 105.8550, etaMinutes: 2 }
      ];

      for (const pos of positions) {
        const updateRes = await context.request.post('http://localhost:3000/api/dispatcher/update-vehicle', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          data: { id: incidentId, lat: pos.lat, lng: pos.lng, etaMinutes: pos.etaMinutes }
        });
        const updateJson = await updateRes.json();
        addTest(`Update vehicle pos (${pos.lat}, ${pos.lng})`, updateJson.ok === true, updateJson);
      }

      // Check incident vehicleTrail state
      const checkRes = await context.request.get(`http://localhost:3000/api/sos/${incidentId}`, {
        headers: {
          'x-sos-access-token': createJson.citizenAccessToken || '',
          'Authorization': `Bearer ${token}`
        }
      });
      const checkJson = await checkRes.json();
      const trail = checkJson.incident?.vehicleTrail || [];
      addTest('Vehicle trail recorded on server incident object', trail.length >= 3, { trailLength: trail.length, trail });
    }

    // Test 4: Verify Dispatcher script contains startRealVehicleTracking
    console.log('\n--- 3. Testing Dispatcher Real Tracking Integration ---');
    const dispPage = await context.newPage();
    await dispPage.goto('http://localhost:3000/dispatcher.html', { waitUntil: 'domcontentloaded' });

    const hasRealTrackingMethod = await dispPage.evaluate(async () => {
      for (let i = 0; i < 30; i++) {
        const app = window.dispatcherApp || window.dispatcher;
        if (app && typeof app.startRealVehicleTracking === 'function') {
          return {
            hasApp: true,
            hasStartRealTracking: typeof app.startRealVehicleTracking === 'function',
            hasStopVehicleTracking: typeof app.stopVehicleTracking === 'function'
          };
        }
        await new Promise(r => setTimeout(r, 100));
      }
      const app = window.dispatcherApp || window.dispatcher;
      return {
        hasApp: Boolean(app),
        hasStartRealTracking: typeof app?.startRealVehicleTracking === 'function',
        hasStopVehicleTracking: typeof app?.stopVehicleTracking === 'function'
      };
    });
    addTest('DispatcherApp exposes startRealVehicleTracking', hasRealTrackingMethod.hasStartRealTracking, hasRealTrackingMethod);

    const trackScreenshot = path.join(ARTIFACT_DIR, 'verify_3000_vehicle_tracking_patched.png');
    await dispPage.screenshot({ path: trackScreenshot });

  } catch (err) {
    console.error('Test execution error:', err);
    addTest('Fatal execution error', false, { error: err.message, stack: err.stack });
  } finally {
    await browser.close();
  }

  // Save QA Reports
  const jsonReportPath = path.join(REPORTS_DIR, '2026-10-13-muse-ai-vehicle-tracking.json');
  const mdReportPath = path.join(REPORTS_DIR, '2026-10-13-muse-ai-vehicle-tracking.md');

  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf8');

  const mdContent = `# QA Report: Muse AI Real GPS Vehicle Tracking & Movement Trail Patch

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
- Dispatcher Console (Port 3000): \`verify_3000_vehicle_tracking_patched.png\`
`;

  fs.writeFileSync(mdReportPath, mdContent, 'utf8');
  console.log(`\nReports generated:\n- ${jsonReportPath}\n- ${mdReportPath}`);
  return results;
}

runVerification().then(res => {
  if (res.summary.failed > 0) process.exit(1);
  else process.exit(0);
});
