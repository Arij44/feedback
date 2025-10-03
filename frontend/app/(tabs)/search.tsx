import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

// Fake MongoDB-style data
const fakeData = [
  {
    _id: '6837075297c17bee3b02e1a9',
    platform: 'reddit',
    post: {
      id: '1kvduot',
      author: 'laksh009',
      text: 'Man I had such high hopes as to understanding what was actually happen…',
      timestamp: '2025-05-25T21:40:28Z',
      avatar: 'https://styles.redditmedia.com/t5_2rfq0/styles/communityIcon_7r11msmkljrd1.png',
    },
    sentiment: 'negative',
  },
  {
    _id: '68370a526ecd3a5dc804b00c',
    platform: 'stackexchange',
    post: {
      id: '281973',
      author: 'Steve Bennett',
      text: 'Output any 500 different valid Roman numerals in the range 1 to 3999, …',
      timestamp: '2025-05-26T13:06:24Z',
      avatar: 'https://www.gravatar.com/avatar/75f5707160697b2164444fc3f5054084?s=256',
    },
    sentiment: 'neutral',
  },
  {
    _id: '68370a986ecd3a5dc804b011',
    platform: 'youtube',
    post: {
      id: 'QF00A48jthY',
      author: 'MusicOvO',
      text: 'can i complete 1k suscriber🥺🥲? plz give me encouragement by supporti…',
      timestamp: '2024-12-10T09:15:01Z',
      avatar: 'https://yt3.googleusercontent.com/s6yZW2dskyIg7PFaVWyNEu7qwRR7siIy4l3OwDwykjTOsdrJEhncxYavaAodWTm9RJBopBkdtA=s160-c-k-c0x00ffffff-no-rj',
    },
    sentiment: 'positive',
  },

  {
    _id: '68370f086ecd3a5dc804b017',
    platform: 'reddit',
    post: {
      id: '1ivijdi',
      author: 'sangeeeeta',
      text: 'I\'m curious to learn about real-world success stories where web scraping was used…',
      timestamp: '2025-02-22T13:18:29Z',
      avatar: 'https://styles.redditmedia.com/t5_318ly/styles/communityIcon_sq64lrv9edwd1.png',
    },
    sentiment: 'neutral',
  },
    {
    _id: '68381158b60a96a97f13aff7',
    platform: 'reddit',
    post: {
      id: '1kxuoww',
      author: 'TheLiesHumansTell',
      text: "Last night before I went to sleep my cat jumped in my bed with me and it went under…",
      timestamp: '2025-05-28T22:34:30Z',
      avatar: 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_5.png',
    },
    sentiment: 'neutral',
  },
  {
    _id: '683710816ecd3a5dc804b01e',
    platform: 'youtube',
    post: {
      id: '9ocPm2eM_e8',
      author: 'Fox News',
      text: "DOGE leader Elon Musk responds to harsh rhetoric against him on 'My View with Lara…",
      timestamp: '2025-05-03T07:30:12Z',
      avatar: 'https://yt3.googleusercontent.com/G3gLy3HBgiZ21mEt1uzR0VPA6VXpsgJReuD7Z91nHwcgyFVu_QpHNpxuULN1D0YEQBwD0F1HwQ=s160-c-k-c0x00ffffff-no-rj',
    },
    sentiment: 'positive',
  },
  {
    _id: '68599fc3555a9cbb7c33ca89',
    platform: 'reddit',
    post: {
      id: '1lg6zve',
      author: 'Finnbigdick',
      text: 'are we getting a new season',
      timestamp: '2025-06-20T15:33:56Z',
      avatar: 'https://styles.redditmedia.com/t5_93mivj/styles/profileIcon_snoo-nftv2_bmZ0X2VpcDE1NToxMzdfZWI5NTlhNzE1ZGZmZmU2ZjgyZjQ2MDU1MzM5ODJjNDg1OWNiMTRmZV8xMTM3NDE1Mg_rare_63df1ffd-7d37-4940-a45e-5fc08d6193a5-headshot.png?width=256&height=256&crop=256:256,smart&s=751fed4e79084dac5c355edeef5993fd935affa9',
    },
    sentiment: 'neutral',
  },
];

const sentimentEmoji: Record<string, string> = {
  positive: '😀',
  neutral: '😐',
  negative: '😠',
};

