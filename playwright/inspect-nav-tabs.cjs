const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  
  await page.addInitScript(() => {
    sessionStorage.setItem('sos_gatekeeper_pass', 'true');
    const officer = {
      username: 'admin',
      name: 'Điền Trần Vĩnh An',
      agency: 'admin',
      agencyName: 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia',
      level: 'national',
      province: 'Cần Thơ',
      ward: 'Tân An'
    };
    sessionStorage.setItem('sos_dispatcher_officer', JSON.stringify(officer));
  });

  await page.goto('http://localhost:3000/dispatcher.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    const a = document.getElementById('activeCountBadge');
    if (a) a.textContent = '82';
    const h = document.getElementById('historyCountBadge');
    if (h) h.textContent = '10';
    const e = document.getElementById('tabBtnEnterprises');
    if (e) e.style.display = 'inline-flex';
    const ho = document.getElementById('tabBtnHospitals');
    if (ho) ho.style.display = 'inline-flex';
  });

  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const nav = document.getElementById('sidebarTabsNav');
    if (!nav) return { error: 'nav not found' };
    const navRect = nav.getBoundingClientRect();
    const btns = Array.from(nav.querySelectorAll('.sidebar-tab-btn')).map(b => {
      const bRect = b.getBoundingClientRect();
      const svg = b.querySelector('svg');
      const sRect = svg ? svg.getBoundingClientRect() : null;
      const span = b.querySelector('span');
      const spanRect = span ? span.getBoundingClientRect() : null;
      const computed = window.getComputedStyle(b);
      return {
        id: b.id,
        text: b.innerText.trim(),
        bRect: { left: Math.round(bRect.left), width: Math.round(bRect.width), right: Math.round(bRect.right) },
        sRect: sRect ? { left: Math.round(sRect.left), width: Math.round(sRect.width), right: Math.round(sRect.right) } : null,
        spanRect: spanRect ? { left: Math.round(spanRect.left), width: Math.round(spanRect.width), right: Math.round(spanRect.right) } : null,
        padding: computed.padding,
        display: computed.display,
        gap: computed.gap
      };
    });
    return { navRect: { left: Math.round(navRect.left), width: Math.round(navRect.width), right: Math.round(navRect.right) }, btns };
  });

  console.log(JSON.stringify(data, null, 2));

  const navEl = await page.locator('#sidebarTabsNav');
  const ssPath = path.join(__dirname, '..', 'Reports', 'qa', 'playwright', 'screenshots', 'debug_sidebar_tabs.png');
  await navEl.screenshot({ path: ssPath });
  console.log('Saved screenshot:', ssPath);

  await browser.close();
})();
