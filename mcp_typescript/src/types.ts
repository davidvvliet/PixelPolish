/**
 * Type definitions for PixelPolish MCP Server
 */

export interface PixelPolishConfig {
  pixelpolishUrl: string;
  localDir: string;
  screenshotsDir: string;
  watchInterval: number;
  aiProvider: 'openai' | 'anthropic';
  autoFix: boolean;
}

export interface AnalysisData {
  success: boolean;
  filename?: string;
  analyzedAt?: string;
  data?: {
    dom: DOMData;
    css: CSSData;
    analysis: HeuristicsAnalysis;
  };
}

export interface DOMData {
  url: string;
  title: string;
  elements: DOMElement[];
  totalElements: number;
  structure: any;
  capturedAt: string;
}

export interface DOMElement {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  computedStyles: Record<string, string>;
  attributes: Record<string, string>;
}

export interface CSSData {
  layoutStyles: any[];
  spacing: any;
  typography: any;
  positioning: any;
}

export interface HeuristicsAnalysis {
  score: number;
  scorePercentage: number;
  issues: Issue[];
  recommendations: string[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  ruleResults: RuleResult[];
}

export interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
  element?: string;
  rule: string;
}

export interface RuleResult {
  ruleName: string;
  score: number;
  maxScore: number;
  issues: Issue[];
  recommendations: string[];
}

export interface ScreenshotResult {
  success: boolean;
  filename: string;
  screenshotPath: string;
  screenshotBase64: string;
  timestamp: number;
  error?: string;
}

export interface AIAnalysis {
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
  priority_fixes: PriorityFix[];
  detailed_feedback: string;
}

export interface PriorityFix {
  element: string;
  issue: string;
  fix: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  css_change?: string;
  html_change?: string;
  reasoning: string;
}

export interface McpToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
} 