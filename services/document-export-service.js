/**
 * Service xuất tài liệu hành chính & thống kê (Word .docx chuẩn Nghị định 30/2020/NĐ-CP & Excel .xlsx).
 * Đóng gói quy trình tạo tệp tạm, gọi động cơ Python, đọc dữ liệu nhị phân và dọn dẹp bộ nhớ an toàn.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const GENERATORS_DIR = fs.existsSync(path.join(PROJECT_ROOT, 'scripts', 'generators'))
  ? path.join(PROJECT_ROOT, 'scripts', 'generators')
  : path.join(PROJECT_ROOT, 'scripts');
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

/**
 * Thực thi kịch bản Python để biên dịch dữ liệu JSON thành tệp nhị phân đầu ra
 */
function executePythonGenerator(scriptFilename, payload, outputExt) {
  return new Promise((resolve, reject) => {
    const tempId = `${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
    const tempJsonPath = path.join(PROJECT_ROOT, `temp_${tempId}.json`);
    const tempOutPath = path.join(PROJECT_ROOT, `temp_${tempId}.${outputExt}`);

    try {
      fs.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2), { encoding: 'utf8', mode: 0o600 });
    } catch (err) {
      return reject(new Error('Không thể khởi tạo tệp cấu hình tạm thời: ' + err.message));
    }

    const scriptPath = fs.existsSync(path.join(GENERATORS_DIR, scriptFilename))
      ? path.join(GENERATORS_DIR, scriptFilename)
      : path.join(PROJECT_ROOT, 'scripts', scriptFilename);

    exec(`${PYTHON_CMD} "${scriptPath}" "${tempJsonPath}" "${tempOutPath}"`, (error, stdout, stderr) => {
      try {
        if (error || !fs.existsSync(tempOutPath)) {
          console.error(`Document generator error (${scriptFilename}):`, error, stderr);
          return reject(new Error(stderr || error?.message || 'Lỗi biên dịch tệp văn bản từ hệ thống'));
        }
        const fileBuffer = fs.readFileSync(tempOutPath);
        resolve(fileBuffer);
      } catch (err) {
        reject(err);
      } finally {
        try { if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath); } catch (_) {}
        try { if (fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath); } catch (_) {}
      }
    });
  });
}

export const documentExportService = {
  /**
   * Sinh Biên bản xác minh vụ việc khẩn cấp (.docx)
   */
  async generateVerificationRecordDocx(recordData) {
    recordData.incidentId = recordData.incidentId || recordData.id || 'SOS-01';
    const buffer = await executePythonGenerator('generate_verification_record_docx.py', recordData, 'docx');
    const filename = `DuThao_BienBan_XacMinh_${recordData.incidentId}.docx`;
    return {
      buffer,
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
  },

  /**
   * Sinh Phiếu tiếp nhận xử lý sự cố khẩn cấp (.docx)
   */
  async generateIncidentReportDocx(reportData) {
    const buffer = await executePythonGenerator('generate_report_docx.py', reportData, 'docx');
    const filename = `Phieu_TiepNhan_UPSC_${reportData.incidentId || 'SOS'}.docx`;
    return {
      buffer,
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
  },

  /**
   * Xuất Bảng kê lịch sử sự cố cứu hộ ra Excel (.xlsx)
   */
  async generateIncidentHistoryExcel(exportPayload) {
    const buffer = await executePythonGenerator('generate_history_excel.py', exportPayload, 'xlsx');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `BangKe_LichSu_SuCo_SOS_${dateStr}.xlsx`;
    return {
      buffer,
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }
};
