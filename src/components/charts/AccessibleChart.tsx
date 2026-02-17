/**
 * AccessibleChart - Wrapper component for chart accessibility
 * Provides screen reader support for all chart types
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '../../design/cinematic';

export interface DataPoint {
  label: string;
  value: number;
}

export interface AccessibleChartProps {
  /** Chart content to render */
  children: React.ReactNode;
  /** Chart title for screen readers */
  title: string;
  /** Brief description of what the chart shows */
  description: string;
  /** Data points for generating accessible summary */
  data: DataPoint[];
  /** Format function for values (e.g., currency formatting) */
  formatValue?: (value: number) => string;
  /** Chart type for context */
  chartType?: 'donut' | 'bar' | 'line' | 'area' | 'gauge' | 'heatmap';
  /** Additional accessibility hint */
  hint?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Generates an accessible summary from chart data
 */
function generateSummary(
  title: string,
  description: string,
  data: DataPoint[],
  formatValue: (value: number) => string,
  chartType: string
): string {
  if (data.length === 0) {
    return `${title}. ${description}. No data available.`;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const highest = data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);
  const lowest = data.reduce((min, d) => (d.value < min.value ? d : min), data[0]);
  const average = total / data.length;

  let summary = `${title}. ${description}. `;

  switch (chartType) {
    case 'donut':
      summary += `Showing ${data.length} segments. `;
      summary += `Total: ${formatValue(total)}. `;
      summary += `Largest segment: ${highest.label} at ${formatValue(highest.value)}. `;
      if (data.length > 1) {
        summary += `Smallest segment: ${lowest.label} at ${formatValue(lowest.value)}.`;
      }
      break;

    case 'bar':
      summary += `${data.length} bars. `;
      summary += `Highest: ${highest.label} at ${formatValue(highest.value)}. `;
      summary += `Lowest: ${lowest.label} at ${formatValue(lowest.value)}. `;
      summary += `Average: ${formatValue(average)}.`;
      break;

    case 'line':
    case 'area':
      summary += `${data.length} data points. `;
      summary += `Peak: ${highest.label} at ${formatValue(highest.value)}. `;
      summary += `Low: ${lowest.label} at ${formatValue(lowest.value)}. `;
      if (data.length >= 2) {
        const trend = data[data.length - 1].value >= data[0].value ? 'upward' : 'downward';
        summary += `Overall ${trend} trend.`;
      }
      break;

    case 'gauge':
      summary += `Current value: ${formatValue(data[0]?.value || 0)}.`;
      break;

    case 'heatmap':
      summary += `Grid with ${data.length} cells. `;
      summary += `Maximum intensity: ${highest.label} at ${formatValue(highest.value)}. `;
      summary += `Minimum intensity: ${lowest.label} at ${formatValue(lowest.value)}.`;
      break;

    default:
      summary += `${data.length} data points. `;
      summary += `Total: ${formatValue(total)}. `;
      summary += `Highest: ${highest.label} at ${formatValue(highest.value)}. `;
      summary += `Lowest: ${lowest.label} at ${formatValue(lowest.value)}.`;
  }

  return summary;
}

/**
 * AccessibleChart component wraps charts with accessibility features
 */
