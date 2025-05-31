#!/usr/bin/env python3
"""
Hello World MCP Server

A simple MCP server demonstrating basic concepts:
- Tools: Functions the LLM can call
- Resources: Data the LLM can access
- Prompts: Reusable templates for interactions
"""

from mcp.server.fastmcp import FastMCP

# Create the MCP server
mcp = FastMCP("Hello World Server")


# Tool: A simple function the LLM can call
@mcp.tool()
def say_hello(name: str = "World") -> str:
    """Say hello to someone"""
    return f"Hello, {name}! 👋"


@mcp.tool()
def add_numbers(a: int, b: int) -> int:
    """Add two numbers together"""
    return a + b


@mcp.tool()
def get_current_time() -> str:
    """Get the current time"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# Resource: Static data the LLM can access
@mcp.resource("info://server")
def get_server_info() -> str:
    """Get information about this MCP server"""
    return """
    Hello World MCP Server
    =====================
    
    This is a simple demonstration server that provides:
    - Basic greeting functionality
    - Simple math operations
    - Current time information
    
    Version: 1.0.0
    Created with: MCP Python SDK
    """


# Resource: Dynamic data based on parameters
@mcp.resource("greeting://{name}")
def get_personal_greeting(name: str) -> str:
    """Get a personalized greeting message"""
    return f"Welcome to the Hello World MCP Server, {name}! 🌟\n\nHere you can explore basic MCP functionality."


# Prompt: A reusable template for interactions
@mcp.prompt()
def introduction_prompt() -> str:
    """Generate an introduction prompt"""
    return """Please introduce yourself and explain what you can help with using the tools available in this Hello World MCP server. Be friendly and helpful!"""


@mcp.prompt()
def math_helper_prompt(problem: str) -> str:
    """Create a math problem solving prompt"""
    return f"""
Help solve this math problem: {problem}

Use the available tools to:
1. Break down the problem
2. Perform any calculations needed
3. Explain the solution step by step
"""


if __name__ == "__main__":
    print("🚀 Starting Hello World MCP Server...")
    print("📊 Available tools:")
    print("   - say_hello: Greet someone")
    print("   - add_numbers: Add two numbers")
    print("   - get_current_time: Get current timestamp")
    print("📚 Available resources:")
    print("   - info://server: Server information")
    print("   - greeting://{name}: Personalized greetings")
    print("🎯 Available prompts:")
    print("   - introduction_prompt: Server introduction")
    print("   - math_helper_prompt: Math problem assistance")
    print("\n✨ Server ready for connections!")
    
    mcp.run() 