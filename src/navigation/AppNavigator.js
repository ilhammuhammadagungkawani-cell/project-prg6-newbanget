import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import InitialBalanceScreen from '../screens/InitialBalanceScreen';
import CustomDrawerNavigator from './CustomDrawerNavigator';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import NearbyATMScreen from '../screens/NearbyATMScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const { initialBalance, isFinanceLoading } = useFinance();

  if (isLoading || (user && isFinanceLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10ac84" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user === null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : initialBalance === null ? (
          <Stack.Screen name="InitialBalance" component={InitialBalanceScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={CustomDrawerNavigator} />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ presentation: 'modal' }}
            />

            <Stack.Screen
              name="NearbyATM"
              component={NearbyATMScreen}
              options={{ presentation: 'card' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});

export default AppNavigator;
