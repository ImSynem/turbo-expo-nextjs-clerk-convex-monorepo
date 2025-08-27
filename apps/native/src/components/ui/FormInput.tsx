import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  containerClassName = '',
  ...props
}) => {
  return (
    <View className={`${containerClassName}`}>
      {label && (
        <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-gray-800 text-gray-300 p-5 rounded-xl border ${
          error ? 'border-red-500' : 'border-gray-700'
        }`}
        placeholderTextColor="#888"
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-sm font-Poppins_400Regular mt-2">
          {error}
        </Text>
      )}
    </View>
  );
};
