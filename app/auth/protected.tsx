import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  return (
    <SafeAreaView>
      <View>
        <Text style={{fontSize: 30}}>Protected Page</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  
});
