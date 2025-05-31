/**
 * AI Analysis service for visual UI assessment
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisData, AIAnalysis, PriorityFix } from './types.js';

export class AIAnalyzer {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private provider: 'openai' | 'anthropic';

  constructor(provider: 'openai' | 'anthropic' = 'openai') {
    this.provider = provider;
    
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Analyze a screenshot with AI vision models
   */
  async analyzeScreenshot(screenshotBase64: string, analysisData: AnalysisData): Promise<AIAnalysis> {
    try {
      if (this.provider === 'openai' && this.openai) {
        return await this.analyzeWithOpenAI(screenshotBase64, analysisData);
      } else if (this.provider === 'anthropic' && this.anthropic) {
        return await this.analyzeWithAnthropic(screenshotBase64, analysisData);
      } else {
        console.warn('⚠️ No AI provider configured, using mock analysis');
        return this.getMockAnalysis(analysisData);
      }
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      return this.getMockAnalysis(analysisData);
    }
  }

  /**
   * Analyze with OpenAI GPT-4 Vision
   */
  private async analyzeWithOpenAI(screenshotBase64: string, analysisData: AnalysisData): Promise<AIAnalysis> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const technicalScore = analysisData.data?.analysis?.scorePercentage || 0;
    const issuesCount = analysisData.data?.analysis?.summary?.totalIssues || 0;

    const prompt = this.buildAnalysisPrompt(technicalScore, issuesCount);

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const aiResponse = response.choices[0]?.message?.content || '';
    return this.parseAIResponse(aiResponse, technicalScore, issuesCount);
  }

  /**
   * Analyze with Anthropic Claude Vision
   */
  private async analyzeWithAnthropic(screenshotBase64: string, analysisData: AnalysisData): Promise<AIAnalysis> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const technicalScore = analysisData.data?.analysis?.scorePercentage || 0;
    const issuesCount = analysisData.data?.analysis?.summary?.totalIssues || 0;

    const prompt = this.buildAnalysisPrompt(technicalScore, issuesCount);

    const response = await this.anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
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

    const aiResponse = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return this.parseAIResponse(aiResponse, technicalScore, issuesCount);
  }

  /**
   * Build the analysis prompt for AI models
   */
  private buildAnalysisPrompt(technicalScore: number, issuesCount: number): string {
    return `You are a professional UI/UX designer and frontend expert. Analyze this website screenshot and provide detailed feedback.

Technical Analysis Context:
- Current technical score: ${technicalScore}%
- Technical issues found: ${issuesCount}

Please analyze the visual design and provide a JSON response with the following structure:

{
  "visual_assessment": {
    "overall_quality": "excellent|good|moderate|poor",
    "color_harmony": "excellent|good|moderate|poor",
    "layout_balance": "excellent|good|moderate|poor", 
    "typography_consistency": "excellent|good|moderate|poor",
    "accessibility_score": 0-100,
    "mobile_responsiveness": "excellent|good|moderate|poor"
  },
  "recommended_fixes": [
    "List of general recommendations"
  ],
  "visual_score": 0-100,
  "priority_fixes": [
    {
      "element": "CSS selector or element description",
      "issue": "Description of the visual issue",
      "fix": "Specific solution",
      "priority": "critical|high|medium|low",
      "css_change": "Specific CSS code to apply",
      "reasoning": "Why this fix improves the design"
    }
  ],
  "detailed_feedback": "Comprehensive analysis of the design quality, visual hierarchy, spacing, colors, typography, and overall user experience"
}

Focus on:
1. Visual hierarchy and layout balance
2. Color scheme effectiveness and accessibility
3. Typography consistency and readability
4. Spacing and alignment issues
5. Overall aesthetic appeal and professionalism
6. Mobile responsiveness indicators
7. Specific actionable fixes with CSS code

Provide practical, implementable solutions.`;
  }

  /**
   * Parse AI response and extract structured data
   */
  private parseAIResponse(aiResponse: string, technicalScore: number, issuesCount: number): AIAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          visual_assessment: parsed.visual_assessment || {
            overall_quality: "moderate",
            color_harmony: "good",
            layout_balance: "moderate",
            typography_consistency: "moderate",
            accessibility_score: 70,
            mobile_responsiveness: "moderate"
          },
          recommended_fixes: parsed.recommended_fixes || [],
          technical_score: technicalScore,
          visual_score: parsed.visual_score || 70,
          total_issues: issuesCount,
          priority_fixes: parsed.priority_fixes || [],
          detailed_feedback: parsed.detailed_feedback || aiResponse
        };
      }
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
    }

    // Fallback to mock analysis if parsing fails
    return this.getMockAnalysis({ data: { analysis: { scorePercentage: technicalScore, summary: { totalIssues: issuesCount } } } } as AnalysisData);
  }

  /**
   * Get mock analysis when AI is not available
   */
  private getMockAnalysis(analysisData: AnalysisData): AIAnalysis {
    const technicalScore = analysisData.data?.analysis?.scorePercentage || 0;
    const issuesCount = analysisData.data?.analysis?.summary?.totalIssues || 0;

    const mockFixes: PriorityFix[] = [
      {
        element: ".hero-section",
        issue: "Inconsistent padding and spacing",
        fix: "Standardize padding to 60px 20px",
        priority: "high",
        css_change: ".hero-section { padding: 60px 20px; }",
        reasoning: "Consistent spacing improves visual rhythm and professional appearance"
      },
      {
        element: ".cta-button",
        issue: "Button size may be too large for mobile",
        fix: "Reduce font size and padding for better mobile UX",
        priority: "medium",
        css_change: ".cta-button { font-size: 18px; padding: 12px 24px; }",
        reasoning: "Appropriately sized buttons improve usability across devices"
      }
    ];

    return {
      visual_assessment: {
        overall_quality: "moderate",
        color_harmony: "good",
        layout_balance: "needs_improvement",
        typography_consistency: "moderate",
        accessibility_score: 75,
        mobile_responsiveness: "moderate"
      },
      recommended_fixes: [
        "Improve spacing consistency throughout the page",
        "Standardize button styles and sizes",
        "Enhance color contrast for better accessibility",
        "Implement a more consistent grid system"
      ],
      technical_score: technicalScore,
      visual_score: 68,
      total_issues: issuesCount,
      priority_fixes: mockFixes,
      detailed_feedback: "The design shows potential but needs refinement in spacing consistency and visual hierarchy. The color scheme is pleasant but could benefit from improved contrast ratios for accessibility. Typography is generally consistent but button sizing could be optimized for mobile users."
    };
  }
} 