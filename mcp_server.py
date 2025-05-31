#!/usr/bin/env python3
"""
UI Analysis MCP Server

A comprehensive MCP server that analyzes UI screenshots using OpenRouter API
to identify issues, suggest fixes, and recommend improvements.
Supports multiple image input formats for maximum flexibility.
"""

import base64
import os
from pathlib import Path
from typing import Annotated, Union

import openai
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.utilities.types import Image
from mcp.types import ImageContent
from pydantic import BaseModel, Field

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


class ImageInput(BaseModel):
    """Flexible image input that can handle various formats"""
    
    # Option 1: Direct base64 string
    base64_data: str | None = Field(
        None, 
        description="Base64 encoded image data (with or without data URL prefix)"
    )
    
    # Option 2: File path
    file_path: str | None = Field(
        None,
        description="Path to an image file (PNG, JPEG, etc.)"
    )
    
    # Option 3: Image URL (for future expansion)
    url: str | None = Field(
        None,
        description="URL to an image (not implemented yet)"
    )
    
    # Image format hint
    format_hint: str | None = Field(
        None,
        description="Image format hint (png, jpeg, etc.)"
    )


def normalize_base64_image(image_input: Union[str, ImageInput, ImageContent]) -> str:
    """
    Normalize various image input formats to a base64 data URL string.
    
    Args:
        image_input: Can be a base64 string, ImageInput object, or ImageContent object
        
    Returns:
        Base64 data URL string ready for API consumption
    """
    
    # Handle direct base64 string input
    if isinstance(image_input, str):
        if image_input.startswith('data:image/'):
            return image_input
        else:
            # Assume it's raw base64, add PNG data URL prefix
            return f"data:image/png;base64,{image_input}"
    
    # Handle ImageContent from MCP protocol
    elif isinstance(image_input, ImageContent):
        mime_type = image_input.mimeType or "image/png"
        return f"data:{mime_type};base64,{image_input.data}"
    
    # Handle our custom ImageInput object
    elif isinstance(image_input, ImageInput):
        if image_input.base64_data:
            # Direct base64 provided
            if image_input.base64_data.startswith('data:image/'):
                return image_input.base64_data
            else:
                format_hint = image_input.format_hint or "png"
                return f"data:image/{format_hint};base64,{image_input.base64_data}"
                
        elif image_input.file_path:
            # Load from file path
            file_path = Path(image_input.file_path)
            if not file_path.exists():
                raise ValueError(f"Image file not found: {file_path}")
            
            # Read and encode the file
            with open(file_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode()
            
            # Determine MIME type from file extension
            ext = file_path.suffix.lower()
            mime_type_map = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }
            mime_type = mime_type_map.get(ext, 'image/png')
            
            return f"data:{mime_type};base64,{image_data}"
            
        elif image_input.url:
            # Future: could implement URL fetching
            raise NotImplementedError("URL-based image input not yet implemented")
        
        else:
            raise ValueError("ImageInput must provide either base64_data, file_path, or url")
    
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")


