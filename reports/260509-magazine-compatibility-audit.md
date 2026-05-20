# 260509 Magazine Compatibility Audit

## Summary

1. total magazine-track files audited: 2662
2. files using transitional bridge components: 4
3. files using components outside the current magazine surface: 51

## Transitional Bridge Usage

1. `AttachmentTest`: 2 files
2. `TypingSpeedTest`: 1 files
3. `StoneSimulator`: 1 files

## Highest-Priority Files

1. `src/content/blog/en/image-tools-creative-suite.mdx` | category=`Technology` | bridge=`none` | outside=`GrayscaleConverter, ImageCropper, ImageDegrader, ImagePixelator, ImageProcessor, MetadataViewer, PaletteExtractor`
2. `src/content/blog/en/education-finance-ch12.mdx` | category=`Education` | bridge=`none` | outside=`CAPMCalculator, WACCCalculator`
3. `src/content/blog/en/education-game-theory-ch2.mdx` | category=`Education` | bridge=`none` | outside=`LectureProcess, LectureTable`
4. `src/content/blog/en/education-game-theory-ch3.mdx` | category=`Education` | bridge=`none` | outside=`LectureProcess, LectureTable`
5. `src/content/blog/en/magazine-education-portfolio-lab.mdx` | category=`Magazine` | bridge=`none` | outside=`BondPricer, PortfolioVisualizer`
6. `src/content/blog/en/age-calculator-korean-standards.mdx` | category=`Life` | bridge=`none` | outside=`AgeCalculator`
7. `src/content/blog/en/ascii-art-generator-creative-tool.mdx` | category=`Tools` | bridge=`none` | outside=`AsciiArtGenerator`
8. `src/content/blog/en/base64-converter-encoding-guide.mdx` | category=`Tools` | bridge=`none` | outside=`Base64Converter`
9. `src/content/blog/en/blackjack-probability-decision.mdx` | category=`Games` | bridge=`none` | outside=`Blackjack`
10. `src/content/blog/en/bmi-body-fat-health-guide.mdx` | category=`Health` | bridge=`none` | outside=`BmiCalculator`
11. `src/content/blog/en/caffeine-half-life-sleep.mdx` | category=`Health` | bridge=`none` | outside=`CaffeineCalculator`
12. `src/content/blog/en/caffeine-sensitivity-guide.mdx` | category=`Health` | bridge=`none` | outside=`CaffeineCalculator`
13. `src/content/blog/en/career-growth-snake-game.mdx` | category=`Productivity` | bridge=`none` | outside=`SnakeGame`
14. `src/content/blog/en/checkers-maneuver-strategy.mdx` | category=`Games` | bridge=`none` | outside=`Checkers`
15. `src/content/blog/en/chess-strategy-depth-thinking.mdx` | category=`Games` | bridge=`none` | outside=`ChessBoard`
16. `src/content/blog/en/child-growth-height-guide.mdx` | category=`Health` | bridge=`none` | outside=`ChildHeightCalculator`
17. `src/content/blog/en/child-height-prediction-factors.mdx` | category=`Health` | bridge=`none` | outside=`HeightPredictor`
18. `src/content/blog/en/chimp-test-cognitive-memory.mdx` | category=`Science` | bridge=`none` | outside=`ChimpTest`
19. `src/content/blog/en/developer-unit-converter-guide.mdx` | category=`Technology` | bridge=`none` | outside=`DeveloperUnitConverter`
20. `src/content/blog/en/dividend-investment-guide.mdx` | category=`Investment` | bridge=`none` | outside=`DividendCalculator`
21. `src/content/blog/en/dog-vision-simulator-science.mdx` | category=`Science` | bridge=`none` | outside=`DogVisionSimulator`
22. `src/content/blog/en/dominoes-connectivity-strategy.mdx` | category=`Games` | bridge=`none` | outside=`Dominoes`
23. `src/content/blog/en/education-finance-ch13.mdx` | category=`Education` | bridge=`none` | outside=`BondPricer`
24. `src/content/blog/en/education-finance-ch14.mdx` | category=`Education` | bridge=`none` | outside=`PortfolioVisualizer`
25. `src/content/blog/en/freecell-resource-allocation.mdx` | category=`Strategy` | bridge=`none` | outside=`FreeCell`

## Output Files

1. [data/catalog/magazine-compatibility-audit.csv](/Users/seuncho/coding/blog-oiyo/data/catalog/magazine-compatibility-audit.csv)
2. [reports/260509-magazine-compatibility-audit.md](/Users/seuncho/coding/blog-oiyo/reports/260509-magazine-compatibility-audit.md)

## Working Note

This audit uses explicit `track` when present and falls back to current category-based inference for legacy content. It is designed to support narrowing the `magazine` compatibility bridge over time.
