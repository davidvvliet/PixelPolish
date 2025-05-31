/**
 * DOM Capture service using Puppeteer for comprehensive element analysis
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import type { DOMData, DOMElement, DOMStructure } from './types.js';

export class DOMCaptureService {
  private layoutProperties = new Set([
    'display', 'position', 'top', 'left', 'right', 'bottom',
    'margin', 'padding', 'width', 'height', 'min-width', 'max-width',
    'min-height', 'max-height', 'flex', 'flex-direction', 'flex-wrap',
    'justify-content', 'align-items', 'align-content', 'grid',
    'grid-template-columns', 'grid-template-rows', 'grid-gap',
    'float', 'clear', 'overflow', 'z-index', 'font-size', 'font-family',
    'color', 'background-color', 'border', 'border-radius', 'box-shadow'
  ]);

  /**
   * Capture DOM structure and element data from a URL
   */
  async capture(url: string): Promise<DOMData> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Create a fresh browser instance for each capture
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      page = await browser.newPage();

      // Disable cache to ensure fresh content
      await page.setCacheEnabled(false);

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1920, height: 1080 });

      console.log(`🔍 Capturing DOM structure from: ${url}`);

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for any dynamic content to load
      await page.waitForFunction(() => document.readyState === 'complete');

      // Extract DOM structure and element data
      const domData = await page.evaluate(() => {
        const elements: any[] = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null
        );

        let node: Element | null;
        while (node = walker.nextNode() as Element) {
          const rect = node.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(node);
          
          // Only include visible elements with meaningful size
          if (rect.width > 0 && rect.height > 0) {
            elements.push({
              tagName: node.tagName.toLowerCase(),
              id: node.id || null,
              className: node.className || null,
              textContent: node.textContent?.trim().substring(0, 100) || null,
              boundingRect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom
              },
              computedStyles: {
                display: computedStyle.display,
                position: computedStyle.position,
                top: computedStyle.top,
                left: computedStyle.left,
                right: computedStyle.right,
                bottom: computedStyle.bottom,
                margin: computedStyle.margin,
                padding: computedStyle.padding,
                width: computedStyle.width,
                height: computedStyle.height,
                fontSize: computedStyle.fontSize,
                fontFamily: computedStyle.fontFamily,
                color: computedStyle.color,
                backgroundColor: computedStyle.backgroundColor,
                border: computedStyle.border,
                borderRadius: computedStyle.borderRadius,
                boxShadow: computedStyle.boxShadow,
                zIndex: computedStyle.zIndex,
                float: computedStyle.float,
                flexDirection: computedStyle.flexDirection,
                justifyContent: computedStyle.justifyContent,
                alignItems: computedStyle.alignItems,
                gridTemplateColumns: computedStyle.gridTemplateColumns,
                gridTemplateRows: computedStyle.gridTemplateRows
              },
              attributes: Array.from(node.attributes).reduce((acc: Record<string, string>, attr: Attr) => {
                acc[attr.name] = attr.value;
                return acc;
              }, {})
            });
          }
        }

        return {
          url: window.location.href,
          title: document.title,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          elements,
          totalElements: elements.length
        };
      });

      // Get the raw HTML for additional parsing
      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract additional structural information
      const structure = this.extractStructure($);

      console.log(`✅ DOM captured: ${domData.totalElements} elements`);

      return {
        ...domData,
        structure,
        capturedAt: new Date().toISOString()
      };

    } finally {
      // Always close the page and browser
      if (page) {
        await page.close().catch(console.error);
      }
      if (browser) {
        await browser.close().catch(console.error);
      }
    }
  }

  /**
   * Extract structural information using Cheerio
   */
  private extractStructure($: cheerio.CheerioAPI): DOMStructure {
    const structure: DOMStructure = {
      headings: [],
      navigation: [],
      forms: [],
      images: [],
      links: []
    };

    // Extract headings hierarchy
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      structure.headings.push({
        level: parseInt(el.tagName[1]),
        text: $(el).text().trim(),
        id: $(el).attr('id') || undefined
      });
    });

    // Extract navigation elements
    $('nav, [role="navigation"]').each((i, el) => {
      structure.navigation.push({
        type: el.tagName,
        links: $(el).find('a').map((j, link) => ({
          text: $(link).text().trim(),
          href: $(link).attr('href')
        })).get()
      });
    });

    // Extract forms
    $('form').each((i, el) => {
      structure.forms.push({
        action: $(el).attr('action'),
        method: $(el).attr('method') || 'get',
        inputs: $(el).find('input, select, textarea').map((j, input) => ({
          type: $(input).attr('type') || input.tagName.toLowerCase(),
          name: $(input).attr('name'),
          required: $(input).attr('required') !== undefined
        })).get()
      });
    });

    // Extract images
    $('img').each((i, el) => {
      structure.images.push({
        src: $(el).attr('src'),
        alt: $(el).attr('alt'),
        width: $(el).attr('width'),
        height: $(el).attr('height')
      });
    });

    // Extract links
    $('a[href]').each((i, el) => {
      structure.links.push({
        href: $(el).attr('href') || '',
        text: $(el).text().trim(),
        target: $(el).attr('target')
      });
    });

    return structure;
  }
} 