/**
 * AI Analyzer service for visual assessment using OpenAI GPT-4V, Anthropic Claude, or Google Gemini
 */

import type { AIAnalysis, AnalysisData, PriorityFix } from './types.js';
export class AIAnalyzer {
  private provider: 'openai' | 'anthropic' | 'gemini';

  constructor(provider: 'openai' | 'anthropic' | 'gemini' = 'openai') {
    this.provider = provider;
  }

  /**
   * Analyze screenshot using AI vision models
   */
  async analyzeScreenshot(screenshotBase64: string, technicalData: AnalysisData): Promise<AIAnalysis> {
    console.error(`🤖 Running AI visual analysis with ${this.provider}...`);

    try {
      if (this.provider === 'openai') {
        return await this.analyzeWithOpenAI(screenshotBase64, technicalData);
      } else if (this.provider === 'anthropic') {
        return await this.analyzeWithAnthropic(screenshotBase64, technicalData);
      } else if (this.provider === 'gemini') {
        return await this.analyzeWithGoogle(screenshotBase64, technicalData);
      } else {
        // Should not happen with proper type checking, but as a safeguard:
        console.warn(`⚠️ Unknown provider: ${this.provider}. Defaulting to mock data.`);
        return this.generateMockAnalysis(technicalData);
      }
    } catch (error) {
      console.warn(`⚠️ AI analysis failed with ${this.provider}, using mock data: ${error}`);
      return this.generateMockAnalysis(technicalData);
    }
  }

