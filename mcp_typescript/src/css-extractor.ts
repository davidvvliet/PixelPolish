/**
 * CSS Extractor service for analyzing layout styles, spacing, typography, and colors
 */

import type { 
  CSSData, 
  LayoutStyle, 
  SpacingAnalysis, 
  TypographyAnalysis, 
  ColorAnalysis, 
  PositioningAnalysis,
  ResponsivenessAnalysis,
  DOMElement 
} from './types.js';

export class CSSExtractorService {
  private layoutProperties = new Set([
    'display', 'position', 'top', 'left', 'right', 'bottom',
    'margin', 'padding', 'width', 'height', 'min-width', 'max-width',
    'min-height', 'max-height', 'flex', 'flex-direction', 'flex-wrap',
    'justify-content', 'align-items', 'align-content', 'grid',
    'grid-template-columns', 'grid-template-rows', 'grid-gap',
    'float', 'clear', 'overflow', 'z-index'
  ]);

  /**
   * Extract comprehensive CSS analysis from DOM elements
   */
  async extract(elements: DOMElement[]): Promise<CSSData> {
    console.error('🎨 Analyzing CSS patterns and styles...');

    const cssAnalysis: CSSData = {
      layoutStyles: this.extractLayoutStyles(elements),
      spacing: this.analyzeSpacing(elements),
      typography: this.analyzeTypography(elements),
      colors: this.analyzeColors(elements),
      positioning: this.analyzePositioning(elements),
      responsiveness: this.analyzeResponsiveness(elements)
    };

    console.error('✅ CSS analysis complete');
    return cssAnalysis;
  }

