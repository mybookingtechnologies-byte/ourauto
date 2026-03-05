import { ActivityIndicator, StyleSheet, View } from 'react-native';

export const Loading = () => {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size="large" color="#0A6CFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
