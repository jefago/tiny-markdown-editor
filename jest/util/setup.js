const { chromium } = require('playwright');

jest.setTimeout(30000);

let browser;
let context;

// Set up global page for jest-puppeteer compatibility
beforeAll(async () => {
  // Server is already started by global setup
  browser = await chromium.launch();
  context = await browser.newContext();
  global.page = await context.newPage();
  
  // Make browser available globally for custom grammar tests
  global.browser = browser;
  global.context = context;
});

afterAll(async () => {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
    global.browser = null;
    global.context = null;
  }
  // Server will be stopped by global teardown
});