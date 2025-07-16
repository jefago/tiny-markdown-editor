const { chromium } = require('playwright');

jest.setTimeout(30000);

let browser;
let context;

// Set up global page for jest-puppeteer compatibility
beforeAll(async () => {
  browser = await chromium.launch();
  context = await browser.newContext();
  global.page = await context.newPage();
  
  // Make browser available globally for custom grammar tests
  global.browser = browser;
  global.context = context;
  
  // Start the test server
  require('./server');
  
  // Give the server time to start
  await new Promise(resolve => setTimeout(resolve, 1000));
});

afterAll(async () => {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
    global.browser = null;
    global.context = null;
  }
});