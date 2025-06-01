import { AnalysisData } from '../types';

interface AIAnalysis {
  visual_assessment: {
    overall_quality: string;
    color_harmony: string;
    layout_balance: string;
    typography_consistency: string;
    accessibility_score: number;
    mobile_responsiveness: string;
  };
  recommended_fixes: string[];
  technical_score: number;
  visual_score: number;
  total_issues: number;
  priority_fixes: Array<{
    element?: string;
    issue: string;
    fix: string;
    priority: string;
    css_change?: string;
    html_change?: string;
    reasoning: string;
    description?: string;
    css?: string;
    impact?: string;
  }>;
  detailed_feedback: string;
}

export class AIAnalyzer {
  private provider: 'openai' | 'anthropic';

  constructor(provider: 'openai' | 'anthropic' = 'anthropic') {
    this.provider = provider;
  }

  async analyzeScreenshot(screenshotBase64: string, technicalData: AnalysisData): Promise<AIAnalysis> {
    if (this.provider === 'openai') {
      return this.analyzeWithOpenAI(screenshotBase64, technicalData);
    } else {
      return this.analyzeWithAnthropic(screenshotBase64, technicalData);
    }
  }

  private async analyzeWithOpenAI(screenshotBase64: string, technicalData: AnalysisData): Promise<AIAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found, using mock analysis');
      return this.generateMockAnalysis(technicalData);
    }

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    const technicalScore = technicalData.data?.analysis?.scorePercentage || 0;
    const heuristicsScore = technicalData.data?.analysis || { total: 0, passed: 0, failed: 0, details: [] };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: this.buildEnhancedPrompt(technicalScore, heuristicsScore)
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

  private async analyzeWithAnthropic(screenshotBase64: string, technicalData: AnalysisData): Promise<AIAnalysis> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not found, using mock analysis');
      return this.generateMockAnalysis(technicalData);
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    const technicalScore = technicalData.data?.analysis?.scorePercentage || 0;
    const heuristicsScore = technicalData.data?.analysis || { total: 0, passed: 0, failed: 0, details: [] };

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: this.buildEnhancedPrompt(technicalScore, heuristicsScore)
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

  private buildEnhancedPrompt(technicalScore: number, heuristicsScore: any): string {
    const failedRules = heuristicsScore.details?.filter((d: any) => !d.passed) || [];
    const mainIssues = failedRules.slice(0, 5).map((d: any) => d.message).join('; ');

    return `You are an expert UI/UX designer analyzing a webpage. Based on the provided data, give comprehensive design recommendations.

**Analysis Data:**
- Technical Score: ${technicalScore}/100 (${heuristicsScore.passed} rules passed, ${heuristicsScore.failed} failed)
- Main Issues: ${mainIssues}

**Your Task:**
Provide JSON response with specific, actionable fixes. Focus on the biggest visual impact improvements.

**Required JSON Structure:**
{
  "visual_assessment": {
    "overall_quality": "excellent|good|fair|poor",
    "color_harmony": "excellent|good|fair|poor", 
    "layout_balance": "excellent|good|fair|poor",
    "typography_consistency": "excellent|good|fair|poor",
    "accessibility_score": 0-100,
    "mobile_responsiveness": "excellent|good|fair|poor"
  },
  "recommended_fixes": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "priority_fixes": [
    {
      "description": "Specific description of what needs fixing",
      "css": "Actual CSS code with proper selectors",
      "priority": "critical|high|medium", 
      "impact": "Expected visual improvement",
      "reasoning": "Why this fix is important"
    }
  ],
  "technical_score": ${technicalScore},
  "visual_score": 0-100,
  "total_issues": ${heuristicsScore.failed},
  "detailed_feedback": "Comprehensive analysis of the design"
}

**CSS Fix Guidelines:**
- Use generic but effective selectors (body, h1, h2, p, button, .container, etc.)
- Provide complete CSS rules, not fragments
- Focus on: typography, spacing, colors, layout, responsiveness
- Make fixes that work without knowing exact HTML structure
- Prioritize high-impact visual improvements
- Include CSS that improves accessibility

**Example Good CSS Fixes:**
- "body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; margin: 0; }"
- "h1, h2, h3 { margin-bottom: 0.5em; color: #2c3e50; font-weight: 600; }"
- "button { padding: 12px 24px; border-radius: 6px; background: #3498db; color: white; border: none; cursor: pointer; transition: all 0.3s; }"
- ".container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }"

Generate 3-8 priority fixes with working CSS code that can be immediately applied.`;
  }

  private parseAIResponse(content: string, technicalScore: number): AIAnalysis {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure priority_fixes have the right format for auto-fix
        const enhancedFixes = (parsed.priority_fixes || []).map((fix: any) => ({
          ...fix,
          css: fix.css || fix.css_change,
          description: fix.description || fix.issue,
          element: fix.element,
          issue: fix.issue,
          fix: fix.fix,
          css_change: fix.css_change,
          html_change: fix.html_change
        }));

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
          priority_fixes: enhancedFixes,
          detailed_feedback: parsed.detailed_feedback || 'AI analysis completed successfully.'
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse AI response, using fallback');
    }

    return this.generateMockAnalysis({ data: { analysis: { scorePercentage: technicalScore } } } as AnalysisData);
  }

  private generateMockAnalysis(technicalData: AnalysisData): AIAnalysis {
    const technicalScore = technicalData.data?.analysis?.scorePercentage || 50;
    const visualScore = Math.min(95, Math.max(30, technicalScore + Math.random() * 20 - 10));

    const mockFixes = [
      {
        description: "Improve typography consistency",
        css: "body { font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.6; } h1, h2, h3 { font-weight: 600; margin-bottom: 0.5em; }",
        priority: "high",
        impact: "Better readability and visual hierarchy",
        reasoning: "Consistent typography improves overall design quality",
        element: "body, headings",
        issue: "Inconsistent typography",
        fix: "Apply system font stack and proper spacing"
      },
      {
        description: "Add proper spacing and layout structure",
        css: ".container { max-width: 1200px; margin: 0 auto; padding: 0 20px; } .section { margin-bottom: 2rem; }",
        priority: "medium",
        impact: "Better content organization and readability",
        reasoning: "Proper spacing improves visual flow",
        element: "layout containers",
        issue: "Inconsistent spacing",
        fix: "Apply container and section spacing"
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
        "Improve color contrast for accessibility",
        "Standardize spacing with consistent scale",
        "Enhance typography hierarchy",
        "Add visual feedback for interactive elements"
      ],
      technical_score: technicalScore,
      visual_score: Math.round(visualScore),
      total_issues: technicalData.data?.analysis?.issues?.length || 0,
      priority_fixes: mockFixes,
      detailed_feedback: `Analysis shows ${technicalScore}% technical score. Focus on typography consistency, proper spacing, and accessibility improvements.`
    };
  }
} 