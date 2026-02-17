// SPENDTRAK CINEMATIC EDITION - Charts
import React, { useEffect, memo, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Rect, G, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { easeOutQuad } from '../../config/easingFunctions';
import { Colors, FontFamily, FontSize, Spacing, getHealthScoreColor } from '../../design/cinematic';
import { GradientText, GradientLabel } from '../ui/GradientText';
import { useTranslation } from '../../context/LanguageContext';

// Re-export accessibility components
export {
  AccessibleChart,
  AccessibleDualSeriesChart,
  AccessibleGauge,
  AccessibleHeatmap,
} from './AccessibleChart';
export type {
  AccessibleChartProps,
  AccessibleDualSeriesChartProps,
  AccessibleGaugeProps,
  AccessibleHeatmapProps,
  DataPoint,
  DualSeriesDataPoint,
  HeatmapCell,
} from './AccessibleChart';

// ==========================================
// CHART COLOR HELPERS
// ==========================================

/**
 * Get a color from the chart palette by index
 * Cycles through the palette if index exceeds palette length
 */
export const getChartColor = (index: number, extended: boolean = false): string => {
  const palette = extended ? Colors.chart.extended : Colors.chart.palette;
  return palette[index % palette.length];
};

/**
 * Get category-specific color if available, otherwise use palette
 */
export const getCategoryColor = (category: string, fallbackIndex: number = 0): string => {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '');
  const categoryColors = Colors.categories as Record<string, string>;
  return categoryColors[normalizedCategory] || getChartColor(fallbackIndex);
};

// ==========================================
// DONUT CHART
// ==========================================

export interface DonutChartSegment {
  value: number;
  color: string;
  label: string;
}

export interface DonutChartProps {
  segments: DonutChartSegment[];
  size?: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
  style?: ViewStyle;
  /** If true, auto-assign colors from chart palette when segment color is not provided */
  autoColors?: boolean;
  /** Accessibility: Chart title for screen readers */
  accessibilityTitle?: string;
  /** Accessibility: Chart description for screen readers */
  accessibilityDescription?: string;
  /** Accessibility: Value formatter for screen reader announcements */
  formatValue?: (value: number) => string;
  /** Test ID for testing */
  testID?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const DonutChart: React.FC<DonutChartProps> = memo(({
  segments,
  size = 200,
  strokeWidth = 24,
  centerContent,
  style,
  autoColors = false,
  accessibilityTitle = 'Donut Chart',
  accessibilityDescription = 'Distribution chart',
  formatValue = (v: number) => v.toLocaleString(),
  testID,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let currentOffset = 0;

  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    if (segments.length === 0) {
      return `${accessibilityTitle}. ${accessibilityDescription}. No data available.`;
    }
    const highest = segments.reduce((max, s) => (s.value > max.value ? s : max), segments[0]);
    const segmentList = segments.map(s => `${s.label}: ${formatValue(s.value)}`).join(', ');
    return `${accessibilityTitle}. ${accessibilityDescription}. ${segments.length} segments. Total: ${formatValue(total)}. Largest: ${highest.label} at ${formatValue(highest.value)}. Breakdown: ${segmentList}`;
  }, [segments, total, accessibilityTitle, accessibilityDescription, formatValue]);

  return (
    <View
      style={[styles.donutContainer, { width: size, height: size }, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      accessibilityHint="Donut chart showing proportional distribution"
      testID={testID}
    >
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.darker}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Segments */}
        {segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0;
          const segmentLength = (circumference * percentage) / 100;
          const offset = currentOffset;
          currentOffset += segmentLength;
          // Use auto-assigned color from palette if autoColors is true and segment has no color
          const segmentColor = autoColors && !segment.color
            ? getChartColor(index)
            : segment.color || getChartColor(index);

          return (
            <DonutSegment
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              circumference={circumference}
              segmentLength={segmentLength}
              offset={offset}
              color={segmentColor}
              strokeWidth={strokeWidth}
            />
          );
        })}
      </Svg>

      {/* Center content */}
      <View style={styles.donutCenter}>
        {centerContent}
      </View>
    </View>
  );
});

DonutChart.displayName = 'DonutChart';

