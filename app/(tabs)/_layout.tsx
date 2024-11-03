import { Tabs } from 'expo-router';
import React from 'react';
import { useOrientation } from '../../hooks/useOrientation';

import { TabBarIcon } from '../../components/navigation/TabBarIcon';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const orientation = useOrientation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
          height: orientation === 'landscape' ? 40 : 50,
        },
        tabBarLabelStyle: {
          fontSize: orientation === 'landscape' ? 10 : 12,
        },
        tabBarIconStyle: {
          marginTop: orientation === 'landscape' ? 0 : 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} size={orientation === 'landscape' ? 20 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="schulcloud"
        options={{
          title: 'schul.cloud',
          tabBarIcon: ({ color, focused }) => (
           <Ionicons name="chatbox-ellipses" color={color} size={orientation === 'landscape' ? 20 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="moodle"
        options={{
          title: 'Moodle',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'school' : 'school-outline'} color={color} size={orientation === 'landscape' ? 20 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="office"
        options={{
          title: 'Office',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'document' : 'document-outline'} color={color} size={orientation === 'landscape' ? 20 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="wiki"
        options={{
          title: 'BBZ Wiki',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'book' : 'book-outline'} color={color} size={orientation === 'landscape' ? 20 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="untis"
        options={{
          title: 'WebUntis',
          tabBarIcon: ({ color, focused }) => (
            <AntDesign name="calendar" color={color} size={orientation === 'landscape' ? 20 : 24} />
          ),
        }}
      />
    </Tabs>
  );
}
