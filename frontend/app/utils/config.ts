import { Platform } from 'react-native';

const API_URLS = [
  'http://localhost:8000',
  'http://192.168.1.48:8000',
  'http://192.168.100.25:8000',
  'https://10.60.122.190:8000',
  'https://20.20.1.83:8000', 
];

export const API_URL =
  Platform.OS === 'web' ? API_URLS[0] : API_URLS[3];
