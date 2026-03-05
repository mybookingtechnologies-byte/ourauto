import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { getTheme } from '../utils/constants';

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export const Header = ({ title, subtitle }: HeaderProps) => {
  const theme = getTheme(useColorScheme());

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.mutedText }]}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});
