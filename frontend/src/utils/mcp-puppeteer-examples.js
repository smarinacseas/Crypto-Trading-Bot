/**
 * MCP Puppeteer Server Examples for Crypto Trading Bot Development
 * 
 * This file contains examples of how to use the Puppeteer MCP server
 * for crypto trading bot development tasks.
 * 
 * Available MCP Tools:
 * - puppeteer_navigate: Navigate to any URL
 * - puppeteer_screenshot: Capture page or element screenshots
 * - puppeteer_click: Click on page elements
 * - puppeteer_fill: Fill input fields
 * - puppeteer_evaluate: Execute JavaScript in browser context
 */

// Example MCP server usage scenarios for crypto trading bot development

const mcpExamples = {
  
  // 1. Navigate to crypto exchanges for data collection
  navigateToCryptoExchange: {
    description: "Navigate to a crypto exchange for data scraping",
    examples: [
      {
        exchange: "CoinGecko",
        url: "https://www.coingecko.com/en/coins/bitcoin",
        purpose: "Get Bitcoin price and market data"
      },
      {
        exchange: "Binance",
        url: "https://www.binance.com/en/trade/BTC_USDT",
        purpose: "Monitor BTC/USDT trading pair"
      },
      {
        exchange: "CoinMarketCap",
        url: "https://coinmarketcap.com/currencies/bitcoin/",
        purpose: "Collect historical price data"
      }
    ]
  },

  // 2. Screenshot capture for documentation and monitoring
  screenshotCapture: {
    description: "Capture screenshots of trading interfaces and data",
    examples: [
      {
        target: "Trading dashboard",
        purpose: "Document current trading interface state"
      },
      {
        target: "Price charts",
        purpose: "Capture technical analysis charts"
      },
      {
        target: "Order book",
        purpose: "Monitor market depth and liquidity"
      },
      {
        target: "Portfolio performance",
        purpose: "Track trading bot performance over time"
      }
    ]
  },

  // 3. Element interaction for automated testing
  elementInteraction: {
    description: "Interact with UI elements for testing and automation",
    examples: [
      {
        action: "Click trading pair selector",
        purpose: "Test cryptocurrency pair switching functionality"
      },
      {
        action: "Fill trade amount input",
        purpose: "Test order placement interface"
      },
      {
        action: "Click buy/sell buttons",
        purpose: "Test order execution workflow"
      },
      {
        action: "Navigate menu items",
        purpose: "Test application navigation"
      }
    ]
  },

  // 4. JavaScript evaluation for data extraction
  jsEvaluation: {
    description: "Execute JavaScript to extract data from crypto websites",
    examples: [
      {
        script: "document.querySelector('.price-display').textContent",
        purpose: "Extract current crypto price from exchange"
      },
      {
        script: "Array.from(document.querySelectorAll('.order-book-row')).map(row => row.textContent)",
        purpose: "Extract order book data"
      },
      {
        script: "window.tradingData || {}",
        purpose: "Access trading platform's JavaScript data"
      },
      {
        script: "localStorage.getItem('trading-preferences')",
        purpose: "Extract user preferences for testing"
      }
    ]
  },

  // 5. Common crypto trading workflows
  tradingWorkflows: {
    description: "Common workflows for crypto trading bot development",
    workflows: [
      {
        name: "Market Data Collection",
        steps: [
          "Navigate to crypto exchange",
          "Wait for price data to load",
          "Extract current prices via JavaScript",
          "Capture screenshot for verification",
          "Store data for analysis"
        ]
      },
      {
        name: "Trading Interface Testing",
        steps: [
          "Navigate to trading platform",
          "Fill in trade parameters",
          "Click execute trade button",
          "Capture confirmation screen",
          "Verify trade execution"
        ]
      },
      {
        name: "Performance Monitoring",
        steps: [
          "Navigate to portfolio dashboard",
          "Capture performance screenshots",
          "Extract performance metrics",
          "Compare with expected results",
          "Generate monitoring reports"
        ]
      },
      {
        name: "News and Sentiment Analysis",
        steps: [
          "Navigate to crypto news sites",
          "Extract headlines and content",
          "Capture screenshots of important news",
          "Analyze sentiment indicators",
          "Store data for trading decisions"
        ]
      }
    ]
  }
};

// Usage instructions for MCP server
const mcpUsageInstructions = {
  setup: {
    description: "The MCP server is configured in .claude/settings.local.json",
    configuration: {
      serverName: "puppeteer",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  },
  
  tools: {
    puppeteer_navigate: {
      description: "Navigate to a URL",
      parameters: {
        url: "Target URL to navigate to"
      }
    },
    puppeteer_screenshot: {
      description: "Take a screenshot of the current page",
      parameters: {
        name: "Optional filename for the screenshot"
      }
    },
    puppeteer_click: {
      description: "Click on an element",
      parameters: {
        selector: "CSS selector for the element to click"
      }
    },
    puppeteer_fill: {
      description: "Fill an input field",
      parameters: {
        selector: "CSS selector for the input field",
        value: "Value to enter in the field"
      }
    },
    puppeteer_evaluate: {
      description: "Execute JavaScript in the browser context",
      parameters: {
        script: "JavaScript code to execute"
      }
    }
  },
  
  bestPractices: [
    "Always navigate to the target URL before interacting with elements",
    "Use specific CSS selectors for reliable element targeting",
    "Take screenshots for debugging and verification purposes",
    "Handle errors gracefully when elements are not found",
    "Be respectful of rate limits when scraping external sites",
    "Consider using headless mode for production automation"
  ]
};

module.exports = {
  mcpExamples,
  mcpUsageInstructions
};