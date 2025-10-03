import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { API_URL } from '../utils/config';
import { G, Rect, Svg, Text as SvgText } from 'react-native-svg';
import { StackedBarChart, XAxis, YAxis } from 'react-native-svg-charts';

const { width } = Dimensions.get('window');
const defaultAvatar = require('../../assets/icons/user-icon.png');
const appLogo = require('../../assets/images/logoo.png');

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Stats = {
  posts: number;
  comments: number;
  sentiment: string;
};

type SentimentBreakdown = {
  positive: number;
  neutral: number;
  negative: number;
};

type FeedbackItem = {
  id: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  author: string;
  sentimentBreakdown: SentimentBreakdown;
};

type PostSentiment = {
  id: string;
  author: string;
  avatar?: string;
  positive: number;
  neutral: number;
  negative: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ posts: 0, comments: 0, sentiment: 'Neutral' });
  const [recentPosts, setRecentPosts] = useState<FeedbackItem[]>([]);
  const [postSentiments, setPostSentiments] = useState<PostSentiment[]>([]);

  const sentimentEmojis: Record<string, string> = {
    positive: '😀',
    neutral: '😐',
    negative: '😠',
  };

  const sentimentColors: Record<string, any> = {
    positive: styles.positive,
    neutral: styles.neutral,
    negative: styles.negative,
  };

  const displayedPosts = expanded ? recentPosts : recentPosts.slice(0, 3);

  const toggleSeeMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPhotoURL(null);
        setStats({ posts: 0, comments: 0, sentiment: 'Neutral' });
        setRecentPosts([]);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/home`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Home data fetch failed');
        const { photoURL, stats, recentFeedback, postSentiments } = await res.json();

        setPhotoURL(photoURL || null);
        setStats(stats);
        setRecentPosts(recentFeedback);
        setPostSentiments(postSentiments);
      } catch (err) {
        console.warn('Failed to load home data:', err);
      }
    });

    return () => unsubscribe();
  }, []);

  const colors = ['#a869e0', '#7f6b94', '#653a8b'];
  const keys = ['positive', 'neutral', 'negative'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={appLogo} style={styles.logoIcon} />
          <Text style={styles.title}>FEEDBACK</Text>
        </View>
        <Image
  source={
    photoURL && photoURL.trim() !== ''
      ? { uri: photoURL }
      : getAuth().currentUser?.photoURL
        ? { uri: getAuth().currentUser?.photoURL }
        : defaultAvatar
  }
  style={styles.avatar}
/>

      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.newPostBtn}
          onPress={() => router.push('/addpost')}
        >
          <Text style={styles.newPostText}>+ New Post</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Posts</Text>
            <Text style={styles.statValue}>{stats.posts}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Comments</Text>
            <Text style={styles.statValue}>{stats.comments}</Text>
          </View>
        </View>

        <View style={styles.avgCard}>
          <Text style={styles.avgLabel}>Average Sentiment</Text>
          <Text style={[styles.avgValue, sentimentColors[stats.sentiment.toLowerCase()]]}>
            {stats.sentiment}
          </Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sentiment by Post</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
         
            <StackedBarChart
              style={{ height: 200, width: width * 0.75 }}
              keys={keys}
              colors={colors}
              data={postSentiments}
              showGrid={true}
              contentInset={{ top: 10, bottom: 10 }}
              horizontal={false}
              spacingInner={0.3}
            />
          </View>
          <View style={styles.avatarRow}>
            {postSentiments.map((p, i) => (
              <Image
                key={i}
                source={p.avatar ? { uri: p.avatar } : defaultAvatar}
                style={styles.chartAvatar}
              />
            ))}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: '#a869e0' }]} /><Text style={styles.legendLabel}>Positive</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: '#7f6b94' }]} /><Text style={styles.legendLabel}>Neutral</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: '#653a8b' }]} /><Text style={styles.legendLabel}>Negative</Text></View>
          </View>
        </View>

        <View style={styles.recentContainer}>
          <Text style={styles.recentHeader}>Recent Posts</Text>
          {displayedPosts.map((item) => (
            <View key={item.id} style={styles.recentItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentAuthor}>{item.author}</Text>
                <Text style={styles.recentText} numberOfLines={1}>
                  {item.text?.split('\n')[0] || '[No text]'}
                </Text>
              </View>
              <Text style={styles.emoji}>{sentimentEmojis[item.sentiment]}</Text>
            </View>
          ))}
          {recentPosts.length > 3 && (
            <TouchableOpacity onPress={toggleSeeMore}>
              <Text style={styles.seeMore}>
                {expanded ? 'see less ...' : 'see more ...'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0FA' },
  content: { alignItems: 'center', paddingBottom: 40, paddingTop: 8 },
  header: {
    width: '100%',
    padding: 16,
    backgroundColor: '#dedce4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 38, height: 38, marginRight: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  newPostBtn: {
    backgroundColor: '#5E2B97',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    width: '90%',
    alignSelf: 'center',
  },
  newPostText: { color: '#FFFFFF', textAlign: 'center', fontSize: 16 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 16,
  },
  statCard: {
    backgroundColor: '#dddaed',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  statLabel: { fontSize: 14, color: '#000' },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  avgCard: {
    backgroundColor: '#dddaed',
    borderRadius: 8,
    padding: 16,
    width: '90%',
    marginTop: 16,
    alignItems: 'center',
  },
  avgLabel: { fontSize: 16, color: '#000' },
  avgValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  chartContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
  },
  chartAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: '#333',
  },
  recentContainer: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  recentHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  recentAuthor: {
    fontWeight: '600',
    fontSize: 14,
    color: '#5E2B97',
    marginBottom: 2,
  },
  recentText: { fontSize: 14, flexShrink: 1 },
  emoji: { fontSize: 18, marginLeft: 8 },
  seeMore: { color: '#5E2B97', textAlign: 'center', marginTop: 8 },
  positive: { color: '#a869e0' },
  neutral: { color: '#7f6b94' },
  negative: { color: '#653a8b' },
});
