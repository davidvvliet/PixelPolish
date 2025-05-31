import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export class DOMCapture {
  constructor() {
    // No longer need to store browser instance
  }

  async capture(url) {
    let browser = null;
    let page = null;

    try {
      // Create a fresh browser instance for each capture
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for any dynamic content to load
      await page.waitForFunction(() => document.readyState === 'complete');

      // Extract DOM structure and element data
      const domData = await page.evaluate(() => {
        const elements = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );

        let node;
        while (node = walker.nextNode()) {
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
              attributes: Array.from(node.attributes).reduce((acc, attr) => {
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

  extractStructure($) {
    const structure = {
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
        id: $(el).attr('id') || null
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
        href: $(el).attr('href'),
        text: $(el).text().trim(),
        target: $(el).attr('target')
      });
    });

    return structure;
  }
} 