@mcp.tool()
async def analyze_ui_screenshot(
    image: Annotated[
        Union[str, ImageInput], 
        Field(description="""
UI screenshot to analyze. Can be provided in multiple formats:
1. Direct base64 string (with or without data URL prefix)
2. ImageInput object with base64_data, file_path, or url
3. File path to an image file

The image will be analyzed for UI/UX issues and improvements.
        """)
    ]
) -> str:
    """
    Analyze a UI screenshot to identify issues, fixes, and improvements.
    
    Args:
        image: UI screenshot in various supported formats
    
    Returns:
        Detailed analysis of the UI with issues, fixes, and improvements
    """
    
    print(f"🔍 DEBUG: analyze_ui_screenshot called with input type: {type(image)}")
    
    if not os.getenv("OPENROUTER_API_KEY"):
        print("❌ DEBUG: OPENROUTER_API_KEY not found in environment variables")
        return "Error: OPENROUTER_API_KEY environment variable not set. Please set your OpenRouter API key."
    
    print("✅ DEBUG: OPENROUTER_API_KEY found")
    
    try:
        # Normalize the image input to a base64 data URL
        base64_image = normalize_base64_image(image)
        print(f"🔍 DEBUG: Normalized image to base64 data URL (length: {len(base64_image)} chars)")
        
        prompt = """
        Analyze this user interface screenshot comprehensively and provide a thorough analysis with specific examples and actionable recommendations.

        Please analyze this interface image and provide:

        1. **ISSUES IDENTIFIED:**
           - List specific problems, inconsistencies, or pain points you can see
           - Rate severity (High/Medium/Low)
           - Include specific elements, colors, spacing, or layout issues

        2. **RECOMMENDED FIXES:**
           - Specific, actionable solutions for each identified issue
           - Implementation priority
           - Suggested changes to improve the current design

        3. **IMPROVEMENT SUGGESTIONS:**
           - Enhancements to improve user experience
           - Best practices recommendations
           - Modern UI/UX trends that could be applied
           - Accessibility improvements

        4. **OVERALL ASSESSMENT:**
           - Summary of the current state
           - Key areas for immediate attention
           - Overall design quality rating

        Focus on practical, implementable feedback that a developer or designer could act upon.
        Be specific about what you observe in the image.
        """
        
        print("🔍 DEBUG: Sending request to OpenRouter API...")
        
        response = client.chat.completions.create(
            model="google/gemini-2.5-flash-preview-05-20",  # Vision-capable model
            messages=[
                {"role": "system", "content": "You are a UI/UX expert who provides detailed analysis of user interface screenshots."},
                {
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": base64_image}}
                    ]
                }
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        print("✅ DEBUG: Received response from OpenRouter API")
        
        content = response.choices[0].message.content
        if not content:
            print("❌ DEBUG: OpenRouter API returned empty response")
            return "Error: OpenRouter API returned an empty response. Please try with a different image."
        
        print(f"✅ DEBUG: Analysis complete, response length: {len(content)} characters")
        return content
        
    except Exception as e:
        print(f"❌ DEBUG: Exception occurred: {str(e)}")
        return f"Error analyzing UI screenshot: {str(e)}"


@mcp.tool()
async def analyze_ui_from_path(
    file_path: Annotated[str, Field(description="Path to the UI screenshot image file")]
) -> str:
    """
    Convenience tool to analyze a UI screenshot from a file path.
    
    Args:
        file_path: Path to the image file
    
    Returns:
        Detailed analysis of the UI
    """
    image_input = ImageInput(file_path=file_path)
    return await analyze_ui_screenshot(image_input)


@mcp.tool()
async def analyze_ui_from_base64(
    base64_data: Annotated[str, Field(description="Base64 encoded image data")]
) -> str:
    """
    Convenience tool to analyze a UI screenshot from base64 data.
    
    Args:
        base64_data: Base64 encoded image (with or without data URL prefix)
    
    Returns:
        Detailed analysis of the UI
    """
    return await analyze_ui_screenshot(base64_data)


@mcp.resource("ui-analysis://guidelines")
def ui_analysis_guidelines() -> str:
    """Provides guidelines for effective UI analysis."""
    return """
    # UI Analysis Guidelines

    ## Supported Image Input Formats:

    ### 1. Direct Base64 String
    - Raw base64: `"iVBORw0KGgoAAAANSUhEUgAA..."`
    - Data URL: `"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."`

    ### 2. ImageInput Object
    ```json
    {
        "base64_data": "iVBORw0KGgoAAAANSUhEUgAA...",
        "format_hint": "png"
    }
    ```
    
    ### 3. File Path
    ```json
    {
        "file_path": "/path/to/screenshot.png"
    }
    ```

    ## Best Practices for UI Screenshots:
    - Provide clear, high-resolution screenshots (PNG format preferred)
    - Capture the full interface or relevant sections
    - Ensure good contrast and visibility of all elements
    - Include different states if relevant (hover, active, error states)
    - Consider capturing both desktop and mobile views

    ## Analysis Focus Areas:
    - **Visual Hierarchy**: Layout, spacing, typography, color usage
    - **Accessibility**: Color contrast, text readability, button sizes
    - **Usability**: Navigation clarity, button placement, information flow
    - **Design Consistency**: Alignment, spacing patterns, visual elements
    - **Mobile Responsiveness**: If mobile view provided
    - **Interactive Elements**: Button states, form elements, links

    ## Common Issues to Look For:
    - Poor color contrast ratios
    - Inconsistent spacing and alignment
    - Unclear or missing call-to-action buttons
    - Cluttered or overwhelming layouts
    - Poor typography hierarchy
    - Accessibility violations (small text, poor contrast)
    - Missing visual feedback for interactions

    ## Example Usage:

    ### Option 1: Direct base64 string
    ```python
    result = await analyze_ui_screenshot("data:image/png;base64,iVBORw0...")
    ```

    ### Option 2: File path
    ```python
    result = await analyze_ui_from_path("/path/to/screenshot.png")
    ```

    ### Option 3: ImageInput object
    ```python
    image_input = {
        "file_path": "/path/to/screenshot.png"
    }
    result = await analyze_ui_screenshot(image_input)
    ```
    """


if __name__ == "__main__":
    # Check if API key is available
    if not os.getenv("OPENROUTER_API_KEY"):
        print("⚠️  Warning: OPENROUTER_API_KEY environment variable not set.")
        print("   Please set it with: export OPENROUTER_API_KEY='your-api-key-here'")
        print("   Get your API key from: https://openrouter.ai/")
    
    print("🚀 Starting UI Analysis MCP Server...")
    print("📊 Tools available:")
    print("   - analyze_ui_screenshot: Flexible UI analysis with multiple input formats")
    print("   - analyze_ui_from_path: Analyze from file path")
    print("   - analyze_ui_from_base64: Analyze from base64 data")
    print("📚 Resources available:")
    print("   - ui-analysis://guidelines: Analysis guidelines and input format examples")
    
    mcp.run()