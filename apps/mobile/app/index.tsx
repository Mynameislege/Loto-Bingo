import { View, ActivityIndicator } from 'react-native';

/**
 * Root index — matches the initial route exp://host/--/
 * The root _layout.tsx handles the redirect to (auth)/login or (tabs)/home
 * once Firebase auth state is known. This screen just shows a spinner
 * during that brief window.
 */
export default function IndexScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A4A2A',
      }}
    >
      <ActivityIndicator size="large" color="#FF8C00" />
    </View>
  );
}
