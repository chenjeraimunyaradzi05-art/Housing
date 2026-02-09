import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { colors } from '../theme';

import DashboardScreen from '../screens/main/DashboardScreen';
import PropertiesScreen from '../screens/main/PropertiesScreen';
import InvestmentsScreen from '../screens/main/InvestmentsScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertiesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏢" label="Properties" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Investments"
        component={InvestmentsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📈" label="Invest" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👥" label="Community" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelFocused: {
    color: colors.rose,
    fontWeight: '700',
  },
});
