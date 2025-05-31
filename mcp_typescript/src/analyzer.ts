/**
 * AI Analyzer service for visual assessment using OpenAI GPT-4V or Anthropic Claude
 */

import type { AIAnalysis, AnalysisData, PriorityFix } from './types.js';

export class AIAnalyzer {
  private provider: 'openai' | 'anthropic';

  constructor(provider: 'openai' | 'anthropic' = 'openai') {
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
      } else {
        return await this.analyzeWithAnthropic(screenshotBase64, technicalData);
      }
    } catch (error) {
      console.warn(`⚠️ AI analysis failed, using mock data: ${error}`);
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
      model: "gpt-4o",
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
   * Build analysis prompt for AI models
   */
  private buildAnalysisPrompt(technicalScore: number, issuesCount: number): string {
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
- Accessibility concerns visible in the design
- Mobile-first responsive design principles
- Modern design best practices

Provide specific, actionable CSS/HTML fixes with exact code suggestions.`;
  }

  /**
   * Parse AI response into structured analysis
   */
  private parseAIResponse(content: string, technicalScore: number): AIAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure all required fields exist
        return {
          visual_assessment: {
            overall_quality: parsed.visual_assessment?.overall_quality || 'fair',
            color_harmony: parsed.visual_assessment?.color_harmony || 'fair',
            layout_balance: parsed.visual_assessment?.layout_balance || 'fair', 
            typography_consistency: parsed.visual_assessment?.typography_consistency || 'fair',
            accessibility_score: parsed.visual_assessment?.accessibility_score || 60,
            mobile_responsiveness: parsed.visual_assessment?.mobile_responsiveness || 'fair'
          },
          recommended_fixes: parsed.recommended_fixes || [],
          technical_score: technicalScore,
          visual_score: parsed.visual_score || 65,
          total_issues: parsed.total_issues || 0,
          priority_fixes: parsed.priority_fixes || [],
          detailed_feedback: parsed.detailed_feedback || 'AI analysis completed successfully.'
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse AI response, using fallback');
    }

    return this.generateMockAnalysis({ data: { analysis: { scorePercentage: technicalScore } } } as AnalysisData);
  }

  /**
   * Generate mock analysis when AI is unavailable
   */
  private generateMockAnalysis(technicalData: AnalysisData): AIAnalysis {
    const technicalScore = technicalData.data?.analysis?.scorePercentage || 50;
    const visualScore = Math.min(95, Math.max(30, technicalScore + Math.random() * 20 - 10));

    const mockFixes: PriorityFix[] = [
      {
        element: "body",
        issue: "Inconsistent spacing between sections",
        fix: "Apply consistent margin-bottom to all section elements",
        priority: "medium",
        css_change: ".section { margin-bottom: 2rem; }",
        reasoning: "Consistent spacing improves visual rhythm and readability"
      },
      {
        element: "h1, h2, h3",
        issue: "Typography scale needs improvement",
        fix: "Implement a consistent typographic scale",
        priority: "high",
        css_change: "h1 { font-size: 2.5rem; } h2 { font-size: 2rem; } h3 { font-size: 1.5rem; }",
        reasoning: "Clear hierarchy guides user attention and improves readability"
      }
    ];

    return {
      visual_assessment: {
        overall_quality: visualScore > 80 ? 'excellent' : visualScore > 60 ? 'good' : 'fair',
        color_harmony: 'good',
        layout_balance: technicalScore > 70 ? 'good' : 'fair',
        typography_consistency: 'fair',
        accessibility_score: Math.round(technicalScore * 0.8),
        mobile_responsiveness: 'good'
      },
      recommended_fixes: [
        "Improve color contrast for better accessibility",
        "Standardize spacing using a consistent scale",
        "Enhance typography hierarchy",
        "Add visual feedback for interactive elements"
      ],
      technical_score: technicalScore,
      visual_score: Math.round(visualScore),
      total_issues: technicalData.data?.analysis?.issues?.length || 0,
      priority_fixes: mockFixes,
      detailed_feedback: `Mock AI analysis: The design shows a technical score of ${technicalScore}% with opportunities for improvement in spacing consistency, typography hierarchy, and color usage. Focus on implementing a design system for better consistency.`
    };
  }
} 