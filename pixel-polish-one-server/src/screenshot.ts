/**
 * Screenshot service using Playwright for high-quality visual capture
 */

import { chromium, Browser, Page } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ScreenshotResult } from './types.js';

export class ScreenshotService {
  private browser: Browser | null = null;
  private screenshotsDir: string;
  private isInitialized = false;

  constructor(screenshotsDir: string) {
    this.screenshotsDir = screenshotsDir;
  }

  /**
   * Initialize Playwright browser
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🎭 Initializing Playwright browser...');
      
      // Ensure screenshots directory exists
      await mkdir(this.screenshotsDir, { recursive: true });

      // Launch browser with optimized settings
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.isInitialized = true;
      console.log('✅ Playwright browser initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Playwright browser:', error);
      throw error;
    }
  }

  /**
   * Take a screenshot of the specified URL
   */
  async takeScreenshot(url: string, filename: string): Promise<ScreenshotResult> {
    if (!this.browser) {
      await this.initialize();
    }

    let page: Page | null = null;

    try {
      console.log(`📸 Taking screenshot of: ${url}`);

      // Create new page with cache disabled
      page = await this.browser!.newPage();
      
      // Disable cache to ensure fresh content
      await page.route('**/*', (route) => {
        route.continue({
          headers: {
            ...route.request().headers(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      });

      // Set viewport for consistent screenshots
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Add cache-busting timestamp to URL
      const timestamp = Date.now();
      const cacheBustedUrl = url.includes('?') 
        ? `${url}&t=${timestamp}` 
        : `${url}?t=${timestamp}`;

      // Navigate to the page
      await page.goto(cacheBustedUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for any dynamic content to load
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Additional wait for any animations

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: 'png',
        quality: 90
      });

      // Generate filename
      const screenshotFilename = `${filename.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.png`;
      const screenshotPath = join(this.screenshotsDir, screenshotFilename);

      // Save screenshot to file
      await writeFile(screenshotPath, screenshotBuffer);

      // Convert to base64 for embedding
      const screenshotBase64 = screenshotBuffer.toString('base64');

      console.log(`✅ Screenshot saved: ${screenshotPath}`);

      return {
        success: true,
        filename: screenshotFilename,
        screenshotPath,
        screenshotBase64,
        timestamp
      };

    } catch (error) {
      console.error('❌ Screenshot failed:', error);
      
      return {
        success: false,
        filename: '',
        screenshotPath: '',
        screenshotBase64: '',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Screenshot failed'
      };

    } finally {
      // Always close the page
      if (page) {
        await page.close().catch(console.error);
      }
    }
  }

  /**
   * Check if service is initialized
   */
  checkInitialized(): boolean {
    return this.isInitialized && this.browser !== null;
  }

  /**
   * Close the browser and cleanup
   */
  async close(): Promise<void> {
    if (this.browser) {
      console.log('🛑 Closing Playwright browser...');
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('✅ Playwright browser closed');
    }
  }
} 