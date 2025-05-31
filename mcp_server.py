#!/usr/bin/env python3
"""
UI Analysis MCP Server

A simple MCP server that analyzes UI images using Google's Gemini API
to identify issues, suggest fixes, and recommend improvements.
"""

import base64
import os
from typing import Any, Annotated

import google.generativeai as genai
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from pydantic import Field

# Load environment variables from .env file
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Create the MCP server
mcp = FastMCP(
    "UI Analysis Server",
    dependencies=["google-generativeai", "Pillow", "python-dotenv"],
)

# Initialize the Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')


def encode_image_for_gemini(image_data: bytes, format: str) -> dict[str, Any]:
    """Convert image data to format expected by Gemini API."""
    # Determine MIME type based on format
    mime_type_map = {
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg', 
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    }
    
    mime_type = mime_type_map.get(format.lower(), 'image/jpeg')
    
    return {
        'mime_type': mime_type,
        'data': image_data
    }


@mcp.tool()
async def analyze_ui_image(
    image_data: Annotated[str, Field(description="Base64-encoded image data")],
    image_format: Annotated[str, Field(description="Image format (e.g., 'png', 'jpeg', 'jpg')")] = "png",
    analysis_focus: Annotated[str, Field(description="Focus area: 'general', 'accessibility', 'usability', 'design', 'mobile'")] = "general",
    detail_level: Annotated[str, Field(description="Detail level: 'brief', 'detailed', 'comprehensive'")] = "detailed"
) -> str:
    """
    Analyze a UI image using Gemini AI to identify issues, fixes, and improvements.
    
    Args:
        image_data: Base64-encoded image data
        image_format: Image format (png, jpeg, jpg, gif, webp)
        analysis_focus: Focus area - 'general', 'accessibility', 'usability', 'design', 'mobile'
        detail_level: Level of detail - 'brief', 'detailed', 'comprehensive'
    
    Returns:
        Detailed analysis of the UI with issues, fixes, and improvements
    """
    
    print(f"🔍 DEBUG: analyze_ui_image called with format={image_format}, focus={analysis_focus}, detail={detail_level}")
    print(f"🔍 DEBUG: Image data length: {len(image_data)} characters")
    
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ DEBUG: GEMINI_API_KEY not found in environment variables")
        return "Error: GEMINI_API_KEY environment variable not set. Please set your Gemini API key."
    
    print("✅ DEBUG: GEMINI_API_KEY found")
    
    try:
        print("🔍 DEBUG: Starting image decode process...")
        # Decode the base64 image data
        image_bytes = base64.b64decode(image_data)
        print(f"✅ DEBUG: Successfully decoded image, size: {len(image_bytes)} bytes")
        
        # Prepare the image for Gemini
        print("🔍 DEBUG: Preparing image for Gemini API...")
        image_part = encode_image_for_gemini(image_bytes, image_format)
        print(f"✅ DEBUG: Image prepared with MIME type: {image_part['mime_type']}")
        
        # Create analysis prompt based on focus and detail level
        focus_prompts = {
            "general": "Analyze this user interface comprehensively",
            "accessibility": "Focus on accessibility issues and WCAG compliance", 
            "usability": "Evaluate the usability and user experience aspects",
            "design": "Assess the visual design, layout, and aesthetics",
            "mobile": "Analyze mobile responsiveness and touch interface suitability"
        }
        
        detail_instructions = {
            "brief": "Provide a concise summary with the top 3-5 most important points",
            "detailed": "Provide a thorough analysis with specific examples and actionable recommendations",
            "comprehensive": "Provide an in-depth analysis covering all aspects with detailed explanations and prioritized recommendations"
        }
        
        base_prompt = focus_prompts.get(analysis_focus, focus_prompts["general"])
        detail_instruction = detail_instructions.get(detail_level, detail_instructions["detailed"])
        
        print(f"🔍 DEBUG: Using focus prompt: '{base_prompt}'")
        print(f"🔍 DEBUG: Using detail level: '{detail_instruction}'")
        
        prompt = f"""
        {base_prompt}. {detail_instruction}.

        Please analyze this UI image and provide:

        1. **ISSUES IDENTIFIED:**
           - List specific problems, inconsistencies, or pain points
           - Rate severity (High/Medium/Low)

        2. **RECOMMENDED FIXES:**
           - Specific, actionable solutions for each identified issue
           - Implementation priority

        3. **IMPROVEMENT SUGGESTIONS:**
           - Enhancements to improve user experience
           - Best practices recommendations
           - Modern UI/UX trends that could be applied

        4. **OVERALL ASSESSMENT:**
           - Summary of the current state
           - Key areas for immediate attention

        Focus on practical, implementable feedback that a developer or designer could act upon.
        """
        
        print("🔍 DEBUG: Sending request to Gemini API...")
        # Generate content using Gemini
        response = model.generate_content([prompt, image_part])
        print("✅ DEBUG: Received response from Gemini API")
        
        if not response.text:
            print("❌ DEBUG: Gemini API returned empty response")
            return "Error: Gemini API returned an empty response. The image might not be processable."
        
        print(f"✅ DEBUG: Analysis complete, response length: {len(response.text)} characters")
        return response.text
        
    except Exception as e:
        print(f"❌ DEBUG: Exception occurred in analyze_ui_image: {str(e)}")
        return f"Error analyzing image: {str(e)}"


