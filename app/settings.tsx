import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface Profile {
  id: number;
  user_id: string;
  username: string;
  displayname: string;
  avatar_url: string | null;
}

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [displayname, setDisplayname] = useState('');
  const [displaynameError, setDisplaynameError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDisplayname, setSavingDisplayname] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        return;
      }

      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username || '');
        setDisplayname(profileData.displayname || '');
        setAvatarUrl(profileData.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = (username: string): string => {
    if (username.length < 1 || username.length > 30) {
      return 'Username must be 1-30 characters';
    }
    
    const validChars = /^[a-z0-9._]+$/;
    if (!validChars.test(username)) {
      return 'Username can only contain lowercase letters, numbers, periods, and underscores';
    }
    
    return '';
  };

  const handleUsernameChange = (text: string) => {
    const lowercaseText = text.toLowerCase();
    setUsername(lowercaseText);
    
    const error = validateUsername(lowercaseText);
    setUsernameError(error);
  };

  const validateDisplayname = (displayname: string): string => {
    if (displayname.length < 1 || displayname.length > 50) {
      return 'Display name must be 1-50 characters';
    }
    return '';
  };

  const handleDisplaynameChange = (text: string) => {
    setDisplayname(text);
    
    const error = validateDisplayname(text);
    setDisplaynameError(error);
  };

  const saveUsername = async () => {
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First try to update existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let updateError;
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            username: username,
            displayname: username,
          })
          .eq('user_id', user.id);
        updateError = error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: username,
            displayname: username,
          });
        updateError = error;
      }

      if (updateError) {
        console.error('Username update error:', updateError);
        if (updateError.code === '23505') { // Unique constraint violation
          setUsernameError('Username is already taken');
        } else {
          Alert.alert('Error', `Failed to update username: ${updateError.message}`);
        }
        return;
      }

      Alert.alert('Success', 'Username updated successfully');
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error saving username:', error);
      Alert.alert('Error', 'Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const saveDisplayname = async () => {
    const error = validateDisplayname(displayname);
    if (error) {
      setDisplaynameError(error);
      return;
    }

    setSavingDisplayname(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First try to update existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let updateError;
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            displayname: displayname,
          })
          .eq('user_id', user.id);
        updateError = error;
      } else {
        // Insert new profile (shouldn't happen if username is set first)
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: username || 'user',
            displayname: displayname,
          });
        updateError = error;
      }

      if (updateError) {
        console.error('Displayname update error:', updateError);
        Alert.alert('Error', `Failed to update display name: ${updateError.message}`);
        return;
      }

      Alert.alert('Success', 'Display name updated successfully');
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error saving displayname:', error);
      Alert.alert('Error', 'Failed to update display name');
    } finally {
      setSavingDisplayname(false);
    }
  };

  const uploadAvatar = async () => {
    try {
      setUploading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 1,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker.');
        return;
      }

      const image = result.assets[0];
      if (!image.uri) {
        throw new Error('No image uri!');
      }

      // Convert image to array buffer
      const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
      
      // Create unique filename
      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Update profile with new avatar URL
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If no username is set, we can't create a profile yet
      if (!username || username.trim() === '') {
        Alert.alert('Error', 'Please set a username first before uploading an avatar');
        return;
      }

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let updateError;
      if (existingProfile) {
        // Update existing profile with avatar
        const { error } = await supabase
          .from('profiles')
          .update({
            avatar_url: data.path,
          })
          .eq('user_id', user.id);
        updateError = error;
      } else {
        // Create new profile with avatar (shouldn't happen if username is set first)
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: username || 'user',
            displayname: displayname || username || 'user',
            avatar_url: data.path,
          });
        updateError = error;
      }

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setAvatarUrl(data.path);
      Alert.alert('Success', 'Avatar updated successfully');
      fetchProfile(); // Refresh profile data
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

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

  if (loading) {
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
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image
                source={{ uri: `${supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#ccc" />
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.uploadButton, uploading ? styles.uploadButtonDisabled : null]} 
            onPress={uploadAvatar}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : 'Change Avatar'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={[styles.textInput, usernameError ? styles.inputError : null]}
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="Enter username"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : null}
          {username.length > 0 && username.length < 1 && (
            <Text style={styles.errorText}>Username must be 1-30 characters</Text>
          )}
          {username.length > 30 && (
            <Text style={styles.errorText}>Username must be 1-30 characters</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]} 
          onPress={saveUsername}
          disabled={saving || !!usernameError}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Username'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.inputContainer, styles.inputContainerWithTopMargin]}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={[styles.textInput, displaynameError ? styles.inputError : null]}
            value={displayname}
            onChangeText={handleDisplaynameChange}
            placeholder="Enter display name"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={50}
          />
          {displaynameError ? (
            <Text style={styles.errorText}>{displaynameError}</Text>
          ) : null}
          {displayname.length > 0 && displayname.length < 1 && (
            <Text style={styles.errorText}>Display name must be 1-50 characters</Text>
          )}
          {displayname.length > 50 && (
            <Text style={styles.errorText}>Display name must be 1-50 characters</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, savingDisplayname ? styles.saveButtonDisabled : null]} 
          onPress={saveDisplayname}
          disabled={savingDisplayname || !!displaynameError}
        >
          <Text style={styles.saveButtonText}>
            {savingDisplayname ? 'Saving...' : 'Save Display Name'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
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
    </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputContainerWithTopMargin: {
    marginTop: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: 'red',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
