import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import Header from '../../components/Header';
import { useAnalysis } from '../../hooks/useAnalysis';
import { getAuth } from 'firebase/auth';
import { API_URL } from '../utils/config';

export default function AddPostScreen() {
  const [url, setUrl] = useState('');
  const router = useRouter();
  const { steps, stepIndex, running, runAnalysis } = useAnalysis();

  const onAnalyze = async () => {
    if (!url.trim()) {
      alert('Please paste a valid URL');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('You must be logged in to analyze posts.');
      return;
    }

    const idToken = await user.getIdToken();

    const result = await runAnalysis(async () => {
      try {
        const response = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze post');
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          alert('Error analyzing post: ' + error.message);
        } else {
          alert('Error analyzing post');
        }
        return null;
      }
    });

    if (result?.postId) {
      router.push({
        pathname: "/analysis/[postId]",
        params: { postId: result.postId },
      });
    } else {
      console.warn('No postId found in result');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Add Post" iconName="link-outline" />
      <View style={styles.container}>
        <Text style={styles.prompt}>Paste a post’s URL here</Text>

        <View style={styles.spacer} />

        <TextInput
          style={styles.input}
          placeholder="https://example.com/post"
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
        />

        <TouchableOpacity style={styles.button} onPress={onAnalyze} disabled={running}>
          <Text style={styles.buttonText}>{running ? 'Analyzing…' : 'Analyze'}</Text>
        </TouchableOpacity>

        <Text style={styles.supportedText}>Supported platforms: Reddit,  YouTube, StackExchange…</Text>

        <Modal visible={running} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.modalBox}>
              <ActivityIndicator size="large" color="#5E2B97" />
              <Text style={styles.stepText}>{steps[stepIndex]}</Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F0FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f0f8',
    padding: 20,
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  prompt: {
    fontSize: 16,
    marginBottom: 12,
    color: '#555',
    textAlign: 'center',
  },
  spacer: {
    height: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#5E2B97',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    fontSize: 15,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#5E2B97',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  supportedText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  stepText: {
    marginTop: 12,
    color: '#5E2B97',
    fontWeight: '500',
  },
});