  /**
   * Analyze with OpenAI GPT-4 Vision
   */
  private async analyzeWithOpenAI(screenshotBase64: string, technicalData: AnalysisData): Promise<AIAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found, using mock analysis');
      return this.generateMockAnalysis(technicalData);
    }

    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });

    const technicalScore = technicalData.data?.analysis?.scorePercentage || 0;
    const issuesCount = technicalData.data?.analysis?.issues?.length || 0;

    const response = await client.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o for best multimodal capabilities
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: this.buildAnalysisPrompt(technicalScore, issuesCount)
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    const content = response.choices[0]?.message?.content || '';
    return this.parseAIResponse(content, technicalScore);
  }

  /**
   * Analyze with Anthropic Claude
   */
  private async analyzeWithAnthropic(screenshotBase64: string, technicalData: AnalysisData): Promise<AIAnalysis> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not found, using mock analysis');
      return this.generateMockAnalysis(technicalData);
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    const technicalScore = technicalData.data?.analysis?.scorePercentage || 0;
    const issuesCount = technicalData.data?.analysis?.issues?.length || 0;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: this.buildAnalysisPrompt(technicalScore, issuesCount)
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: screenshotBase64
              }
            }
          ]
        }
      ]
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return this.parseAIResponse(content, technicalScore);
  }

  /**
   * Analyze with Google Gemini
   */
  private async analyzeWithGoogle(screenshotBase64: string, technicalData: AnalysisData): Promise<AIAnalysis> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found, using mock analysis');
      return this.generateMockAnalysis(technicalData);
    }

    const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const technicalScore = technicalData.data?.analysis?.scorePercentage || 0;
    const issuesCount = technicalData.data?.analysis?.issues?.length || 0;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro-preview-05-06", // Efficient and capable multimodal model
      generationConfig: {
        maxOutputTokens: 1500,
        responseMimeType: "application/json", // Request JSON output directly
      },
      // Optional: Adjust safety settings if needed, default might be too strict for some UI analysis
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ]
    });

    const prompt = this.buildAnalysisPrompt(technicalScore, issuesCount);
    const imagePart = {
      inlineData: {
        data: screenshotBase64,
        mimeType: "image/png",
      },
    };

    try {
      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      const content = response.text(); // Should be a JSON string due to responseMimeType
      return this.parseAIResponse(content, technicalScore);
    } catch (error) {
        console.warn(`⚠️ Google Gemini analysis failed: ${error}. Falling back to mock data.`);
        // Log the full error for debugging if needed
        // console.error("Full Gemini error:", error);
        return this.generateMockAnalysis(technicalData);
    }
  }


  /**
   * Build analysis prompt for AI models
   */
  private buildAnalysisPrompt(technicalScore: number, issuesCount: number): string {
    // Note: The instruction "Provide a JSON response with this exact structure" is crucial.
    // For Gemini with responseMimeType: "application/json", it will enforce the format,
    // but the structure defined here guides the content of that JSON.
    return `Analyze this UI screenshot for visual design quality. Technical analysis shows ${technicalScore}% score with ${issuesCount} issues.

Provide a JSON response with this exact structure:
{
  "visual_assessment": {
    "overall_quality": "excellent|good|fair|poor",
    "color_harmony": "excellent|good|fair|poor", 
    "layout_balance": "excellent|good|fair|poor",
    "typography_consistency": "excellent|good|fair|poor",
    "accessibility_score": 0-100,
    "mobile_responsiveness": "excellent|good|fair|poor"
  },
  "recommended_fixes": ["fix1", "fix2", "fix3"],
  "technical_score": ${technicalScore},
  "visual_score": 0-100,
  "total_issues": ${issuesCount},
  "priority_fixes": [
    {
      "element": "element_type",
      "issue": "description", 
      "fix": "solution",
      "priority": "critical|high|medium|low",
      "css_change": "specific CSS code",
      "html_change": "specific HTML change if needed",
      "reasoning": "why this fix is important"
    }
  ],
  "detailed_feedback": "comprehensive analysis of the design"
}

Focus on:
- Visual hierarchy and layout balance
- Color scheme effectiveness
- Typography consistency and readability  
- Spacing and alignment issues
- Accessibility concerns visible in the design (e.g., contrast, touch target size)
- Mobile-first responsive design principles (infer from layout if possible)
- Modern design best practices and overall aesthetic appeal.

Provide specific, actionable CSS/HTML fixes with exact code suggestions where applicable. Ensure the "element" field in "priority_fixes" describes the target HTML element (e.g., "button.primary", "div.header", "nav ul li").
Be concise but thorough in your "detailed_feedback".
The "visual_score" should be your assessment of the visual quality based on the screenshot.
The "accessibility_score" in "visual_assessment" should be estimated based on visual cues (contrast, font sizes, spacing).
If the image quality is too low or the content is uninterpretable, indicate this in the feedback and use placeholder values.`;
  }

  /**
   * Parse AI response into structured analysis
   */
  private parseAIResponse(content: string, technicalScore: number): AIAnalysis {
    try {
      let parsedJson;
      // Check if content is already a valid JSON string (e.g., from Gemini with responseMimeType: "application/json")
      try {
        parsedJson = JSON.parse(content);
      } catch (e) {
        // If direct parsing fails, try to extract JSON from a larger string (e.g., wrapped in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          parsedJson = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found in AI response.");
        }
      }
        
      // Ensure all required fields exist, providing defaults
      return {
        visual_assessment: {
          overall_quality: parsedJson.visual_assessment?.overall_quality || 'fair',
          color_harmony: parsedJson.visual_assessment?.color_harmony || 'fair',
          layout_balance: parsedJson.visual_assessment?.layout_balance || 'fair', 
          typography_consistency: parsedJson.visual_assessment?.typography_consistency || 'fair',
          accessibility_score: parsedJson.visual_assessment?.accessibility_score || 60,
          mobile_responsiveness: parsedJson.visual_assessment?.mobile_responsiveness || 'fair'
        },
        recommended_fixes: parsedJson.recommended_fixes || [],
        technical_score: technicalScore, // This comes from input, not AI response
        visual_score: parsedJson.visual_score || 65,
        total_issues: parsedJson.total_issues === undefined ? (technicalData.data?.analysis?.issues?.length || 0) : parsedJson.total_issues, // Use actual issues if AI doesn't override
        priority_fixes: (parsedJson.priority_fixes || []).map((fix: any) => ({ // Basic validation/shaping
            element: fix.element || "unknown",
            issue: fix.issue || "No issue described",
            fix: fix.fix || "No fix suggested",
            priority: fix.priority || "medium",
            css_change: fix.css_change,
            html_change: fix.html_change,
            reasoning: fix.reasoning || "No reasoning provided"
        })),
        detailed_feedback: parsedJson.detailed_feedback || 'AI analysis completed, but some fields might be missing.'
      };
    } catch (error) {
      console.warn(`⚠️ Failed to parse AI response: ${error}. Content was: ${content.substring(0, 500)}... Using fallback mock data.`);
      // Fallback to mock data, passing the original technicalData to generateMockAnalysis
      const fallbackTechnicalData = { data: { analysis: { scorePercentage: technicalScore, issues: { length: 0 } } } } as AnalysisData;
      return this.generateMockAnalysis(fallbackTechnicalData);
    }
  }

  /**
   * Generate mock analysis when AI is unavailable or parsing fails
   */
  private generateMockAnalysis(technicalData: AnalysisData): AIAnalysis {
    const technicalScore = technicalData.data?.analysis?.scorePercentage || 50;
    const issuesCount = technicalData.data?.analysis?.issues?.length || 0;
    const visualScore = Math.min(95, Math.max(30, technicalScore + Math.random() * 20 - 10)); // Keep visual score somewhat related

    const mockFixes: PriorityFix[] = [
      {
        element: "body",
        issue: "Inconsistent spacing between sections (Mock)",
        fix: "Apply consistent margin-bottom to all section elements e.g., `margin-bottom: var(--spacing-large);`",
        priority: "medium",
        css_change: ".section { margin-bottom: 2rem; } /* Or use CSS variables */",
        reasoning: "Consistent spacing improves visual rhythm and overall readability of the page."
      },
      {
        element: "h1, h2, h3",
        issue: "Typography scale needs improvement for better hierarchy (Mock)",
        fix: "Implement a clear and consistent typographic scale. Ensure headings are distinct.",
        priority: "high",
        css_change: "h1 { font-size: 2.5rem; line-height: 1.2; } h2 { font-size: 2rem; line-height: 1.3; } h3 { font-size: 1.5rem; line-height: 1.4; }",
        reasoning: "A clear typographic hierarchy guides the user's attention and improves content scannability."
      }
    ];

    return {
      visual_assessment: {
        overall_quality: visualScore > 80 ? 'excellent' : visualScore > 60 ? 'good' : 'fair',
        color_harmony: 'good',
        layout_balance: technicalScore > 70 ? 'good' : 'fair',
        typography_consistency: 'fair',
        accessibility_score: Math.round(Math.max(40, technicalScore * 0.8 + Math.random() * 10 - 5)), // Mock accessibility
        mobile_responsiveness: 'good'
      },
      recommended_fixes: [
        "Improve color contrast for better accessibility (Mock)",
        "Standardize spacing using a consistent scale (e.g., 4px or 8px grid) (Mock)",
        "Enhance typography hierarchy and readability (Mock)",
        "Add visual feedback (hover, focus, active states) for interactive elements (Mock)"
      ],
      technical_score: technicalScore,
      visual_score: Math.round(visualScore),
      total_issues: issuesCount,
      priority_fixes: mockFixes,
      detailed_feedback: `This is MOCK AI analysis based on a technical score of ${technicalScore}%. The design shows potential but could benefit from systematic improvements in visual consistency, typography, and spacing. Consider establishing a basic design system or style guide.`
    };
  }
}
