import { ViewStyle } from 'react-native';
import { Card } from './Card';
import { spacing, shadows } from '@/constants/tokens';

type FlashListItemProps = {
  children: React.ReactNode;
  id: string | number;
  style?: ViewStyle;
  pressable?: boolean;
  onPress?: () => void;
  testID?: string;
};

const baseItemStyle: ViewStyle = { marginBottom: spacing.md, ...shadows.sm };

export function FlashListItem({
  children,
  id,
  style,
  pressable,
  onPress,
  testID,
}: FlashListItemProps) {
  const mergedStyle = [baseItemStyle, style].filter(Boolean) as ViewStyle[];

  return (
    <Card
      key={id}
      pressable={pressable}
      onPress={onPress}
      testID={testID}
      style={mergedStyle}
    >
      {children}
    </Card>
  );
}
