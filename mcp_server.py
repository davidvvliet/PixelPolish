#!/usr/bin/env python3
"""
UI Analysis MCP Server

A simple MCP server that analyzes UI descriptions using OpenRouter API
to identify issues, suggest fixes, and recommend improvements.
"""

import os
from typing import Annotated

import openai
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from pydantic import Field

# Load environment variables from .env file
load_dotenv()

# Configure OpenRouter API
client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Create the MCP server
mcp = FastMCP(
    "UI Analysis Server",
    dependencies=["openai", "python-dotenv"],
)


@mcp.tool()
async def analyze_ui_description(
    ui_description: Annotated[str, Field(description="Description of the UI/interface to analyze")]
) -> str:
    """
    Analyze a UI description using OpenRouter AI to identify issues, fixes, and improvements.
    
    Args:
        ui_description: Text description of the UI/interface
    
    Returns:
        Detailed analysis of the UI with issues, fixes, and improvements
    """
    
    print(f"🔍 DEBUG: analyze_ui_description called")
    print(f"🔍 DEBUG: UI description length: {len(ui_description)} characters")
    
    if not os.getenv("OPENROUTER_API_KEY"):
        print("❌ DEBUG: OPENROUTER_API_KEY not found in environment variables")
        return "Error: OPENROUTER_API_KEY environment variable not set. Please set your OpenRouter API key."
    
    print("✅ DEBUG: OPENROUTER_API_KEY found")
    
    try:
        prompt = f"""
        Analyze this user interface comprehensively and provide a thorough analysis with specific examples and actionable recommendations.

        Based on this UI description: "{ui_description}"

        Please analyze this interface and provide:

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
        
        print("🔍 DEBUG: Sending request to OpenRouter API...")
        # Generate content using OpenRouter
        response = client.chat.completions.create(
            model="anthropic/claude-3.5-sonnet",
            messages=[
                {"role": "system", "content": "You are a UI/UX expert who provides detailed analysis of user interfaces."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        print("✅ DEBUG: Received response from OpenRouter API")
        
        content = response.choices[0].message.content
        if not content:
            print("❌ DEBUG: OpenRouter API returned empty response")
            return "Error: OpenRouter API returned an empty response. Please try with a more detailed description."
        
        print(f"✅ DEBUG: Analysis complete, response length: {len(content)} characters")
        return content
        
    except Exception as e:
        print(f"❌ DEBUG: Exception occurred in analyze_ui_description: {str(e)}")
        return f"Error analyzing UI description: {str(e)}"


@mcp.resource("ui-analysis://guidelines")
def ui_analysis_guidelines() -> str:
    """Provides guidelines for effective UI analysis."""
    return """
    # UI Analysis Guidelines

    ## Best Practices for UI Description:
    - Be detailed and specific about layout, colors, components
    - Describe user interactions and flows
    - Mention any specific functionality or features
    - Include information about target users/use cases
    - Note any existing problems you've observed

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

    ## Example UI Description:
    "A login form with email and password fields, a blue submit button, 
    and a 'Forgot Password?' link below. The form is centered on a white 
    background with the company logo at the top. There's no validation 
    feedback shown and the button text is very small."
    """


if __name__ == "__main__":
    # Check if API key is available
    if not os.getenv("OPENROUTER_API_KEY"):
        print("⚠️  Warning: OPENROUTER_API_KEY environment variable not set.")
        print("   Please set it with: export OPENROUTER_API_KEY='your-api-key-here'")
        print("   Get your API key from: https://openrouter.ai/")
    
    print("🚀 Starting UI Analysis MCP Server...")
    print("📊 Tools available:")
    print("   - analyze_ui_description: Comprehensive UI analysis from text description")
    print("   - quick_ui_check: Rapid assessment of critical issues from text description")
    print("📚 Resources available:")
    print("   - ui-analysis://guidelines: Analysis guidelines and best practices")
    
    mcp.run()