const platforms = ['All Platforms', 'Reddit', 'YouTube', 'Facebook', 'StackExchange'];
const times = ['Any Time', '1d', '7d', '30d'];
const timeToDaysMap: Record<string, number | null> = {
  'Any Time': null,
  '1d': 1,
  '7d': 7,
  '30d': 30,
};
export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('All Platforms');
  const [time, setTime] = useState('Any Time');
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>([]);
  const [platformModal, setPlatformModal] = useState(false);
  const [timeModal, setTimeModal] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQ = query.toLowerCase();
    const now = new Date();

    const filtered = fakeData.filter((item) => {
      const { post } = item;
      if (!post.text.toLowerCase().includes(lowerQ)) return false;
      if (platform !== 'All Platforms' && item.platform.toLowerCase() !== platform.toLowerCase()) return false;
      if (selectedSentiments.length && !selectedSentiments.includes(item.sentiment)) return false;

    const selectedDays = timeToDaysMap[time];
    if (selectedDays !== null) {
      const postDate = new Date(post.timestamp);
      const timeDiff = (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24);
      if (timeDiff > selectedDays) return false;
    }

      return true;
    });

    setResults(filtered);
  }, [query, platform, time, selectedSentiments]);

  const toggleSentiment = (s: string) =>
    setSelectedSentiments(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  const clearQuery = () => {
    setQuery('');
    setResults([]);
  };

  const renderItem = ({ item }: { item: typeof fakeData[0] }) => (
    <TouchableOpacity style={styles.resultCard}>
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
          <Text style={styles.userName}>{item.post.author}</Text>
          <Text style={styles.date}>{new Date(item.post.timestamp).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={styles.description}>{item.post.text}</Text>
      <Text style={styles.platformTag}>{item.platform}</Text>
      <Text style={styles.sentimentTag}>{sentimentEmoji[item.sentiment]}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search posts..."
          placeholderTextColor="#888"
        />
        {query && (
          <Ionicons
            name="close-circle"
            size={20}
            style={styles.clearIcon}
            onPress={clearQuery}
          />
        )}
      </View>

      <View style={styles.filterGrid}>
        <TouchableOpacity style={styles.filterBox} onPress={() => setPlatformModal(true)}>
          <Text>{platform}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBox} onPress={() => setTimeModal(true)}>
          <Text>{time}</Text>
        </TouchableOpacity>
        <View style={[styles.filterBox, styles.fullWidth]}>
          <View style={styles.sentimentRow}>
            {['positive', 'neutral', 'negative'].map(s => (
              <Pressable
                key={s}
                style={[styles.emojiChip, selectedSentiments.includes(s) && styles.activeChip]}
                onPress={() => toggleSentiment(s)}
              >
                <Text style={styles.emojiText}>{sentimentEmoji[s]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Modal transparent visible={platformModal}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setPlatformModal(false)}>
          <View style={styles.modalContent}>
            {platforms.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => {
                  setPlatform(p);
                  setPlatformModal(false);
                }}
              >
                <Text style={styles.modalItem}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal transparent visible={timeModal}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setTimeModal(false)}>
          <View style={styles.modalContent}>
            {times.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  setTime(t);
                  setTimeModal(false);
                }}
              >
                <Text style={styles.modalItem}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={results}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.noResults}>
            {query.trim() ? 'No matching results' : 'Start typing to search...'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f0f8' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 8,
    elevation: 3,
    paddingVertical: 4,
    marginTop: 50,
  },
  searchIcon: { marginHorizontal: 4, color: '#888' },
  searchInput: { flex: 1, fontSize: 16, padding: 6 },
  clearIcon: { color: '#888' },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterBox: {
    backgroundColor: '#E6E4F3',
    borderRadius: 16,
    padding: 10,
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    marginBottom: 8,
  },
  fullWidth: { flexBasis: '100%' },
  sentimentRow: { flexDirection: 'row', justifyContent: 'center' },
  emojiChip: { marginHorizontal: 4, padding: 6, borderRadius: 20, backgroundColor: '#D9D6EF' },
  activeChip: { backgroundColor: '#B8ADF1' },
  emojiText: { fontSize: 20, color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: 200 },
  modalItem: { paddingVertical: 10, fontSize: 16, color: '#333', textAlign: 'center' },
  resultCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    padding: 12,
    elevation: 1,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  date: { fontSize: 12, color: '#666' },
  description: { fontSize: 14, marginBottom: 8 },
  platformTag: { position: 'absolute', top: 12, right: 12, fontSize: 12, color: '#5E2B97' },
  sentimentTag: { position: 'absolute', bottom: 12, right: 12, fontSize: 24 },
  noResults: { textAlign: 'center', color: '#888', marginTop: 20 },
});
