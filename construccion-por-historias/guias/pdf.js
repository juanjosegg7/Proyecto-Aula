const { chromium } = require('playwright');
(async () => {
  const [,, entrada, salida, pie] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + entrada);
  await p.pdf({ path: salida, format: 'Letter', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888;font-family:Arial">' + pie + ' · página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '16mm', right: '16mm' } });
  await b.close();
})();
