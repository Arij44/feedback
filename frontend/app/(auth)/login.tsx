import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
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
  StatusBar,
} from 'react-native';
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { loginUser } from '../../firebase/auth';
import { auth } from '@/firebase/config';
import { routes } from '../utils/_routes';

const { width } = Dimensions.get('window');
const waveHeight = 180;

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const validateForm = () => {
    console.log('Validating form', { email, password });
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      console.log('Missing fields');
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in both email and password.',
      });
      Alert.alert('Missing Fields', 'Please fill in both email and password.');
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
    console.log('Form validated successfully');
    return true;
  };
  
 
      const API_URLS = [
        'http://localhost:8000',
        'http://192.168.1.48:8000',
        'http://192.168.100.25:8000',
        'http://10.60.122.190:8000',
      ];
      const API_URL =
        Platform.OS === 'web'
          ? API_URLS[0]
          : API_URLS[3]; 

  const handleLogin = async () => {
    console.log('Login button pressed', { email, password });
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('Attempting Firebase login');
      const idToken = await loginUser(email, password);
      console.log('Firebase login successful, idToken:', idToken);
      console.log("✅ Logged in UID:", auth.currentUser?.uid); // should not be null
      if (!idToken) {
        console.error('No ID token received from Firebase');
        throw new Error('Login failed, no ID token received');
      }

      const user = (await import('firebase/auth')).getAuth().currentUser;
      if (user) {
        console.log('Sending user to backend...');
        await sendUserToBackend(user);
      }

      console.log('Fetching user data from backend');
      console.log("Firebase ID Token:", idToken);
      const res = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch failed with status:', res.status, 'Response:', errorText);
        throw new Error(`Unauthorized: ${errorText}`);
      }

      const userData = await res.json();
      console.log('✅ Authenticated user:', userData);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Login failed:', err.message, err.stack);
      let errorMessage = 'Something went wrong. Please try again.';
      if (err.message.includes('auth/invalid-credential')) {
        errorMessage = 'Oops, wrong email or password. Try again!';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('net::ERR_CONNECTION_TIMED_OUT')) {
        errorMessage = 'Cant connect to the server. Check your network or try again later.';
      }
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    getIdToken: () => Promise<string>;
  }

  interface UserData {
    uid: string;
    email: string | null;
    name: string | null;
    photo_url: string | null;
  }

  const sendUserToBackend = async (user: User): Promise<void> => {
    const idToken = await user.getIdToken();

    const userData: UserData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      photo_url: user.photoURL,
    };

    await fetch(`${API_URL}/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(userData),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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

        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.headerText}>Login</Text>

          <View style={[styles.form, { zIndex: 20 }]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { color: isEmailFocused || email ? '#000000' : '#a09d9d' }]}
              placeholder="Enter your email"
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
                source={require('@/assets/icons/lock.png')}
                style={styles.lockIcon}
              />
            </View>

            <TouchableOpacity
              style={[styles.buttonPrimary, { zIndex: 10 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Logging in...' : 'Log in'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Not have account?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => router.push(routes.signup)}
              >
                Signup here
              </Text>
            </Text>
          </View>
        </ScrollView>
        <Toast />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  contentContainer: { 
    alignItems: 'center',
    paddingBottom: 20, // Add padding to prevent bottom overlap
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    height: waveHeight * 0.8,
    width: '100%',
    zIndex: -1,
  },
  wave: { 
    position: 'absolute', 
    top: 0, 
    zIndex: 0,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerText: {
    
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5E2B97',
    marginTop: 100,
    textAlign: 'center',
  },
  form: { 
    width: '90%', 
    marginTop: 150,
    marginBottom: 20, // Add margin to prevent keyboard overlap
  },
  label: { 
    fontSize: 14, 
    color: '#333', 
    marginBottom: 8 
  },
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

export default LoginScreen;