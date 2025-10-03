import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import SentimentSemiCircle from '../components/SentimentSemiCircle';
import TopicBubbles from '../components/TopicBubble';
import ScreenLayout from '../components/screenlayout';

import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AnalysisScreen() {
  const router = useRouter();
  const { data: dataParam } = useLocalSearchParams<{ data?: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    if (dataParam) {
      try {
        const parsed = JSON.parse(dataParam);
        setData(parsed);
      } catch (e) {
        console.warn('Failed to parse analysis data', e);
      } finally {
        setLoading(false);
      }
    } else {
      console.warn('No data provided to analysis screen.');
      setLoading(false);
    }
  }, []);

  if (loading) return <Text style={{ padding: 20 }}>Loading...</Text>;
  if (!data) return <Text style={{ padding: 20 }}>Failed to load post.</Text>;

  const { platform, comments, sentiment, topics, post } = data;

  const safeComments = Array.isArray(comments) ? comments : [];
  const maxLength = 180;
  const isLong = post.text.length > maxLength;
  const displayedText = showFullText || !isLong ? post.text : post.text.slice(0, maxLength);

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/addpost')}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metaCard}>
          <View style={styles.metaHeaderRow}>
            <View style={styles.metaHeaderLeft}>
              {post.photo_url ? (
                <Image source={{ uri: post.photo_url }} style={styles.userIcon} />
              ) : (
                <Image source={require('../assets/icons/user-icon.png')} style={styles.userIcon} />
              )}
              <View>
                <Text style={styles.metaUser}>{post.author}</Text>
                <Text style={styles.metaDate}>
                  {post.timestamp ? new Date(post.timestamp).toLocaleString() : 'Unknown date'}
                </Text>
              </View>
            </View>
            <Text style={styles.metaPlatform}>{platform}</Text>
          </View>

          <Text style={styles.metaContent}>
            {displayedText}
            {isLong && (
              <Text style={styles.seeMoreText} onPress={() => setShowFullText(!showFullText)}>
                {' '}
                {showFullText ? 'See less' : '... See more'}
            
              </Text>
            )}
          </Text>

          <TouchableOpacity onPress={() => setShowAllComments(!showAllComments)}>
            <Text style={styles.commentsToggle}>
              comments {showAllComments ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showAllComments && safeComments.length > 0 && (
            <View style={styles.commentContainer}>
              <FlatList
                data={safeComments}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Text style={styles.commentAuthor}>{item.author}</Text>
                    <Text style={styles.commentText}>• {item.text}</Text>
                  </View>
                )}
              />
            </View>
          )}
        </View>

        {sentiment && <SentimentSemiCircle data={sentiment} />}
        {topics && <TopicBubbles topics={topics} />}


      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#dedce4',
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 16 },
  metaCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  metaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  metaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  metaUser: { fontWeight: 'bold', fontSize: 14 },
  metaDate: { fontSize: 12, color: '#666' },
  metaPlatform: { color: '#5E2B97', fontWeight: '600', fontSize: 13 },
  metaContent: { fontSize: 14, marginBottom: 8, color: '#333' },
  seeMoreText: {
    color: '#333',
    fontWeight: '600',
  },
  commentsToggle: { color: '#5E2B97', fontWeight: '500', marginBottom: 6 },
  commentContainer: {
    maxHeight: 180,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#F5F3FB',
    borderRadius: 10,
    marginTop: 8,
  },
  commentItem: {
    marginBottom: 6,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  commentText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
  },
});
