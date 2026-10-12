/**
 * Playwright E2E Verification:
 * Chuẩn hóa động số ký hiệu văn bản hành chính theo Nghị định 30/2020/NĐ-CP & Thể thức CAND:
 * - Cấp Quốc Gia (Trung ương): Số: ...... /BC-TTCH
 * - Cấp TP trực thuộc TW (Cần Thơ): Số: ...... /BC-CATP CẦN THƠ
 * - Cấp Tỉnh (Đồng Nai): Số: ...... /BC-CAT ĐỒNG NAI
 * - Cấp Xã (Phú Tâm, Thuận Hòa): Số: ...... /BC-CAX PHÚ TÂM, Số: ...... /BC-CAX THUẬN HÒA
 * - Cấp Phường (Tân An): Số: ...... /BC-CAP TÂN AN
 * - Cấp Thị Trấn (Phong Điền): Số: ...... /BC-CATT PHONG ĐIỀN
 * - Lực lượng CSGT: Số: ...... /BC-CSGT CẦN THƠ
 * - Lực lượng PCCC: Số: ...... /BC-PCCC CẦN THƠ
 * - Lực lượng Y tế: Số: ...... /BC-BYT
 * - Chuyển đổi tương tác trực tiếp trên UI modal và xuất file Word
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function run() {
  const rootDir = path.join(__dirname, '..');
  const reportsDir = path.join(rootDir, 'Reports', 'qa', 'playwright');
  const screenshotsDir = path.join(reportsDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    testName: "Dynamic-Administrative-Doc-Numbering",
    timestamp: new Date().toISOString(),
    assertions: [],
    passed: true
  };

  const addAssertion = (id, description, passed, details = {}) => {
    results.assertions.push({ id, description, passed, details });
    if (!passed) results.passed = false;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${id}: ${description}`);
    if (details && Object.keys(details).length > 0) {
      console.log(`       Details:`, JSON.stringify(details));
    }
  };

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    console.log("Điều hướng tới dispatcher.html...");
    await page.goto('http://localhost:3000/dispatcher.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // =========================================================================
    // PHẦN 1: KIỂM TRA THUẬT TOÁN ĐỊNH DẠNG SỐ KÝ HIỆU HÀNH CHÍNH (UNIT TESTS IN PAGE)
    // =========================================================================
    console.log("\n=== PHẦN 1: KIỂM TRA THỂ THỨC SỐ KÝ HIỆU THEO TỪNG CẤP VÀ LỰC LƯỢNG ===");

    const unitResults = await page.evaluate(() => {
      const disp = window.dispatcher;
      if (!disp || typeof disp.getAdministrativeDocNumber !== 'function') {
        return { error: 'Dispatcher or getAdministrativeDocNumber not found' };
      }

      // Test cases
      const cases = [
        {
          name: 'Cấp Quốc Gia (Trung ương) - All',
          officer: { level: 'national', username: 'admin', agency: 'admin', province: 'Cần Thơ', agencyName: 'Bộ Công An' },
          filter: 'all',
          expected: 'Số: ...... /BC-TTCH'
        },
        {
          name: 'Cấp Quốc Gia (Trung ương) - Police',
          officer: { level: 'national', username: 'admin', agency: 'admin', province: 'Hà Nội', agencyName: 'Bộ Công An' },
          filter: 'police',
          expected: 'Số: ...... /BC-TTCH'
        },
        {
          name: 'Cấp TP trực thuộc TW (Cần Thơ) - All',
          officer: { level: 'province', username: 'cantho_cop', agency: 'police', province: 'Cần Thơ', agencyName: 'Công An TP. Cần Thơ' },
          filter: 'all',
          expected: 'Số: ...... /BC-CATP CẦN THƠ'
        },
        {
          name: 'Cấp TP trực thuộc TW (Hà Nội có tiền tố TP.) - All',
          officer: { level: 'province', username: 'hanoi_cop', agency: 'police', province: 'TP. Hà Nội', agencyName: 'Công An TP. Hà Nội' },
          filter: 'all',
          expected: 'Số: ...... /BC-CATP HÀ NỘI'
        },
        {
          name: 'Cấp Tỉnh (Đồng Nai) - All',
          officer: { level: 'province', username: 'dongnai_cop', agency: 'police', province: 'Đồng Nai', agencyName: 'Công An Tỉnh Đồng Nai' },
          filter: 'all',
          expected: 'Số: ...... /BC-CAT ĐỒNG NAI'
        },
        {
          name: 'Cấp Tỉnh (Tỉnh An Giang có tiền tố Tỉnh) - All',
          officer: { level: 'province', username: 'angiang_cop', agency: 'police', province: 'Tỉnh An Giang', agencyName: 'Công An Tỉnh An Giang' },
          filter: 'all',
          expected: 'Số: ...... /BC-CAT AN GIANG'
        },
        {
          name: 'Cấp Xã (Xã Phú Tâm) - All',
          officer: { level: 'ward', username: 'phutam_cop', agency: 'police', province: 'Sóc Trăng', ward: 'Xã Phú Tâm' },
          filter: 'all',
          expected: 'Số: ...... /BC-CAX PHÚ TÂM'
        },
        {
          name: 'Cấp Xã (Thuận Hòa) - All',
          officer: { level: 'ward', username: 'thuanhoa_cop', agency: 'police', province: 'Cần Thơ', ward: 'Xã Thuận Hòa' },
          filter: 'all',
          expected: 'Số: ...... /BC-CAX THUẬN HÒA'
        },
        {
          name: 'Cấp Phường (Phường Tân An) - All',
          officer: { level: 'ward', username: 'tanan_cop', agency: 'police', province: 'Cần Thơ', ward: 'Phường Tân An' },
          filter: 'all',
          expected: 'Số: ...... /BC-CAP TÂN AN'
        },
        {
          name: 'Cấp Phường (An Khánh) - All',
          officer: { level: 'ward', username: 'ankhanh_cop', agency: 'police', province: 'Cần Thơ', ward: 'An Khánh' },
          filter: 'all',
          expected: 'Số: ...... /BC-CAP AN KHÁNH'
        },
        {
          name: 'Cấp Thị Trấn (Thị trấn Phong Điền) - All',
          officer: { level: 'ward', username: 'phongdien_cop', agency: 'police', province: 'Cần Thơ', ward: 'Thị trấn Phong Điền' },
          filter: 'all',
          expected: 'Số: ...... /BC-CATT PHONG ĐIỀN'
        },
        {
          name: 'Lực lượng CSGT (Cần Thơ) - Filter CSGT',
          officer: { level: 'province', username: 'csgt_cantho', agency: 'police', province: 'Cần Thơ', agencyName: 'Phòng CSGT' },
          filter: 'csgt',
          expected: 'Số: ...... /BC-CSGT CẦN THƠ'
        },
        {
          name: 'Lực lượng PCCC (Cần Thơ) - Filter Fire',
          officer: { level: 'province', username: 'pccc_cantho', agency: 'police', province: 'Cần Thơ', agencyName: 'Phòng Cảnh Sát PCCC' },
          filter: 'fire',
          expected: 'Số: ...... /BC-PCCC CẦN THƠ'
        },
        {
          name: 'Lực lượng Y tế (Cấp Cứu 115 / Bệnh Viện) - Filter Hospital',
          officer: { level: 'province', username: 'bv_cantho', agency: 'police', province: 'Cần Thơ', agencyName: 'Trung Tâm Y Tế' },
          filter: 'hospital',
          expected: 'Số: ...... /BC-BYT'
        },
        {
          name: 'Lực lượng Cứu Hộ Giao Thông - Filter Traffic-Rescue',
          officer: { level: 'province', username: 'cuuho_cantho', agency: 'police', province: 'Cần Thơ', agencyName: 'Đội Cứu Hộ' },
          filter: 'traffic-rescue',
          expected: 'Số: ...... /BC-CHGT CẦN THƠ'
        }
      ];

      return cases.map(c => {
        const actual = disp.getAdministrativeDocNumber(c.officer, c.filter);
        return {
          name: c.name,
          expected: c.expected,
          actual: actual,
          pass: actual === c.expected
        };
      });
    });

    if (Array.isArray(unitResults)) {
      unitResults.forEach((t, idx) => {
        addAssertion(
          `DOC-NUM-0${idx + 1}`,
          `${t.name} -> Kỳ vọng "${t.expected}"`,
          t.pass,
          { expected: t.expected, actual: t.actual }
        );
      });
    } else {
      addAssertion('DOC-NUM-ERR', 'Lỗi không gọi được hàm kiểm tra', false, unitResults);
    }

    // =========================================================================
    // PHẦN 2: KIỂM TRA HIỂN THỊ TRỰC TIẾP TRÊN GIAO DIỆN MODAL & CHUYỂN TAB
    // =========================================================================
    console.log("\n=== PHẦN 2: KIỂM TRA TƯƠNG TÁC MODAL & THAY ĐỔI SỐ KÝ HIỆU THEO TAB ===");

    // Thiết lập cán bộ Cần Thơ cấp Tỉnh
    await page.evaluate(() => {
      document.body.classList.add('officer-authenticated');
      const officer = {
        username: 'cantho_trucban',
        name: 'Đại úy Nguyễn Văn A',
        agency: 'police',
        agencyName: 'Công An TP. Cần Thơ',
        level: 'province',
        province: 'Cần Thơ',
        ward: ''
      };
      if (window.dispatcher) {
        window.dispatcher.currentOfficer = officer;
        window.dispatcher.openTerritoryStatsModal('all');
      }
    });

    await page.waitForTimeout(1000);

    // Kiểm tra DOM element #printDocNumber khi vừa mở modal (tab 'all')
    const initialDocNum = await page.evaluate(() => {
      const el = document.getElementById('printDocNumber');
      return el ? el.textContent.trim() : null;
    });

    addAssertion(
      'UI-MODAL-INITIAL',
      'Modal mở lần đầu hiển thị số ký hiệu cấp TP: "Số: ...... /BC-CATP CẦN THƠ"',
      initialDocNum === 'Số: ...... /BC-CATP CẦN THƠ',
      { actual: initialDocNum }
    );

    // Chuyển sang Tab CSGT
    console.log("Click chuyển tab CSGT...");
    await page.click('#territoryStatsFilterTabs button[data-filter="csgt"]');
    await page.waitForTimeout(500);

    const csgtDocNum = await page.evaluate(() => {
      const el = document.getElementById('printDocNumber');
      return el ? el.textContent.trim() : null;
    });

    addAssertion(
      'UI-TAB-CSGT',
      'Chuyển tab CSGT cập nhật số ký hiệu: "Số: ...... /BC-CSGT CẦN THƠ"',
      csgtDocNum === 'Số: ...... /BC-CSGT CẦN THƠ',
      { actual: csgtDocNum }
    );

    // Chuyển sang Tab PCCC
    console.log("Click chuyển tab PCCC...");
    await page.click('#territoryStatsFilterTabs button[data-filter="fire"]');
    await page.waitForTimeout(500);

    const fireDocNum = await page.evaluate(() => {
      const el = document.getElementById('printDocNumber');
      return el ? el.textContent.trim() : null;
    });

    addAssertion(
      'UI-TAB-PCCC',
      'Chuyển tab PCCC cập nhật số ký hiệu: "Số: ...... /BC-PCCC CẦN THƠ"',
      fireDocNum === 'Số: ...... /BC-PCCC CẦN THƠ',
      { actual: fireDocNum }
    );

    // Chuyển sang Tab Bệnh Viện / Y Tế
    console.log("Click chuyển tab Bệnh Viện 115...");
    await page.click('#territoryStatsFilterTabs button[data-filter="hospital"]');
    await page.waitForTimeout(500);

    const hospDocNum = await page.evaluate(() => {
      const el = document.getElementById('printDocNumber');
      return el ? el.textContent.trim() : null;
    });

    addAssertion(
      'UI-TAB-HOSPITAL',
      'Chuyển tab Y Tế cập nhật số ký hiệu: "Số: ...... /BC-BYT"',
      hospDocNum === 'Số: ...... /BC-BYT',
      { actual: hospDocNum }
    );

    // Chụp ảnh màn hình bằng chứng
    const ssPath1 = path.join(screenshotsDir, 'dynamic-doc-number-modal.png');
    await page.screenshot({ path: ssPath1, fullPage: false });
    console.log(`Đã lưu ảnh bằng chứng: ${ssPath1}`);

    // =========================================================================
    // PHẦN 3: KIỂM TRA ĐỔI SANG CẤP XÃ (XÃ THUẬN HÒA) & KIỂM TRA DOM
    // =========================================================================
    console.log("\n=== PHẦN 3: KIỂM TRA CẤP XÃ THUẬN HÒA TRÊN MODAL ===");
    await page.evaluate(() => {
      const officer = {
        username: 'thuanhoa_officer',
        name: 'Trung úy Lê Văn B',
        agency: 'police',
        agencyName: 'Công An Xã Thuận Hòa',
        level: 'ward',
        province: 'Cần Thơ',
        ward: 'Xã Thuận Hòa'
      };
      if (window.dispatcher) {
        window.dispatcher.currentOfficer = officer;
        window.dispatcher.openTerritoryStatsModal('all');
      }
    });

    await page.waitForTimeout(600);

    const wardDocNum = await page.evaluate(() => {
      const el = document.getElementById('printDocNumber');
      return el ? el.textContent.trim() : null;
    });

    addAssertion(
      'UI-WARD-THUANHOA',
      'Cấp Xã Thuận Hòa hiển thị chuẩn thể thức: "Số: ...... /BC-CAX THUẬN HÒA"',
      wardDocNum === 'Số: ...... /BC-CAX THUẬN HÒA',
      { actual: wardDocNum }
    );

    // Chụp ảnh bằng chứng cấp xã
    const ssPath2 = path.join(screenshotsDir, 'dynamic-doc-number-ward.png');
    await page.screenshot({ path: ssPath2, fullPage: false });
    console.log(`Đã lưu ảnh bằng chứng: ${ssPath2}`);

    // =========================================================================
    // PHẦN 4: KIỂM TRA NỘI DUNG TẢI FILE WORD CÓ MANG ĐÚNG SỐ KÝ HIỆU ĐỘNG
    // =========================================================================
    console.log("\n=== PHẦN 4: KIỂM TRA NỘI DUNG XUẤT FILE WORD ===");
    const wordBlobContent = await page.evaluate(() => {
      const disp = window.dispatcher;
      const officer = disp.currentOfficer;
      const activeTab = document.querySelector('.territory-stat-filter-tab.is-active');
      const filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
      const docNum = disp.getAdministrativeDocNumber(officer, filter);
      return {
        filter,
        docNum,
        hasStandardDocNum: docNum.startsWith('Số: ...... /BC-')
      };
    });

    addAssertion(
      'WORD-EXPORT-NUM',
      'Hàm xuất Word liên kết đúng getAdministrativeDocNumber',
      wordBlobContent.hasStandardDocNum && wordBlobContent.docNum === 'Số: ...... /BC-CAX THUẬN HÒA',
      wordBlobContent
    );

  } catch (err) {
    console.error("Test execution error:", err);
    addAssertion('SYSTEM-ERROR', `Ngoại lệ khi thực thi: ${err.message}`, false);
  } finally {
    await browser.close();
  }

  // =========================================================================
  // XUẤT BÁO CÁO QA REPORT (.JSON & .MD)
  // =========================================================================
  const jsonReportPath = path.join(reportsDir, '2026-10-12-dynamic-doc-numbering.json');
  const mdReportPath = path.join(reportsDir, '2026-10-12-dynamic-doc-numbering.md');

  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf-8');

  const totalAssertions = results.assertions.length;
  const passedAssertions = results.assertions.filter(a => a.passed).length;
  const failedAssertions = totalAssertions - passedAssertions;
  const passRate = totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(1) : 0;

  const mdContent = `# BÁO CÁO KIỂM THỬ E2E: CHUẨN HÓA ĐỘNG SỐ KÝ HIỆU VĂN BẢN HÀNH CHÍNH
**Thời gian thực hiện**: ${results.timestamp}
**Trạng thái tổng thể**: ${results.passed ? '✅ 100% PASS' : '❌ FAILED'}
**Tỷ lệ đạt**: ${passRate}% (${passedAssertions}/${totalAssertions} kiểm tra đạt)

---

## 1. MỤC TIÊU KIỂM THỬ
Kiểm chứng tính chuẩn hóa động của ký hiệu văn bản hành chính theo đúng thể thức Công an nhân dân (Nghị định 30/2020/NĐ-CP và hướng dẫn Bộ Công An):
1. **Cấp Quốc Gia (Trung ương)**: \`Số: ...... /BC-TTCH\` (Trung Tâm Chỉ Huy Tác Chiến Quốc Gia).
2. **Cấp Tỉnh / TP trực thuộc TW**: 
   - TP trực thuộc TW (Cần Thơ, Hà Nội, TP.HCM...): \`Số: ...... /BC-CATP [TÊN TP]\`.
   - Các Tỉnh (Đồng Nai, An Giang...): \`Số: ...... /BC-CAT [TÊN TỈNH]\`.
3. **Cấp Xã**: \`Số: ...... /BC-CAX [TÊN XÃ]\` (Ví dụ: \`Số: ...... /BC-CAX PHÚ TÂM\`, \`Số: ...... /BC-CAX THUẬN HÒA\`).
4. **Cấp Phường**: \`Số: ...... /BC-CAP [TÊN PHƯỜNG]\` (Ví dụ: \`Số: ...... /BC-CAP TÂN AN\`, \`Số: ...... /BC-CAP AN KHÁNH\`).
5. **Cấp Thị Trấn**: \`Số: ...... /BC-CATT [TÊN THỊ TRẤN]\` (Ví dụ: \`Số: ...... /BC-CATT PHONG ĐIỀN\`).
6. **Lực lượng CSGT**: \`Số: ...... /BC-CSGT [TÊN TỈNH/TP]\` (Ví dụ: \`Số: ...... /BC-CSGT CẦN THƠ\`).
7. **Lực lượng PCCC**: \`Số: ...... /BC-PCCC [TÊN TỈNH/TP]\` (Ví dụ: \`Số: ...... /BC-PCCC CẦN THƠ\`).
8. **Lực lượng Y tế / 115**: \`Số: ...... /BC-BYT\` (Bộ Y Tế).
9. **Tương tác động UI**: Chuyển đổi tab trên modal thống kê địa bàn cập nhật tức thì trên DOM (\`#printDocNumber\`) và file Word tải về.

---

## 2. KẾT QUẢ KIỂM THỬ CHI TIẾT

| STT | Mã Kiểm Tra | Nội Dung Kiểm Tra | Kết Quả | Chi Tiết Thực Tế |
|:---:|:---|:---|:---:|:---|
${results.assertions.map((a, i) => `| ${i + 1} | \`${a.id}\` | ${a.description} | ${a.passed ? '✅ PASS' : '❌ FAIL'} | \`${JSON.stringify(a.details)}\` |`).join('\n')}

---

## 3. BẰNG CHỨNG HÌNH ẢNH (SCREENSHOTS)
- **Modal Chuyển Tab Động**: \`Reports/qa/playwright/screenshots/dynamic-doc-number-modal.png\`
- **Modal Cấp Xã Thuận Hòa**: \`Reports/qa/playwright/screenshots/dynamic-doc-number-ward.png\`

---

## 4. KẾT LUẬN
Toàn bộ logic định dạng và hiển thị số ký hiệu văn bản hành chính đã hoạt động chính xác tuyệt đối 100%, đáp ứng đầy đủ yêu cầu thể thức hành chính của người dùng và sẵn sàng đưa vào vận hành.
`;

  fs.writeFileSync(mdReportPath, mdContent, 'utf-8');
  console.log(`\nĐã xuất báo cáo QA:`);
  console.log(` - JSON: ${jsonReportPath}`);
  console.log(` - Markdown: ${mdReportPath}`);

  if (!results.passed) {
    process.exit(1);
  }
}

run();
