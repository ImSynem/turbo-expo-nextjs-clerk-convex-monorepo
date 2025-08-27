import { FormInput } from '@/components/ui/FormInput';
import { LoginValidation } from '@/shared/validations/clerk';
import { useLoginStore } from '@/store/login';
import { twFullConfig } from '@/utils/twconfig';
import { isClerkAPIResponseError, useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { zodResolver } from '@hookform/resolvers/zod';
import Checkbox from 'expo-checkbox';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';

type FormData = z.infer<typeof LoginValidation>;

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'apple' | 'email' | false>(false);
  const { setEmail } = useLoginStore();

  const { startSSOFlow } = useSSO();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting: formIsSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(LoginValidation),
    mode: 'onChange',
    defaultValues: {
      email: '',
      terms: false,
    },
  });

  const handleSignInWithSSO = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isSignInLoaded) return;
    
    setLoading(strategy.replace('oauth_', '') as 'google' | 'apple');
    
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(app)/(authenticated)/(tabs)/profile');
      }
    } catch (err) {
      console.error('OAuth error:', err);
      Alert.alert('Error', 'Failed to sign in with OAuth. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (data: FormData) => {
    if (!isSignUpLoaded) return;
    
    try {
      setLoading('email');
      setEmail(data.email);

      console.log('Creating sign up for email:', data.email);
      
      // First, try to create a sign-up
      const signUpResult = await signUp.create({
        emailAddress: data.email,
      });
      
      console.log('Sign up result:', signUpResult);
      
      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      console.log('Email verification prepared');
      
      // Navigate to verification page
      router.push('/verify');
    } catch (error) {
      console.error('Sign up error:', error);
      
      if (isClerkAPIResponseError(error)) {
        if (error.status === 422) {
          console.log('User already exists, attempting sign in instead');
          // User already exists, try to sign in instead
          await handleSignInWithEmail(data.email);
        } else {
          console.error('Sign up error details:', error.errors);
          const errorMessage = error.errors?.[0]?.message || 'Something went wrong. Please try again.';
          
          // Set form error for better UX if it's an email-related error
          if (errorMessage.toLowerCase().includes('email')) {
            setError('email', { message: errorMessage });
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      } else {
        console.error('Unexpected error:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithEmail = async (email: string) => {
    if (!isSignInLoaded) return;
    
    try {
      setLoading('email');
      
      const signInAttempt = await signIn.create({
        strategy: 'email_code',
        identifier: email,
      });
      
      console.log('Sign in attempt created:', signInAttempt.status);
      
      // Navigate to verification page for login
      router.push('/verify?isLogin=true');
    } catch (error) {
      console.error('Sign in error:', error);
      
      if (isClerkAPIResponseError(error)) {
        Alert.alert('Error', error.errors?.[0]?.message || 'Failed to initiate sign in.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPress = (linkType: 'terms' | 'privacy') => {
    console.log(`Link pressed: ${linkType}`);
    Linking.openURL(
      linkType === 'terms' ? 'https://galaxies.dev/terms' : 'https://galaxies.dev/privacy'
    );
  };

  const signInWithPasskey = async () => {
    if (!isSignInLoaded) return;
    
    try {
      const signInAttempt = await signIn.authenticateWithPasskey({
        flow: 'discoverable',
      });

      if (signInAttempt?.status === 'complete') {
        router.replace('/(app)/(authenticated)/(tabs)/profile');
      } else {
        console.error('Passkey authentication incomplete:', signInAttempt);
        Alert.alert('Error', 'Passkey authentication was not completed.');
      }
    } catch (err) {
      console.error('Passkey error:', err);
      Alert.alert('Error', 'Failed to authenticate with passkey. Please try again.');
    }
  };

  // Don't render until Clerk is loaded
  if (!isSignUpLoaded || !isSignInLoaded) {
    return (
      <View className="flex-1 bg-black pt-safe items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black pt-safe">
      {/* Loading overlay */}
      {(formIsSubmitting || loading === 'email') && (
        <View className="absolute inset-0 bg-black bg-opacity-50 z-50 items-center justify-center">
          <View className="bg-gray-800 p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color="#fff" />
            <Text className="text-white mt-4 font-Poppins_500Medium">
              {loading === 'email' ? 'Processing...' : 'Validating...'}
            </Text>
          </View>
        </View>
      )}
      
      <View className="flex-1 p-6">
        <View className="flex-row justify-end">
          <Link href="/faq" asChild>
            <TouchableOpacity className="bg-gray-700 rounded-xl p-2">
              <Feather name="help-circle" size={30} color="white" />
            </TouchableOpacity>
          </Link>
        </View>

        <View className="items-center mb-8 pt-8">
          <View className="flex-row">
            <Image source={require('@/assets/images/logo.png')} className="w-40 h-40" />
          </View>
          <Text className="text-gray-400 text-md mt-2 font-Poppins_400Regular">
            Acme
          </Text>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email?.message}
              containerClassName="mb-6"
            />
          )}
        />

        <Controller
          control={control}
          name="terms"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row items-center mb-6">
              <Checkbox
                value={value}
                onValueChange={(newValue) => {
                  console.log('Checkbox value changed:', newValue);
                  onChange(newValue);
                }}
                color={value ? (twFullConfig.theme.colors as any).primary : undefined}
                className="mr-3"
              />
              <Text className="text-gray-400 text-md font-Poppins_500Medium flex-1 flex-wrap">
                I agree to the{' '}
                <Text className="text-white underline" onPress={() => handleLinkPress('terms')}>
                  Terms of Service
                </Text>{' '}
                and acknowledge Captions&apos;{' '}
                <Text className="text-white underline" onPress={() => handleLinkPress('privacy')}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          )}
        />

        {errors.terms && (
          <Text className="text-red-500 text-sm font-Poppins_400Regular mb-4 text-center">
            {errors.terms.message}
          </Text>
        )}

        <TouchableOpacity
          className={`w-full py-4 rounded-lg mb-14 transition-colors duration-300 ${
            !isValid || formIsSubmitting || loading === 'email' ? 'bg-gray-800' : 'bg-primary'
          }`}
          onPress={handleSubmit(handleEmailSignIn)}
          disabled={!isValid || formIsSubmitting || loading === 'email'}>
          {formIsSubmitting || loading === 'email' ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-Poppins_600SemiBold text-lg ">
              Continue
            </Text>
          )}
        </TouchableOpacity>

        <View className="gap-4">
          <Pressable
            className="w-full flex-row justify-center items-center bg-gray-800 p-4 rounded-lg"
            onPress={() => handleSignInWithSSO('oauth_apple')}
            disabled={!!loading}>
            {loading === 'apple' ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={24} color="white" />
                <Text className="text-white text-center font-Poppins_600SemiBold ml-3 text-base">
                  Continue with Apple
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            className="w-full flex-row justify-center items-center bg-gray-800 p-4 rounded-lg"
            onPress={() => handleSignInWithSSO('oauth_google')}
            disabled={!!loading}>
            {loading === 'google' ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Image source={require('@/assets/images/google.webp')} className="w-6 h-6" />
                <Text className="text-white text-center font-Poppins_600SemiBold ml-3 text-base">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View className="items-center pt-6">
          {/* <TouchableOpacity onPress={signInWithPasskey}>
            <Text className="text-gray-400 text-center font-Poppins_600SemiBold text-base">
              Continue with Passkey
            </Text>
          </Touchable> */}

        </View>
      </View>
    </View>
  );
}
