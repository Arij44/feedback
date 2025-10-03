// components/ScreenLayout.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function ScreenLayout({ children }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f0fb', // match your screen bg
  },
});
