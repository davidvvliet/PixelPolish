import { parse } from 'css-tree';

export class CSSExtractor {
  constructor() {
    this.layoutProperties = new Set([
      'display', 'position', 'top', 'left', 'right', 'bottom',
      'margin', 'padding', 'width', 'height', 'min-width', 'max-width',
      'min-height', 'max-height', 'flex', 'flex-direction', 'flex-wrap',
      'justify-content', 'align-items', 'align-content', 'grid',
      'grid-template-columns', 'grid-template-rows', 'grid-gap',
      'float', 'clear', 'overflow', 'z-index'
    ]);
  }

  async extract(domData) {
    const cssAnalysis = {
      layoutStyles: this.extractLayoutStyles(domData.elements),
      spacing: this.analyzeSpacing(domData.elements),
      typography: this.analyzeTypography(domData.elements),
      colors: this.analyzeColors(domData.elements),
      positioning: this.analyzePositioning(domData.elements),
      responsiveness: this.analyzeResponsiveness(domData.elements)
    };

    return cssAnalysis;
  }

  extractLayoutStyles(elements) {
    const layoutStyles = [];

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      const layoutStyle = {
        elementIndex: index,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        layout: {}
      };

      // Extract layout-related properties
      for (const [property, value] of Object.entries(styles)) {
        if (this.layoutProperties.has(property)) {
          layoutStyle.layout[property] = value;
        }
      }

      // Calculate derived properties
      layoutStyle.isFlexContainer = styles.display?.includes('flex');
      layoutStyle.isGridContainer = styles.display?.includes('grid');
      layoutStyle.isPositioned = ['absolute', 'relative', 'fixed', 'sticky'].includes(styles.position);
      layoutStyle.hasFloat = styles.float !== 'none';

      layoutStyles.push(layoutStyle);
    });

    return layoutStyles;
  }

  analyzeSpacing(elements) {
    const spacingAnalysis = {
      marginPatterns: new Map(),
      paddingPatterns: new Map(),
      inconsistencies: [],
      recommendations: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      
      // Parse margin values
      const margin = this.parseSpacingValue(styles.margin);
      const padding = this.parseSpacingValue(styles.padding);

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

  analyzeTypography(elements) {
    const typographyAnalysis = {
      fontSizes: new Map(),
      fontFamilies: new Map(),
      colors: new Map(),
      inconsistencies: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      
      if (element.textContent) {
        // Track font patterns
        const fontSize = styles.fontSize;
        const fontFamily = styles.fontFamily;
        const color = styles.color;

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

  analyzeColors(elements) {
    const colorAnalysis = {
      backgroundColor: new Map(),
      textColors: new Map(),
      borderColors: new Map(),
      colorScheme: [],
      contrastIssues: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      
      // Extract colors
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      const borderColor = this.extractBorderColor(styles.border);

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

  analyzePositioning(elements) {
    const positioningAnalysis = {
      positionTypes: new Map(),
      zIndexLayers: new Map(),
      overlaps: [],
      misalignments: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      const rect = element.boundingRect;
      
      // Track positioning types
      const position = styles.position;
      positioningAnalysis.positionTypes.set(position, 
        (positioningAnalysis.positionTypes.get(position) || 0) + 1
      );

      // Track z-index usage
      if (styles.zIndex !== 'auto') {
        positioningAnalysis.zIndexLayers.set(styles.zIndex, 
          (positioningAnalysis.zIndexLayers.get(styles.zIndex) || 0) + 1
        );
      }

      // Check for potential overlaps with other elements
      elements.slice(index + 1).forEach((otherElement, otherIndex) => {
        if (this.doElementsOverlap(rect, otherElement.boundingRect)) {
          positioningAnalysis.overlaps.push({
            element1: index,
            element2: index + otherIndex + 1,
            type: 'overlap'
          });
        }
      });
    });

    return positioningAnalysis;
  }

  analyzeResponsiveness(elements) {
    const responsivenessAnalysis = {
      flexElements: [],
      gridElements: [],
      fixedWidthElements: [],
      recommendations: []
    };

    elements.forEach((element, index) => {
      const styles = element.computedStyles;
      
      if (styles.display?.includes('flex')) {
        responsivenessAnalysis.flexElements.push({
          elementIndex: index,
          flexDirection: styles.flexDirection,
          justifyContent: styles.justifyContent,
          alignItems: styles.alignItems
        });
      }

      if (styles.display?.includes('grid')) {
        responsivenessAnalysis.gridElements.push({
          elementIndex: index,
          gridTemplateColumns: styles.gridTemplateColumns,
          gridTemplateRows: styles.gridTemplateRows
        });
      }

      // Check for fixed width elements that might not be responsive
      if (styles.width && styles.width.includes('px') && !styles.maxWidth) {
        responsivenessAnalysis.fixedWidthElements.push({
          elementIndex: index,
          width: styles.width,
          recommendation: 'Consider using relative units or max-width'
        });
      }
    });

    return responsivenessAnalysis;
  }

  parseSpacingValue(spacingString) {
    // Parse margin/padding shorthand values
    if (!spacingString || spacingString === '0px') {
      return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
    }

    const values = spacingString.split(' ').filter(v => v);
    
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

  getSpacingKey(spacing) {
    return `${spacing.top}-${spacing.right}-${spacing.bottom}-${spacing.left}`;
  }

  hasInconsistentSpacing(spacing) {
    const values = Object.values(spacing);
    const uniqueValues = new Set(values);
    return uniqueValues.size > 2; // Allow for vertical/horizontal symmetry
  }

  extractBorderColor(borderString) {
    if (!borderString || borderString === 'none') return null;
    
    // Simple extraction - in a real implementation, you'd want more robust parsing
    const colorMatch = borderString.match(/rgb\([^)]+\)|rgba\([^)]+\)|#[0-9a-fA-F]{3,6}|\b\w+\b/);
    return colorMatch ? colorMatch[0] : null;
  }

  doElementsOverlap(rect1, rect2) {
    return !(rect1.right <= rect2.left || 
             rect2.right <= rect1.left || 
             rect1.bottom <= rect2.top || 
             rect2.bottom <= rect1.top);
  }
} 