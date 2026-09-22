import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { getCategoryById } from '../constants/categories';
import { formatRupiah } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import { Colors, radius, spacing } from '../theme';

interface Props {
  transaction: Transaction;
  onPress?: () => void;
  showDate?: boolean;
  dateLabel?: string;
}

function TransactionItem({ transaction, onPress, showDate, dateLabel }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const category = getCategoryById(transaction.categoryId);
  const isIncome = transaction.type === 'income';
  const color = category?.color ?? colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons
          name={(category?.icon ?? 'pricetag-outline') as any}
          size={22}
          color={color}
        />
      </View>

      <View style={styles.middle}>
        <Text style={styles.label} numberOfLines={1}>
          {category?.label ?? 'Lainnya'}
        </Text>
        {transaction.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : showDate && dateLabel ? (
          <Text style={styles.note} numberOfLines={1}>
            {dateLabel}
          </Text>
        ) : null}
      </View>

      <Text
        style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}
      >
        {isIncome ? '+' : '-'}
        {formatRupiah(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    pressed: {
      backgroundColor: c.background,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    middle: {
      flex: 1,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    note: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 2,
    },
    amount: {
      fontSize: 15,
      fontWeight: '700',
    },
  });

export default React.memo(TransactionItem);
