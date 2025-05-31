/**
 * Heuristics Engine for comprehensive UI analysis with 190-point scoring system
 */

import type { 
  HeuristicsAnalysis, 
  DOMData, 
  CSSData, 
  Issue, 
  Recommendation, 
  RuleResult 
} from './types.js';

export class HeuristicsEngineService {
  private rules: BaseRule[];

  constructor() {
    this.rules = [
      new AlignmentRule(),
      new SpacingConsistencyRule(),
      new TypographyConsistencyRule(),
      new ResponsivenessRule(),
      new AccessibilityRule(),
      new PerformanceRule()
    ];
  }

  /**
   * Run comprehensive heuristics analysis
   */
  async analyze(domData: DOMData, cssData: CSSData): Promise<HeuristicsAnalysis> {
    console.log('📊 Running heuristics analysis...');

    const analysis: HeuristicsAnalysis = {
      score: 0,
      maxScore: 0,
      scorePercentage: 0,
      issues: [],
      recommendations: [],
      summary: {
        totalIssues: 0,
        severityCounts: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        typeCounts: {},
        topRecommendations: []
      },
      ruleResults: []
    };

    // Run each heuristic rule
    for (const rule of this.rules) {
      try {
        console.log(`  Running ${rule.name}...`);
        const result = await rule.evaluate(domData, cssData);
        
        analysis.ruleResults.push({
          ruleName: rule.name,
          score: result.score,
          maxScore: result.maxScore,
          issues: result.issues,
          recommendations: result.recommendations
        });

        // Accumulate overall scores and issues
        analysis.score += result.score;
        analysis.maxScore += result.maxScore;
        analysis.issues.push(...result.issues);
        analysis.recommendations.push(...result.recommendations);

      } catch (error) {
        console.error(`Error running rule ${rule.name}:`, error);
        analysis.issues.push({
          type: 'system_error',
          severity: 'low',
          message: `Failed to run ${rule.name} rule: ${error}`,
          suggestion: 'Check system configuration'
        });
      }
    }

    // Calculate percentage score
    analysis.scorePercentage = analysis.maxScore > 0 ? 
      Math.round((analysis.score / analysis.maxScore) * 100) : 0;

    // Generate summary
    analysis.summary = this.generateSummary(analysis);

    console.log(`✅ Analysis complete: ${analysis.scorePercentage}% (${analysis.issues.length} issues)`);
    
    return analysis;
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(analysis: HeuristicsAnalysis) {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const typeCounts: Record<string, number> = {};

    analysis.issues.forEach(issue => {
      severityCounts[issue.severity]++;
      typeCounts[issue.type] = (typeCounts[issue.type] || 0) + 1;
    });

    return {
      totalIssues: analysis.issues.length,
      severityCounts,
      typeCounts,
      topRecommendations: analysis.recommendations
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5)
    };
  }
}

// Base rule class
abstract class BaseRule {
  public name: string;
  public weight: number;

  constructor(name: string, weight: number = 1) {
    this.name = name;
    this.weight = weight;
  }

  abstract evaluate(domData: DOMData, cssData: CSSData): Promise<RuleResult>;
}

// Alignment detection rule
class AlignmentRule extends BaseRule {
  constructor() {
    super('Alignment Rule', 2);
  }

  async evaluate(domData: DOMData, cssData: CSSData): Promise<RuleResult> {
    const result: RuleResult = {
      ruleName: this.name,
      score: 0,
      maxScore: 40,
      issues: [],
      recommendations: []
    };

    const elements = domData.elements;
    const alignmentGrid = this.detectAlignmentGrid(elements);
    
    // Check horizontal alignment
    const horizontalIssues = this.checkHorizontalAlignment(elements, alignmentGrid);
    result.issues.push(...horizontalIssues);

    // Check vertical alignment
    const verticalIssues = this.checkVerticalAlignment(elements, alignmentGrid);
    result.issues.push(...verticalIssues);

    // Check text alignment consistency
    const textAlignmentIssues = this.checkTextAlignment(elements);
    result.issues.push(...textAlignmentIssues);

    // Calculate score based on issues found
    const totalIssues = result.issues.length;
    result.score = Math.max(0, result.maxScore - (totalIssues * 3));

    if (totalIssues > 0) {
      result.recommendations.push({
        type: 'alignment',
        priority: 8,
        message: `Found ${totalIssues} alignment issues. Consider using CSS Grid or Flexbox for better alignment.`,
        action: 'Use layout systems like CSS Grid or Flexbox to ensure consistent alignment'
      });
    }

    return result;
  }