@mcp.tool()
async def quick_ui_check(
    image_data: Annotated[str, Field(description="Base64-encoded image data")],
    image_format: Annotated[str, Field(description="Image format (e.g., 'png', 'jpeg', 'jpg')")] = "png"
) -> str:
    """
    Perform a quick UI check focusing on the most critical issues.
    
    Args:
        image_data: Base64-encoded image data
        image_format: Image format (png, jpeg, jpg, gif, webp)
    
    Returns:
        Brief summary of critical issues and quick wins
    """
    
    print(f"⚡ DEBUG: quick_ui_check called with format={image_format}")
    print(f"⚡ DEBUG: Image data length: {len(image_data)} characters")
    
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ DEBUG: GEMINI_API_KEY not found in environment variables")
        return "Error: GEMINI_API_KEY environment variable not set."
    
    print("✅ DEBUG: GEMINI_API_KEY found")
    
    try:
        print("⚡ DEBUG: Starting quick check image decode...")
        # Decode the base64 image data
        image_bytes = base64.b64decode(image_data)
        print(f"✅ DEBUG: Successfully decoded image, size: {len(image_bytes)} bytes")
        
        print("⚡ DEBUG: Preparing image for Gemini API...")
        image_part = encode_image_for_gemini(image_bytes, image_format)
        print(f"✅ DEBUG: Image prepared with MIME type: {image_part['mime_type']}")
        
        prompt = """
        Perform a rapid UI assessment of this interface. Provide:

        🚨 **CRITICAL ISSUES** (fix immediately):
        - List 2-3 most serious problems

        ⚡ **QUICK WINS** (easy improvements):
        - List 2-3 simple changes with high impact

        📱 **MOBILE CHECK**:
        - Is this mobile-friendly? Key concerns?

        ♿ **ACCESSIBILITY ALERT**:
        - Any obvious accessibility problems?

        Keep it concise but actionable. Focus on high-impact, easy-to-fix issues.
        """
        
        print("⚡ DEBUG: Sending quick check request to Gemini API...")
        response = model.generate_content([prompt, image_part])
        print("✅ DEBUG: Received quick check response from Gemini API")
        
        result = response.text or "Error: Could not analyze the image."
        print(f"✅ DEBUG: Quick check complete, response length: {len(result)} characters")
        return result
        
    except Exception as e:
        print(f"❌ DEBUG: Exception occurred in quick_ui_check: {str(e)}")
        return f"Error in quick check: {str(e)}"


@mcp.resource("ui-analysis://guidelines")
def ui_analysis_guidelines() -> str:
    """Provides guidelines for effective UI analysis."""
    return """
    # UI Analysis Guidelines

    ## Best Practices for Image Submission:
    - Use high-resolution screenshots (at least 1200px wide)
    - Capture full page layouts when possible
    - Include different screen states (hover, focus, error states)
    - Test on multiple devices/screen sizes
    - Encode images as base64 strings before submitting

    ## Analysis Focus Areas:
    - **General**: Comprehensive overview of all aspects
    - **Accessibility**: WCAG compliance, screen reader compatibility
    - **Usability**: User flow, navigation, cognitive load
    - **Design**: Visual hierarchy, consistency, branding
    - **Mobile**: Responsive design, touch targets, mobile UX

    ## Common Issues to Look For:
    - Poor color contrast
    - Inconsistent spacing and typography
    - Unclear navigation
    - Missing feedback states
    - Accessibility violations
    - Mobile responsiveness problems

    ## Implementation Tips:
    - Prioritize high-severity issues first
    - Test fixes with real users when possible
    - Maintain design system consistency
    - Consider performance implications

    ## Image Encoding:
    To encode an image as base64, you can use:
    - JavaScript: `btoa()` function or FileReader API
    - Python: `base64.b64encode(image_bytes).decode()`
    - Command line: `base64 -i image.png`
    """


if __name__ == "__main__":
    # Check if API key is available
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️  Warning: GEMINI_API_KEY environment variable not set.")
        print("   Please set it with: export GEMINI_API_KEY='your-api-key-here'")
        print("   Get your API key from: https://makersuite.google.com/app/apikey")
    
    print("🚀 Starting UI Analysis MCP Server...")
    print("📊 Tools available:")
    print("   - analyze_ui_image: Comprehensive UI analysis")
    print("   - quick_ui_check: Rapid assessment of critical issues")
    print("📚 Resources available:")
    print("   - ui-analysis://guidelines: Analysis guidelines and best practices")
    
    mcp.run()