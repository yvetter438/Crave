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
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingScreen() {
  const { height } = Dimensions.get('window');
  const [username, setUsername] = useState('');
  const [displayname, setDisplayname] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.user) {
      router.replace('/');
      return;
    }

    // Pre-populate with existing profile data or suggested values
    const fetchExistingProfile = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileData) {
          // Pre-populate with existing data
          setUsername(profileData.username || '');
          setDisplayname(profileData.displayname || '');
          setBio(profileData.bio || '');
          setLocation(profileData.location || '');
          setInstagramHandle(profileData.instagram_handle || '');
          if (profileData.avatar_url) {
            // For existing avatar, we'd need to get the public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(profileData.avatar_url);
            setAvatarUri(data.publicUrl);
          }
        }
      } catch (error) {
        console.log('No existing profile found, using defaults');
      }

      // If no existing data, use email-based suggestions
      if (!username && !displayname) {
        const email = session.user.email;
        if (email) {
          const emailPrefix = email.split('@')[0];
          const suggestedUsername = emailPrefix.toLowerCase().replace(/[^a-z0-9._]/g, '');
          setUsername(suggestedUsername);
          setDisplayname(emailPrefix);
        }
      }
    };

    fetchExistingProfile();
  }, [session]);

  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to upload an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarUri || !session?.user) return null;

    setUploading(true);
    try {
      // Get file extension, default to jpg for iOS screenshots
      let fileExt = avatarUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      
      // Handle iOS screenshots which might not have proper extensions
      if (avatarUri.includes('ph://') || avatarUri.includes('assets-library://')) {
        fileExt = 'jpg'; // iOS screenshots are typically JPG
      }
      
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const mimeType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      
      console.log('Uploading avatar:', { fileName, avatarUri, fileExt, mimeType });

      // Use fetch to read the file as ArrayBuffer (most reliable for RN + Supabase)
      const response = await fetch(avatarUri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('ArrayBuffer created:', { size: arrayBuffer.byteLength });

      // Upload using ArrayBuffer (most compatible with Supabase)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);
      return data.path;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      
      // Provide more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Upload Error', `Failed to upload avatar: ${errorMessage}. You can add one later in settings.`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const validateUsername = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setUsername(cleaned);
  };

  const completeOnboarding = async () => {
    if (!session?.user) return;

    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter a username to continue.');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Username Too Short', 'Username must be at least 3 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Upload avatar if selected
      const avatarPath = await uploadAvatar();

      // Update profile with onboarding data
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim().toLowerCase(),
          displayname: displayname.trim() || username.trim(),
          bio: bio.trim() || null,
          location: location.trim() || null,
          instagram_handle: instagramHandle.trim() || null,
          avatar_url: avatarPath,
          onboarding_completed: true,
        })
        .eq('user_id', session.user.id);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Username Taken', 'This username is already taken. Please choose another one.');
          return;
        }
        throw error;
      }

      // Success! Navigate to main app
      Alert.alert(
        'Welcome to Crave! 🎉',
        'Your profile has been set up successfully. Start discovering amazing food!',
        [
          {
            text: 'Let\'s Go!',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );

    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !username.trim()) {
      Alert.alert('Username Required', 'Please enter a username to continue.');
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const goBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Your Username</Text>
            <Text style={styles.stepDescriptionCompact}>
              How other food lovers will find you
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                placeholder="username"
                placeholderTextColor={Colors.textSecondary}
                style={styles.usernameInput}
                onChangeText={validateUsername}
                value={username}
                autoCapitalize="none"
                maxLength={30}
              />
            </View>
            
            <Text style={styles.characterCount}>{username.length}/30</Text>
            
            <View style={styles.requirementsCompact}>
              <Text style={styles.requirementItemCompact}>3-30 characters • Letters, numbers, dots, underscores • Must be unique</Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Your Display Name</Text>
            <Text style={styles.stepDescription}>
              This is the name that appears on your profile. It can be your real name or anything you prefer.
            </Text>
            
            <TextInput
              placeholder="Display Name"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              onChangeText={setDisplayname}
              value={displayname}
              maxLength={50}
            />
            
            <Text style={styles.characterCount}>{displayname.length}/50</Text>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tell Us About Yourself</Text>
            <Text style={styles.stepDescription}>
              Share your bio and location to help others discover your food taste! (All optional)
            </Text>
            
            <TextInput
              placeholder="Bio - Tell us about your food preferences..."
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, styles.bioInput]}
              onChangeText={setBio}
              value={bio}
              maxLength={150}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.characterCount}>{bio.length}/150</Text>
            
            <TextInput
              placeholder="Location (e.g., San Francisco, CA)"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              onChangeText={setLocation}
              value={location}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{location.length}/100</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                placeholder="Instagram handle (optional)"
                placeholderTextColor={Colors.textSecondary}
                style={styles.usernameInput}
                onChangeText={setInstagramHandle}
                value={instagramHandle}
                autoCapitalize="none"
                maxLength={30}
              />
            </View>
            <Text style={styles.characterCount}>{instagramHandle.length}/30</Text>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Your Photo</Text>
            <Text style={styles.stepDescription}>
              Add a profile photo so others can recognize you! (Optional)
            </Text>
            
            <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={Colors.textSecondary} />
                </View>
              )}
              <Text style={styles.avatarText}>
                {avatarUri ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
            
            {uploading && (
              <Text style={styles.uploadingText}>Uploading photo...</Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              {currentStep > 1 ? (
                <TouchableOpacity style={styles.backButton} onPress={goBackStep}>
                  <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={styles.backButtonPlaceholder} />
              )}
              
              <Text style={styles.stepIndicator}>
                Step {currentStep} of 4
              </Text>
              
              <View style={styles.backButtonPlaceholder} />
            </View>
            
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Let's set up your profile to get started</Text>
            
            <View style={styles.progressContainer}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.progressDot,
                    step <= currentStep && styles.progressDotActive
                  ]}
                />
              ))}
            </View>
          </View>

          {renderStep()}

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={nextStep}
              disabled={loading || uploading}
            >
              <Text style={styles.primaryButtonText}>
                {loading || uploading ? 'Loading...' : (currentStep === 4 ? 'Complete Setup' : 'Next')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={skipStep}
              disabled={loading || uploading}
            >
              <Text style={styles.secondaryButtonText}>
                {currentStep === 4 ? 'Skip for Now' : 'Skip'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  stepIndicator: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: 15,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  stepDescriptionCompact: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  inputPrefix: {
    fontSize: 16,
    color: Colors.text,
    paddingLeft: 16,
    fontWeight: '500',
  },
  usernameInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 20,
  },
  requirements: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  requirementItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  requirementsCompact: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
  },
  requirementItemCompact: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  avatarText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingVertical: 30,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  uploadingText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
