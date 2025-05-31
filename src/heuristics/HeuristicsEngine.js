export class HeuristicsEngine {
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

  async analyze(domData, cssData) {
    const analysis = {
      score: 0,
      maxScore: 100,
      issues: [],
      recommendations: [],
      summary: {},
      ruleResults: []
    };

    // Run each heuristic rule
    for (const rule of this.rules) {
      try {
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
          message: `Failed to run ${rule.name} rule: ${error.message}`
        });
      }
    }

    // Calculate percentage score
    analysis.scorePercentage = analysis.maxScore > 0 ? 
      Math.round((analysis.score / analysis.maxScore) * 100) : 0;

    // Generate summary
    analysis.summary = this.generateSummary(analysis);

    return analysis;
  }

  generateSummary(analysis) {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const typeCounts = {};

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
class BaseRule {
  constructor(name, weight = 1) {
    this.name = name;
    this.weight = weight;
  }

  async evaluate(domData, cssData) {
    throw new Error('evaluate method must be implemented by subclass');
  }
}

// Alignment detection rule
class AlignmentRule extends BaseRule {
  constructor() {
    super('Alignment Rule', 2);
  }

  async evaluate(domData, cssData) {
    const result = {
      score: 0,
      maxScore: 20,
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
    result.score = Math.max(0, result.maxScore - (totalIssues * 2));

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

  detectAlignmentGrid(elements) {
    const grid = {
      horizontalLines: new Set(),
      verticalLines: new Set(),
      commonWidths: new Map(),
      commonHeights: new Map()
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

  checkHorizontalAlignment(elements, grid) {
    const issues = [];
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

  checkVerticalAlignment(elements, grid) {
    const issues = [];
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

      if (!alignedToGrid && rect.height > 20) { // Only check meaningful elements
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

  checkTextAlignment(elements) {
    const issues = [];
    const textAlignments = new Map();

    elements.forEach((element, index) => {
      if (element.textContent && element.computedStyles.textAlign) {
        const alignment = element.computedStyles.textAlign;
        textAlignments.set(alignment, (textAlignments.get(alignment) || 0) + 1);
      }
    });

    // If too many different text alignments, suggest consistency
    if (textAlignments.size > 3) {
      issues.push({
        type: 'text_alignment_inconsistency',
        severity: 'low',
        message: `Found ${textAlignments.size} different text alignments. Consider standardizing.`,
        suggestion: 'Use consistent text alignment throughout the page'
      });
    }

    return issues;
  }
}

// Spacing consistency rule
class SpacingConsistencyRule extends BaseRule {
  constructor() {
    super('Spacing Consistency Rule', 1.5);
  }

  async evaluate(domData, cssData) {
    const result = {
      score: 0,
      maxScore: 15,
      issues: [],
      recommendations: []
    };

    // Analyze spacing patterns from CSS data
    const spacingIssues = this.analyzeSpacingPatterns(cssData.spacing);
    result.issues.push(...spacingIssues);

    // Check for spacing inconsistencies
    const inconsistencyIssues = this.checkSpacingInconsistencies(cssData.spacing);
    result.issues.push(...inconsistencyIssues);

    // Calculate score
    const totalIssues = result.issues.length;
    result.score = Math.max(0, result.maxScore - (totalIssues * 1.5));

    if (totalIssues > 0) {
      result.recommendations.push({
        type: 'spacing',
        priority: 7,
        message: 'Consider using a consistent spacing system (e.g., 8px, 16px, 24px multiples)',
        action: 'Implement a spacing scale for consistent margins and padding'
      });
    }

    return result;
  }

  analyzeSpacingPatterns(spacingData) {
    const issues = [];
    
    // Check if there are too many unique spacing values
    if (spacingData.marginPatterns.size > 10) {
      issues.push({
        type: 'spacing_variety',
        severity: 'medium',
        message: `Found ${spacingData.marginPatterns.size} different margin patterns. Consider standardizing.`,
        suggestion: 'Use a limited set of margin values based on a spacing scale'
      });
    }

    if (spacingData.paddingPatterns.size > 8) {
      issues.push({
        type: 'spacing_variety',
        severity: 'medium',
        message: `Found ${spacingData.paddingPatterns.size} different padding patterns. Consider standardizing.`,
        suggestion: 'Use a limited set of padding values based on a spacing scale'
      });
    }

    return issues;
  }

  checkSpacingInconsistencies(spacingData) {
    return spacingData.inconsistencies.map(inconsistency => ({
      type: 'spacing_inconsistency',
      severity: 'low',
      elementIndex: inconsistency.elementIndex,
      message: inconsistency.issue,
      suggestion: `Consider using symmetric ${inconsistency.type} values`
    }));
  }
}

// Typography consistency rule
class TypographyConsistencyRule extends BaseRule {
  constructor() {
    super('Typography Consistency Rule', 1);
  }

  async evaluate(domData, cssData) {
    const result = {
      score: 0,
      maxScore: 10,
      issues: [],
      recommendations: []
    };

    const typography = cssData.typography;

    // Check font size variety
    if (typography.fontSizes.size > 8) {
      result.issues.push({
        type: 'font_size_variety',
        severity: 'medium',
        message: `Found ${typography.fontSizes.size} different font sizes. Consider using a type scale.`,
        suggestion: 'Use a consistent typographic scale (e.g., 1.2x ratio)'
      });
    }

    // Check font family consistency
    if (typography.fontFamilies.size > 3) {
      result.issues.push({
        type: 'font_family_variety',
        severity: 'high',
        message: `Found ${typography.fontFamilies.size} different font families. Limit to 2-3 fonts.`,
        suggestion: 'Use a maximum of 2-3 font families for consistency'
      });
    }

    // Calculate score
    result.score = Math.max(0, result.maxScore - (result.issues.length * 2));

    return result;
  }
}

// Responsiveness rule
class ResponsivenessRule extends BaseRule {
  constructor() {
    super('Responsiveness Rule', 1.5);
  }

  async evaluate(domData, cssData) {
    const result = {
      score: 0,
      maxScore: 15,
      issues: [],
      recommendations: []
    };

    const responsiveness = cssData.responsiveness;

    // Check for fixed width elements
    responsiveness.fixedWidthElements.forEach(element => {
      result.issues.push({
        type: 'fixed_width',
        severity: 'medium',
        elementIndex: element.elementIndex,
        message: `Element has fixed width (${element.width}) which may not be responsive`,
        suggestion: element.recommendation
      });
    });

    // Score based on responsive layout usage
    const totalElements = domData.elements.length;
    const flexElements = responsiveness.flexElements.length;
    const gridElements = responsiveness.gridElements.length;
    
    const responsiveScore = ((flexElements + gridElements) / totalElements) * result.maxScore;
    result.score = Math.min(result.maxScore, responsiveScore);

    return result;
  }
}

// Accessibility rule
class AccessibilityRule extends BaseRule {
  constructor() {
    super('Accessibility Rule', 2);
  }

  async evaluate(domData, cssData) {
    const result = {
      score: 0,
      maxScore: 20,
      issues: [],
      recommendations: []
    };

    // Check for images without alt text
    domData.structure.images.forEach((image, index) => {
      if (!image.alt || image.alt.trim() === '') {
        result.issues.push({
          type: 'missing_alt_text',
          severity: 'high',
          message: 'Image missing alt text',
          suggestion: 'Add descriptive alt text to images for screen readers'
        });
      }
    });

    // Check heading hierarchy
    const headings = domData.structure.headings;
    if (headings.length > 0) {
      const hierarchyIssues = this.checkHeadingHierarchy(headings);
      result.issues.push(...hierarchyIssues);
    }

    // Calculate score
    result.score = Math.max(0, result.maxScore - (result.issues.length * 3));

    return result;
  }

  checkHeadingHierarchy(headings) {
    const issues = [];
    
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      if (current.level > previous.level + 1) {
        issues.push({
          type: 'heading_hierarchy',
          severity: 'medium',
          message: `Heading level jumps from h${previous.level} to h${current.level}`,
          suggestion: 'Use sequential heading levels for proper document outline'
        });
      }
    }

    return issues;
  }
}

// Performance rule
class PerformanceRule extends BaseRule {
  constructor() {
    super('Performance Rule', 1);
  }

  async evaluate(domData, cssData) {
    const result = {
      score: 0,
      maxScore: 10,
      issues: [],
      recommendations: []
    };

    // Check for excessive DOM elements
    if (domData.totalElements > 1000) {
      result.issues.push({
        type: 'excessive_dom',
        severity: 'medium',
        message: `Page has ${domData.totalElements} DOM elements. Consider simplifying.`,
        suggestion: 'Reduce DOM complexity for better performance'
      });
    }

    // Check for overlapping elements (potential layout issues)
    const overlaps = cssData.positioning.overlaps;
    if (overlaps.length > 0) {
      result.issues.push({
        type: 'overlapping_elements',
        severity: 'high',
        message: `Found ${overlaps.length} overlapping elements`,
        suggestion: 'Fix overlapping elements to prevent layout issues'
      });
    }

    // Calculate score
    result.score = Math.max(0, result.maxScore - (result.issues.length * 2));

    return result;
  }
} 