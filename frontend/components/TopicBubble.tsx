import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Topic {
  topic_id: number;
  title: string;
  keywords: string[];
  size: number;
  example?: string;
}

export default function TopicBubbles({ topics }: { topics: Topic[] }) {
  const topTopics = topics?.slice(0, 5) ?? [];

  console.log('Received topics in TopicBubbles:', topics); // Debug

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trending Topics</Text>
      <View style={styles.bubbleContainer}>
        {topTopics.map((topic, index) => {
          const title = topic?.title || `Topic #${topic?.topic_id ?? index}`;
          const size = typeof topic?.size === 'number' ? topic.size : '?';
          return (
            <View key={index} style={styles.bubbleWrapper}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{title}</Text>
                <Text style={styles.sizeText}>💬 {size}</Text>
              </View>
              <View style={styles.tail} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F4FB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  bubbleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    columnGap: 8,
  },
  bubbleWrapper: {
    alignItems: 'center',
    maxWidth: '45%',
  },
  bubble: {
    backgroundColor: '#e6d9ef',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B0066',
    textAlign: 'center',
  },
  sizeText: {
    fontSize: 11,
    color: '#3B0066',
    marginTop: 4,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#e6d9ef',
    marginTop: -1,
  },
});
