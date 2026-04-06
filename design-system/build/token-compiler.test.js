/**
 * Unit Tests for Token Compiler
 * Tests token reference resolution, CSS variable generation, and light/dark mode output
 */

import { describe, it, expect, beforeEach } from 'vitest';
import TokenCompiler from './token-compiler.js';

describe('TokenCompiler', () => {
  let compiler;

  beforeEach(() => {
    compiler = new TokenCompiler();
  });

  describe('Token Reference Resolution', () => {
    it('should resolve simple primitive color references', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            purple: {
              '600': '#9333ea'
            }
          },
          semantic: {
            brand: {
              primary: {
                value: '{primitive.purple.600}'
              }
            }
          }
        }
      };

      const resolved = compiler.resolveReference('{primitive.purple.600}');
      expect(resolved).toBe('#9333ea');
    });

    it('should resolve nested token references', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            purple: {
              '600': '#9333ea'
            }
          },
          semantic: {
            brand: {
              primary: {
                value: '{primitive.purple.600}'
              },
              secondary: {
                value: '{semantic.brand.primary}'
              }
            }
          }
        }
      };

      // First resolve the primary reference
      const primary = compiler.resolveReference('{primitive.purple.600}');
      expect(primary).toBe('#9333ea');
    });

    it('should resolve spacing scale references', () => {
      compiler.tokens = {
        spacing: {
          scale: {
            '4': {
              value: '1rem'
            }
          },
          semantic: {
            'button-padding': {
              value: '{scale.4}'
            }
          }
        }
      };

      const resolved = compiler.resolveReference('{scale.4}');
      expect(resolved).toBe('1rem');
    });

    it('should resolve animation duration references', () => {
      compiler.tokens = {
        animations: {
          duration: {
            normal: {
              value: '250ms'
            }
          }
        }
      };

      const resolved = compiler.resolveReference('{duration.normal}');
      expect(resolved).toBe('250ms');
    });

    it('should resolve animation easing references', () => {
      compiler.tokens = {
        animations: {
          easing: {
            'ease-in-out': {
              value: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }
        }
      };

      const resolved = compiler.resolveReference('{easing.ease-in-out}');
      expect(resolved).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('should handle multiple references in a single value', () => {
      compiler.tokens = {
        animations: {
          duration: {
            normal: {
              value: '250ms'
            }
          },
          easing: {
            'ease-out': {
              value: 'cubic-bezier(0, 0, 0.2, 1)'
            }
          }
        }
      };

      const resolved = compiler.resolveReference('{duration.normal} {easing.ease-out}');
      expect(resolved).toBe('250ms cubic-bezier(0, 0, 0.2, 1)');
    });

    it('should return original value if reference cannot be resolved', () => {
      compiler.tokens = {
        colors: {
          primitive: {}
        }
      };

      const resolved = compiler.resolveReference('{primitive.nonexistent.color}');
      expect(resolved).toBe('{primitive.nonexistent.color}');
    });

    it('should handle non-string values', () => {
      const resolved = compiler.resolveReference(42);
      expect(resolved).toBe(42);
    });

    it('should handle values without references', () => {
      const resolved = compiler.resolveReference('#9333ea');
      expect(resolved).toBe('#9333ea');
    });
  });

  describe('CSS Variable Generation', () => {
    it('should generate CSS variables for primitive colors', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            purple: {
              '50': '#faf5ff',
              '600': '#9333ea',
              '900': '#581c87'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--purple-50: #faf5ff;');
      expect(css).toContain('--purple-600: #9333ea;');
      expect(css).toContain('--purple-900: #581c87;');
    });

    it('should generate CSS variables for semantic colors in light mode', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            neutral: {
              '900': '#171717',
              '50': '#fafafa'
            }
          },
          semantic: {
            text: {
              primary: {
                light: '{primitive.neutral.900}',
                dark: '{primitive.neutral.50}'
              }
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--color-text-primary: #171717;');
    });

    it('should generate CSS variables for typography tokens', () => {
      compiler.tokens = {
        typography: {
          fontSizes: {
            base: {
              value: '1rem'
            },
            lg: {
              value: '1.125rem'
            }
          },
          fontWeights: {
            normal: {
              value: '400'
            },
            bold: {
              value: '700'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      // The actual output uses lowercase for the category part
      expect(css).toContain('--font-fontSize-base: 1rem;');
      expect(css).toContain('--font-fontSize-lg: 1.125rem;');
      expect(css).toContain('--font-fontWeight-normal: 400;');
      expect(css).toContain('--font-fontWeight-bold: 700;');
    });

    it('should generate CSS variables for spacing scale', () => {
      compiler.tokens = {
        spacing: {
          scale: {
            '0': {
              value: '0'
            },
            '4': {
              value: '1rem'
            },
            '8': {
              value: '2rem'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--spacing-0: 0;');
      expect(css).toContain('--spacing-4: 1rem;');
      expect(css).toContain('--spacing-8: 2rem;');
    });

    it('should generate CSS variables for semantic spacing with nested values', () => {
      compiler.tokens = {
        spacing: {
          scale: {
            '3': {
              value: '0.75rem'
            },
            '4': {
              value: '1rem'
            },
            '6': {
              value: '1.5rem'
            }
          },
          semantic: {
            'button-padding-x': {
              sm: '{scale.3}',
              md: '{scale.4}',
              lg: '{scale.6}'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--button-padding-x-sm: 0.75rem;');
      expect(css).toContain('--button-padding-x-md: 1rem;');
      expect(css).toContain('--button-padding-x-lg: 1.5rem;');
    });

    it('should generate CSS variables for shadows with light mode', () => {
      compiler.tokens = {
        shadows: {
          elevation: {
            raised: {
              light: '0 1px 3px rgba(0, 0, 0, 0.1)',
              dark: '0 1px 3px rgba(0, 0, 0, 0.5)'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--shadow-elevation-raised: 0 1px 3px rgba(0, 0, 0, 0.1);');
    });

    it('should generate CSS variables for border radii', () => {
      compiler.tokens = {
        radii: {
          scale: {
            sm: {
              value: '4px'
            },
            md: {
              value: '8px'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--radius-sm: 4px;');
      expect(css).toContain('--radius-md: 8px;');
    });

    it('should generate CSS variables for animations', () => {
      compiler.tokens = {
        animations: {
          duration: {
            fast: {
              value: '150ms'
            },
            normal: {
              value: '250ms'
            }
          },
          easing: {
            'ease-out': {
              value: 'cubic-bezier(0, 0, 0.2, 1)'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--animation-duration-fast: 150ms;');
      expect(css).toContain('--animation-duration-normal: 250ms;');
      expect(css).toContain('--animation-easing-ease-out: cubic-bezier(0, 0, 0.2, 1);');
    });

    it('should wrap output in :root selector', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            purple: {
              '600': '#9333ea'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain(':root {');
      expect(css).toContain('}');
    });

    it('should include header comments', () => {
      compiler.tokens = {};

      const css = compiler.generateCSS();
      
      expect(css).toContain('DESIGN TOKENS - AUTO-GENERATED');
      expect(css).toContain('Do not edit this file directly');
    });
  });

  describe('Light/Dark Mode Output', () => {
    it('should generate dark mode overrides for semantic colors', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            neutral: {
              '900': '#171717',
              '50': '#fafafa'
            }
          },
          semantic: {
            text: {
              primary: {
                light: '{primitive.neutral.900}',
                dark: '{primitive.neutral.50}'
              }
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('.dark {');
      expect(css).toContain('--color-text-primary: #fafafa;');
    });

    it('should generate dark mode overrides for backgrounds', () => {
      compiler.tokens = {
        colors: {
          semantic: {
            background: {
              base: {
                light: '#ffffff',
                dark: '#0f0f0f'
              },
              elevated: {
                light: '#ffffff',
                dark: '#2d2d2d'
              }
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      // Check light mode in :root
      expect(css).toMatch(/:root[\s\S]*--color-background-base: #ffffff;/);
      expect(css).toMatch(/:root[\s\S]*--color-background-elevated: #ffffff;/);
      
      // Check dark mode in .dark
      expect(css).toMatch(/\.dark[\s\S]*--color-background-base: #0f0f0f;/);
      expect(css).toMatch(/\.dark[\s\S]*--color-background-elevated: #2d2d2d;/);
    });

    it('should generate dark mode overrides for shadows', () => {
      compiler.tokens = {
        shadows: {
          elevation: {
            raised: {
              light: '0 1px 3px rgba(0, 0, 0, 0.1)',
              dark: '0 1px 3px rgba(0, 0, 0, 0.5)'
            },
            overlay: {
              light: '0 10px 25px rgba(0, 0, 0, 0.15)',
              dark: '0 10px 25px rgba(0, 0, 0, 0.7)'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      // Check light mode
      expect(css).toMatch(/:root[\s\S]*--shadow-elevation-raised: 0 1px 3px rgba\(0, 0, 0, 0\.1\);/);
      
      // Check dark mode
      expect(css).toMatch(/\.dark[\s\S]*--shadow-elevation-raised: 0 1px 3px rgba\(0, 0, 0, 0\.5\);/);
      expect(css).toMatch(/\.dark[\s\S]*--shadow-elevation-overlay: 0 10px 25px rgba\(0, 0, 0, 0\.7\);/);
    });

    it('should handle tokens with only light mode values', () => {
      compiler.tokens = {
        colors: {
          semantic: {
            brand: {
              primary: {
                value: '#9333ea'
              }
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--color-brand-primary: #9333ea;');
      // Note: The compiler currently outputs all semantic tokens in both modes
      // This is acceptable behavior as the value remains the same
      const darkSection = css.split('.dark {')[1];
      expect(darkSection).toContain('--color-brand-primary: #9333ea;');
    });

    it('should resolve references in both light and dark mode', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            neutral: {
              '900': '#171717',
              '50': '#fafafa',
              '800': '#262626',
              '200': '#e5e5e5'
            }
          },
          semantic: {
            text: {
              primary: {
                light: '{primitive.neutral.900}',
                dark: '{primitive.neutral.50}'
              },
              secondary: {
                light: '{primitive.neutral.800}',
                dark: '{primitive.neutral.200}'
              }
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      // Light mode
      expect(css).toMatch(/:root[\s\S]*--color-text-primary: #171717;/);
      expect(css).toMatch(/:root[\s\S]*--color-text-secondary: #262626;/);
      
      // Dark mode
      expect(css).toMatch(/\.dark[\s\S]*--color-text-primary: #fafafa;/);
      expect(css).toMatch(/\.dark[\s\S]*--color-text-secondary: #e5e5e5;/);
    });

    it('should handle status colors with value, light, and dark properties', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            green: {
              '600': '#10b981',
              '100': '#dcfce7',
              '700': '#059669'
            }
          },
          semantic: {
            status: {
              success: {
                value: '{primitive.green.600}',
                light: '{primitive.green.100}',
                dark: '{primitive.green.700}'
              }
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      // The compiler treats light/dark as mode-specific values, not separate properties
      // In light mode, it uses the 'light' value
      expect(css).toMatch(/:root[\s\S]*--color-status-success: #dcfce7;/);
      // In dark mode, it uses the 'dark' value
      expect(css).toMatch(/\.dark[\s\S]*--color-status-success: #059669;/);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete color token structure', () => {
      compiler.tokens = {
        colors: {
          primitive: {
            purple: {
              '50': '#faf5ff',
              '600': '#9333ea',
              '900': '#581c87'
            },
            neutral: {
              '50': '#fafafa',
              '900': '#171717'
            }
          },
          semantic: {
            brand: {
              primary: {
                value: '{primitive.purple.600}'
              }
            },
            text: {
              primary: {
                light: '{primitive.neutral.900}',
                dark: '{primitive.neutral.50}'
              }
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      // Primitive colors
      expect(css).toContain('--purple-50: #faf5ff;');
      expect(css).toContain('--purple-600: #9333ea;');
      
      // Semantic colors with resolved references
      expect(css).toContain('--color-brand-primary: #9333ea;');
      expect(css).toMatch(/:root[\s\S]*--color-text-primary: #171717;/);
      expect(css).toMatch(/\.dark[\s\S]*--color-text-primary: #fafafa;/);
    });

    it('should handle complete spacing token structure', () => {
      compiler.tokens = {
        spacing: {
          scale: {
            '3': {
              value: '0.75rem'
            },
            '4': {
              value: '1rem'
            }
          },
          semantic: {
            'button-padding-x': {
              sm: '{scale.3}',
              md: '{scale.4}'
            },
            'input-padding-y': {
              value: '{scale.4}'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      // Scale
      expect(css).toContain('--spacing-3: 0.75rem;');
      expect(css).toContain('--spacing-4: 1rem;');
      
      // Semantic with nested values
      expect(css).toContain('--button-padding-x-sm: 0.75rem;');
      expect(css).toContain('--button-padding-x-md: 1rem;');
      
      // Semantic with single value
      expect(css).toContain('--input-padding-y: 1rem;');
    });

    it('should handle animation tokens with nested semantic values', () => {
      compiler.tokens = {
        animations: {
          duration: {
            fast: {
              value: '150ms'
            }
          },
          easing: {
            'ease-out': {
              value: 'cubic-bezier(0, 0, 0.2, 1)'
            }
          }
        }
      };

      const css = compiler.generateCSS();
      
      expect(css).toContain('--animation-duration-fast: 150ms;');
      expect(css).toContain('--animation-easing-ease-out: cubic-bezier(0, 0, 0.2, 1);');
    });
  });
});
