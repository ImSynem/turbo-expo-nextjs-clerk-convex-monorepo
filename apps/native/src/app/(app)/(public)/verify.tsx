import { VerificationValidation } from '@/shared/validations/clerk';
import { useLoginStore } from '@/store/login';
import { isClerkAPIResponseError, useClerk, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { z } from 'zod';

const Verify = () => {
  const router = useRouter();
  const { isLogin } = useLocalSearchParams<{ isLogin?: string }>();

  const [countdown, setCountdown] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([null, null, null, null, null, null]);
  const { email } = useLoginStore();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { setActive } = useClerk();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<z.infer<typeof VerificationValidation>>({
    resolver: zodResolver(VerificationValidation),
    mode: 'onChange',
    defaultValues: {
      code: '',
    },
  });

  const watchedCode = watch('code');

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isTimerRunning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [countdown, isTimerRunning]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...watchedCode.split('')];
    newCode[index] = text;
    const codeString = newCode.join('');
    setValue('code', codeString, { shouldValidate: true });

    // Move to next input if value entered
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (!watchedCode[index] && index > 0) {
      // If current input is empty and not first input, move to previous
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (watchedCode.length === 6) {
      Keyboard.dismiss();
    }
  }, [watchedCode]);

  const handleCreateAccount = async (data: z.infer<typeof VerificationValidation>) => {
    if (!isSignUpLoaded || isSubmitting || !signUp) return;
    
    try {
      setIsSubmitting(true);
      
      const result = await signUp.attemptEmailAddressVerification({
        code: data.code,
      });
      
      console.log('Verification result:', result);
      
      if (result.status === 'complete' && result.createdSessionId) {
        // Use setActive from useClerk hook
        await setActive({ session: result.createdSessionId });
        router.replace('/(app)/(authenticated)/(tabs)/profile');
      } else {
        console.error('Verification incomplete:', result.status);
        Alert.alert('Error', 'Verification was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      
      if (isClerkAPIResponseError(err)) {
        const errorMessage = err.errors?.[0]?.message || 'Verification failed. Please try again.';
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (data: z.infer<typeof VerificationValidation>) => {
    if (!isSignInLoaded || isSubmitting || !signIn) return;
    
    try {
      setIsSubmitting(true);
      
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: data.code,
      });
      
      console.log('Sign in result status:', result.status);
      
      if (result.status === 'complete' && result.createdSessionId) {
        // Use setActive from useClerk hook
        await setActive({ session: result.createdSessionId });
        router.replace('/(app)/(authenticated)/(tabs)/profile');
      } else {
        console.error('Sign in incomplete:', result.status);
        Alert.alert('Error', 'Sign in was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      
      if (isClerkAPIResponseError(err)) {
        const errorMessage = err.errors?.[0]?.message || 'Sign in failed. Please try again.';
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || !signIn || !signUp) return;
    
    try {
      if (isLogin === 'true') {
        // For sign in, we need to create a new sign in attempt
        await signIn.create({
          strategy: 'email_code',
          identifier: email,
        });
      } else {
        // For sign up, prepare verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      }
      
      // Reset timer
      setCountdown(60);
      setIsTimerRunning(true);
      
      Alert.alert('Success', 'Verification code has been resent to your email.');
    } catch (err) {
      console.error('Resend error:', err);
      
      if (isClerkAPIResponseError(err)) {
        const errorMessage = err.errors?.[0]?.message || 'Failed to resend code.';
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to resend verification code. Please try again.');
      }
    }
  };

  const onSubmit = (data: z.infer<typeof VerificationValidation>) => {
    if (isLogin === 'true') {
      handleSignIn(data);
    } else {
      handleCreateAccount(data);
    }
  };

  // Don't render until Clerk is loaded
  if (!isSignUpLoaded || !isSignInLoaded) {
    return (
      <View className="flex-1 bg-black pt-safe items-center justify-center">
        <Text className="text-white text-lg">Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1">
      <View className="flex-1 bg-black px-6 pt-safe">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 justify-center bg-gray-800 rounded-xl">
          <MaterialCommunityIcons name="chevron-left" size={32} color="white" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-white text-xl font-Poppins_600SemiBold mt-20">Enter code</Text>

        {/* Subtitle */}
        <Text className="text-gray-400 mt-2 font-Poppins_400Regular">
          Check your email and enter the code sent to{'\n'}
          <Text className="text-white">{email}</Text>
        </Text>

        {/* Code Input */}
        <Controller
          control={control}
          name="code"
          render={({ field: { value } }) => (
            <View className="mt-8">
              <View className="flex-row justify-between">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    className={`w-[52px] h-[52px] bg-gray-800 rounded-lg text-white text-center text-xl border ${
                      value[index] ? 'border-primary' : 'border-gray-700'
                    }`}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={value[index] || ''}
                    caretHidden={true}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace') {
                        const newCode = value.split('');
                        newCode[index] = '';
                        setValue('code', newCode.join(''), { shouldValidate: true });
                        handleBackspace(index);
                      }
                    }}
                  />
                ))}
              </View>
              {errors.code && (
                <Text className="text-red-500 text-sm font-Poppins_400Regular mt-2 text-center">
                  {errors.code.message}
                </Text>
              )}
            </View>
          )}
        />

        {/* Resend Code */}
        <TouchableOpacity 
          className={`mt-6`} 
          onPress={handleResendCode}
          disabled={countdown > 0}>
          <Text
            className={`font-Poppins_500Medium ${countdown > 0 ? 'text-gray-400' : 'text-primary'}`}>
            Resend code {countdown > 0 ? `(${countdown})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 mt-auto mb-8 ${isValid && !isSubmitting ? 'bg-primary' : 'bg-gray-900'}`}
          disabled={!isValid || isSubmitting}
          onPress={handleSubmit(onSubmit)}>
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className={`text-center text-lg font-Poppins_600SemiBold ${
                !isValid ? 'text-gray-400' : 'text-white'
              }`}>
              {isLogin === 'true' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Verify;