export function AccessibleChart({
  children,
  title,
  description,
  data,
  formatValue = (v) => v.toLocaleString(),
  chartType = 'bar',
  hint,
  testID,
}: AccessibleChartProps) {
  // Generate accessible summary
  const accessibleSummary = useMemo(
    () => generateSummary(title, description, data, formatValue, chartType),
    [title, description, data, formatValue, chartType]
  );

  // Generate detailed data table text
  const dataTableText = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((d) => `${d.label}: ${formatValue(d.value)}`).join('. ');
  }, [data, formatValue]);

  const accessibilityHint = hint || 'Double tap to hear detailed breakdown';

  return (
    <View
      accessible={true}
      accessibilityLabel={accessibleSummary}
      accessibilityHint={accessibilityHint}
      accessibilityRole="image"
      testID={testID}
    >
      {children}

      {/* Hidden data table for screen readers - provides detailed breakdown */}
      <View
        accessible={true}
        accessibilityLabel={`Detailed data: ${dataTableText}`}
        accessibilityRole="summary"
        style={styles.srOnly}
        // iOS-specific
        {...(Platform.OS === 'ios' && {
          accessibilityElementsHidden: false,
        })}
        // Android-specific
        {...(Platform.OS === 'android' && {
          importantForAccessibility: 'yes',
        })}
      >
        <Text accessibilityRole="header" style={styles.srOnlyText}>
          {title}
        </Text>
        {data.map((d, i) => (
          <Text key={i} style={styles.srOnlyText}>
            {d.label}: {formatValue(d.value)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Accessible wrapper for charts with dual data series (income/expense, etc.)
 */
export interface DualSeriesDataPoint {
  label: string;
  primary: number;
  secondary: number;
}

export interface AccessibleDualSeriesChartProps {
  children: React.ReactNode;
  title: string;
  description: string;
  data: DualSeriesDataPoint[];
  primaryLabel: string;
  secondaryLabel: string;
  formatValue?: (value: number) => string;
  chartType?: 'line' | 'area' | 'bar';
  testID?: string;
}

export function AccessibleDualSeriesChart({
  children,
  title,
  description,
  data,
  primaryLabel,
  secondaryLabel,
  formatValue = (v) => v.toLocaleString(),
  chartType = 'area',
  testID,
}: AccessibleDualSeriesChartProps) {
  const accessibleSummary = useMemo(() => {
    if (data.length === 0) {
      return `${title}. ${description}. No data available.`;
    }

    const primaryTotal = data.reduce((sum, d) => sum + d.primary, 0);
    const secondaryTotal = data.reduce((sum, d) => sum + d.secondary, 0);
    const primaryHighest = data.reduce((max, d) => (d.primary > max.primary ? d : max), data[0]);
    const secondaryHighest = data.reduce(
      (max, d) => (d.secondary > max.secondary ? d : max),
      data[0]
    );

    let summary = `${title}. ${description}. `;
    summary += `Comparing ${primaryLabel} and ${secondaryLabel} over ${data.length} periods. `;
    summary += `${primaryLabel} total: ${formatValue(primaryTotal)}, highest in ${primaryHighest.label}. `;
    summary += `${secondaryLabel} total: ${formatValue(secondaryTotal)}, highest in ${secondaryHighest.label}. `;

    const net = primaryTotal - secondaryTotal;
    summary += `Net difference: ${formatValue(Math.abs(net))} ${net >= 0 ? 'surplus' : 'deficit'}.`;

    return summary;
  }, [title, description, data, primaryLabel, secondaryLabel, formatValue]);

  const dataTableText = useMemo(() => {
    if (data.length === 0) return '';
    return data
      .map((d) => `${d.label}: ${primaryLabel} ${formatValue(d.primary)}, ${secondaryLabel} ${formatValue(d.secondary)}`)
      .join('. ');
  }, [data, primaryLabel, secondaryLabel, formatValue]);

  return (
    <View
      accessible={true}
      accessibilityLabel={accessibleSummary}
      accessibilityHint="Double tap to hear detailed breakdown"
      accessibilityRole="image"
      testID={testID}
    >
      {children}

      <View
        accessible={true}
        accessibilityLabel={`Detailed data: ${dataTableText}`}
        accessibilityRole="summary"
        style={styles.srOnly}
      >
        <Text accessibilityRole="header" style={styles.srOnlyText}>
          {title}
        </Text>
        {data.map((d, i) => (
          <Text key={i} style={styles.srOnlyText}>
            {d.label}: {primaryLabel} {formatValue(d.primary)}, {secondaryLabel}{' '}
            {formatValue(d.secondary)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Accessible wrapper for gauge/score displays
 */
export interface AccessibleGaugeProps {
  children: React.ReactNode;
  title: string;
  value: number;
  maxValue: number;
  grade?: string;
  formatValue?: (value: number) => string;
  interpretation?: string;
  testID?: string;
}

export function AccessibleGauge({
  children,
  title,
  value,
  maxValue,
  grade,
  formatValue = (v) => v.toString(),
  interpretation,
  testID,
}: AccessibleGaugeProps) {
  const percentage = Math.round((value / maxValue) * 100);

  const accessibleSummary = useMemo(() => {
    let summary = `${title}. `;
    summary += `Score: ${formatValue(value)} out of ${formatValue(maxValue)}. `;
    summary += `${percentage}% of maximum. `;

    if (grade) {
      summary += `Grade: ${grade}. `;
    }

    if (interpretation) {
      summary += interpretation;
    } else {
      // Default interpretation based on percentage
      if (percentage >= 80) summary += 'Excellent performance.';
      else if (percentage >= 60) summary += 'Good performance.';
      else if (percentage >= 40) summary += 'Needs improvement.';
      else summary += 'Poor performance.';
    }

    return summary;
  }, [title, value, maxValue, percentage, grade, interpretation, formatValue]);

  return (
    <View
      accessible={true}
      accessibilityLabel={accessibleSummary}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: maxValue,
        now: value,
        text: grade || `${percentage}%`,
      }}
      testID={testID}
    >
      {children}
    </View>
  );
}

/**
 * Accessible wrapper for heatmaps
 */
export interface HeatmapCell {
  row: number;
  col: number;
  value: number;
  label?: string;
}

export interface AccessibleHeatmapProps {
  children: React.ReactNode;
  title: string;
  description: string;
  data: HeatmapCell[];
  rowLabels: string[];
  colLabels: string[];
  formatValue?: (value: number) => string;
  testID?: string;
}

export function AccessibleHeatmap({
  children,
  title,
  description,
  data,
  rowLabels,
  colLabels,
  formatValue = (v) => v.toLocaleString(),
  testID,
}: AccessibleHeatmapProps) {
  const accessibleSummary = useMemo(() => {
    if (data.length === 0) {
      return `${title}. ${description}. No data available.`;
    }

    const maxCell = data.reduce((max, cell) => (cell.value > max.value ? cell : max), data[0]);
    const minCell = data.reduce((min, cell) => (cell.value < min.value ? cell : min), data[0]);
    const total = data.reduce((sum, cell) => sum + cell.value, 0);

    let summary = `${title}. ${description}. `;
    summary += `${rowLabels.length} rows by ${colLabels.length} columns grid. `;
    summary += `Total: ${formatValue(total)}. `;
    summary += `Highest: ${formatValue(maxCell.value)} at row ${rowLabels[maxCell.row] || maxCell.row + 1}, column ${colLabels[maxCell.col] || maxCell.col + 1}. `;
    summary += `Lowest: ${formatValue(minCell.value)} at row ${rowLabels[minCell.row] || minCell.row + 1}, column ${colLabels[minCell.col] || minCell.col + 1}.`;

    return summary;
  }, [title, description, data, rowLabels, colLabels, formatValue]);

  return (
    <View
      accessible={true}
      accessibilityLabel={accessibleSummary}
      accessibilityHint="Shows intensity values across a grid"
      accessibilityRole="image"
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    // Using clip path for proper hiding
    opacity: 0,
  },
  srOnlyText: {
    fontSize: 1,
    color: 'transparent',
  },
});

export default AccessibleChart;
