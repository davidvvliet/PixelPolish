/**
 * Comprehensive type definitions for PixelPolish AI Agent
 */

export interface PixelPolishConfig {
  port: number;
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

// === DOM Analysis Types ===

export interface DOMData {
  url: string;
  title: string;
  viewport: {
    width: number;
    height: number;
  };
  elements: DOMElement[];
  totalElements: number;
  structure: DOMStructure;
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

export interface DOMStructure {
  headings: Array<{
    level: number;
    text: string;
    id?: string;
  }>;
  navigation: Array<{
    type: string;
    links: Array<{
      text: string;
      href?: string;
    }>;
  }>;
  forms: Array<{
    action?: string;
    method: string;
    inputs: Array<{
      type: string;
      name?: string;
      required: boolean;
    }>;
  }>;
  images: Array<{
    src?: string;
    alt?: string;
    width?: string;
    height?: string;
  }>;
  links: Array<{
    href: string;
    text: string;
    target?: string;
  }>;
}

// === CSS Analysis Types ===

export interface CSSData {
  layoutStyles: LayoutStyle[];
  spacing: SpacingAnalysis;
  typography: TypographyAnalysis;
  colors: ColorAnalysis;
  positioning: PositioningAnalysis;
  responsiveness: ResponsivenessAnalysis;
}

export interface LayoutStyle {
  elementIndex: number;
  tagName: string;
  id?: string;
  className?: string;
  layout: Record<string, string>;
  isFlexContainer: boolean;
  isGridContainer: boolean;
  isPositioned: boolean;
  hasFloat: boolean;
}

export interface SpacingAnalysis {
  marginPatterns: Map<string, number>;
  paddingPatterns: Map<string, number>;
  inconsistencies: Array<{
    elementIndex: number;
    type: 'margin' | 'padding';
    issue: string;
    values: any;
  }>;
  recommendations: string[];
}

export interface TypographyAnalysis {
  fontSizes: Map<string, number>;
  fontFamilies: Map<string, number>;
  colors: Map<string, number>;
  inconsistencies: any[];
}

export interface ColorAnalysis {
  backgroundColor: Map<string, number>;
  textColors: Map<string, number>;
  borderColors: Map<string, number>;
  colorScheme: string[];
  contrastIssues: any[];
}

export interface PositioningAnalysis {
  positionTypes: Map<string, number>;
  zIndexLayers: Map<string, number>;
  overlaps: any[];
  misalignments: any[];
}

export interface ResponsivenessAnalysis {
  hasMediaQueries: boolean;
  breakpoints: number[];
  flexboxUsage: number;
  gridUsage: number;
  issues: any[];
}

// === Heuristics Analysis Types ===

export interface HeuristicsAnalysis {
  score: number;
  maxScore: number;
  scorePercentage: number;
  issues: Issue[];
  recommendations: Recommendation[];
  summary: {
    totalIssues: number;
    severityCounts: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    typeCounts: Record<string, number>;
    topRecommendations: Recommendation[];
  };
  ruleResults: RuleResult[];
}

export interface Issue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
  element?: string;
  elementIndex?: number;
}

export interface Recommendation {
  type: string;
  priority: number;
  message: string;
  action: string;
}

export interface RuleResult {
  ruleName: string;
  score: number;
  maxScore: number;
  issues: Issue[];
  recommendations: Recommendation[];
}

// === Screenshot Types ===

export interface ScreenshotResult {
  success: boolean;
  filename: string;
  screenshotPath: string;
  screenshotBase64: string;
  timestamp: number;
  error?: string;
}

// === AI Analysis Types ===

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

// === Combined Analysis Result ===

export interface ComprehensiveAnalysis {
  success: boolean;
  filename: string;
  analyzedAt: string;
  technical: HeuristicsAnalysis;
  visual: AIAnalysis;
  screenshot: ScreenshotResult;
  combined_score: number;
  priority_actions: PriorityFix[];
}

export interface McpToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
} 