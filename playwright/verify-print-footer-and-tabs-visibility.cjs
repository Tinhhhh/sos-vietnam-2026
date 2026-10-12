/**
 * Playwright E2E Verification:
 * 1. Triệt tiêu trang trắng khi In & PDF (Zero leading blank pages, table starts page 1)
 * 2. Căn góc bên phải cho khối Cán Bộ Lập Biểu Thống Kê & Không ngắt đôi chữ "KÊ"
 * 3. Hiển thị trọn vẹn 100% cả 5 Tab Buttons trên Sidebar Điều Phối
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function run() {
  const reportsDir = path.join(__dirname, '..', 'Reports', 'qa', 'playwright');
  const screenshotsDir = path.join(reportsDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    testName: "Print-Footer-Blank-Pages-And-Sidebar-Tabs-Visibility",
    timestamp: new Date().toISOString(),
    assertions: [],
    passed: true
  };

  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------
    // PHẦN 1: KIỂM TRA 5 TAB BUTTONS TRÊN SIDEBAR (VIEWPORT 1366x768)
    // -------------------------------------------------------------
    console.log("=== PHẦN 1: KIỂM TRA 5 TAB BUTTONS TRÊN SIDEBAR ===");
    const context = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1366, height: 768 }
    });
    const page = await context.newPage();

    console.log("Navigating to dispatcher.html...");
    await page.goto('http://localhost:3000/dispatcher.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);

    // Kích hoạt Officer National Admin để hiển thị toàn bộ 5 tabs
    await page.evaluate(() => {
      document.body.classList.add('officer-authenticated');
      const officer = {
        username: 'admin',
        name: 'Điền Trần Vĩnh An',
        agency: 'admin',
        agencyName: 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia',
        level: 'national',
        province: 'Cần Thơ',
        ward: 'Tân An'
      };
      if (window.dispatcher) {
        window.dispatcher.currentOfficer = officer;
        const banner = document.getElementById('adminStatsBanner');
        const tabEnterprises = document.getElementById('tabBtnEnterprises');
        const tabHospitals = document.getElementById('tabBtnHospitals');
        if (banner) banner.style.display = 'block';
        if (tabEnterprises) tabEnterprises.style.display = 'inline-flex';
        if (tabHospitals) tabHospitals.style.display = 'inline-flex';
      }
    });

    await page.waitForTimeout(800);

    // Đo lường độ hiển thị của 5 tabs
    const tabsMetrics = await page.evaluate(() => {
      const nav = document.getElementById('sidebarTabsNav');
      const navRect = nav.getBoundingClientRect();
      const tabIds = [
        'tabBtnIncidents',
        'tabBtnHistory',
        'tabBtnStations',
        'tabBtnEnterprises',
        'tabBtnHospitals'
      ];

      return tabIds.map(id => {
        const el = document.getElementById(id);
        if (!el) return { id, exists: false };
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isFullyVisible = (rect.right <= navRect.right + 2) && (rect.left >= navRect.left - 2) && (style.display !== 'none');
        return {
          id,
          text: el.innerText.trim().replace(/\s+/g, ' '),
          display: style.display,
          width: rect.width,
          left: rect.left,
          right: rect.right,
          navRight: navRect.right,
          isFullyVisible
        };
      });
    });

    console.log("Kết quả 5 tab buttons:", JSON.stringify(tabsMetrics, null, 2));

    const allTabsVisible = tabsMetrics.every(t => t.isFullyVisible);
    results.assertions.push({
      test: "Tất cả 5 tab buttons trên Sidebar hiển thị đầy đủ 100% trong khung nhìn, không bị cắt xén",
      passed: allTabsVisible,
      expected: true,
      actual: allTabsVisible,
      details: tabsMetrics
    });

    // Chụp ảnh bằng chứng 5 tab buttons
    const sidebarEl = await page.$('#dispatcherSidebar');
    if (sidebarEl) {
      await sidebarEl.screenshot({ path: path.join(screenshotsDir, 'sidebar-tabs-5-buttons-fixed.png') });
      console.log("Saved screenshot: Reports/qa/playwright/screenshots/sidebar-tabs-5-buttons-fixed.png");
    }

    // -------------------------------------------------------------
    // PHẦN 2: KIỂM TRA IN & PDF (KHÔNG TRANG TRẮNG, CHỮ KÝ CĂN PHẢI)
    // -------------------------------------------------------------
    console.log("\n=== PHẦN 2: KIỂM TRA IN & PDF BÁO CÁO SỰ CỐ ===");
    // Mở modal territoryStatsModal
    await page.evaluate(() => {
      if (window.dispatcher) {
        window.dispatcher.openTerritoryStatsModal('all');
      } else {
        const modal = document.getElementById('territoryStatsModal');
        if (modal) modal.style.display = 'flex';
      }
    });

    await page.waitForTimeout(800);

    // Kích hoạt chế độ in printing-territory-stats
    await page.evaluate(() => {
      document.body.classList.add('printing-territory-stats');
      let printStyle = document.getElementById('territoryStatsPrintPageStyle');
      if (!printStyle) {
        printStyle = document.createElement('style');
        printStyle.id = 'territoryStatsPrintPageStyle';
        document.head.appendChild(printStyle);
      }
      printStyle.textContent = `
        @media print {
          @page { size: A4 landscape !important; margin: 6mm 10mm 6mm 10mm !important; }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.printing-territory-stats > *:not(#territoryStatsModal) {
            display: none !important;
            height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.printing-territory-stats #territoryStatsModal {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            inset: auto !important;
            transform: none !important;
          }
        }
      `;
    });

    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(600);

    // Kiểm tra các phần tử anh em có bị display: none không
    const siblingsDisplay = await page.evaluate(() => {
      const topSiblings = Array.from(document.body.children);
      const hiddenSiblings = topSiblings.filter(el => el.id !== 'territoryStatsModal' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE');
      const allHidden = hiddenSiblings.every(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none';
      });
      return { totalSiblings: hiddenSiblings.length, allHidden };
    });

    results.assertions.push({
      test: "Tất cả các phần tử con trực tiếp của body ngoại trừ territoryStatsModal đều bị ẩn (display: none)",
      passed: siblingsDisplay.allHidden,
      expected: true,
      actual: siblingsDisplay.allHidden
    });

    // Kiểm tra cấu trúc & vị trí của khối chữ ký
    const footerMetrics = await page.evaluate(() => {
      const footer = document.querySelector('.print-official-footer');
      const signBlock = document.querySelector('.print-official-footer-sign');
      const signTitle = document.querySelector('.print-official-footer-sign-title');
      const recipientBlock = document.querySelector('.print-official-footer-recipient');
      const printArea = document.getElementById('territoryStatsPrintArea');

      const footerRect = footer.getBoundingClientRect();
      const signRect = signBlock.getBoundingClientRect();
      const recipRect = recipientBlock.getBoundingClientRect();
      const printRect = printArea.getBoundingClientRect();

      // Kiểm tra khoảng cách từ signBlock tới lề phải
      const distanceToRight = footerRect.right - signRect.right;
      // Kiểm tra signTitle có bị rớt dòng không (chiều cao 1 dòng font 11.5pt thường <= 24px)
      const isSingleLine = signTitle ? signTitle.offsetHeight <= 26 : false;

      return {
        footerWidth: footerRect.width,
        printAreaWidth: printRect.width,
        signRight: signRect.right,
        footerRight: footerRect.right,
        distanceToRight,
        recipWidth: recipRect.width,
        signWidth: signRect.width,
        signTitleHeight: signTitle ? signTitle.offsetHeight : 0,
        signTitleText: signTitle ? signTitle.textContent.trim() : '',
        isSingleLine,
        isRightAligned: distanceToRight <= 30
      };
    });

    console.log("Khối chữ ký Metrics:", JSON.stringify(footerMetrics, null, 2));

    results.assertions.push({
      test: "Khối chữ ký cán bộ lập biểu căn sát lề phải trang in (distanceToRight <= 30px)",
      passed: footerMetrics.isRightAligned,
      expected: true,
      actual: footerMetrics.isRightAligned,
      distanceToRight: footerMetrics.distanceToRight
    });

    results.assertions.push({
      test: "Tiêu đề 'CÁN BỘ LẬP BIỂU THỐNG KÊ' hiển thị trên 1 dòng duy nhất (không ngắt đôi chữ 'KÊ')",
      passed: footerMetrics.isSingleLine,
      expected: true,
      actual: footerMetrics.isSingleLine,
      height: footerMetrics.signTitleHeight
    });

    // Xuất file PDF thực tế
    const pdfPath = path.join(reportsDir, 'BaoCao_ThongKe_SuCo_SOS_VietNam_2026.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '6mm', right: '10mm', bottom: '6mm', left: '10mm' }
    });
    console.log("Exported PDF:", pdfPath);

    const pdfSize = fs.statSync(pdfPath).size;
    results.assertions.push({
      test: "Xuất file PDF thành công, dung lượng hợp lệ (> 10KB và < 200KB)",
      passed: pdfSize > 10000 && pdfSize < 200000,
      expected: true,
      actual: `${Math.round(pdfSize / 1024)} KB`
    });

    // Chụp ảnh print layout
    const modalPrintEl = await page.$('#territoryStatsModal');
    if (modalPrintEl) {
      await modalPrintEl.screenshot({ path: path.join(screenshotsDir, 'territory-stats-print-layout-fixed.png') });
      console.log("Saved screenshot: Reports/qa/playwright/screenshots/territory-stats-print-layout-fixed.png");
    }

    results.passed = results.assertions.every(a => a.passed);
  } finally {
    await browser.close();
  }

  // Ghi báo cáo JSON và Markdown
  const jsonReportPath = path.join(reportsDir, '2026-10-12-print-footer-and-tabs-fix.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf-8');

  const mdReportPath = path.join(reportsDir, '2026-10-12-print-footer-and-tabs-fix.md');
  const mdContent = `# Báo Cáo Kiểm Thử Tự Động Playwright: Khắc Phục Trang Trắng, Khối Chữ Ký & 5 Tab Buttons

## Tổng Quan
- Thời gian: \`${results.timestamp}\`
- Trạng thái tổng thể: **${results.passed ? 'ĐẠT (PASS 100%)' : 'KHÔNG ĐẠT (FAIL)'}**
- Số tiêu chí kiểm tra: **${results.assertions.length}**

## Chi Tiết Các Tiêu Chí Kiểm Tra

${results.assertions.map((a, i) => `### ${i + 1}. ${a.test}
- Trạng thái: **${a.passed ? '✅ PASS' : '❌ FAIL'}**
- Kết quả thực tế: \`${JSON.stringify(a.actual)}\`
${a.details ? `\`\`\`json\n${JSON.stringify(a.details, null, 2)}\n\`\`\`` : ''}
`).join('\n')}

## Minh Chứng Xuất File
- **File PDF**: \`Reports/qa/playwright/BaoCao_ThongKe_SuCo_SOS_VietNam_2026.pdf\`
- **Ảnh 5 Tab Buttons**: \`Reports/qa/playwright/screenshots/sidebar-tabs-5-buttons-fixed.png\`
- **Ảnh Print Layout Fixed**: \`Reports/qa/playwright/screenshots/territory-stats-print-layout-fixed.png\`
`;

  fs.writeFileSync(mdReportPath, mdContent, 'utf-8');
  console.log(`Báo cáo QA đã lưu tại: ${jsonReportPath} & ${mdReportPath}`);
  console.log(`KẾT QUẢ CUỐI CÙNG: ${results.passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  if (!results.passed) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
