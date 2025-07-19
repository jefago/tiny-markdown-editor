const { chromium, firefox, webkit } = require('playwright');

jest.setTimeout(30000);

// Get browser type from Jest globals or environment variable
const browserType = global.BROWSER_TYPE || process.env.BROWSER_TYPE || 'chromium';

const getBrowser = () => {
  switch (browserType) {
    case 'firefox':
      return firefox;
    case 'webkit':
      return webkit;
    case 'chromium':
    default:
      return chromium;
  }
};

let browser;
let context;

// Set up global page for jest-puppeteer compatibility
beforeAll(async () => {
  // Server is already started by global setup
  const browserEngine = getBrowser();
  browser = await browserEngine.launch();
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