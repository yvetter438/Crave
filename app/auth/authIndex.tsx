import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  return (
    <SafeAreaView>
      <View>
        <Text> authIndex.tsx </Text>
        <Link href="/auth/protected">
          <Text>Go to protected page</Text>
          <Text>You have been authenticated</Text>
        </Link>
      </View>
    </SafeAreaView>
  )
}

