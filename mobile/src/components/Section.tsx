import { View, Text } from 'react-native';

export function Section({ title }: { title: string }) {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
}
