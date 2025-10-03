import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type HeaderProps = {
  title: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  darkMode?: boolean;
};

const Header: React.FC<HeaderProps> = ({ title, iconName, darkMode = false }) => {
  const backgroundColor = darkMode ? '#1c1c1e' : '#DEDCE4';
  const textColor = darkMode ? '#ffffff' : '#5E2B97';

  return (
    <View style={[styles.header, { backgroundColor }]}>
      {iconName && (
        <Ionicons
          name={iconName}
          size={22}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginRight: 8,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    marginTop: 6,
    fontWeight: 'bold',
  },
});

export default Header;