  /**
   * Extract layout-related styles from elements
   */
  private extractLayoutStyles(elements: DOMElement[]): LayoutStyle[] {
    const layoutStyles: LayoutStyle[] = [];

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      const layoutStyle: LayoutStyle = {
        elementIndex: index,
        tagName: element.tagName,
        id: element.id || undefined,
        className: element.className || undefined,
        layout: {},
        isFlexContainer: false,
        isGridContainer: false,
        isPositioned: false,
        hasFloat: false
      };

      // Extract layout-related properties
      for (const [property, value] of Object.entries(styles)) {
        if (this.layoutProperties.has(property)) {
          layoutStyle.layout[property] = value;
        }
      }

      // Calculate derived properties
      layoutStyle.isFlexContainer = styles.display?.includes('flex') || false;
      layoutStyle.isGridContainer = styles.display?.includes('grid') || false;
      layoutStyle.isPositioned = ['absolute', 'relative', 'fixed', 'sticky'].includes(styles.position || '');
      layoutStyle.hasFloat = styles.float !== 'none';

      layoutStyles.push(layoutStyle);
    });

    return layoutStyles;
  }

  /**
   * Analyze spacing patterns and inconsistencies
   */
  private analyzeSpacing(elements: DOMElement[]): SpacingAnalysis {
    const spacingAnalysis: SpacingAnalysis = {
      marginPatterns: new Map(),
      paddingPatterns: new Map(),
      inconsistencies: [],
      recommendations: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      
      // Parse margin values
      const margin = this.parseSpacingValue(styles.margin || '0px');
      const padding = this.parseSpacingValue(styles.padding || '0px');

      // Track patterns
      const marginKey = this.getSpacingKey(margin);
      const paddingKey = this.getSpacingKey(padding);

      spacingAnalysis.marginPatterns.set(marginKey, 
        (spacingAnalysis.marginPatterns.get(marginKey) || 0) + 1
      );
      spacingAnalysis.paddingPatterns.set(paddingKey, 
        (spacingAnalysis.paddingPatterns.get(paddingKey) || 0) + 1
      );

      // Check for inconsistencies
      if (this.hasInconsistentSpacing(margin)) {
        spacingAnalysis.inconsistencies.push({
          elementIndex: index,
          type: 'margin',
          issue: 'Inconsistent margin values',
          values: margin
        });
      }

      if (this.hasInconsistentSpacing(padding)) {
        spacingAnalysis.inconsistencies.push({
          elementIndex: index,
          type: 'padding',
          issue: 'Inconsistent padding values',
          values: padding
        });
      }
    });

    return spacingAnalysis;
  }

  /**
   * Analyze typography patterns and consistency
   */
  private analyzeTypography(elements: DOMElement[]): TypographyAnalysis {
    const typographyAnalysis: TypographyAnalysis = {
      fontSizes: new Map(),
      fontFamilies: new Map(),
      colors: new Map(),
      inconsistencies: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      
      if (element.textContent) {
        // Track font patterns
        const fontSize = styles.fontSize || '16px';
        const fontFamily = styles.fontFamily || 'inherit';
        const color = styles.color || 'black';

        typographyAnalysis.fontSizes.set(fontSize, 
          (typographyAnalysis.fontSizes.get(fontSize) || 0) + 1
        );
        typographyAnalysis.fontFamilies.set(fontFamily, 
          (typographyAnalysis.fontFamilies.get(fontFamily) || 0) + 1
        );
        typographyAnalysis.colors.set(color, 
          (typographyAnalysis.colors.get(color) || 0) + 1
        );
      }
    });

    return typographyAnalysis;
  }

  /**
   * Analyze color usage and patterns
   */
  private analyzeColors(elements: DOMElement[]): ColorAnalysis {
    const colorAnalysis: ColorAnalysis = {
      backgroundColor: new Map(),
      textColors: new Map(),
      borderColors: new Map(),
      colorScheme: [],
      contrastIssues: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      
      // Extract colors
      const bgColor = styles.backgroundColor || 'transparent';
      const textColor = styles.color || 'black';
      const borderColor = this.extractBorderColor(styles.border || 'none');

      if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        colorAnalysis.backgroundColor.set(bgColor, 
          (colorAnalysis.backgroundColor.get(bgColor) || 0) + 1
        );
      }

      if (textColor) {
        colorAnalysis.textColors.set(textColor, 
          (colorAnalysis.textColors.get(textColor) || 0) + 1
        );
      }

      if (borderColor) {
        colorAnalysis.borderColors.set(borderColor, 
          (colorAnalysis.borderColors.get(borderColor) || 0) + 1
        );
      }
    });

    return colorAnalysis;
  }

  /**
   * Analyze positioning and layout relationships
   */
  private analyzePositioning(elements: DOMElement[]): PositioningAnalysis {
    const positioningAnalysis: PositioningAnalysis = {
      positionTypes: new Map(),
      zIndexLayers: new Map(),
      overlaps: [],
      misalignments: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      const rect = element.boundingRect;
      
      // Track positioning types
      const position = styles.position || 'static';
      positioningAnalysis.positionTypes.set(position, 
        (positioningAnalysis.positionTypes.get(position) || 0) + 1
      );

      // Track z-index usage
      if (styles.zIndex !== 'auto') {
        positioningAnalysis.zIndexLayers.set(styles.zIndex || '0', 
          (positioningAnalysis.zIndexLayers.get(styles.zIndex || '0') || 0) + 1
        );
      }
    });

    return positioningAnalysis;
  }

  /**
   * Analyze responsive design patterns
   */
  private analyzeResponsiveness(elements: DOMElement[]): ResponsivenessAnalysis {
    const responsivenessAnalysis: ResponsivenessAnalysis = {
      hasMediaQueries: false, // Would need CSS parsing to detect
      breakpoints: [],
      flexboxUsage: 0,
      gridUsage: 0,
      issues: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      
      // Count modern layout usage
      if (styles.display?.includes('flex')) {
        responsivenessAnalysis.flexboxUsage++;
      }
      if (styles.display?.includes('grid')) {
        responsivenessAnalysis.gridUsage++;
      }
    });

    return responsivenessAnalysis;
  }

  /**
   * Parse spacing value (margin/padding) into structured format
   */
  private parseSpacingValue(spacingString: string): { top: string; right: string; bottom: string; left: string } {
    const values = spacingString.split(' ').filter(v => v.length > 0);
    
    switch (values.length) {
      case 1:
        return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
      case 2:
        return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
      case 3:
        return { top: values[0], right: values[1], bottom: values[2], left: values[1] };
      case 4:
        return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
      default:
        return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
    }
  }

  /**
   * Generate a key for spacing pattern tracking
   */
  private getSpacingKey(spacing: { top: string; right: string; bottom: string; left: string }): string {
    return `${spacing.top}-${spacing.right}-${spacing.bottom}-${spacing.left}`;
  }

  /**
   * Check if spacing values are inconsistent
   */
  private hasInconsistentSpacing(spacing: { top: string; right: string; bottom: string; left: string }): boolean {
    const values = [spacing.top, spacing.right, spacing.bottom, spacing.left];
    const uniqueValues = new Set(values);
    return uniqueValues.size > 2; // More than 2 different values suggests inconsistency
  }

  /**
   * Extract border color from border string
   */
  private extractBorderColor(borderString: string): string | null {
    if (!borderString || borderString === 'none') return null;
    
    // Simple extraction - in reality would need more sophisticated parsing
    const colorMatch = borderString.match(/(rgb\([^)]+\)|rgba\([^)]+\)|#[a-fA-F0-9]{3,6}|[a-z]+)/);
    return colorMatch ? colorMatch[1] : null;
  }
} 