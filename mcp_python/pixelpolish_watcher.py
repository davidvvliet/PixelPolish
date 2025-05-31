#!/usr/bin/env python3
"""
PixelPolish AI Agent Watcher

A watcher that monitors localhost:3002 for changes, takes screenshots,
and provides AI-powered visual analysis and automated fixes.
"""

import asyncio
import base64
import json
import logging
import time
import os
from pathlib import Path
from typing import Optional, Dict, Any
import aiohttp
from playwright.async_api import async_playwright

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PixelPolishWatcher:
    """AI agent that watches localhost:3002 and provides automated UI fixes."""
    
    def __init__(self, pixelpolish_url: str = "http://localhost:3002"):
        self.pixelpolish_url = pixelpolish_url
        self.local_dir = Path("../local")
        self.screenshots_dir = Path("screenshots")
        self.screenshots_dir.mkdir(exist_ok=True)
        self.last_analysis_time = None
        self.browser = None
        
    async def start_browser(self):
        """Start Playwright browser for screenshots."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        logger.info("Browser started successfully")
        
    async def stop_browser(self):
        """Stop Playwright browser."""
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
        logger.info("Browser stopped")
        
    async def check_server_health(self) -> bool:
        """Check if PixelPolish server is running."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.pixelpolish_url}/health") as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"Server health check failed: {e}")
            return False
            
    async def get_latest_analysis(self) -> Optional[Dict[str, Any]]:
        """Get the latest analysis from PixelPolish dashboard."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.pixelpolish_url}/dashboard") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('success'):
                            return data
                    return None
        except Exception as e:
            logger.error(f"Failed to get analysis: {e}")
            return None
            
    async def take_screenshot(self, filename: str) -> Optional[str]:
        """Take a screenshot of the local file."""
        if not self.browser:
            await self.start_browser()
            
        try:
            # Construct URL to local file
            local_url = f"{self.pixelpolish_url}/local/{filename}"
            
            # Create browser page
            page = await self.browser.new_page()
            await page.set_viewport_size({"width": 1920, "height": 1080})
            
            # Navigate to page
            await page.goto(local_url, wait_until="domcontentloaded", timeout=10000)
            
            # Take screenshot
            screenshot_bytes = await page.screenshot(full_page=True, type='png')
            
            # Save screenshot
            timestamp = int(time.time())
            screenshot_path = self.screenshots_dir / f"{filename}_{timestamp}.png"
            with open(screenshot_path, 'wb') as f:
                f.write(screenshot_bytes)
                
            # Convert to base64 for AI analysis
            screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
            
            await page.close()
            
            logger.info(f"Screenshot saved: {screenshot_path}")
            return screenshot_b64
            
        except Exception as e:
            logger.error(f"Failed to take screenshot: {e}")
            return None
            
    async def analyze_with_ai(self, screenshot_b64: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send screenshot and analysis to AI for visual assessment and fix suggestions."""
        # This is where we'll integrate with Claude/GPT-4V
        # For now, just return a placeholder analysis
        
        score = analysis_data.get('data', {}).get('analysis', {}).get('scorePercentage', 0)
        issues_count = analysis_data.get('data', {}).get('analysis', {}).get('summary', {}).get('totalIssues', 0)
        
        ai_analysis = {
            "visual_assessment": {
                "overall_quality": "moderate",
                "color_harmony": "good",
                "layout_balance": "needs_improvement",
                "typography_consistency": "fair"
            },
            "recommended_fixes": [
                "Improve spacing consistency between sections",
                "Standardize button styles across the page",
                "Enhance color contrast for better accessibility",
                "Align elements to a consistent grid system"
            ],
            "technical_score": score,
            "visual_score": 65,  # Placeholder AI visual score
            "total_issues": issues_count,
            "priority_fixes": [
                {
                    "element": ".hero-section",
                    "issue": "Inconsistent padding",
                    "fix": "padding: 60px 20px;",
                    "priority": "high"
                }
            ]
        }
        
        return ai_analysis
        
    async def apply_fixes(self, filename: str, fixes: list) -> bool:
        """Apply automated fixes to the HTML/CSS file."""
        file_path = self.local_dir / filename
        
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return False
            
        try:
            # Read current file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Apply fixes (this is a simplified implementation)
            # In a real implementation, we'd parse the HTML/CSS and make targeted changes
            modified_content = content
            
            for fix in fixes:
                if fix.get('priority') == 'high':
                    element = fix.get('element', '')
                    fix_css = fix.get('fix', '')
                    
                    # Simple string replacement (needs more sophisticated parsing)
                    if element and fix_css:
                        logger.info(f"Applying fix to {element}: {fix_css}")
                        # This would need proper CSS parsing and modification
                        
            # For now, just log the fixes that would be applied
            logger.info(f"Would apply {len(fixes)} fixes to {filename}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to apply fixes: {e}")
            return False
            
    async def watch_for_changes(self):
        """Main watcher loop that monitors for analysis changes."""
        logger.info("Starting PixelPolish AI Agent Watcher...")
        
        # Check server health
        if not await self.check_server_health():
            logger.error("PixelPolish server is not running. Start it with: npm start")
            return
            
        logger.info("PixelPolish server is running. Starting watch loop...")
        
        try:
            while True:
                # Get latest analysis
                analysis = await self.get_latest_analysis()
                
                if analysis:
                    analyzed_at = analysis.get('analyzedAt')
                    filename = analysis.get('filename')
                    
                    # Check if this is a new analysis
                    if analyzed_at != self.last_analysis_time and filename:
                        logger.info(f"New analysis detected for: {filename}")
                        
                        # Take screenshot
                        screenshot_b64 = await self.take_screenshot(filename)
                        
                        if screenshot_b64:
                            # Analyze with AI
                            ai_analysis = await self.analyze_with_ai(screenshot_b64, analysis)
                            
                            # Log AI analysis
                            logger.info(f"AI Visual Analysis:")
                            logger.info(f"  Visual Score: {ai_analysis['visual_score']}%")
                            logger.info(f"  Technical Score: {ai_analysis['technical_score']}%")
                            logger.info(f"  Priority Fixes: {len(ai_analysis['priority_fixes'])}")
                            
                            # Apply fixes if there are high-priority ones
                            priority_fixes = [f for f in ai_analysis['priority_fixes'] if f.get('priority') == 'high']
                            if priority_fixes:
                                logger.info(f"Applying {len(priority_fixes)} high-priority fixes...")
                                await self.apply_fixes(filename, priority_fixes)
                        
                        self.last_analysis_time = analyzed_at
                
                # Wait before next check
                await asyncio.sleep(2)
                
        except KeyboardInterrupt:
            logger.info("Watcher stopped by user")
        except Exception as e:
            logger.error(f"Watcher error: {e}")
        finally:
            await self.stop_browser()

async def main():
    """Main entry point."""
    watcher = PixelPolishWatcher()
    await watcher.watch_for_changes()

if __name__ == "__main__":
    asyncio.run(main()) 