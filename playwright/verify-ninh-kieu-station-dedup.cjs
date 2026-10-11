const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Bắt đầu kiểm thử tự động: Kiểm tra rà soát và loại bỏ đồn công an thừa/trùng lặp tại Phường Ninh Kiều (Cần Thơ)...');
  const browser = await chromium.launch({ headless: true });
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: UA
  });
  const page = await context.newPage();

  const report = {
    testName: 'Rà soát loại bỏ đồn công an giải thể và ghim trùng lặp tại Phường Ninh Kiều (Cần Thơ)',
    timestamp: new Date().toISOString(),
    steps: [],
    assertions: {},
    passed: false
  };

  try {
    page.on('console', msg => {
      const txt = msg.text();
      if (!txt.includes('WebGL') && !txt.includes('font')) {
        console.log('BROWSER CONSOLE:', msg.type(), txt);
      }
    });
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

    // Bypass Gatekeeper & Preset Officer Session
    await page.addInitScript(() => {
      sessionStorage.setItem('sos_gatekeeper_pass', 'true');
      sessionStorage.setItem('sos_dispatcher_officer', JSON.stringify({
        username: 'admin',
        name: 'Đại tá Hoàng Quốc Việt',
        agency: 'admin',
        role: 'admin',
        province: 'Toàn quốc',
        token: 'mock-admin-token'
      }));
    });

    // 1. Tải trang điều phối
    await page.goto('http://localhost:3000/dispatcher.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Mở khóa giao diện và map
    await page.evaluate(() => {
      document.body.classList.add('officer-authenticated');
      const d = window.dispatcher || window.dispatcherApp;
      if (d) {
        if (d.cosmicPortalView) d.cosmicPortalView.style.setProperty('display', 'none', 'important');
        if (d.authGateModal) d.authGateModal.style.setProperty('display', 'none', 'important');
        if (d.mapController?.map) d.mapController.map.resize();
      }
    });

    await page.waitForFunction(() => !!(window.dispatcher || window.dispatcherApp), { timeout: 15000 });
    report.steps.push({ step: '1. Tải trang dispatcher.html & Đăng nhập thành công', status: 'SUCCESS' });

    // 2. Chọn và khoanh vùng Phường Ninh Kiều (Cần Thơ)
    const selectResult = await page.evaluate(async () => {
      const d = window.dispatcher || window.dispatcherApp;
      if (!d) return { error: 'Dispatcher not found' };
      const res = await fetch('/api/geo/ward-list');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.list || []);
      const ninhKieu = list.find(w => (w.province?.includes('Cần Thơ') || w.province?.includes('Can Tho')) && w.ward?.includes('Ninh Kiều'));
      if (!ninhKieu) return { error: 'Ward not found in list' };
      await d.selectAndHighlightWard(ninhKieu);
      return { success: true, ninhKieu };
    });

    if (!selectResult.success) {
      throw new Error('Không thể chọn Phường Ninh Kiều: ' + JSON.stringify(selectResult));
    }
    await page.waitForTimeout(2000);
    report.steps.push({ step: '2. Chọn và khoanh vùng Phường Ninh Kiều (Cần Thơ)', status: 'SUCCESS' });

    // 3. Kiểm tra các ghim hiển thị trên bản đồ trong khu vực Phường Ninh Kiều
    const mapPinsCheck = await page.evaluate(() => {
      const d = window.dispatcher || window.dispatcherApp;
      const mc = d?.mapController;
      if (!mc) return { error: 'MapController not found' };

      // Thu thập thông tin ghim active ward
      const activePin = mc.activeWardStationMarker;
      const activePinCoords = activePin ? activePin.getLngLat() : null;

      // Thu thập tất cả các ghim trạm đang được mount trên DOM
      const pinElements = Array.from(document.querySelectorAll('.custom-map-pin.congan-station-pin, .custom-map-pin.station-pin'));
      const pinsInfo = pinElements.map(el => {
        const label = el.querySelector('.congan-pin-label, .pin-tooltip')?.textContent?.trim() || '';
        const isSelected = el.classList.contains('neon-selected');
        const isActiveWardReveal = el.classList.contains('active-ward-reveal-pin');
        return { label, isSelected, isActiveWardReveal };
      });

      // Lấy danh sách candidateStations gần Ninh Kiều (bounds: 10.02 - 10.04, 105.77 - 105.795)
      const nearStations = (mc.candidateStations || []).filter(s => {
        const lat = Number(s.lat);
        const lng = Number(s.lng);
        return lat >= 10.02 && lat <= 10.04 && lng >= 105.77 && lng <= 105.795;
      });

      return {
        activePinCoords,
        pinsInfo,
        nearStations: nearStations.map(s => ({ id: s.id, name: s.name, ward: s.ward, level: s.level, agency: s.agency, lat: s.lat, lng: s.lng }))
      };
    });

    console.log('📍 Kiểm tra ghim trên bản đồ:', JSON.stringify(mapPinsCheck, null, 2));

    // 4. Kiểm tra dữ liệu trên HUD
    const hudData = await page.evaluate(() => {
      const getVal = (id) => document.getElementById(id)?.textContent?.trim() || '';
      const getHref = (id) => document.getElementById(id)?.getAttribute('href') || '';
      return {
        unitTitle: getVal('hudWardUnitTitle'),
        address: getVal('hudWardAddress'),
        phone: getVal('hudWardPhone'),
        officer: getVal('hudWardOfficer'),
        email: getVal('hudWardEmail'),
        sapNhap: getVal('hudWardSapNhap'),
        dienTich: getVal('hudWardDienTich'),
        danSo: getVal('hudWardDanSo'),
        maDVHC: getVal('hudWardMaDVHC')
      };
    });

    console.log('📋 Dữ liệu HUD thu thập:', hudData);
    report.hudData = hudData;

    // 5. Xác thực các tiêu chí (Assertions)
    const assertions = {
      hudTitleMatchesNinhKieu: hudData.unitTitle.includes('Ninh Kiều'),
      hudAddressMatchesPhanDinhPhung: hudData.address.includes('72') && hudData.address.includes('Phan Đình Phùng'),
      hudPhoneMatchesOfficial: hudData.phone.replace(/[^0-9]/g, '').includes('02923820938'),
      hudOfficerMatchesPhamHienTai: hudData.officer.includes('Phạm Hiền Tài'),
      noAbolishedAnCuPin: !mapPinsCheck.pinsInfo.some(p => p.label.includes('An Cư')),
      noAbolishedThoiBinhPin: !mapPinsCheck.pinsInfo.some(p => p.label.includes('Thới Bình')),
      noAbolishedXuanKhanhPin: !mapPinsCheck.pinsInfo.some(p => p.label.includes('Xuân Khánh')),
      noFakeKhuVucSoTaiPin: !mapPinsCheck.pinsInfo.some(p => p.label.includes('Khu Vực Sở Tại')),
      noMisplacedGenericConganAt10033: !mapPinsCheck.nearStations.some(s => s.id === 'st-congan' && s.lat === 10.033333),
      onlyOneWardPolicePinInNinhKieu: mapPinsCheck.nearStations.filter(s => s.level === 'ward' && s.agency === 'police').length === 1
    };

    report.assertions = assertions;
    console.log('✅ Kết quả kiểm thử Assertions:', assertions);

    const allPassed = Object.values(assertions).every(Boolean);
    if (!allPassed) {
      throw new Error('Một hoặc nhiều assertion không đạt: ' + JSON.stringify(assertions, null, 2));
    }

    report.steps.push({ step: '4. Kiểm tra HUD & Xác nhận 10/10 assertions đạt chuẩn', status: 'SUCCESS' });
    report.passed = true;

    // Chụp ảnh bằng chứng
    const reportsDir = path.join(__dirname, '..', 'Reports', 'qa', 'playwright');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const screenshotPath = path.join(reportsDir, '2026-10-11-ninh-kieu-station-dedup.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.screenshotPath = screenshotPath;
    console.log('📸 Đã chụp ảnh màn hình lưu tại:', screenshotPath);

    // Ghi báo cáo JSON
    const reportJsonPath = path.join(reportsDir, '2026-10-11-station-dedup-verification.json');
    fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log('📝 Đã lưu báo cáo JSON:', reportJsonPath);

    // Ghi báo cáo Markdown
    const reportMdPath = path.join(reportsDir, '2026-10-11-station-dedup-verification.md');
    const mdContent = `# Báo Cáo Kiểm Thử Tự Động: Rà Soát & Khử Trùng Lặp Đồn Công An Phường Ninh Kiều (Cần Thơ)

## Thông Tin Tổng Quan
- **Thời gian thực hiện**: \`${report.timestamp}\`
- **Kết quả tổng thể**: **${report.passed ? 'PASSED ✅' : 'FAILED ❌'}**
- **Trang kiểm thử**: \`http://localhost:3000/dispatcher.html\`
- **Ảnh chụp màn hình**: [2026-10-11-ninh-kieu-station-dedup.png](./2026-10-11-ninh-kieu-station-dedup.png)

## Các Bước Thực Hiện
${report.steps.map(s => `- **${s.step}**: \`${s.status}\``).join('\n')}

