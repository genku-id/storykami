const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/faizal-ainun/', { waitUntil: 'networkidle2' });
  const hari = await page.$eval('.countdown-item span', el => el.textContent);
  console.log('Hari:', hari);
  const btn = await page.$('#btn-open');
  if (btn) await btn.click();
  console.log('Clicked');
  await browser.close();
})();