  private detectAlignmentGrid(elements: any[]) {
    const grid = {
      horizontalLines: new Set<number>(),
      verticalLines: new Set<number>(),
      commonWidths: new Map<number, number>(),
      commonHeights: new Map<number, number>()
    };

    elements.forEach(element => {
      const rect = element.boundingRect;
      
      // Track common alignment points
      grid.horizontalLines.add(rect.top);
      grid.horizontalLines.add(rect.bottom);
      grid.verticalLines.add(rect.left);
      grid.verticalLines.add(rect.right);

      // Track common dimensions
      grid.commonWidths.set(rect.width, (grid.commonWidths.get(rect.width) || 0) + 1);
      grid.commonHeights.set(rect.height, (grid.commonHeights.get(rect.height) || 0) + 1);
    });

    return grid;
  }

  private checkHorizontalAlignment(elements: any[], grid: any): Issue[] {
    const issues: Issue[] = [];
    const tolerance = 5; // pixels

    elements.forEach((element, index) => {
      const rect = element.boundingRect;
      let alignedToGrid = false;

      // Check if element aligns to common horizontal lines
      for (const line of grid.horizontalLines) {
        if (Math.abs(rect.top - line) <= tolerance || Math.abs(rect.bottom - line) <= tolerance) {
          alignedToGrid = true;
          break;
        }
      }

      if (!alignedToGrid && rect.width > 50) { // Only check meaningful elements
        issues.push({
          type: 'misalignment',
          severity: 'medium',
          elementIndex: index,
          message: `Element at (${rect.left}, ${rect.top}) is not aligned to the horizontal grid`,
          suggestion: 'Align element to common horizontal baselines'
        });
      }
    });

    return issues;
  }

  private checkVerticalAlignment(elements: any[], grid: any): Issue[] {
    const issues: Issue[] = [];
    const tolerance = 5; // pixels

    elements.forEach((element, index) => {
      const rect = element.boundingRect;
      let alignedToGrid = false;

      // Check if element aligns to common vertical lines
      for (const line of grid.verticalLines) {
        if (Math.abs(rect.left - line) <= tolerance || Math.abs(rect.right - line) <= tolerance) {
          alignedToGrid = true;
          break;
        }
      }

      if (!alignedToGrid && rect.height > 30) { // Only check meaningful elements
        issues.push({
          type: 'misalignment',
          severity: 'medium',
          elementIndex: index,
          message: `Element at (${rect.left}, ${rect.top}) is not aligned to the vertical grid`,
          suggestion: 'Align element to common vertical baselines'
        });
      }
    });

    return issues;
  }

  private checkTextAlignment(elements: any[]): Issue[] {
    const issues: Issue[] = [];
    const textAlignments = new Map<string, number>();

    elements.forEach((element, index) => {
      if (element.textContent && element.computedStyles.textAlign) {
        const alignment = element.computedStyles.textAlign;
        textAlignments.set(alignment, (textAlignments.get(alignment) || 0) + 1);
      }
    });

    // Check for too many different alignments
    if (textAlignments.size > 3) {
      issues.push({
        type: 'text_alignment_inconsistency',
        severity: 'low',
        message: `Found ${textAlignments.size} different text alignments, consider standardizing`,
        suggestion: 'Limit text alignment variations to improve consistency'
      });
    }

    return issues;
  }
}

// Spacing consistency rule
class SpacingConsistencyRule extends BaseRule {
  constructor() {
    super('Spacing Consistency Rule', 2);
  }

  async evaluate(domData: DOMData, cssData: CSSData): Promise<RuleResult> {
    const result: RuleResult = {
      ruleName: this.name,
      score: 0,
      maxScore: 35,
      issues: [],
      recommendations: []
    };

    const spacingData = cssData.spacing;
    
    // Analyze spacing patterns
    const patterns = this.analyzeSpacingPatterns(spacingData);
    
    // Check for inconsistencies
    const inconsistencyIssues = this.checkSpacingInconsistencies(spacingData);
    result.issues.push(...inconsistencyIssues);

    // Calculate score
    const totalIssues = result.issues.length;
    result.score = Math.max(0, result.maxScore - (totalIssues * 2));

    if (totalIssues > 5) {
      result.recommendations.push({
        type: 'spacing',
        priority: 7,
        message: 'Significant spacing inconsistencies detected. Consider using a spacing scale system.',
        action: 'Implement consistent spacing using CSS custom properties or a design system'
      });
    }

    return result;
  }

  private analyzeSpacingPatterns(spacingData: any) {
    // Implementation for spacing pattern analysis
    return {
      marginPatterns: spacingData.marginPatterns?.size || 0,
      paddingPatterns: spacingData.paddingPatterns?.size || 0
    };
  }

  private checkSpacingInconsistencies(spacingData: any): Issue[] {
    const issues: Issue[] = [];
    
    if (spacingData.inconsistencies) {
      spacingData.inconsistencies.forEach((inconsistency: any) => {
        issues.push({
          type: 'spacing_inconsistency',
          severity: 'medium',
          elementIndex: inconsistency.elementIndex,
          message: inconsistency.issue,
          suggestion: `Standardize ${inconsistency.type} values for better consistency`
        });
      });
    }

    return issues;
  }
}

