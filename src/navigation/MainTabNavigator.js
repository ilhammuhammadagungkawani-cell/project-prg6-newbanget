import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import TimelineScreen from '../screens/TimelineScreen';
import WalletScreen from '../screens/WalletScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ActivityScreen from '../screens/ActivityScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#10ac84',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 8,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName;

          if (route.name === 'Timeline') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Budget') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Activity') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={focused ? 22 : 20} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{ title: t('tab_timeline') }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: t('tab_wallet') }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{ title: t('tab_budget') }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{ title: t('tab_activity') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('tab_settings') }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
