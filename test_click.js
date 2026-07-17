const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://storykami.my.id/faizal-ainun/', { waitUntil: 'networkidle2' });
  const html = await page.content();
  console.log('Has Button:', html.includes('id="btn-open"'));
  const btn = await page.$('#btn-open');
  if (btn) {
    await btn.click();
    await new Promise(r => setTimeout(r, 2000));
    const coverClass = await page.$eval('#cover-page', el => el.className);
    console.log('Cover class after click:', coverClass);
    
    // Check countdown
    const days = await page.$eval('#days', el => el.textContent);
    console.log('Days left:', days);
  } else {
    console.log('Button not found');
  }
  await browser.close();
})();
