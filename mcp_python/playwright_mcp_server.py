#!/usr/bin/env python3
"""
Playwright MCP Server

A Model Context Protocol server that provides web scraping capabilities using Playwright.
Allows scraping websites, taking screenshots, and extracting DOM content.
Includes AI-powered UI/UX analysis using OpenRouter API.
"""

import asyncio
import base64
import json
import logging
import sys
import os
from typing import Optional, Dict, Any, List
from pathlib import Path

import click
from pydantic import BaseModel, Field
from mcp.server.fastmcp import FastMCP
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the MCP server with proper configuration
mcp = FastMCP("playwright-server")


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


class UIIssue(BaseModel):
    """A specific UI/UX issue identified in the analysis."""
    category: str = Field(description="Category of the issue (e.g., 'accessibility', 'usability', 'visual-design')")
    severity: str = Field(description="Severity level: 'low', 'medium', 'high', 'critical'")
    title: str = Field(description="Brief title of the issue")
    description: str = Field(description="Detailed description of the issue")
    recommendation: str = Field(description="Specific recommendation to fix the issue")
    affected_elements: Optional[List[str]] = Field(default=None, description="CSS selectors or descriptions of affected elements")


class UIAnalysisResult(BaseModel):
    """Result of UI/UX analysis."""
    overall_score: int = Field(description="Overall UI/UX score from 1-100")
    summary: str = Field(description="Brief summary of the UI analysis")
    issues: List[UIIssue] = Field(description="List of identified issues")
    strengths: List[str] = Field(description="Positive aspects of the UI")
    priority_recommendations: List[str] = Field(description="Top 3-5 priority recommendations")
    error: Optional[str] = Field(default=None, description="Error message if analysis failed")


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


@mcp.tool()
async def analyze_ui_ux(
    screenshot_b64: str = Field(description="Base64 encoded screenshot of the UI to analyze"),
    dom_content: Optional[str] = Field(default=None, description="DOM content (HTML) for additional context")
) -> UIAnalysisResult:
    """
    Analyze a UI screenshot and DOM content to identify UX/UI issues and provide improvement recommendations.
    
    Uses AI vision analysis to evaluate:
    - Visual hierarchy and layout
    - Accessibility compliance
    - User experience patterns
    - Common UI/UX issues
    - Mobile responsiveness indicators
    - Conversion optimization opportunities
    """
    try:
        # Check if OpenRouter API key is available
        openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        if not openrouter_api_key:
            return UIAnalysisResult(
                overall_score=0,
                summary="Analysis failed",
                issues=[],
                strengths=[],
                priority_recommendations=[],
                error="OpenRouter API key not found. Please set OPENROUTER_API_KEY environment variable."
            )
        
        # Import OpenAI here to make it optional
        try:
            import openai
        except ImportError:
            return UIAnalysisResult(
                overall_score=0,
                summary="Analysis failed",
                issues=[],
                strengths=[],
                priority_recommendations=[],
                error="OpenAI package not installed. Install with: pip install openai"
            )
        
        # Initialize OpenRouter client
        client = openai.AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_api_key,
        )
        
        # Prepare DOM context if available
        dom_text = ""
        if dom_content:
            # Truncate DOM content to avoid token limits
            dom_preview = dom_content[:2000] + "..." if len(dom_content) > 2000 else dom_content
            dom_text = f"\nDOM Content Preview:\n{dom_preview}"
        
        system_prompt = """You are a senior UI/UX consultant and accessibility expert. Analyze the provided screenshot and identify specific issues and improvement opportunities.

Focus on:
1. Visual hierarchy and information architecture
2. Accessibility compliance (WCAG guidelines)
3. User experience and usability patterns
4. Mobile responsiveness indicators
5. Conversion optimization opportunities
6. Common UI/UX anti-patterns
7. Design consistency and branding
8. Performance and loading indicators

Provide specific, actionable recommendations with clear priorities."""
        
        user_prompt = f"""Please analyze this UI screenshot and provide detailed feedback.{dom_text}

Return your analysis in this exact JSON format:
{{
    "overall_score": <number 1-100>,
    "summary": "<brief overall assessment>",
    "issues": [
        {{
            "category": "<category like 'accessibility', 'usability', 'visual-design', 'performance', 'mobile', 'content'>",
            "severity": "<low|medium|high|critical>",
            "title": "<brief issue title>",
            "description": "<detailed description>",
            "recommendation": "<specific fix recommendation>",
            "affected_elements": ["<css selector or description>"]
        }}
    ],
    "strengths": ["<positive aspects>"],
    "priority_recommendations": ["<top 3-5 priority fixes>"]
}}"""
        
        # Make the API call using OpenRouter
        logger.info("Sending screenshot for UI/UX analysis via OpenRouter...")
        
        response = await client.chat.completions.create(
            model="google/gemini-2.5-flash-preview-05-20",  # Vision-capable model via OpenRouter
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{screenshot_b64}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=2000
        )
        
        # Parse the response
        analysis_text = response.choices[0].message.content
        logger.info(f"Received analysis response: {len(analysis_text)} characters")
        
        # Try to extract JSON from the response
        try:
            # Find JSON content between ```json and ``` or just parse directly
            if "```json" in analysis_text:
                json_start = analysis_text.find("```json") + 7
                json_end = analysis_text.find("```", json_start)
                json_text = analysis_text[json_start:json_end].strip()
            else:
                # Try to find JSON object directly
                json_start = analysis_text.find("{")
                json_end = analysis_text.rfind("}") + 1
                json_text = analysis_text[json_start:json_end]
            
            analysis_data = json.loads(json_text)
            
            # Convert to our structured format
            issues = []
            for issue_data in analysis_data.get("issues", []):
                issues.append(UIIssue(
                    category=issue_data.get("category", "general"),
                    severity=issue_data.get("severity", "medium"),
                    title=issue_data.get("title", "UI Issue"),
                    description=issue_data.get("description", ""),
                    recommendation=issue_data.get("recommendation", ""),
                    affected_elements=issue_data.get("affected_elements")
                ))
            
            return UIAnalysisResult(
                overall_score=analysis_data.get("overall_score", 50),
                summary=analysis_data.get("summary", "UI analysis completed"),
                issues=issues,
                strengths=analysis_data.get("strengths", []),
                priority_recommendations=analysis_data.get("priority_recommendations", [])
            )
            
        except json.JSONDecodeError:
            # Fallback: return the raw analysis as summary
            logger.warning("Could not parse JSON response, returning as summary")
            return UIAnalysisResult(
                overall_score=50,
                summary=analysis_text[:500] + "..." if len(analysis_text) > 500 else analysis_text,
                issues=[],
                strengths=["Analysis completed but parsing failed"],
                priority_recommendations=["Review the full analysis in the summary field"]
            )
        
    except Exception as e:
        logger.error(f"Error in UI/UX analysis: {str(e)}")
        return UIAnalysisResult(
            overall_score=0,
            summary="Analysis failed due to error",
            issues=[],
            strengths=[],
            priority_recommendations=[],
            error=f"Analysis error: {str(e)}"
        )


