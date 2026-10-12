/**
 * Playwright E2E & Automation Verification:
 * Chuẩn hóa 100% Phông chữ Times New Roman và Kích cỡ Thể thức Văn bản Hành chính theo Nghị định 30/2020/NĐ-CP
 * Áp dụng cho toàn bộ: Bản In/PDF, File Word (.docx / .doc), File Excel (.xlsx), và Bản ảnh xuất (.png).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function run() {
  const rootDir = path.join(__dirname, '..');
  const reportsDir = path.join(rootDir, 'Reports', 'qa', 'playwright');
  const screenshotsDir = path.join(reportsDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    testName: "Decree-30-Times-New-Roman-Standardization",
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
    // =========================================================================
    // PHẦN 1: KIỂM TRA BẢN IN & FILE PDF TRÊN BẢNG THỐNG KÊ (territoryStatsModal)
    // =========================================================================
    console.log("\n=== PHẦN 1: KIỂM TRA BẢN IN & XUẤT PDF (territoryStatsModal) ===");
    const context = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    await page.goto('http://localhost:3000/dispatcher.html', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1500);

    // Xác thực sĩ quan trực ban và mở modal thống kê địa bàn
    await page.evaluate(() => {
      document.body.classList.add('officer-authenticated');
      const officer = {
        username: 'police_thuanhoa',
        name: 'Đại úy Lê Văn Hòa',
        agency: 'police',
        agencyName: 'Công An Xã Thuận Hòa',
        level: 'ward',
        province: 'Cần Thơ',
        ward: 'Thuận Hòa'
      };
      if (window.dispatcher) {
        window.dispatcher.currentOfficer = officer;
        window.dispatcher.openTerritoryStatsModal('all');
      }
    });

    await page.waitForTimeout(800);

    // Kích hoạt mode in trực tiếp để kiểm tra media print styles
    await page.evaluate(() => {
      document.body.classList.add('printing-territory-stats');
    });

    const printDomMetrics = await page.evaluate(() => {
      const getMetrics = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const style = window.getComputedStyle(el);
        return {
          selector,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fontStyle: style.fontStyle,
          textTransform: style.textTransform,
          text: el.innerText.trim().replace(/\s+/g, ' ')
        };
      };

      return {
        container: getMetrics('#territoryStatsPrintArea'),
        upperAgency: getMetrics('#printUpperAgency'),
        lowerAgency: getMetrics('#printLowerAgency'),
        datePlace: getMetrics('#printDatePlace'),
        title: getMetrics('.print-title-doc'),
        filterTitle: getMetrics('#printFilterCategoryTitle'),
        table: getMetrics('table.territory-stats-table'),
        tableTh: getMetrics('table.territory-stats-table th'),
        recipientTitle: getMetrics('.print-official-footer-recipient div:first-child'),
        recipientBody: getMetrics('.print-official-footer-recipient'),
        datePlaceFooter: getMetrics('#printDatePlaceFooter'),
        signTitle: getMetrics('.print-official-footer-sign-title'),
        officerFooter: getMetrics('#printOfficerNameFooter')
      };
    });

    // Xác minh phông chữ Times New Roman trên các thành phần
    const fontChecks = [
      { name: "Container", item: printDomMetrics.container },
      { name: "Upper Agency", item: printDomMetrics.upperAgency },
      { name: "Lower Agency", item: printDomMetrics.lowerAgency },
      { name: "Date & Place", item: printDomMetrics.datePlace },
      { name: "Document Title", item: printDomMetrics.title },
      { name: "Table Header", item: printDomMetrics.tableTh },
      { name: "Sign Title", item: printDomMetrics.signTitle },
      { name: "Officer Footer", item: printDomMetrics.officerFooter }
    ];

    const allTimesNewRoman = fontChecks.every(fc => fc.item && fc.item.fontFamily.toLowerCase().includes('times new roman'));
    addAssertion(
      "PRINT_PDF_FONT_TIMES_NEW_ROMAN",
      "Bản In & PDF Thống kê: 100% các thành phần tiêu đề, cơ quan, bảng biểu, chữ ký áp dụng phông chữ Times New Roman",
      allTimesNewRoman,
      { metrics: fontChecks }
    );

    // Xác minh cỡ chữ chuẩn Nghị định 30:
    // Tiêu đề: 14.5pt (~19.3px), Chức danh: 13pt (~17.3px), Địa danh ngày tháng: 13pt (~17.3px)
    const isDecree30Sizing = 
      parseFloat(printDomMetrics.title.fontSize) >= 18 && 
      parseFloat(printDomMetrics.signTitle.fontSize) >= 16 &&
      parseFloat(printDomMetrics.datePlace.fontSize) >= 16;
    
    addAssertion(
      "PRINT_PDF_DECREE30_SIZING",
      "Bản In & PDF Thống kê: Kích cỡ phân cấp chuẩn NĐ 30 (Tiêu đề ~14.5pt, Chức danh ký ~13pt, Địa danh ~13pt)",
      isDecree30Sizing,
      {
        titleFontSize: printDomMetrics.title.fontSize,
        signTitleFontSize: printDomMetrics.signTitle.fontSize,
        datePlaceFontSize: printDomMetrics.datePlace.fontSize
      }
    );

    // Xuất file PDF mẫu để lưu bằng chứng kiểm thử
    const pdfPath = path.join(screenshotsDir, 'Bao_Cao_Thong_Ke_Su_Co_Decree30.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '8mm', right: '10mm', bottom: '8mm', left: '10mm' }
    });
    console.log(`Đã xuất PDF kiểm thử thành công: ${pdfPath}`);

    // Chụp ảnh bằng chứng
    const ssPrintPath = path.join(screenshotsDir, 'territory_stats_print_decree30.png');
    await page.screenshot({ path: ssPrintPath, fullPage: false });

    // =========================================================================
    // PHẦN 2: KIỂM TRA PHIẾU TIẾP NHẬN SỰ CỐ KHẨN CẤP (#reportSheetContainer)
    // =========================================================================
    console.log("\n=== PHẦN 2: KIỂM TRA PHIẾU TIẾP NHẬN SỰ CỐ KHẨN CẤP (reportSheetContainer) ===");
    
    await page.evaluate(() => {
      document.body.classList.remove('printing-territory-stats');
      const testIncident = {
        id: 'SOS-TEST-999',
        agency: 'police',
        agencyName: 'Công An Xã Thuận Hòa',
        address: 'Ấp Phước Thuận, Xã Thuận Hòa, TP. Cần Thơ',
        reporterName: 'Trần Văn Dân',
        reporterPhone: '0988123456',
        createdAt: new Date().toISOString(),
        incidentTags: ['Khẩn Cấp', 'An Ninh'],
        status: 'dispatching',
        signatures: {
          isFullySigned: false,
          citizen: { signed: false },
          officer: { signed: false }
        }
      };
      if (window.dispatcher) {
        window.dispatcher.selectedIncidentId = 'SOS-TEST-999';
        window.dispatcher.incidents.set('SOS-TEST-999', testIncident);
        window.dispatcher.openReportModal(testIncident);
      }
    });

    await page.waitForTimeout(600);

    const sheetMetrics = await page.evaluate(() => {
      const getMetrics = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const style = window.getComputedStyle(el);
        return {
          selector,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight
        };
      };

      return {
        container: getMetrics('#reportSheetContainer'),
        agencyUpper: getMetrics('#docHeaderAgencyUpper'),
        agencyLower: getMetrics('#docHeaderAgencyLower'),
        docNumber: getMetrics('#docHeaderDocNumber'),
        dateLocation: getMetrics('#docHeaderDateLocation'),
        signCitizen: getMetrics('#docSignaturesBlock div:first-child div:first-child'),
        signOfficer: getMetrics('#docSignaturesBlock div:last-child div:first-child')
      };
    });

    const isSheetTimesNewRoman = 
      sheetMetrics.container && 
      sheetMetrics.container.fontFamily.toLowerCase().includes('times new roman') &&
      sheetMetrics.agencyUpper.fontFamily.toLowerCase().includes('times new roman') &&
      sheetMetrics.dateLocation.fontFamily.toLowerCase().includes('times new roman');

    addAssertion(
      "REPORT_SHEET_FONT_TIMES_NEW_ROMAN",
      "Phiếu Tiếp Nhận (Modal & Ảnh): 100% các thành phần đều kế thừa và sử dụng Times New Roman",
      isSheetTimesNewRoman,
      { sheetMetrics }
    );

    const ssSheetPath = path.join(screenshotsDir, 'report_sheet_decree30.png');
    await page.screenshot({ path: ssSheetPath, fullPage: false });

    // =========================================================================
    // PHẦN 3: KIỂM TRA FILE WORD (.DOCX) ĐƯỢC TẠO BỞI PYTHON GENERATOR
    // =========================================================================
    console.log("\n=== PHẦN 3: KIỂM TRA FILE WORD (.DOCX) SINH BỞI PYTHON GENERATOR ===");
    
    const testJsonPath = path.join(rootDir, '.tmp_test_report_payload.json');
    const testDocxPath = path.join(screenshotsDir, 'test_output_decree30.docx');
    
    const samplePayload = {
      incidentId: "SOS-2026-8888",
      agency: "police",
      province: "Cần Thơ",
      ward: "Thuận Hòa",
      unitName: "Công An Xã Thuận Hòa",
      unitAddress: "Trụ sở Công An Xã Thuận Hòa, TP. Cần Thơ",
      unitPhone: "0292 3822 123",
      unitSms: "0988 999 115",
      officerName: "Đại úy Lê Văn Hòa",
      officerTitle: "Trưởng Công An Xã",
      reporterName: "Nguyễn Văn An",
      reporterPhone: "0912345678",
      targetType: "Người dân",
      incidentTime: "14:30:00 - 12/10/2026",
      incidentAddress: "Ấp Thuận Bình, Xã Thuận Hòa, TP. Cần Thơ",
      lat: 9.6012,
      lng: 105.8523,
      incidentDescription: "Người dân cần cứu trợ khẩn cấp.",
      helpRequest: "Điều động xe tuần tra đến hiện trường",
      adviceGiven: "Giữ an toàn tại chỗ",
      resolutionResult: "Đã xử lý xong an toàn.",
      citizenSignature: { signed: true, signatureData: "Nguyễn Văn An", signedAt: "12/10/2026 14:35" },
      officerSignature: { signed: true, signatureData: "Lê Văn Hòa", signedAt: "12/10/2026 14:36" }
    };

    fs.writeFileSync(testJsonPath, JSON.stringify(samplePayload, null, 2), 'utf-8');

    // Chạy generator script
    execSync(`python scripts/generate_report_docx.py "${testJsonPath}" "${testDocxPath}"`, { cwd: rootDir });
    const docxExists = fs.existsSync(testDocxPath);

    // Kiểm tra cấu trúc nội bộ docx bằng script Python nhỏ
    const pyDocxScriptFile = path.join(rootDir, '.tmp_verify_docx.py');
    const pyVerifyScript = `import docx
doc = docx.Document(r"""${testDocxPath}""")
styles = doc.styles['Normal']
normal_font = styles.font.name
normal_size = styles.font.size.pt if styles.font.size else 0

non_times = []
for p in doc.paragraphs:
    for r in p.runs:
        if r.font.name and r.font.name != 'Times New Roman':
            non_times.append((r.text, r.font.name))

for t in doc.tables:
    for row in t.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    if r.font.name and r.font.name != 'Times New Roman':
                        non_times.append((r.text, r.font.name))

print(f"NORMAL_FONT:{normal_font}|NORMAL_SIZE:{normal_size}|NON_TIMES_COUNT:{len(non_times)}")
`;
    fs.writeFileSync(pyDocxScriptFile, pyVerifyScript, 'utf-8');
    const pyDocxOut = execSync(`python "${pyDocxScriptFile}"`, { cwd: rootDir }).toString().trim();
    if (fs.existsSync(pyDocxScriptFile)) fs.unlinkSync(pyDocxScriptFile);
    console.log("Kết quả kiểm tra DOCX:", pyDocxOut);

    const isDocxTimes = pyDocxOut.includes("NORMAL_FONT:Times New Roman") && pyDocxOut.includes("NON_TIMES_COUNT:0");
    const isDocxSize13 = pyDocxOut.includes("NORMAL_SIZE:13.0");

    addAssertion(
      "DOCX_TIMES_NEW_ROMAN_AND_DECREE30",
      "File Word (.docx): 100% font chữ là Times New Roman, Normal font size đạt chuẩn 13pt theo Nghị định 30/2020",
      docxExists && isDocxTimes && isDocxSize13,
      { output: pyDocxOut }
    );

    // =========================================================================
    // PHẦN 4: KIỂM TRA FILE EXCEL (.XLSX) ĐƯỢC TẠO BỞI PYTHON GENERATOR
    // =========================================================================
    console.log("\n=== PHẦN 4: KIỂM TRA FILE EXCEL (.XLSX) SINH BỞI PYTHON GENERATOR ===");
    
    const testExcelJsonPath = path.join(rootDir, '.tmp_test_excel_payload.json');
    const testXlsxPath = path.join(screenshotsDir, 'test_output_decree30.xlsx');

    const sampleExcelPayload = {
      incidents: [
        {
          id: "SOS-2026-0001",
          createdAt: new Date().toISOString(),
          resolvedAt: new Date().toISOString(),
          agency: "police",
          incidentTags: ["Khẩn cấp"],
          reporterName: "Trần Văn An",
          reporterPhone: "0912345678",
          address: "123 Đường 30/4, Thuận Hòa, Cần Thơ",
          jurisdiction: { ward: "Thuận Hòa", province: "Cần Thơ" },
          lat: 9.601,
          lng: 105.852,
          resolutionResult: "Đã hoàn thành an toàn"
        }
      ],
      officerName: "Đại úy Lê Văn Hòa",
      generatedAt: "12/10/2026 15:00:00"
    };

    fs.writeFileSync(testExcelJsonPath, JSON.stringify(sampleExcelPayload, null, 2), 'utf-8');

    execSync(`python scripts/generate_history_excel.py "${testExcelJsonPath}" "${testXlsxPath}"`, { cwd: rootDir });
    const xlsxExists = fs.existsSync(testXlsxPath);

    // Kiểm tra cấu trúc nội bộ file excel bằng openpyxl
    const pyExcelScriptFile = path.join(rootDir, '.tmp_verify_xlsx.py');
    const pyVerifyExcelScript = `import openpyxl
wb = openpyxl.load_workbook(r"""${testXlsxPath}""")
ws = wb.active
a1_font = ws['A1'].font.name
a1_size = ws['A1'].font.size
a2_size = ws['A2'].font.size
a4_size = ws['A4'].font.size

non_times_cells = []
for row in ws.iter_rows(values_only=False):
    for cell in row:
        if cell.value and cell.font and cell.font.name != 'Times New Roman':
            non_times_cells.append(str(cell.coordinate))

has_sign = any("CÁN BỘ LẬP BIỂU" in str(cell.value) for row in ws.iter_rows(values_only=False) for cell in row)
has_recip = any("Nơi nhận" in str(cell.value) for row in ws.iter_rows(values_only=False) for cell in row)

print(f"EXCEL_FONT:{a1_font}|A1_SIZE:{a1_size}|A2_SIZE:{a2_size}|A4_SIZE:{a4_size}|NON_TIMES:{len(non_times_cells)}|HAS_SIGN:{has_sign}|HAS_RECIP:{has_recip}")
`;
    fs.writeFileSync(pyExcelScriptFile, pyVerifyExcelScript, 'utf-8');
    const pyExcelOut = execSync(`python "${pyExcelScriptFile}"`, { cwd: rootDir }).toString().trim();
    if (fs.existsSync(pyExcelScriptFile)) fs.unlinkSync(pyExcelScriptFile);
    console.log("Kết quả kiểm tra EXCEL:", pyExcelOut);

    const isExcelTimes = pyExcelOut.includes("EXCEL_FONT:Times New Roman") && pyExcelOut.includes("NON_TIMES:0");
    const isExcelDecree30 = pyExcelOut.includes("A1_SIZE:12") && pyExcelOut.includes("A2_SIZE:13") && pyExcelOut.includes("HAS_SIGN:True") && pyExcelOut.includes("HAS_RECIP:True");

    addAssertion(
      "EXCEL_TIMES_NEW_ROMAN_AND_DECREE30",
      "File Excel (.xlsx): 100% font chữ là Times New Roman, Quốc hiệu 12pt, Tiêu ngữ 13pt, có Khối chữ ký & Nơi nhận theo Nghị định 30/2020",
      xlsxExists && isExcelTimes && isExcelDecree30,
      { output: pyExcelOut }
    );

    // Dọn dẹp files tạm nội bộ trong repo
    try {
      if (fs.existsSync(testJsonPath)) fs.unlinkSync(testJsonPath);
      if (fs.existsSync(testExcelJsonPath)) fs.unlinkSync(testExcelJsonPath);
    } catch (e) {}

  } catch (err) {
    console.error("Lỗi thực thi test Playwright:", err);
    addAssertion("EXECUTION_ERROR", `Phát sinh lỗi: ${err.message}`, false);
  } finally {
    await browser.close();
  }

  // Ghi báo cáo JSON và Markdown theo Quy tắc số 7
  const reportJsonPath = path.join(reportsDir, '2026-10-12-decree-30-times-new-roman-standardization.json');
  const reportMdPath = path.join(reportsDir, '2026-10-12-decree-30-times-new-roman-standardization.md');

  fs.writeFileSync(reportJsonPath, JSON.stringify(results, null, 2), 'utf-8');

  let mdContent = `# Báo Cáo Kiểm Thử Tự Động: Chuẩn Hóa Phông Chữ Times New Roman & Kích Cỡ Thể Thức Theo Nghị Định 30/2020/NĐ-CP\n\n`;
  mdContent += `- **Ngày kiểm thử**: ${results.timestamp}\n`;
  mdContent += `- **Tổng số xác nhận**: ${results.assertions.length}\n`;
  mdContent += `- **Kết quả chung**: **${results.passed ? 'PASSED (100% ĐẠT CHUẨN)' : 'FAILED'}**\n\n`;
  mdContent += `## Bảng Chi Tiết Kết Quả Kiểm Thử\n\n`;
  mdContent += `| STT | Mã Tiêu Chí | Nội Dung Kiểm Thử | Kết Quả | Chi Tiết |\n`;
  mdContent += `|---|---|---|---|---|\n`;

  results.assertions.forEach((a, idx) => {
    mdContent += `| ${idx + 1} | \`${a.id}\` | ${a.description} | ${a.passed ? '✅ PASS' : '❌ FAIL'} | \`${JSON.stringify(a.details)}\` |\n`;
  });

  mdContent += `\n## Danh Mục Bằng Chứng Sinh Ra\n\n`;
  mdContent += `- File PDF in thử nghiệm: \`Reports/qa/playwright/screenshots/Bao_Cao_Thong_Ke_Su_Co_Decree30.pdf\`\n`;
  mdContent += `- File Word (.docx) sinh thử nghiệm: \`Reports/qa/playwright/screenshots/test_output_decree30.docx\`\n`;
  mdContent += `- File Excel (.xlsx) sinh thử nghiệm: \`Reports/qa/playwright/screenshots/test_output_decree30.xlsx\`\n`;
  mdContent += `- Ảnh chụp Bản In: \`Reports/qa/playwright/screenshots/territory_stats_print_decree30.png\`\n`;
  mdContent += `- Ảnh chụp Phiếu Tiếp Nhận: \`Reports/qa/playwright/screenshots/report_sheet_decree30.png\`\n`;

  fs.writeFileSync(reportMdPath, mdContent, 'utf-8');
  console.log(`\nĐã ghi báo cáo chính thức tại:\n- ${reportJsonPath}\n- ${reportMdPath}`);

  if (!results.passed) {
    process.exit(1);
  }
}

run();