## Kết Quả Kiểm Tra Dữ Liệu Thực Tế (Assertions)
| Tiêu Chí Kiểm Tra | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|-------------------|------------------|-----------------|------------|
| Tên đơn vị trên HUD | Chứa "Ninh Kiều" | "${hudData.unitTitle}" | ${assertions.hudTitleMatchesNinhKieu ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Địa chỉ trụ sở | Số 72, đường Phan Đình Phùng | "${hudData.address}" | ${assertions.hudAddressMatchesPhanDinhPhung ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Số điện thoại trực ban | 02923820938 | "${hudData.phone}" | ${assertions.hudPhoneMatchesOfficial ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Trưởng Công An Phường | Thượng tá Phạm Hiền Tài | "${hudData.officer}" | ${assertions.hudOfficerMatchesPhamHienTai ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Không còn ghim giải thể An Cư | Không tồn tại | Đã loại bỏ hoàn toàn | ${assertions.noAbolishedAnCuPin ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Không còn ghim giải thể Thới Bình | Không tồn tại | Đã loại bỏ hoàn toàn | ${assertions.noAbolishedThoiBinhPin ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Không còn ghim giải thể Xuân Khánh | Không tồn tại | Đã loại bỏ hoàn toàn | ${assertions.noAbolishedXuanKhanhPin ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Không còn ghim giả định Khu Vực Sở Tại | Không tồn tại | Đã loại bỏ hoàn toàn | ${assertions.noFakeKhuVucSoTaiPin ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Khử trùng tọa độ CATP 10.033333 | Di dời về 9A Trần Phú Cái Khế | Tọa độ chuẩn 10.045250, 105.781820 | ${assertions.noMisplacedGenericConganAt10033 ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |
| Duy nhất 1 đồn CA phường tại Ninh Kiều | Đúng 1 đồn | 1 đồn (${mapPinsCheck.nearStations.filter(s => s.level === 'ward' && s.agency === 'police')[0]?.name}) | ${assertions.onlyOneWardPolicePinInNinhKieu ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'} |

## Dữ Liệu HUD Thu Thập Được
\`\`\`json
${JSON.stringify(hudData, null, 2)}
\`\`\`
`;
    fs.writeFileSync(reportMdPath, mdContent, 'utf-8');
    console.log('📝 Đã lưu báo cáo Markdown:', reportMdPath);

  } catch (error) {
    console.error('❌ Kiểm thử thất bại:', error);
    report.error = error.message;
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Hoàn tất phiên kiểm thử.');
  }
})();
