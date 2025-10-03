import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

export default function SentimentSemiCircle({ data }: { data: { positive: number, neutral: number, negative: number } }) {
  const { width: screenWidth } = useWindowDimensions();
  
  if (!data || typeof data.positive !== 'number' || typeof data.neutral !== 'number' || typeof data.negative !== 'number') {
    return <Text style={{ color: '#999' }}>No sentiment data is available for the current platform.</Text>;
  }

  const colors = ['#b54dfd', '#d0ade9', '#7d4ca0'];
  const labels = ['Positive', 'Neutral', 'Negative'];
  const values = [data.positive, data.neutral, data.negative];
  const total = values.reduce((sum, val) => sum + val, 0);

  const chartData = values.map((value, index) => ({
    name: labels[index],
    population: value,
    color: colors[index],
  }));

  const percentages = values.map((value) => ((value / total) * 100).toFixed(0) + '%');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentiment Distribution</Text>

      <View style={styles.centerContainer}>
        {/* Chart with extra padding container */}
        <View style={styles.chartWrapper}>
          <PieChart
            data={chartData}
            width={200}  // Increased width to ensure full visibility
            height={180}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(75, 0, 130, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="35"  // Significantly increased left padding
            hasLegend={false}
            absolute={false}
            center={[30, 0]}  // Adjusts the pie position within its container
          />
        </View>

        <View style={styles.legendColumn}>
          {labels.map((label, index) => (
            <View style={styles.legendItem} key={label}>
              <View style={[styles.colorDot, { backgroundColor: colors[index] }]} />
              <Text style={styles.legendText}>{`${label} ${percentages[index]}`}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4B0082',
    textAlign: 'center',
  },
  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  chartWrapper: {
    marginRight: 16,
    paddingLeft: 15,  // Additional wrapper padding
    overflow: 'visible', // Ensures nothing gets clipped
  },
  legendColumn: {
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
});