// Typography consistency rule
class TypographyConsistencyRule extends BaseRule {
  constructor() {
    super('Typography Consistency Rule', 2);
  }

  async evaluate(domData: DOMData, cssData: CSSData): Promise<RuleResult> {
    const result: RuleResult = {
      ruleName: this.name,
      score: 0,
      maxScore: 30,
      issues: [],
      recommendations: []
    };

    const typography = cssData.typography;
    
    // Check font size consistency
    if (typography.fontSizes.size > 8) {
      result.issues.push({
        type: 'typography_inconsistency',
        severity: 'medium',
        message: `Too many font sizes (${typography.fontSizes.size}). Consider using a typographic scale.`,
        suggestion: 'Limit font sizes to 6-8 variations using a consistent scale'
      });
    }

    // Check font family consistency
    if (typography.fontFamilies.size > 3) {
      result.issues.push({
        type: 'typography_inconsistency',
        severity: 'high',
        message: `Too many font families (${typography.fontFamilies.size}). Limit to 2-3 families maximum.`,
        suggestion: 'Use a consistent font family system'
      });
    }

    const totalIssues = result.issues.length;
    result.score = Math.max(0, result.maxScore - (totalIssues * 5));

    return result;
  }
}

// Responsiveness rule
class ResponsivenessRule extends BaseRule {
  constructor() {
    super('Responsiveness Rule', 1.5);
  }

  async evaluate(domData: DOMData, cssData: CSSData): Promise<RuleResult> {
    const result: RuleResult = {
      ruleName: this.name,
      score: 0,
      maxScore: 25,
      issues: [],
      recommendations: []
    };

    const responsiveness = cssData.responsiveness;
    
    // Check for modern layout usage
    if (responsiveness.flexboxUsage === 0 && responsiveness.gridUsage === 0) {
      result.issues.push({
        type: 'responsiveness',
        severity: 'high',
        message: 'No modern layout systems (Flexbox/Grid) detected',
        suggestion: 'Use Flexbox or CSS Grid for responsive layouts'
      });
    }

    const totalIssues = result.issues.length;
    result.score = Math.max(0, result.maxScore - (totalIssues * 8));

    return result;
  }
}

// Accessibility rule
class AccessibilityRule extends BaseRule {
  constructor() {
    super('Accessibility Rule', 2);
  }

  async evaluate(domData: DOMData, cssData: CSSData): Promise<RuleResult> {
    const result: RuleResult = {
      ruleName: this.name,
      score: 0,
      maxScore: 35,
      issues: [],
      recommendations: []
    };

    // Check heading hierarchy
    const headingIssues = this.checkHeadingHierarchy(domData.structure.headings);
    result.issues.push(...headingIssues);

    // Check image alt attributes
    const imageIssues = this.checkImageAccessibility(domData.structure.images);
    result.issues.push(...imageIssues);

    const totalIssues = result.issues.length;
    result.score = Math.max(0, result.maxScore - (totalIssues * 4));

    return result;
  }

  private checkHeadingHierarchy(headings: any[]): Issue[] {
    const issues: Issue[] = [];
    
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      if (current.level > previous.level + 1) {
        issues.push({
          type: 'accessibility',
          severity: 'medium',
          message: `Heading hierarchy skips levels (h${previous.level} to h${current.level})`,
          suggestion: 'Maintain proper heading hierarchy for screen readers'
        });
      }
    }

    return issues;
  }

  private checkImageAccessibility(images: any[]): Issue[] {
    const issues: Issue[] = [];
    
    images.forEach((image, index) => {
      if (!image.alt) {
        issues.push({
          type: 'accessibility',
          severity: 'high',
          message: `Image missing alt attribute`,
          suggestion: 'Add descriptive alt text for screen readers'
        });
      }
    });

    return issues;
  }
}

// Performance rule
class PerformanceRule extends BaseRule {
  constructor() {
    super('Performance Rule', 1);
  }

  async evaluate(domData: DOMData, cssData: CSSData): Promise<RuleResult> {
    const result: RuleResult = {
      ruleName: this.name,
      score: 0,
      maxScore: 25,
      issues: [],
      recommendations: []
    };

    // Check DOM complexity
    if (domData.totalElements > 500) {
      result.issues.push({
        type: 'performance',
        severity: 'medium',
        message: `High DOM complexity (${domData.totalElements} elements)`,
        suggestion: 'Consider reducing DOM complexity for better performance'
      });
    }

    const totalIssues = result.issues.length;
    result.score = Math.max(0, result.maxScore - (totalIssues * 5));

    return result;
  }
} 