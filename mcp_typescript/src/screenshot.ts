/**
 * Screenshot capture service using Playwright
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { ScreenshotResult } from './types.js';

export class ScreenshotService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private screenshotsDir: string;

  constructor(screenshotsDir: string = './screenshots') {
    this.screenshotsDir = screenshotsDir;
  }

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) return;

    console.log('🚀 Starting Playwright browser...');
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });

    console.log('✅ Browser initialized successfully');
  }

  /**
   * Take a screenshot of a given URL
   */
  async takeScreenshot(url: string, filename: string): Promise<ScreenshotResult> {
    try {
      if (!this.browser || !this.context) {
        await this.initialize();
      }

      console.log(`📸 Taking screenshot of: ${url}`);
      
      const page = await this.context!.newPage();
      
      // Set cache to false for fresh content
      await page.route('**/*', (route) => {
        const headers = {
          ...route.request().headers(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
        route.continue({ headers });
      });

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });

      // Wait for any dynamic content
      await page.waitForTimeout(1000);

      // Take full-page screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: 'png',
        animations: 'disabled'
      });

      // Generate filename with timestamp
      const timestamp = Date.now();
      const screenshotFilename = `${filename.replace('.html', '')}_${timestamp}.png`;
      const screenshotPath = join(this.screenshotsDir, screenshotFilename);

      // Save screenshot to file
      await writeFile(screenshotPath, screenshotBuffer);

      // Convert to base64 for AI analysis
      const screenshotBase64 = screenshotBuffer.toString('base64');

      await page.close();

      console.log(`✅ Screenshot saved: ${screenshotPath}`);

      return {
        success: true,
        filename: screenshotFilename,
        screenshotPath,
        screenshotBase64,
        timestamp
      };

    } catch (error) {
      console.error(`❌ Screenshot failed:`, error);
      return {
        success: false,
        filename: '',
        screenshotPath: '',
        screenshotBase64: '',
        timestamp: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Take multiple screenshots at different viewport sizes
   */
  async takeResponsiveScreenshots(url: string, filename: string): Promise<ScreenshotResult[]> {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    const results: ScreenshotResult[] = [];

    for (const viewport of viewports) {
      try {
        if (!this.browser || !this.context) {
          await this.initialize();
        }

        const page = await this.context!.newPage();
        await page.setViewportSize(viewport);

        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });

        await page.waitForTimeout(500);

        const screenshotBuffer = await page.screenshot({
          fullPage: true,
          type: 'png',
          animations: 'disabled'
        });

        const timestamp = Date.now();
        const screenshotFilename = `${filename.replace('.html', '')}_${viewport.name}_${timestamp}.png`;
        const screenshotPath = join(this.screenshotsDir, screenshotFilename);

        await writeFile(screenshotPath, screenshotBuffer);
        const screenshotBase64 = screenshotBuffer.toString('base64');

        await page.close();

        results.push({
          success: true,
          filename: screenshotFilename,
          screenshotPath,
          screenshotBase64,
          timestamp
        });

        console.log(`✅ ${viewport.name} screenshot saved: ${screenshotPath}`);

      } catch (error) {
        console.error(`❌ ${viewport.name} screenshot failed:`, error);
        results.push({
          success: false,
          filename: '',
          screenshotPath: '',
          screenshotBase64: '',
          timestamp: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
    }
  }

  /**
   * Check if browser is initialized
   */
  isInitialized(): boolean {
    return this.browser !== null && this.context !== null;
  }
} 