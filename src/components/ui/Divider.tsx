import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { hairline } from '@/theme/tokens';

export function Divider({ inset = 0, style }: { inset?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useAppTheme();
  return <View style={[{ height: hairline, backgroundColor: c.line, marginLeft: inset }, style]} />;
}