const DonutSegment: React.FC<{
  cx: number;
  cy: number;
  r: number;
  circumference: number;
  segmentLength: number;
  offset: number;
  color: string;
  strokeWidth: number;
}> = ({ cx, cy, r, circumference, segmentLength, offset, color, strokeWidth }) => {
  const animatedLength = useSharedValue(0);

  useEffect(() => {
    animatedLength.value = withTiming(segmentLength, { duration: 1000, easing: easeOutQuad });
  }, [segmentLength]);

  const circleProps = useAnimatedProps(() => ({
    strokeDasharray: `${animatedLength.value} ${circumference}`,
    strokeDashoffset: -offset,
  }));

  return (
    <AnimatedCircle
      animatedProps={circleProps}
      cx={cx}
      cy={cy}
      r={r}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      transform={`rotate(-90 ${cx} ${cy})`}
    />
  );
};

// ==========================================
// BAR CHART
// ==========================================

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  height?: number;
  barWidth?: number;
  barGap?: number;
  showLabels?: boolean;
  showValues?: boolean;
  style?: ViewStyle;
  /** If true, auto-assign colors from chart palette when bar color is not provided */
  autoColors?: boolean;
  /** Accessibility: Chart title for screen readers */
  accessibilityTitle?: string;
  /** Accessibility: Chart description for screen readers */
  accessibilityDescription?: string;
  /** Accessibility: Value formatter for screen reader announcements */
  formatValue?: (value: number) => string;
  /** Test ID for testing */
  testID?: string;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const BarChart: React.FC<BarChartProps> = memo(({
  data,
  height = 150,
  barWidth = 32,
  barGap = 16,
  showLabels = true,
  showValues = true,
  style,
  autoColors = false,
  accessibilityTitle = 'Bar Chart',
  accessibilityDescription = 'Comparison chart',
  formatValue = (v: number) => v.toLocaleString(),
  testID,
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartWidth = data.length * (barWidth + barGap) - barGap;
  const chartHeight = height - (showLabels ? 30 : 0) - (showValues ? 20 : 0);

  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    if (data.length === 0) {
      return `${accessibilityTitle}. ${accessibilityDescription}. No data available.`;
    }
    const highest = data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);
    const lowest = data.reduce((min, d) => (d.value < min.value ? d : min), data[0]);
    const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const barList = data.map(d => `${d.label}: ${formatValue(d.value)}`).join(', ');
    return `${accessibilityTitle}. ${accessibilityDescription}. ${data.length} bars. Highest: ${highest.label} at ${formatValue(highest.value)}. Lowest: ${lowest.label} at ${formatValue(lowest.value)}. Average: ${formatValue(avg)}. Values: ${barList}`;
  }, [data, accessibilityTitle, accessibilityDescription, formatValue]);

  return (
    <View
      style={[styles.barChartContainer, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      accessibilityHint="Bar chart comparing values"
      testID={testID}
    >
      {/* Values */}
      {showValues && (
        <View style={[styles.barValues, { width: chartWidth }]}>
          {data.map((item, index) => (
            <View key={index} style={[styles.barValueContainer, { width: barWidth, marginRight: index < data.length - 1 ? barGap : 0 }]}>
              <Text style={styles.barValue}>{item.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bars */}
      <View style={[styles.barChartContent, { height: chartHeight }]}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={Colors.neon} />
              <Stop offset="100%" stopColor={Colors.deep} />
            </LinearGradient>
          </Defs>

          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = index * (barWidth + barGap);
            const y = chartHeight - barHeight;
            // Use auto-assigned color from palette if autoColors is true and item has no color
            const barColor = autoColors && !item.color ? getChartColor(index) : item.color;

            return (
              <AnimatedBar
                key={index}
                x={x}
                targetY={y}
                width={barWidth}
                targetHeight={barHeight}
                chartHeight={chartHeight}
                color={barColor}
              />
            );
          })}
        </Svg>
      </View>

      {/* Labels */}
      {showLabels && (
        <View style={[styles.barLabels, { width: chartWidth }]}>
          {data.map((item, index) => (
            <View key={index} style={[styles.barLabelContainer, { width: barWidth, marginRight: index < data.length - 1 ? barGap : 0 }]}>
              <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

BarChart.displayName = 'BarChart';

const AnimatedBar: React.FC<{
  x: number;
  targetY: number;
  width: number;
  targetHeight: number;
  chartHeight: number;
  color?: string;
}> = ({ x, targetY, width, targetHeight, chartHeight, color }) => {
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = withTiming(targetHeight, { duration: 800, easing: easeOutQuad });
  }, [targetHeight]);

  const rectProps = useAnimatedProps(() => ({
    y: chartHeight - animatedHeight.value,
    height: animatedHeight.value,
  }));

  return (
    <AnimatedRect
      animatedProps={rectProps}
      x={x}
      width={width}
      rx={width / 4}
      fill={color || "url(#barGrad)"}
    />
  );
};

// ==========================================
// CHART LEGEND
// ==========================================

export interface LegendItem {
  color: string;
  label: string;
  value?: string;
}

export interface ChartLegendProps {
  items: LegendItem[];
  style?: ViewStyle;
  /** Accessibility: Legend title for screen readers */
  accessibilityTitle?: string;
  /** Test ID for testing */
  testID?: string;
}

export const ChartLegend: React.FC<ChartLegendProps> = memo(({
  items,
  style,
  accessibilityTitle = 'Chart Legend',
  testID,
}) => {
  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    if (items.length === 0) return `${accessibilityTitle}. No items.`;
    const itemList = items.map(item =>
      item.value ? `${item.label}: ${item.value}` : item.label
    ).join(', ');
    return `${accessibilityTitle}. ${items.length} items: ${itemList}`;
  }, [items, accessibilityTitle]);

  return (
    <View
      style={[styles.legend, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="list"
      testID={testID}
    >
      {items.map((item, index) => (
        <View
          key={index}
          style={styles.legendItem}
          accessible={true}
          accessibilityLabel={item.value ? `${item.label}: ${item.value}` : item.label}
          accessibilityRole="text"
        >
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendLabel}>{item.label}</Text>
          {item.value && <Text style={styles.legendValue}>{item.value}</Text>}
        </View>
      ))}
    </View>
  );
});

ChartLegend.displayName = 'ChartLegend';

// ==========================================
// LINE CHART
// ==========================================

export interface LineChartDataPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  secondaryData?: LineChartDataPoint[];
  height?: number;
  showDots?: boolean;
  showLabels?: boolean;
  style?: ViewStyle;
  /** Primary line color - defaults to semantic.expense (red) for spending trends */
  primaryColor?: string;
  /** Secondary line color - defaults to semantic.income (blue) for income comparison */
  secondaryColor?: string;
  /** Area fill color - defaults to primaryColor with opacity */
  areaColor?: string;
  /** Accessibility: Chart title for screen readers */
  accessibilityTitle?: string;
  /** Accessibility: Chart description for screen readers */
  accessibilityDescription?: string;
  /** Accessibility: Primary data series label */
  primaryLabel?: string;
  /** Accessibility: Secondary data series label */
  secondaryLabel?: string;
  /** Accessibility: Value formatter for screen reader announcements */
  formatValue?: (value: number) => string;
  /** Test ID for testing */
  testID?: string;
}

export const LineChart: React.FC<LineChartProps> = memo(({
  data,
  secondaryData,
  height = 200,
  showDots = true,
  showLabels = true,
  style,
  primaryColor = Colors.semantic.expense,  // Red for spending trends
  secondaryColor = Colors.semantic.income,  // Blue for income
  areaColor,
  accessibilityTitle = 'Line Chart',
  accessibilityDescription = 'Trend chart',
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
  formatValue = (v: number) => v.toLocaleString(),
  testID,
}) => {
  const { t } = useTranslation();
  // Effective colors
  const lineColor = primaryColor;
  const incomeColor = secondaryColor;
  const fillColor = areaColor || primaryColor;

  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    if (data.length === 0) {
      return `${accessibilityTitle}. ${accessibilityDescription}. No data available.`;
    }
    const highest = data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);
    const lowest = data.reduce((min, d) => (d.value < min.value ? d : min), data[0]);
    const trend = data.length >= 2 && data[data.length - 1].value >= data[0].value ? 'upward' : 'downward';

    let label = `${accessibilityTitle}. ${accessibilityDescription}. `;
    label += `${data.length} data points. `;
    label += `${primaryLabel}: Peak at ${highest.label} with ${formatValue(highest.value)}. `;
    label += `Low at ${lowest.label} with ${formatValue(lowest.value)}. `;
    label += `Overall ${trend} trend. `;

    if (secondaryData && secondaryData.length > 0) {
      const secHighest = secondaryData.reduce((max, d) => (d.value > max.value ? d : max), secondaryData[0]);
      label += `${secondaryLabel}: Peak at ${secHighest.label} with ${formatValue(secHighest.value)}.`;
    }

    return label;
  }, [data, secondaryData, accessibilityTitle, accessibilityDescription, primaryLabel, secondaryLabel, formatValue]);

  if (data.length === 0) {
    return (
      <View style={[{ height }, style]} accessible={true} accessibilityLabel={accessibilityLabel}>
        <Text style={lineChartStyles.emptyText}>{t('charts.noData')}</Text>
      </View>
    );
  }

  const maxValue = Math.max(
    ...data.map(d => d.value),
    ...(secondaryData?.map(d => d.value) || [0]),
    1
  );

  const padding = 20;
  const chartWidth = Math.max(data.length * 50, 200);
  const chartHeight = height - (showLabels ? 40 : 20);

  const getX = (index: number) => {
    return padding + (index / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);
  };

  const getY = (value: number) => {
    return chartHeight - padding - (value / maxValue) * (chartHeight - padding * 2);
  };

  const createPath = (points: LineChartDataPoint[]) => {
    if (points.length === 0) return '';

    let path = `M ${getX(0)} ${getY(points[0].value)}`;
    points.forEach((point, index) => {
      if (index > 0) {
        path += ` L ${getX(index)} ${getY(point.value)}`;
      }
    });
    return path;
  };

  const createAreaPath = (points: LineChartDataPoint[]) => {
    if (points.length === 0) return '';

    let path = `M ${getX(0)} ${chartHeight - padding}`;
    path += ` L ${getX(0)} ${getY(points[0].value)}`;
    points.forEach((point, index) => {
      if (index > 0) {
        path += ` L ${getX(index)} ${getY(point.value)}`;
      }
    });
    path += ` L ${getX(points.length - 1)} ${chartHeight - padding}`;
    path += ' Z';
    return path;
  };

  return (
    <View
      style={[lineChartStyles.container, { height }, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      accessibilityHint="Line chart showing trends over time"
      testID={testID}
    >
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={fillColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <Path
            key={ratio}
            d={`M ${padding} ${padding + (chartHeight - padding * 2) * ratio} L ${chartWidth - padding} ${padding + (chartHeight - padding * 2) * ratio}`}
            stroke={Colors.border.subtle}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fill */}
        <Path
          d={createAreaPath(data)}
          fill="url(#areaGradient)"
        />

        {/* Main line (spending - red by default) */}
        <Path
          d={createPath(data)}
          stroke={lineColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary line (income comparison - blue by default) */}
        {secondaryData && (
          <Path
            d={createPath(secondaryData)}
            stroke={incomeColor}
            strokeWidth={2}
            fill="none"
            strokeDasharray="5,5"
            strokeLinecap="round"
          />
        )}

        {/* Dots */}
        {showDots && data.map((point, index) => (
          <G key={index}>
            <Circle
              cx={getX(index)}
              cy={getY(point.value)}
              r={6}
              fill={Colors.void}
              stroke={lineColor}
              strokeWidth={2}
            />
            <Circle
              cx={getX(index)}
              cy={getY(point.value)}
              r={3}
              fill={lineColor}
            />
          </G>
        ))}
      </Svg>

      {/* X-axis labels */}
      {showLabels && (
        <View style={lineChartStyles.labels}>
          {data.map((point, index) => (
            <View
              key={index}
              style={[
                lineChartStyles.labelContainer,
                { left: getX(index) - 20 }
              ]}
            >
              <Text style={lineChartStyles.label}>{point.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

LineChart.displayName = 'LineChart';

const lineChartStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  labels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  labelContainer: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});

// ==========================================
// HEALTH SCORE GAUGE
// ==========================================

export interface HealthScoreGaugeProps {
  score: number; // 0-100
  grade: string;
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
  /** Accessibility: Gauge title for screen readers */
  accessibilityTitle?: string;
  /** Accessibility: Description of what the score represents */
  accessibilityDescription?: string;
  /** Test ID for testing */
  testID?: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = memo(({
  score,
  grade,
  size = 200,
  strokeWidth = 16,
  style,
  accessibilityTitle = 'Health Score',
  accessibilityDescription,
  testID,
}) => {
  const animatedScore = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // 270 degree arc (from -225 to 45 degrees)
  const startAngle = -225;
  const endAngle = 45;
  const angleRange = endAngle - startAngle; // 270 degrees

  useEffect(() => {
    animatedScore.value = withTiming(score, { duration: 1500, easing: easeOutQuad });
  }, [score]);

  // Get color based on score
  const getScoreColor = (s: number): string => {
    if (s >= 75) return Colors.semantic.income; // Green
    if (s >= 60) return '#FFFF00'; // Yellow
    if (s >= 40) return Colors.semantic.warning; // Orange
    return Colors.semantic.expense; // Red
  };

  const scoreColor = getScoreColor(score);

  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    let interpretation = '';
    if (score >= 75) interpretation = 'Excellent';
    else if (score >= 60) interpretation = 'Good';
    else if (score >= 40) interpretation = 'Needs improvement';
    else interpretation = 'Poor';

    const desc = accessibilityDescription || 'Financial health indicator';
    return `${accessibilityTitle}. ${desc}. Score: ${Math.round(score)} out of 100. Grade: ${grade}. ${interpretation} performance.`;
  }, [score, grade, accessibilityTitle, accessibilityDescription]);

  // Create arc path
  const createArcPath = (startDeg: number, endDeg: number) => {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = endDeg - startDeg > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const backgroundPath = createArcPath(startAngle, endAngle);

  // Animated path for filled portion
  const animatedProps = useAnimatedProps(() => {
    const currentAngle = startAngle + (animatedScore.value / 100) * angleRange;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (currentAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = currentAngle - startAngle > 180 ? 1 : 0;

    return {
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    };
  });

  return (
    <View
      style={[healthGaugeStyles.container, { width: size, height: size, overflow: 'hidden' }, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: score,
        text: `${grade}: ${Math.round(score)}%`,
      }}
      testID={testID}
    >
      <Svg width={size} height={size} style={{ overflow: 'hidden' }}>
        <Defs>
          <LinearGradient id="healthGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={Colors.semantic.expense} />
            <Stop offset="40%" stopColor={Colors.semantic.warning} />
            <Stop offset="60%" stopColor="#FFFF00" />
            <Stop offset="100%" stopColor={Colors.semantic.income} />
          </LinearGradient>
        </Defs>

        {/* Background arc */}
        <Path
          d={backgroundPath}
          stroke={Colors.darker}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Only render progress arcs when score > 0 */}
        {score > 0 && (
          <>
            {/* Glow effect - rendered before main arc so it appears behind */}
            <AnimatedPath
              animatedProps={animatedProps}
              stroke={scoreColor}
              strokeWidth={strokeWidth + 4}
              fill="none"
              strokeLinecap="round"
              opacity={0.15}
            />

            {/* Colored arc */}
            <AnimatedPath
              animatedProps={animatedProps}
              stroke={scoreColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
      </Svg>

      {/* Center content */}
      <View style={healthGaugeStyles.center}>
        <Text style={[healthGaugeStyles.score, { color: scoreColor }]}>{Math.round(score)}</Text>
        <Text style={[healthGaugeStyles.grade, { color: scoreColor }]}>{grade}</Text>
      </View>
    </View>
  );
});

HealthScoreGauge.displayName = 'HealthScoreGauge';

const healthGaugeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: FontFamily.bold,
    fontSize: 48,
    letterSpacing: -1,
  },
  grade: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
});

// ==========================================
// AREA CHART (Dual Series)
// ==========================================

export interface AreaChartDataPoint {
  label: string;
  income: number;
  expenses: number;
}

export interface AreaChartProps {
  data: AreaChartDataPoint[];
  height?: number;
  width?: number;
  style?: ViewStyle;
  showLabels?: boolean;
  /** Accessibility: Chart title for screen readers */
  accessibilityTitle?: string;
  /** Accessibility: Chart description for screen readers */
  accessibilityDescription?: string;
  /** Accessibility: Value formatter for screen reader announcements */
  formatValue?: (value: number) => string;
  /** Test ID for testing */
  testID?: string;
}

export const AreaChart: React.FC<AreaChartProps> = memo(({
  data,
  height = 200,
  width,
  style,
  showLabels = true,
  accessibilityTitle = 'Area Chart',
  accessibilityDescription = 'Income vs Expenses comparison',
  formatValue = (v: number) => v.toLocaleString(),
  testID,
}) => {
  const { t } = useTranslation();

  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    if (data.length === 0) {
      return `${accessibilityTitle}. ${accessibilityDescription}. No data available.`;
    }
    const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
    const net = totalIncome - totalExpenses;
    const incomeHighest = data.reduce((max, d) => (d.income > max.income ? d : max), data[0]);
    const expenseHighest = data.reduce((max, d) => (d.expenses > max.expenses ? d : max), data[0]);

    let label = `${accessibilityTitle}. ${accessibilityDescription}. `;
    label += `${data.length} periods shown. `;
    label += `Total income: ${formatValue(totalIncome)}, highest in ${incomeHighest.label}. `;
    label += `Total expenses: ${formatValue(totalExpenses)}, highest in ${expenseHighest.label}. `;
    label += `Net ${net >= 0 ? 'surplus' : 'deficit'}: ${formatValue(Math.abs(net))}.`;

    return label;
  }, [data, accessibilityTitle, accessibilityDescription, formatValue]);

  if (data.length === 0) {
    return (
      <View style={[{ height }, style]} accessible={true} accessibilityLabel={accessibilityLabel}>
        <Text style={areaChartStyles.emptyText}>{t('charts.noDataAvailable')}</Text>
      </View>
    );
  }

  const padding = 20;
  // Use provided width, or fall back to calculated width based on data points
  const chartWidth = width || Math.max(data.length * 50, 280);
  const chartHeight = height - (showLabels ? 30 : 10);

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expenses)),
    1
  );

  const getX = (index: number) => {
    return padding + (index / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);
  };

  const getY = (value: number) => {
    return chartHeight - padding - (value / maxValue) * (chartHeight - padding * 2);
  };

  const createAreaPath = (values: number[], fromBottom: boolean = true) => {
    if (values.length === 0) return '';

    let path = fromBottom ? `M ${getX(0)} ${chartHeight - padding}` : `M ${getX(0)} ${getY(values[0])}`;

    if (fromBottom) {
      path += ` L ${getX(0)} ${getY(values[0])}`;
    }

    // Create smooth curve using bezier
    for (let i = 0; i < values.length - 1; i++) {
      const x1 = getX(i);
      const y1 = getY(values[i]);
      const x2 = getX(i + 1);
      const y2 = getY(values[i + 1]);

      const cpx = (x1 + x2) / 2;
      path += ` C ${cpx} ${y1} ${cpx} ${y2} ${x2} ${y2}`;
    }

    if (fromBottom) {
      path += ` L ${getX(values.length - 1)} ${chartHeight - padding}`;
      path += ' Z';
    }

    return path;
  };

  const createLinePath = (values: number[]) => {
    if (values.length === 0) return '';

    let path = `M ${getX(0)} ${getY(values[0])}`;

    for (let i = 0; i < values.length - 1; i++) {
      const x1 = getX(i);
      const y1 = getY(values[i]);
      const x2 = getX(i + 1);
      const y2 = getY(values[i + 1]);

      const cpx = (x1 + x2) / 2;
      path += ` C ${cpx} ${y1} ${cpx} ${y2} ${x2} ${y2}`;
    }

    return path;
  };

  const incomeValues = data.map(d => d.income);
  const expenseValues = data.map(d => d.expenses);

  return (
    <View
      style={[areaChartStyles.container, { height }, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      accessibilityHint="Area chart comparing income and expenses over time"
      testID={testID}
    >
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.semantic.income} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={Colors.semantic.income} stopOpacity="0.05" />
          </LinearGradient>
          <LinearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.semantic.expense} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={Colors.semantic.expense} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <Path
            key={ratio}
            d={`M ${padding} ${padding + (chartHeight - padding * 2) * ratio} L ${chartWidth - padding} ${padding + (chartHeight - padding * 2) * ratio}`}
            stroke={Colors.border.subtle}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Income area fill */}
        <Path
          d={createAreaPath(incomeValues)}
          fill="url(#incomeArea)"
        />

        {/* Expense area fill */}
        <Path
          d={createAreaPath(expenseValues)}
          fill="url(#expenseArea)"
        />

        {/* Income line */}
        <Path
          d={createLinePath(incomeValues)}
          stroke={Colors.semantic.income}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Expense line */}
        <Path
          d={createLinePath(expenseValues)}
          stroke={Colors.semantic.expense}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      {/* X-axis labels */}
      {showLabels && (
        <View style={[areaChartStyles.labels, { width: chartWidth }]}>
          {data.map((point, index) => (
            <Text
              key={index}
              style={[
                areaChartStyles.label,
                { left: getX(index) - 15, width: 30 }
              ]}
            >
              {point.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
});

AreaChart.displayName = 'AreaChart';

const areaChartStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  labels: {
    flexDirection: 'row',
    position: 'relative',
    height: 20,
  },
  label: {
    position: 'absolute',
    fontFamily: FontFamily.regular,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});

// ==========================================
// HEATMAP CHART
// ==========================================

export interface HeatmapChartProps {
  data: number[][]; // 4 rows x 7 cols
  maxValue: number;
  style?: ViewStyle;
  cellSize?: number;
  showDayLabels?: boolean;
  /** Accessibility: Chart title for screen readers */
  accessibilityTitle?: string;
  /** Accessibility: Chart description for screen readers */
  accessibilityDescription?: string;
  /** Accessibility: Value formatter for screen reader announcements */
  formatValue?: (value: number) => string;
  /** Test ID for testing */
  testID?: string;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = memo(({
  data,
  maxValue,
  style,
  cellSize = 32,
  showDayLabels = true,
  accessibilityTitle = 'Activity Heatmap',
  accessibilityDescription = 'Spending intensity by day',
  formatValue = (v: number) => v.toLocaleString(),
  testID,
}) => {
  const { t } = useTranslation();
  const days = [t('time.sun').charAt(0), t('time.mon').charAt(0), t('time.tue').charAt(0), t('time.wed').charAt(0), t('time.thu').charAt(0), t('time.fri').charAt(0), t('time.sat').charAt(0)];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const gap = 4;
  const width = 7 * (cellSize + gap) - gap;
  const height = 4 * (cellSize + gap) - gap + (showDayLabels ? 20 : 0);

  const getIntensityColor = (value: number): string => {
    if (maxValue === 0 || value === 0) return Colors.darker;

    const ratio = Math.min(value / maxValue, 1);

    if (ratio < 0.25) return Colors.transparent.neon10;
    if (ratio < 0.5) return Colors.transparent.neon30;
    if (ratio < 0.75) return Colors.transparent.neon50;
    return Colors.neon;
  };

  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    const flatData = data.flat();
    if (flatData.length === 0) {
      return `${accessibilityTitle}. ${accessibilityDescription}. No data available.`;
    }

    const total = flatData.reduce((sum, v) => sum + v, 0);
    const maxVal = Math.max(...flatData);
    const minVal = Math.min(...flatData.filter(v => v > 0));

    // Find day with highest activity
    let highestDay = '';
    let highestValue = 0;
    data.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
        if (value > highestValue) {
          highestValue = value;
          highestDay = fullDays[colIdx];
        }
      });
    });

    let label = `${accessibilityTitle}. ${accessibilityDescription}. `;
    label += `${data.length} weeks by 7 days grid. `;
    label += `Total activity: ${formatValue(total)}. `;
    label += `Maximum: ${formatValue(maxVal)}. `;
    if (highestDay) {
      label += `Most active day: ${highestDay}. `;
    }
    label += `Intensity ranges from low to high based on spending amount.`;

    return label;
  }, [data, accessibilityTitle, accessibilityDescription, formatValue, fullDays]);

  return (
    <View
      style={[heatmapStyles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      accessibilityHint="Heatmap showing spending intensity patterns"
      testID={testID}
    >
      {/* Day labels */}
      {showDayLabels && (
        <View style={[heatmapStyles.dayLabels, { width }]}>
          {days.map((day, index) => (
            <Text
              key={index}
              style={[heatmapStyles.dayLabel, { width: cellSize }]}
            >
              {day}
            </Text>
          ))}
        </View>
      )}

      {/* Heatmap grid */}
      <Svg width={width} height={height - (showDayLabels ? 20 : 0)}>
        {data.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <Rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * (cellSize + gap)}
              y={rowIndex * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={6}
              fill={getIntensityColor(value)}
            />
          ))
        )}
      </Svg>

      {/* Legend */}
      <View style={heatmapStyles.legend}>
        <Text style={heatmapStyles.legendText}>{t('charts.low')}</Text>
        <View style={[heatmapStyles.legendCell, { backgroundColor: Colors.transparent.neon10 }]} />
        <View style={[heatmapStyles.legendCell, { backgroundColor: Colors.transparent.neon30 }]} />
        <View style={[heatmapStyles.legendCell, { backgroundColor: Colors.transparent.neon50 }]} />
        <View style={[heatmapStyles.legendCell, { backgroundColor: Colors.neon }]} />
        <Text style={heatmapStyles.legendText}>{t('charts.high')}</Text>
      </View>
    </View>
  );
});

HeatmapChart.displayName = 'HeatmapChart';

const heatmapStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 6,
  },
  legendText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.label,
    color: Colors.text.tertiary,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});

// ==========================================
// MINI FACTOR INDICATOR
// ==========================================

export interface MiniFactorIndicatorProps {
  value: number; // 0-100 (score where higher is better)
  label: string;
  size?: number;
  /** Accessibility: Additional context about what this factor measures */
  accessibilityDescription?: string;
  /** Test ID for testing */
  testID?: string;
}

export const MiniFactorIndicator: React.FC<MiniFactorIndicatorProps> = memo(({
  value,
  label,
  size = 48,
  accessibilityDescription,
  testID,
}) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (value / 100) * circumference;

  // Color based on score (higher is always better for all factors including debt)
  // Score of 100 = excellent (green), score of 0 = poor (red)
  // Uses getHealthScoreColor from design system for consistency
  const color = getHealthScoreColor(value);

  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    let status = '';
    if (value >= 70) status = 'Good';
    else if (value >= 40) status = 'Needs attention';
    else status = 'Poor';

    const desc = accessibilityDescription || `${label} health indicator`;
    return `${label}. ${desc}. Score: ${Math.round(value)} percent. Status: ${status}.`;
  }, [value, label, accessibilityDescription]);

  return (
    <View
      style={miniFactorStyles.container}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: value,
        text: `${Math.round(value)}%`,
      }}
      testID={testID}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.darker}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress - only render if value > 0 to avoid visual glitch */}
          {value > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${progress} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
        <View style={miniFactorStyles.valueContainer}>
          <Text style={[miniFactorStyles.value, { color }]}>{Math.round(value)}%</Text>
        </View>
      </View>
      <Text style={miniFactorStyles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
});

MiniFactorIndicator.displayName = 'MiniFactorIndicator';

const miniFactorStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 60,
  },
  valueContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Colors.text.tertiary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // Donut Chart
  donutContainer: { alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  // Bar Chart
  barChartContainer: { alignItems: 'center' },
  barChartContent: { marginBottom: Spacing.xs },
  barValues: { flexDirection: 'row', marginBottom: Spacing.xs },
  barValueContainer: { alignItems: 'center' },
  barValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.caption, color: Colors.text.primary },
  barLabels: { flexDirection: 'row' },
  barLabelContainer: { alignItems: 'center' },
  barLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.label, color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Legend
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.xs },
  legendLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: Colors.text.secondary },
  legendValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.caption, color: Colors.text.primary, marginLeft: Spacing.xs },
});
