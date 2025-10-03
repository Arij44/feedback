import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => router.replace('/welcome'), 2000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={s.container}>
      <Image source={require('../../assets/images/logo.png')} style={s.logo} />
      <ActivityIndicator size="large" color="#5E2B97" style={s.loader} />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0FA', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 350, height: 350, resizeMode: 'contain' },
  loader: { position: 'absolute', bottom: height * 0.1 },
});

export default SplashScreen;