@mcp.tool()
async def scrape_and_analyze_ui(
    url: str = Field(description="URL of the website to scrape and analyze"),
    viewport_width: int = Field(default=1920, description="Viewport width for screenshot"),
    viewport_height: int = Field(default=1080, description="Viewport height for screenshot")
) -> Dict[str, Any]:
    """
    Scrape a website and immediately analyze its UI/UX.
    
    Combines web scraping with AI-powered UI/UX analysis in one step.
    Returns both the scraped data and the UI analysis results.
    """
    try:
        # First scrape the website
        scrape_options = {
            "screenshot": True,
            "dom": True,
            "viewport_width": viewport_width,
            "viewport_height": viewport_height
        }
        
        scrape_result = await scrape_website(url, scrape_options)
        
        if scrape_result.error:
            return {
                "scrape_result": scrape_result.dict(),
                "ui_analysis": None,
                "error": f"Scraping failed: {scrape_result.error}"
            }
        
        # Then analyze the UI if we got a screenshot
        ui_analysis = None
        if scrape_result.screenshot:
            ui_analysis = await analyze_ui_ux(
                screenshot_b64=scrape_result.screenshot,
                dom_content=scrape_result.dom
            )
        
        return {
            "scrape_result": scrape_result.dict(),
            "ui_analysis": ui_analysis.dict() if ui_analysis else None,
            "error": None
        }
        
    except Exception as e:
        logger.error(f"Error in scrape and analyze: {str(e)}")
        return {
            "scrape_result": None,
            "ui_analysis": None,
            "error": f"Combined operation failed: {str(e)}"
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
    
    # Check if OpenRouter API key is available for UI analysis
    if not os.getenv("OPENROUTER_API_KEY"):
        logger.warning("OPENROUTER_API_KEY not found. UI analysis features will not work.")
        logger.warning("Get your API key from: https://openrouter.ai/")
        logger.warning("Set it with: export OPENROUTER_API_KEY='your-api-key-here'")
    else:
        logger.info("OpenRouter API key found - UI analysis features enabled")
    
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
    main()