#!/usr/bin/env python3
"""
UI Analysis MCP Server

A simple MCP server that analyzes UI images using Google's Gemini API
to identify issues, suggest fixes, and recommend improvements.
"""

import base64
import os
from typing import Any

import google.generativeai as genai
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.utilities.types import Image

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
    image: Image,
    analysis_focus: str = "general",
    detail_level: str = "detailed"
) -> str:
    """
    Analyze a UI image using Gemini AI to identify issues, fixes, and improvements.
    
    Args:
        image: The UI image to analyze
        analysis_focus: Focus area - 'general', 'accessibility', 'usability', 'design', 'mobile'
        detail_level: Level of detail - 'brief', 'detailed', 'comprehensive'
    
    Returns:
        Detailed analysis of the UI with issues, fixes, and improvements
    """
    
    if not os.getenv("GEMINI_API_KEY"):
        return "Error: GEMINI_API_KEY environment variable not set. Please set your Gemini API key."
    
    try:
        # Prepare the image for Gemini
        image_part = encode_image_for_gemini(image.data, image.format)
        
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
        
        # Generate content using Gemini
        response = model.generate_content([prompt, image_part])
        
        if not response.text:
            return "Error: Gemini API returned an empty response. The image might not be processable."
            
        return response.text
        
    except Exception as e:
        return f"Error analyzing image: {str(e)}"


@mcp.tool()
async def quick_ui_check(image: Image) -> str:
    """
    Perform a quick UI check focusing on the most critical issues.
    
    Args:
        image: The UI image to analyze
    
    Returns:
        Brief summary of critical issues and quick wins
    """
    
    if not os.getenv("GEMINI_API_KEY"):
        return "Error: GEMINI_API_KEY environment variable not set."
    
    try:
        image_part = encode_image_for_gemini(image.data, image.format)
        
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
        
        response = model.generate_content([prompt, image_part])
        return response.text or "Error: Could not analyze the image."
        
    except Exception as e:
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