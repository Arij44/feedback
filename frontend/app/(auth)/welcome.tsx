import { useRouter } from 'expo-router';
import { routes } from "../utils/_routes";

import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const waveHeight = 200;

const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  return (
    <View style={w.container}>
      <Svg width={width} height={waveHeight} style={w.wave}>
        <Path d={`M0,${waveHeight * 0.6} Q${width / 2},${waveHeight} ${width},${waveHeight * 0.6} L${width},0 L0,0 Z`} fill="#F2F0FA" />
      </Svg>
      <View style={w.content}>
        <Image source={require('../../assets/images/logo.png')} style={w.logo} />
        <Text style={w.title}>Welcome!</Text>
        <TouchableOpacity style={w.buttonPrimary} onPress={() => router.push(routes.login)}>
          <Text style={w.btnTextPrimary}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={w.buttonSecondary} onPress={() => router.push(routes.signup)}>
          <Text style={w.btnTextSecondary}>Signup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const w = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0FA' },
  wave: { position: 'absolute', top: 0 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  logo: { width: 350, height: 350, marginBottom: -20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#5E2B97', marginBottom: 30 },
  buttonPrimary: { backgroundColor: '#5E2B97', width: '80%', padding: 15, borderRadius: 30, marginBottom: 15 },
  btnTextPrimary: { color: '#FFF', textAlign: 'center', fontSize: 16 },
  buttonSecondary: { borderWidth: 1, borderColor: '#5E2B97', width: '80%', padding: 15, borderRadius: 30 },
  btnTextSecondary: { color: '#5E2B97', textAlign: 'center', fontSize: 16 },
});

export default WelcomeScreen;
