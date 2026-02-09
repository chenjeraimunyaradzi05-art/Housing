import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuth } from '../contexts/AuthContext';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Import detail screens
import PropertyDetailScreen from '../screens/main/PropertyDetailScreen';
import InvestmentDetailScreen from '../screens/main/InvestmentDetailScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import FinancialDashboardScreen from '../screens/main/FinancialDashboardScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show nothing while checking auth state
  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
          <Stack.Screen name="InvestmentDetail" component={InvestmentDetailScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="FinancialDashboard" component={FinancialDashboardScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
