import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '../../components/navigation/TabBarIcon';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="schulcloud"
        options={{
          title: 'schul.cloud',
          tabBarIcon: ({ color, focused }) => (
           <Ionicons name="chatbox-ellipses" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="moodle"
        options={{
          title: 'Moodle',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'school' : 'school-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="office"
        options={{
          title: 'Office',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'document' : 'document-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="untis"
        options={{
          title: 'WebUntis',
          tabBarIcon: ({ color, focused }) => (
            <AntDesign name="calendar" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
