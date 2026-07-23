const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function render() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  
  const launchOptions = {
    headless: true
  };
  
  if (fs.existsSync(edgePath)) {
    launchOptions.executablePath = edgePath;
  }

  console.log('Launching browser...');
  const browser = await chromium.launch(launchOptions);
  
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2
  });

  const filePath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  console.log('Navigating to:', filePath);
  await page.goto(filePath, { waitUntil: 'networkidle' });

  // Ensure fonts and images are fully loaded
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
  });

  // Small delay for font rendering and layout paint
  await page.waitForTimeout(1000);

  // Get full document height
  const bodyHandle = await page.$('body');
  const boundingBox = await bodyHandle.boundingBox();
  const contentHeight = Math.ceil(boundingBox.height);
  console.log('Measured content height:', contentHeight);

  // 1. Save High-Res PNG
  const pngPath = path.resolve(__dirname, 'Thirtyone_Lab_Master_HD.png');
  console.log('Saving PNG to:', pngPath);
  await page.screenshot({
    path: pngPath,
    fullPage: true,
    type: 'png'
  });

  // 2. Save PDF
  const pdfPath = path.resolve(__dirname, 'ThirtyOne_Lab_Brand_Presentation.pdf');
  console.log('Saving PDF to:', pdfPath);
  
  await page.pdf({
    path: pdfPath,
    printBackground: true,
    width: '1400px',
    height: (contentHeight + 20) + 'px',
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });

  await browser.close();
  console.log('PNG and PDF generated successfully!');
}

render().catch(err => {
  console.error('Error during rendering:', err);
  process.exit(1);
});
