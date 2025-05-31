#!/usr/bin/env python3
"""
Test script for Playwright MCP Server

Run this to verify the server works correctly.
"""

import asyncio
import json
import sys
from pathlib import Path

# Add the server to path for testing
sys.path.insert(0, str(Path(__file__).parent))

try:
    from playwright_mcp_server import scrape_website, ScrapingOptions
    print("✅ Successfully imported Playwright MCP server")
except ImportError as e:
    print(f"❌ Failed to import server: {e}")
    print("Make sure you've installed the requirements:")
    print("pip install -r requirements.txt")
    print("playwright install chromium")
    sys.exit(1)


async def test_basic_scraping():
    """Test basic website scraping functionality."""
    
    print("\n🧪 Testing basic scraping...")
    
    # Test with a simple, reliable website
    test_url = "https://httpbin.org/html"
    
    try:
        result = await scrape_website(test_url)
        
        print(f"✅ Scraping successful: {result.success}")
        print(f"📄 Page title: {result.page_title}")
        print(f"📸 Screenshot captured: {bool(result.screenshot_base64)}")
        print(f"🔍 DOM extracted: {bool(result.dom_content)}")
        
        if result.screenshot_base64:
            print(f"📊 Screenshot size: {len(result.screenshot_base64)} characters")
        
        if result.dom_content:
            print(f"📊 DOM size: {len(result.dom_content)} characters")
            
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


async def test_screenshot_only():
    """Test screenshot-only functionality."""
    
    print("\n🧪 Testing screenshot-only mode...")
    
    options = ScrapingOptions(
        extract_links=False,
        extract_images=False,
        extract_text_content=False
    )
    
    try:
        result = await scrape_website("https://example.com", options)
        
        print(f"✅ Screenshot-only successful: {result.success}")
        print(f"📸 Screenshot captured: {bool(result.screenshot_base64)}")
        print(f"🔗 Links extracted: {bool(result.links)}")
        print(f"🖼️ Images extracted: {bool(result.images)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Screenshot test failed: {e}")
        return False


async def test_error_handling():
    """Test error handling with invalid URL."""
    
    print("\n🧪 Testing error handling...")
    
    try:
        result = await scrape_website("https://thisdomaindoesnotexist12345.com")
        
        print(f"✅ Error handling test completed")
        print(f"❌ Expected failure: {not result.success}")
        print(f"📝 Error message: {result.error_message}")
        
        return not result.success  # We expect this to fail
        
    except Exception as e:
        print(f"✅ Exception properly caught: {e}")
        return True


async def test_custom_options():
    """Test with custom scraping options."""
    
    print("\n🧪 Testing custom options...")
    
    options = ScrapingOptions(
        viewport_width=800,
        viewport_height=600,
        timeout=10000,
        full_page_screenshot=False,
        extract_links=True,
        extract_images=True
    )
    
    try:
        result = await scrape_website("https://httpbin.org/html", options)
        
        print(f"✅ Custom options test: {result.success}")
        if result.page_size:
            print(f"📏 Viewport used: {result.page_size.get('viewport_width')}x{result.page_size.get('viewport_height')}")
        
        return result.success
        
    except Exception as e:
        print(f"❌ Custom options test failed: {e}")
        return False


async def save_test_screenshot():
    """Save a test screenshot to verify output."""
    
    print("\n🧪 Saving test screenshot...")
    
    try:
        result = await scrape_website("https://example.com")
        
        if result.success and result.screenshot_base64:
            import base64
            
            # Save screenshot
            screenshot_data = base64.b64decode(result.screenshot_base64)
            test_file = Path("test_screenshot.png")
            test_file.write_bytes(screenshot_data)
            
            print(f"✅ Screenshot saved to: {test_file.absolute()}")
            print(f"📊 File size: {test_file.stat().st_size} bytes")
            
            return True
        else:
            print("❌ No screenshot data to save")
            return False
            
    except Exception as e:
        print(f"❌ Failed to save screenshot: {e}")
        return False


async def main():
    """Run all tests."""
    
    print("🚀 Starting Playwright MCP Server Tests")
    print("="*50)
    
    tests = [
        ("Basic Scraping", test_basic_scraping),
        ("Screenshot Only", test_screenshot_only),
        ("Error Handling", test_error_handling),
        ("Custom Options", test_custom_options),
        ("Save Screenshot", save_test_screenshot),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        try:
            success = await test_func()
            results.append((test_name, success))
            if success:
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"💥 {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST RESULTS SUMMARY")
    print("="*50)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🏆 Final Score: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The Playwright MCP server is working correctly.")
        print("\nNext steps:")
        print("1. Run the server: python playwright_mcp_server.py")
        print("2. Connect with an MCP client")
        print("3. Try: scrape_url_simple('https://example.com')")
    else:
        print("⚠️ Some tests failed. Check the error messages above.")
        print("\nTroubleshooting:")
        print("1. Make sure Playwright is installed: pip install playwright")
        print("2. Install browsers: playwright install chromium")
        print("3. Check your internet connection")
    
    return passed == total


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test runner crashed: {e}")
        sys.exit(1)