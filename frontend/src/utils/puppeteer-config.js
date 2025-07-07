const puppeteer = require('puppeteer');

class PuppeteerScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init(options = {}) {
    const defaultOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      ...options
    };

    this.browser = await puppeteer.launch(defaultOptions);
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    return this;
  }

  async scrapeExchangeData(url, selectors = {}) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      
      const data = await this.page.evaluate((selectors) => {
        const result = {};
        
        // Extract price data
        if (selectors.price) {
          const priceElement = document.querySelector(selectors.price);
          result.price = priceElement ? priceElement.textContent.trim() : null;
        }
        
        // Extract volume data
        if (selectors.volume) {
          const volumeElement = document.querySelector(selectors.volume);
          result.volume = volumeElement ? volumeElement.textContent.trim() : null;
        }
        
        // Extract market cap
        if (selectors.marketCap) {
          const marketCapElement = document.querySelector(selectors.marketCap);
          result.marketCap = marketCapElement ? marketCapElement.textContent.trim() : null;
        }
        
        return result;
      }, selectors);
      
      return data;
    } catch (error) {
      console.error('Error scraping exchange data:', error);
      throw error;
    }
  }

  async takeScreenshot(filename = 'screenshot.png') {
    if (!this.page) {
      throw new Error('Page not initialized. Call init() first.');
    }
    
    await this.page.screenshot({ path: filename, fullPage: true });
    return filename;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Example usage function for crypto exchanges
async function scrapeCryptoData() {
  const scraper = new PuppeteerScraper();
  
  try {
    await scraper.init({ headless: false }); // Set to true for production
    
    // Example: Scrape CoinGecko
    const coinGeckoData = await scraper.scrapeExchangeData('https://www.coingecko.com/en/coins/bitcoin', {
      price: '[data-test-id="price-display"]',
      volume: '[data-test-id="trading-volume"]',
      marketCap: '[data-test-id="market-cap"]'
    });
    
    console.log('CoinGecko Data:', coinGeckoData);
    
    return coinGeckoData;
  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

module.exports = {
  PuppeteerScraper,
  scrapeCryptoData
};