import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const { height } = Dimensions.get('window');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    checkResetSession();
  }, []);

  const checkResetSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.user) {
        setIsValidSession(true);
      } else {
        // No valid session, redirect to login
        Alert.alert(
          'Invalid Reset Link',
          'This password reset link is invalid or has expired. Please request a new one.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking reset session:', error);
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/')
          }
        ]
      );
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Password Required', 'Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Don\'t Match', 'Please make sure both passwords match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        Alert.alert('Reset Failed', error.message);
      } else {
        Alert.alert(
          'Password Updated!',
          'Your password has been successfully updated. You can now sign in with your new password.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Sign out to ensure clean state, then redirect to login
                supabase.auth.signOut();
                router.replace('/');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    router.replace('/');
  };

  if (!isValidSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Verifying reset link...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={goBackToLogin}>
            <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
          </Pressable>
          <Text style={styles.title}>Reset Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Enter your new password below. Make sure it's secure and easy for you to remember.
          </Text>

          <TextInput
            placeholder="New Password"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            onChangeText={setNewPassword}
            value={newPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            autoComplete="new-password"
          />

          <TextInput
            placeholder="Confirm New Password"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            autoComplete="new-password"
          />

          <Pressable
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handlePasswordReset}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </Text>
          </Pressable>

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirementItem}>• At least 6 characters long</Text>
            <Text style={styles.requirementItem}>• Should be unique and secure</Text>
            <Text style={styles.requirementItem}>• Avoid using personal information</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textInverse,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  requirements: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  requirementItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
    lineHeight: 20,
  },
});
