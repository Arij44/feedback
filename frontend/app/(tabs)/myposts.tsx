import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Header from '../../components/Header';
import { getIdToken } from '../../firebase/auth';
import { useRouter } from 'expo-router';
import { API_URL } from '../utils/config';

type Post = {
  _id: string;
  platform: string;
  post: {
    author: string;
    text: string;
    timestamp: number;
    avatar?: string;
    photo_url?: string; // Added photo_url here
  };
  url: string;
  created_at?: string;
};

export default function MyPostsScreen() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Track which posts have expanded text
  const [expandedPosts, setExpandedPosts] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    const fetchMyPosts = async () => {
      setLoading(true);
      try {
        const token = await getIdToken();
        const res = await fetch(`${API_URL}/api/posts/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await res.json();
        console.log('Fetched posts:', data); // Debug log
        setPosts(data);
      } catch (err) {
        console.error('❌ Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  const toggleText = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const renderItem = ({ item }: { item: Post }) => {
    const isExpanded = expandedPosts[item._id] || false;

    return (
      <TouchableOpacity
        style={styles.postContainer}
        onPress={() => router.push(`../analysis/${item._id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.headerRow}>
          <View style={styles.userRow}>
            <Image
              source={
                item.post.avatar
                  ? { uri: item.post.avatar }
                  : require('@/assets/icons/user-icon.png')
              }
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName}>{item.post.author || 'Unknown'}</Text>
              <Text style={styles.date}>
                {new Date(item.post.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <Text style={styles.platform}>{item.platform.toLowerCase()}</Text>
        </View>

        <View style={styles.descriptionBox}>
          <Text
            style={styles.description}
            numberOfLines={isExpanded ? undefined : 3}
            ellipsizeMode="tail"
          >
            {item.post.text}
          </Text>

          {item.post.text.length > 100 && (
            <Text onPress={() => toggleText(item._id)} style={styles.seeMoreLess}>
              {isExpanded ? 'See Less' : 'See More'}
            </Text>
          )}

          {/* Render post photo if available */}
          {item.post.photo_url && (
            <Image
              source={{ uri: item.post.photo_url }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Header title="My Posts" iconName="list-outline" />
      {loading ? (
        <ActivityIndicator size="large" color="#5E2B97" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.container}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f2f0f8',
  },
  postContainer: {
    backgroundColor: '#e6e3ed',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  date: {
    fontSize: 12,
    color: '#555',
  },
  platform: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5d2fa3',
  },
  descriptionBox: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
  },
  seeMoreLess: {
    marginTop: 6,
    color: '#5d2fa3',
    fontWeight: '600',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
});
