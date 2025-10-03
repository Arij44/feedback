import { Tabs } from 'expo-router';
import { useTheme } from '../../components/Themecontext';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { isDarkMode } = useTheme();

  const tabs = [
    { name: 'home', icon: 'home-outline' },
    { name: 'myposts', icon: 'document-text-outline' },
    { name: 'addpost', icon: 'add-circle-outline' },
    { name: 'search', icon: 'search-outline' },
    { name: 'settings', icon: 'settings-outline' },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation, descriptors }) => (
        <View style={[styles.tabBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const icon = tabs.find(t => t.name === route.name)?.icon || 'ellipse-outline';
            const color = isFocused ? '#b28ce0' : '#999';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={styles.tab}
              >
                <Ionicons name={icon as any} size={22} color={color} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="myposts" />
      <Tabs.Screen name="addpost" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
});
