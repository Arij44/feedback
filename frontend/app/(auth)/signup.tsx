import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../../firebase/config';
console.log('Auth in signup screen:', auth);

import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from 'react-native';
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { registerUser } from '../../firebase/auth';
import { routes } from '../utils/_routes';

const { width } = Dimensions.get('window');
const waveHeight = 180;

const SignupScreen: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const validateForm = () => {
    console.log('Validating form', { name, email, password });
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      console.log('Missing fields');
      Toast.show({
        type: 'error',
        text1: 'Missing Info',
        text2: 'Please fill in all fields.',
      });
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log('Invalid email format');
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address.',
      });
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (trimmedPassword.length < 6) {
      console.log('Weak password');
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 6 characters.',
      });
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return false;
    }

    console.log('Form validated successfully');
    return true;
  };

      const API_URLS = [
        'http://localhost:8000',
        'http://192.168.1.48:8000',
        'http://192.168.100.25:8000',
        'https://10.60.122.190:8000', // Replace with your ngrok URL if using
      ];
      const API_URL =
        Platform.OS === 'web'
          ? API_URLS[0]
          : API_URLS[3]; 
  const handleSignup = async () => {
    console.log('Signup button pressed', { name, email, password });
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('Attempting Firebase signup');
      const token = await registerUser(email, password);
      console.log('Firebase signup successful, token:', token);

      console.log('Fetching user data from backend');
      const res = await fetch(`${API_URL}/me`, { // Replace with your backend IP or ngrok URL
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch failed with status:', res.status, 'Response:', errorText);
        throw new Error(`Unauthorized: ${errorText}`);
      }
      const user = await res.json();
      console.log('🆕 User registered and verified:', user);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Signup failed:', err.message, err.stack);
      let errorMessage = 'Something went wrong. Please try again.';
      if (err.message.includes('auth/email-already-in-use')) {
        errorMessage = 'This email is already taken. Try another!';
      } else if (err.message.includes('auth/invalid-email')) {
        errorMessage = 'That email doesn’t look right. Try again!';
      } else if (err.message.includes('auth/weak-password')) {
        errorMessage = 'Your password is too weak. Use at least 6 characters!';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('net::ERR_CONNECTION_TIMED_OUT')) {
        errorMessage = 'Can’t connect to the server. Check your network or try again later.';
      }
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: errorMessage,
      });
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#d8c4f3', '#f4edff', '#ffffff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.headerGradient}
      />

      <Svg width={width} height={waveHeight} style={styles.wave}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#d8c4f3" stopOpacity="1" />
            <Stop offset="70%" stopColor="#f4edff" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Path
          d={`M0,${waveHeight * 0.6} C ${width * 0.3},${waveHeight * 0.9} ${width * 0.7},${waveHeight * 0.3} ${width},${waveHeight * 0.6} L ${width},0 L0,0 Z`}
          fill="url(#grad)"
        />
      </Svg>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.headerText}>Sign Up</Text>

        <View style={[styles.form, { zIndex: 20 }]}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, { color: isNameFocused || name ? '#000000' : '#a09d9d' }]}
            placeholder="Your name"
            placeholderTextColor="#a09d9d"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { color: isEmailFocused || email ? '#000000' : '#a09d9d' }]}
            placeholder="Your email"
            placeholderTextColor="#a09d9d"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => setIsEmailFocused(false)}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { borderWidth: 0, marginBottom: 0, flex: 1, color: isPasswordFocused || password ? '#000000' : '#a09d9d' }]}
              placeholder="Enter your password"
              placeholderTextColor="#a09d9d"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <Image
              source={require('../../assets/icons/lock.png')}
              style={styles.lockIcon}
            />
          </View>

          <TouchableOpacity
            style={[styles.buttonPrimary, { zIndex: 10 }]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Already Registered?{' '}
            <Text style={styles.footerLink} onPress={() => router.push(routes.login)}>
              Log in here.
            </Text>
          </Text>
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contentContainer: { alignItems: 'center' },
  headerGradient: {
    position: 'absolute',
    top: 0,
    height: waveHeight * 0.8,
    width: '100%',
    zIndex: -1,
  },
  wave: { position: 'absolute', top: 0, zIndex: 0 },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5E2B97',
    marginTop: 100,
    textAlign: 'center',
  },
  form: { width: '90%', marginTop: 150 },
  label: { fontSize: 14, color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#5E2B97',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5E2B97',
    borderRadius: 8,
    paddingHorizontal: 8,
    width: '100%',
    marginBottom: 24,
  },
  lockIcon: {
    width: 20,
    height: 20,
    tintColor: '#5E2B97',
    marginLeft: 8,
  },
  buttonPrimary: {
    backgroundColor: '#5E2B97',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 14,
  },
  footerLink: {
    color: '#5E2B97',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;

