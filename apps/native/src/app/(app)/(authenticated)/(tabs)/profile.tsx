import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Button, Text, TouchableOpacity, View } from 'react-native';

// First saw this example on Beto's app https://github.com/betomoedano/modern-chat-app
const Page = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const passkeys = user?.passkeys ?? [];

  const createClerkPasskey = async () => {
    if (!user) return;

    try {
      await user?.createPasskey();
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error('Error:', JSON.stringify(err, null, 2));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-[#0F0F10]">
      <View className="px-5 pt-16">
        <Text className="text-white text-2xl font-Poppins_600SemiBold">Settings</Text>
        <Text className="text-gray-400 mt-1 font-Poppins_400Regular">Account & preferences</Text>
      </View>

      <View className="mt-8 px-5 gap-4">
        <View className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <Text className="text-white font-Poppins_600SemiBold">Account</Text>
          <View className="mt-3 flex-row gap-3">
            <Button title="Create Passkey" onPress={createClerkPasskey} />
            <Button title="Sign Out" onPress={handleSignOut} />
          </View>
        </View>

        <View className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <Text className="text-white font-Poppins_600SemiBold">Passkeys</Text>
          <View className="gap-3 mt-3">
            {passkeys.length === 0 && (
              <Text className="text-base text-gray-400">No passkeys found</Text>
            )}
            {passkeys.map((passkey) => (
              <View key={passkey.id} className="bg-gray-800 p-4 rounded-xl">
                <Text className="text-white">
                  ID: <Text className="text-gray-400">{passkey.id}</Text>
                </Text>
                <Text className="text-white">
                  Name: <Text className="text-gray-400">{passkey.name}</Text>
                </Text>
                <Text className="text-white">
                  Created: <Text className="text-gray-400">{passkey.createdAt.toDateString()}</Text>
                </Text>
                <Text className="text-white">
                  Last Used: <Text className="text-gray-400">{passkey.lastUsedAt?.toDateString()}</Text>
                </Text>
                <TouchableOpacity onPress={() => passkey.delete()} className="mt-2">
                  <Text className="text-red-500">Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};
export default Page;
