#!/usr/bin/env python3
"""
Playwright MCP Server

A Model Context Protocol server that provides web scraping capabilities using Playwright.
Allows scraping websites, taking screenshots, and extracting DOM content.
"""

import asyncio
import base64
import json
import logging
import sys
from typing import Optional, Dict, Any
from pathlib import Path

import click
from pydantic import BaseModel, Field
from mcp.server.fastmcp import FastMCP
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the MCP server with proper configuration
mcp = FastMCP(
    name="playwright-server",
    instructions="A web scraping server using Playwright for browser automation. "
                "Provides tools to scrape websites, take screenshots, and extract DOM content."
)


class ScrapeOptions(BaseModel):
    """Options for scraping a website."""
    screenshot: bool = Field(default=True, description="Whether to take a screenshot")
    dom: bool = Field(default=True, description="Whether to extract DOM content")
    full_page: bool = Field(default=True, description="Whether to capture full page screenshot")
    viewport_width: int = Field(default=1920, description="Viewport width in pixels")
    viewport_height: int = Field(default=1080, description="Viewport height in pixels")
    timeout: int = Field(default=30000, description="Navigation timeout in milliseconds")
    wait_until: str = Field(default="domcontentloaded", description="When to consider navigation succeeded")


class ScrapeResult(BaseModel):
    """Result of scraping a website."""
    url: str = Field(description="The URL that was scraped")
    title: Optional[str] = Field(default=None, description="Page title")
    screenshot: Optional[str] = Field(default=None, description="Base64 encoded screenshot")
    dom: Optional[str] = Field(default=None, description="DOM content as HTML")
    error: Optional[str] = Field(default=None, description="Error message if scraping failed")
    status: Optional[int] = Field(default=None, description="HTTP status code")


@mcp.tool()
async def scrape_website(
    url: str = Field(description="URL of the website to scrape"),
    options: Optional[Dict[str, Any]] = Field(default=None, description="Scraping options")
) -> ScrapeResult:
    """
    Scrape a website using Playwright.
    
    Returns the page title, screenshot (base64 encoded), and DOM content.
    Supports custom viewport sizes and various scraping options.
    """
    # Parse options
    opts = ScrapeOptions(**(options or {}))
    
    browser = None
    try:
        logger.info(f"Starting to scrape: {url}")
        
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            
            # Create context with custom viewport
            context = await browser.new_context(
                viewport={
                    'width': opts.viewport_width,
                    'height': opts.viewport_height
                }
            )
            
            # Create page
            page = await context.new_page()
            
            # Navigate to URL
            response = await page.goto(
                url,
                wait_until=opts.wait_until,
                timeout=opts.timeout
            )
            
            # Get status code
            status = response.status if response else None
            
            # Check if page loaded successfully
            if response and response.status >= 400:
                raise Exception(f"HTTP {response.status} error")
            
            # Get page title
            title = await page.title()
            
            # Take screenshot if requested
            screenshot_b64 = None
            if opts.screenshot:
                screenshot_bytes = await page.screenshot(
                    full_page=opts.full_page,
                    type='png'
                )
                screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
                logger.info(f"Screenshot captured: {len(screenshot_b64)} characters")
            
            # Get DOM content if requested
            dom_content = None
            if opts.dom:
                dom_content = await page.content()
                logger.info(f"DOM extracted: {len(dom_content)} characters")
            
            # Close browser
            await browser.close()
            
            logger.info(f"Successfully scraped: {url}")
            
            return ScrapeResult(
                url=url,
                title=title,
                screenshot=screenshot_b64,
                dom=dom_content,
                status=status
            )
            
    except PlaywrightTimeout:
        logger.error(f"Timeout while scraping: {url}")
        return ScrapeResult(
            url=url,
            error=f"Timeout: Page took too long to load (>{opts.timeout}ms)"
        )
    except Exception as e:
        logger.error(f"Error scraping {url}: {str(e)}")
        return ScrapeResult(
            url=url,
            error=f"Error: {str(e)}"
        )
    finally:
        if browser:
            try:
                await browser.close()
            except:
                pass


@mcp.tool()
async def scrape_url_simple(
    url: str = Field(description="URL of the website to scrape")
) -> ScrapeResult:
    """
    Simple website scraping with default options.
    
    Takes a full-page screenshot and extracts the DOM content.
    Uses default viewport size of 1920x1080.
    """
    return await scrape_website(url)


@mcp.tool()
async def take_screenshot(
    url: str = Field(description="URL of the website to screenshot"),
    full_page: bool = Field(default=True, description="Whether to capture the full page"),
    width: int = Field(default=1920, description="Viewport width"),
    height: int = Field(default=1080, description="Viewport height")
) -> ScrapeResult:
    """
    Take a screenshot of a website without extracting DOM content.
    
    Useful for visual capture of web pages.
    Returns only the screenshot as base64 encoded PNG.
    """
    options = {
        "screenshot": True,
        "dom": False,
        "full_page": full_page,
        "viewport_width": width,
        "viewport_height": height
    }
    return await scrape_website(url, options)


@mcp.tool()
async def extract_page_content(
    url: str = Field(description="URL of the website to extract content from")
) -> ScrapeResult:
    """
    Extract DOM content from a website without taking a screenshot.
    
    Useful for text extraction and HTML analysis.
    Returns the page title and full DOM content.
    """
    options = {
        "screenshot": False,
        "dom": True
    }
    return await scrape_website(url, options)


@mcp.tool() 
async def test_browser_connection() -> Dict[str, Any]:
    """
    Test if Playwright and browser are properly installed and working.
    
    Useful for debugging connection issues.
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            version = browser.version
            await browser.close()
            
            return {
                "status": "success",
                "message": "Browser connection successful",
                "browser_version": version
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Browser connection failed: {str(e)}",
            "help": "Run 'playwright install chromium' to install the browser"
        }


# Main entry point
@click.command()
@click.option("--port", default=8000, help="Port to listen on for SSE")
@click.option(
    "--transport",
    type=click.Choice(["stdio", "sse"]),
    default="stdio",
    help="Transport type",
)
@click.option("--log-level", default="INFO", help="Logging level")
def main(port: int, transport: str, log_level: str) -> int:
    """Run the Playwright MCP server."""
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Check if Playwright browsers are installed
    try:
        import subprocess
        result = subprocess.run(
            [sys.executable, "-c", "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); p.chromium.launch(headless=True).close(); p.stop()"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            logger.warning("Playwright browsers may not be installed. Run 'playwright install chromium' to install.")
    except:
        pass
    
    logger.info(f"Starting Playwright MCP Server with {transport} transport...")
    
    # Run the server with the specified transport
    if transport == "sse":
        mcp.run(transport=transport, port=port)
    else:
        mcp.run(transport=transport)
    return 0


if __name__ == "__main__":
    main()  # type: ignore[call-arg]