import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import SentimentSemiCircle from '../../components/SentimentSemiCircle';
import TopicBubbles from '../../components/TopicBubble';
import ScreenLayout from '../../components/screenlayout';
import { API_URL } from '../utils/config';

import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { onAuthStateChanged } from "firebase/auth";
import { auth } from '@/firebase/config';

const defaultAvatar = require('../../assets/icons/user-icon.png');

export default function AnalysisScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    if (!postId) {
      setError('No post ID provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      try {
        const idToken = await user.getIdToken();

        const res = await fetch(`${API_URL}/api/analyze/${postId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Error fetching data: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch analysis.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [postId]);

  if (loading) return <Text style={{ padding: 20 }}>Loading...</Text>;
  if (error) return <Text style={{ padding: 20, color: 'red' }}>{error}</Text>;
  if (!data) return <Text style={{ padding: 20 }}>No data found.</Text>;

  const { platform, comments, sentiment, topics, post } = data;
  const safeComments = Array.isArray(comments) ? comments : [];
  const maxLength = 180;
  const isLong = post.text.length > maxLength;
  const displayedText = showFullText || !isLong ? post.text : post.text.slice(0, maxLength);

  const sentimentColors = {
    positive: { bg: '#f3e6ff', bar: '#b54dfd' },
    neutral: { bg: '#f7edfc', bar: '#d0ade9' },
    negative: { bg: '#efe4f7', bar: '#7d4ca0' },
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/myposts')}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metaCard}>
          <View style={styles.metaHeaderRow}>
            <View style={styles.metaHeaderLeft}>
              <Image
                source={
                  post.avatar && post.avatar.trim() !== ''
                    ? { uri: post.avatar }
                    : defaultAvatar
                }
                style={styles.userIcon}
                onError={() => console.warn('Author avatar failed to load')}
                resizeMode="cover"
              />
              <View>
                <Text style={styles.metaUser}>{post.author}</Text>
                <Text style={styles.metaDate}>
                  {post.timestamp
                    ? new Date(post.timestamp).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Unknown date'}
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
                renderItem={({ item }) => {
                  type SentimentType = 'positive' | 'neutral' | 'negative';
                  const sentiment: SentimentType =
                    item.sentiment === 'positive' || item.sentiment === 'negative' || item.sentiment === 'neutral'
                      ? item.sentiment
                      : 'neutral';
                  const { bg, bar } = sentimentColors[sentiment];
                  return (
                    <View style={[styles.commentItem, { backgroundColor: bg, borderLeftColor: bar }]}>
                      <Text style={styles.commentAuthor}>{item.author}</Text>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                  );
                }}
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
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
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
    padding: 8,
    borderLeftWidth: 4,
    borderRadius: 6,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  commentText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 4,
  },
});
