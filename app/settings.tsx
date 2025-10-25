import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import TextFieldEditor from '@/components/TextFieldEditor';

interface Profile {
  id: number;
  user_id: string;
  username: string;
  displayname: string;
  avatar_url: string | null;
  bio?: string;
  location?: string;
  instagram_handle?: string;
}

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [displayname, setDisplayname] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [currentField, setCurrentField] = useState<{
    name: string;
    title: string;
    value: string;
    maxLength: number;
    multiline: boolean;
    autoCapitalize: 'none' | 'sentences' | 'words' | 'characters';
    showAtPrefix: boolean;
  } | null>(null);

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
        setBio(profileData.bio || '');
        setLocation(profileData.location || '');
        setInstagramHandle(profileData.instagram_handle || '');
        setAvatarUrl(profileData.avatar_url);
      }

      // Check if user is a moderator
      checkModeratorStatus(user.id);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkModeratorStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('moderators')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setIsModerator(true);
      }
    } catch (error) {
      // Not a moderator or error occurred
      setIsModerator(false);
    }
  };

  const validateUsername = (text: string): boolean => {
    if (text.length < 1 || text.length > 30) return false;
    const validChars = /^[a-z0-9._]+$/;
    return validChars.test(text);
  };

  const validateInstagramHandle = (text: string): boolean => {
    if (text.length === 0) return true; // Optional field
    if (text.length > 30) return false;
    const validChars = /^[a-zA-Z0-9._]+$/;
    return validChars.test(text);
  };

  const openFieldEditor = (fieldName: string) => {
    let fieldConfig = {
      name: fieldName,
      title: '',
      value: '',
      maxLength: 100,
      multiline: false,
      autoCapitalize: 'sentences' as 'none' | 'sentences' | 'words' | 'characters',
      showAtPrefix: false,
    };

    switch (fieldName) {
      case 'username':
        fieldConfig = {
          name: 'username',
          title: 'Username',
          value: username,
          maxLength: 30,
          multiline: false,
          autoCapitalize: 'none',
          showAtPrefix: false,
        };
        break;
      case 'displayname':
        fieldConfig = {
          name: 'displayname',
          title: 'Name',
          value: displayname,
          maxLength: 35,
          multiline: false,
          autoCapitalize: 'words',
          showAtPrefix: false,
        };
        break;
      case 'bio':
        fieldConfig = {
          name: 'bio',
          title: 'Bio',
          value: bio,
          maxLength: 150,
          multiline: true,
          autoCapitalize: 'sentences',
          showAtPrefix: false,
        };
        break;
      case 'location':
        fieldConfig = {
          name: 'location',
          title: 'Location',
          value: location,
          maxLength: 150,
          multiline: false,
          autoCapitalize: 'words',
          showAtPrefix: false,
        };
        break;
      case 'instagram':
        fieldConfig = {
          name: 'instagram',
          title: 'Instagram',
          value: instagramHandle,
          maxLength: 30,
          multiline: false,
          autoCapitalize: 'none',
          showAtPrefix: true,
        };
        break;
    }

    setCurrentField(fieldConfig);
    setEditorVisible(true);
  };

  const handleFieldSave = (value: string) => {
    if (!currentField) return;

    setHasChanges(true);
    
    const fieldName = currentField.name;
    
    switch (fieldName) {
      case 'username':
        setUsername(value.toLowerCase());
        break;
      case 'displayname':
        setDisplayname(value);
        break;
      case 'bio':
        setBio(value);
        break;
      case 'location':
        setLocation(value);
        break;
      case 'instagram':
        setInstagramHandle(value.replace('@', ''));
        break;
    }
    
    // Close editor after save
    handleEditorClose();
  };

  const handleEditorClose = () => {
    setEditorVisible(false);
    setCurrentField(null);
  };

  const saveProfile = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter a username');
      return;
    }

    if (!validateUsername(username)) {
      Alert.alert('Invalid Username', 'Username must be 1-30 characters and contain only lowercase letters, numbers, periods, and underscores');
      return;
    }

    if (displayname.length < 1 || displayname.length > 35) {
      Alert.alert('Invalid Display Name', 'Display name must be 1-35 characters');
      return;
    }

    if (bio.length > 150) {
      Alert.alert('Bio Too Long', 'Bio must be 150 characters or less');
      return;
    }

    if (location.length > 150) {
      Alert.alert('Location Too Long', 'Location must be 150 characters or less');
      return;
    }

    if (instagramHandle && !validateInstagramHandle(instagramHandle)) {
      Alert.alert('Invalid Instagram Handle', 'Instagram handle must be 30 characters or less and contain only letters, numbers, periods, and underscores');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated. Please log in again.');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: username.trim().toLowerCase(),
          displayname: displayname.trim(),
          bio: bio.trim() || null,
          location: location.trim() || null,
          instagram_handle: instagramHandle.trim() || null,
        })
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '23505') {
          Alert.alert('Username Taken', 'This username is already taken. Please choose another.');
        } else {
          Alert.alert('Error', `Failed to update profile: ${error.message}`);
        }
        return;
      }

      // Success!
      setHasChanges(false);
      Alert.alert('✓ Saved', 'Your profile has been updated', [
        { text: 'OK', onPress: () => fetchProfile() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
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

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, username')
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
        // Create new profile with avatar
        // Use provided username or generate one from email
        const generatedUsername = username.trim() || 
          user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '') || 
          `user_${user.id.slice(0, 8)}`;
        
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: generatedUsername,
            displayname: displayname || generatedUsername,
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
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Instagram-style Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        {hasChanges ? (
          <TouchableOpacity onPress={saveProfile} disabled={saving}>
            <Text style={[styles.doneButton, saving && styles.doneButtonDisabled]}>
              {saving ? '...' : 'Done'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {avatarUrl ? (
            <Image
              source={{ uri: `${supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#bbb" />
            </View>
          )}
          <TouchableOpacity onPress={uploadAvatar} disabled={uploading}>
            <Text style={styles.changePhotoText}>
              {uploading ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Username */}
          <TouchableOpacity 
            style={styles.fieldContainer}
            onPress={() => openFieldEditor('username')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={[styles.fieldValue, !username && styles.fieldPlaceholder]}>
                {username || 'username'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7c7" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Display Name */}
          <TouchableOpacity 
            style={styles.fieldContainer}
            onPress={() => openFieldEditor('displayname')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={[styles.fieldValue, !displayname && styles.fieldPlaceholder]}>
                {displayname || 'Name'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7c7" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Bio */}
          <TouchableOpacity 
            style={styles.fieldContainer}
            onPress={() => openFieldEditor('bio')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Bio</Text>
            <View style={styles.fieldValueContainer}>
              <Text 
                style={[styles.fieldValue, !bio && styles.fieldPlaceholder]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {bio || 'Write a bio...'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7c7" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Location */}
          <TouchableOpacity 
            style={styles.fieldContainer}
            onPress={() => openFieldEditor('location')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Location</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={[styles.fieldValue, !location && styles.fieldPlaceholder]}>
                {location || 'Location'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7c7" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Instagram */}
          <TouchableOpacity 
            style={styles.fieldContainer}
            onPress={() => openFieldEditor('instagram')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Instagram</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={[styles.fieldValue, !instagramHandle && styles.fieldPlaceholder]}>
                {instagramHandle ? `@${instagramHandle}` : 'instagram'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7c7" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          {/* Moderator Dashboard - Only show for moderators */}
          {isModerator && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.moderatorButton]} 
              onPress={() => router.push('/moderator')}
            >
              <Ionicons name="shield-checkmark" size={20} color="#007AFF" style={styles.moderatorIcon} />
              <Text style={[styles.actionButtonText, styles.moderatorButtonText]}>Moderator Dashboard</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Text style={styles.actionButtonText}>Log Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteAccount}>
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Text Field Editor Modal */}
      {currentField && (
        <TextFieldEditor
          visible={editorVisible}
          title={currentField.title}
          value={currentField.value}
          maxLength={currentField.maxLength}
          multiline={currentField.multiline}
          autoCapitalize={currentField.autoCapitalize}
          showAtPrefix={currentField.showAtPrefix}
          onSave={handleFieldSave}
          onClose={handleEditorClose}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095f6',
  },
  doneButtonDisabled: {
    color: '#0095f680',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0095f6',
  },
  formSection: {
    backgroundColor: '#fff',
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    minHeight: 56,
  },
  fieldLabel: {
    width: 100,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  fieldValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
  fieldPlaceholder: {
    color: '#999',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#dbdbdb',
    marginLeft: 116,
  },
  actionsSection: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  actionButton: {
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#0095f6',
    fontWeight: '500',
  },
  moderatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 12,
    borderBottomWidth: 0,
  },
  moderatorIcon: {
    marginRight: 8,
  },
  moderatorButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ed4956',
  },
});
