import { Text, View, TextInput, StyleSheet, Dimensions, Pressable, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator } from "react-native";
import { Link, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Colors, Gradients } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Image, Ellipse, ClipPath } from 'react-native-svg';
import { AppleSignIn } from '@/components/AppleSignIn';
import { useAuth } from '@/contexts/AuthContext';


export default function Index() {
  const { height, width } = Dimensions.get("window");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegistrationOptions, setShowRegistrationOptions] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  //supabase logic
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in and redirect to main app
  useEffect(() => {
    if (!authLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading]);


  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert(error.message);
    } else {
      router.push('./(tabs)');
    }
    setLoading(false);
  }
  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert(error.message);
    } else if (!session) {
      Alert.alert('Please check your inbox for email verification!');
    }
    setLoading(false);
  }


  const guestLoginHandler = () => {
    router.push('./(tabs)');
  };


  const loginHandler = () => {
    setShowLoginOptions(true);
  }

  const emailLoginHandler = () => {
    setIsRegistering(false);
    setShowLoginOptions(false);
    setShowRegistrationOptions(false);
    setShowEmailForm(true);
  }


  const backToMainFromLoginHandler = () => {
    setShowLoginOptions(false);
  }

  const backToMainFromEmailForm = () => {
    setShowEmailForm(false);
    setShowRegistrationOptions(false);
    setShowLoginOptions(false);
    setEmail('');
    setPassword('');
  }

  const registerHandler = () => {
    setShowRegistrationOptions(true);
  }

  const emailRegisterHandler = () => {
    setIsRegistering(true);
    setShowRegistrationOptions(false);
    setShowLoginOptions(false);
    setShowEmailForm(true);
  }

  const handleAppleSignInSuccess = () => {
    // Clear all states and navigate to main app
    setShowRegistrationOptions(false);
    setShowLoginOptions(false);
    setShowEmailForm(false);
    router.push('./(tabs)');
  }

  const handleAppleSignInError = (error: string) => {
    console.error('Apple Sign In Error:', error);
    // Error is already handled in the AppleSignIn component
  }

  const backToMainHandler = () => {
    setShowRegistrationOptions(false);
  }

  // Show loading screen while checking auth state
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={[StyleSheet.absoluteFill, styles.backgroundContainer]}>
          <Svg height={height + 100} width={width}>
            <ClipPath id="clipPathId">
              <Ellipse cx={width / 2} rx={height} ry={height + 100} />
            </ClipPath>
            <Image 
              href={require('.././assets/images/login-background.png')}
              width={width + 100} 
              height={height + 100}
              preserveAspectRatio="xMidYMid slice"
              x={-50}
              clipPath="url(#clipPathId)"
            />
          </Svg>
        </View>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={[StyleSheet.absoluteFill, styles.backgroundContainer]}>
            <Svg height={height + 100} width={width}>
              <ClipPath id="clipPathId">
                <Ellipse cx={width / 2} rx={height} ry={height + 100} />
              </ClipPath>
              <Image 
                href={require('.././assets/images/login-background.png')}
                width={width + 100} 
                height={height + 100}
                preserveAspectRatio="xMidYMid slice"
                x={-50}
                clipPath="url(#clipPathId)"
              />
            </Svg>
          </View>
          
          {showEmailForm ? (
            <View style={styles.emailFormContainer}>
              <View style={styles.emailFormHeader}>
                <Pressable style={styles.backButtonHeader} onPress={backToMainFromEmailForm}>
                  <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
                </Pressable>
                <Text style={styles.emailFormTitle}>
                  {isRegistering ? 'Create Account' : 'Welcome Back'}
                </Text>
                <View style={{ width: 24 }} />
              </View>
              
              <View style={styles.emailFormContent}>
                <TextInput 
                  placeholder="Email" 
                  placeholderTextColor={Colors.textSecondary} 
                  style={styles.emailFormInput}
                  onChangeText={(text) => setEmail(text)}
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                
                <TextInput 
                  placeholder="Password"  
                  placeholderTextColor={Colors.textSecondary} 
                  style={styles.emailFormInput}
                  onChangeText={(text) => setPassword(text)}
                  value={password}
                  secureTextEntry={true}
                  autoCapitalize="none"
                />
                
                <Pressable 
                  style={styles.emailFormSubmitButton} 
                  onPress={() => {
                    if (isRegistering) {
                      signUpWithEmail();
                    } else {
                      signInWithEmail();
                    }
                  }}
                >
                  <Text style={styles.emailFormSubmitText}>
                    {loading ? 'Loading...' : (isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN')}
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={styles.switchModeButton}
                  onPress={() => {
                    setIsRegistering(!isRegistering);
                    setEmail('');
                    setPassword('');
                  }}
                >
                  <Text style={styles.switchModeText}>
                    {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.bottomContainer}>
              {!showRegistrationOptions && !showLoginOptions ? (
                <>
                  <View style={styles.buttonContainer}>
                    <Pressable style={[styles.button, styles.guestButton]} onPress={guestLoginHandler}>
                      <Text style={[styles.buttonText, styles.guestButtonText]}>BROWSE AS GUEST</Text>
                    </Pressable>
                    
                    <Pressable style={styles.button} onPress={loginHandler}>
                      <Text style={styles.buttonText}>LOG IN</Text>
                    </Pressable>
                  </View>
                  <View style={styles.buttonContainer}>
                    <Pressable style={styles.button} onPress={registerHandler}>
                      <Text style={styles.buttonText}>REGISTER</Text>
                    </Pressable>
                  </View>
                </>
              ) : showRegistrationOptions ? (
                <View style={styles.buttonContainer}>
                  <View style={styles.optionsHeader}>
                    <Pressable style={styles.optionsBackButton} onPress={backToMainHandler}>
                      <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
                    </Pressable>
                    <Text style={styles.registrationTitle}>Choose how to sign up</Text>
                    <View style={{ width: 24 }} />
                  </View>
                  
                  <Pressable style={styles.button} onPress={emailRegisterHandler}>
                    <Ionicons name="mail-outline" size={20} color={Colors.textInverse} style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Continue with Email</Text>
                  </Pressable>
                  
                  <View style={styles.appleButtonContainer}>
                    <AppleSignIn 
                      onSuccess={handleAppleSignInSuccess}
                      onError={handleAppleSignInError}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.buttonContainer}>
                  <View style={styles.optionsHeader}>
                    <Pressable style={styles.optionsBackButton} onPress={backToMainFromLoginHandler}>
                      <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
                    </Pressable>
                    <Text style={styles.registrationTitle}>Choose how to sign in</Text>
                    <View style={{ width: 24 }} />
                  </View>
                  
                  <Pressable style={styles.button} onPress={emailLoginHandler}>
                    <Ionicons name="mail-outline" size={20} color={Colors.textInverse} style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Continue with Email</Text>
                  </Pressable>
                  
                  <View style={styles.appleButtonContainer}>
                    <AppleSignIn 
                      onSuccess={handleAppleSignInSuccess}
                      onError={handleAppleSignInError}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const { height, width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    width: width - 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    gap: 8,
  }, 
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textInverse,
    letterSpacing: 0.5
  },
  bottomContainer: {
    justifyContent: 'flex-end',
    height: height / 2.2,
    paddingBottom: 60,
  },
  backgroundContainer: {
    zIndex: -1,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 25,
    paddingLeft: 10,
    backgroundColor: Colors.surface,
    color: Colors.text,
  },
  formButton: {
    backgroundColor: Colors.accent,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formInputContainer: {
    marginBottom: 70,
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  closeButtonContainer: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 1000,
    backgroundColor: 'white',
    alignItems: 'center',
    borderRadius: 25,
    top: 60,
    zIndex: 1000,
    position: 'absolute',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  closeButton: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonText: {
    color: Colors.text,
  },
  guestButton: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  registrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  switchAuthButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchAuthText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '500',
  },
  emailFormContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emailFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButtonHeader: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  emailFormTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textInverse,
  },
  emailFormContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  emailFormInput: {
    height: 55,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailFormSubmitButton: {
    backgroundColor: Colors.primary,
    height: 55,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  emailFormSubmitText: {
    color: Colors.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchModeButton: {
    alignItems: 'center',
  },
  switchModeText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '500',
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  optionsBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  buttonIcon: {
    marginRight: 4,
  },
  appleButtonContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
});
