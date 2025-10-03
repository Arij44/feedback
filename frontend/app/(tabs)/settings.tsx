import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [tempName, setTempName] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const backgroundColor = isDarkMode ? '#1c1c1e' : '#f2f0f8';
  const cardColor = isDarkMode ? '#2c2c2e' : '#e6e3ed';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const subTextColor = isDarkMode ? '#cccccc' : '#555555';
  const buttonColor = isDarkMode ? '#795d99' : '#795d99';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:8000/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await res.json();
      setName(profile.displayName || '');
      setTempName(profile.displayName || '');
      setImageUri(profile.photoURL || '');
    };
    fetchProfile();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      await fetch('http://localhost:8000/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: tempName, photoURL: imageUri }),
      });
      setName(tempName);
      setIsEditing(false);
      Alert.alert('Profile updated');
    } catch (err) {
      Alert.alert('Failed to update profile');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setTempName(name);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      router.replace('/welcome');
    } catch (err) {
      Alert.alert('Logout failed');
      console.error(err);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <Header title="Settings" iconName="settings-outline" darkMode={isDarkMode} />
      <ScrollView style={styles.container}>
        <View style={[styles.profileContainer, { backgroundColor: cardColor }]}>
          <Image
            source={
              imageUri
                ? { uri: imageUri }
                : require('../../assets/icons/user-icon.png')
            }
            style={styles.avatar}
          />
          <Text style={[styles.name, { color: textColor }]}>{name}</Text>
        </View>

        <TouchableOpacity
          style={[styles.sectionHeader, { backgroundColor: cardColor }]}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={[styles.sectionHeaderText, { color: textColor }]}>
            Edit profile details
          </Text>
          <Feather name={isEditing ? 'chevron-up' : 'chevron-down'} size={20} color={textColor} />
        </TouchableOpacity>

        {isEditing && (
          <View style={[styles.editSection, { backgroundColor: cardColor }]}>
            <Text style={[styles.label, { color: textColor }]}>Name</Text>
            <TextInput
  style={[
    styles.input,
    {
      color: textColor,
      backgroundColor: isDarkMode ? '#3a3a3c' : '#fff',
      borderColor: '#a089c0',
    },
  ]}
  value={tempName}
  onChangeText={setTempName}
  placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
/>

            <Text style={[styles.label, { color: textColor }]}>Picture</Text>
            <TouchableOpacity
              style={[styles.changePicButton, { backgroundColor: buttonColor }]}
              onPress={pickImage}
            >
              <Text style={styles.changePicText}>Change Picture</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: '#5E2B97' }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: '#dedce4' }]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.toggleContainer, { backgroundColor: cardColor }]}>
          <Text style={[styles.darkModeText, { color: isDarkMode ? '#fff' : '#000' }]}>
            Dark Mode
          </Text>
          <Switch
  value={isDarkMode}
  onValueChange={setIsDarkMode}
  trackColor={{ false: '#ccc', true: '#b28ce0' }}  // purple
  thumbColor={isDarkMode ? '#fff' : '#888'}
  ios_backgroundColor="#ccc"
/>



        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
  },
  editSection: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  changePicButton: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  changePicText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  darkModeText: {
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#5d2fa3',
    padding: 14,
    borderRadius: 10,
  },
  logoutText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});
