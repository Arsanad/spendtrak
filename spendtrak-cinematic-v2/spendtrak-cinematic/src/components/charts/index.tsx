// SPENDTRAK CINEMATIC EDITION - Charts
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Rect, G, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing } from '../../design/cinematic';
import { GradientText, GradientLabel } from '../ui/GradientText';

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
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const DonutChart: React.FC<DonutChartProps> = ({
  segments, size = 200, strokeWidth = 24, centerContent, style,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let currentOffset = 0;

  return (
    <View style={[styles.donutContainer, { width: size, height: size }, style]}>
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

          return (
            <DonutSegment
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              circumference={circumference}
              segmentLength={segmentLength}
              offset={offset}
              color={segment.color}
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
};

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
    animatedLength.value = withTiming(segmentLength, { duration: 1000, easing: Easing.out(Easing.ease) });
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
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const BarChart: React.FC<BarChartProps> = ({
  data, height = 150, barWidth = 32, barGap = 16, showLabels = true, showValues = true, style,
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartWidth = data.length * (barWidth + barGap) - barGap;
  const chartHeight = height - (showLabels ? 30 : 0) - (showValues ? 20 : 0);

  return (
    <View style={[styles.barChartContainer, style]}>
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

            return (
              <AnimatedBar
                key={index}
                x={x}
                targetY={y}
                width={barWidth}
                targetHeight={barHeight}
                chartHeight={chartHeight}
                color={item.color}
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
};

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
    animatedHeight.value = withTiming(targetHeight, { duration: 800, easing: Easing.out(Easing.ease) });
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
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ items, style }) => (
  <View style={[styles.legend, style]}>
    {items.map((item, index) => (
      <View key={index} style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
        <Text style={styles.legendLabel}>{item.label}</Text>
        {item.value && <Text style={styles.legendValue}>{item.value}</Text>}
      </View>
    ))}
  </View>
);

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

export { DonutChart, BarChart, ChartLegend };
