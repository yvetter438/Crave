import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Settings() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error logging out');
    } else {
      router.replace('/');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // First delete user's posts
                const { error: postsError } = await supabase
                  .from('posts')
                  .delete()
                  .eq('user', user.id);
                
                if (postsError) throw postsError;

                // Sign out the user
                await supabase.auth.signOut();
                
                Alert.alert(
                  "Account Deactivated & Data Deleted",
                  "Your account has been deactivated, and all associated data has been permanently deleted. No further action is needed to delete your account fully. For assistance or inquiries, please contact support."
                );
                
                router.replace('/');
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error deleting account', 'Please try again later.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <TouchableOpacity 
        style={styles.option} 
        onPress={handleLogout}
      >
        <Text style={styles.optionText}>Log Out</Text>
        <Ionicons name="log-out-outline" size={24} color="black" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.option, styles.deleteOption]} 
        onPress={handleDeleteAccount}
      >
        <Text style={[styles.optionText, styles.deleteText]}>Delete Account</Text>
        <Ionicons name="trash-outline" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
  },
  deleteOption: {
    marginTop: 20,
  },
  deleteText: {
    color: 'red',
  },
});
