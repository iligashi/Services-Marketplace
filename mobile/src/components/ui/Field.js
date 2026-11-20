import React, { useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';

/**
 * Rounded text field with an optional label, leading icon and prefix.
 * Focus draws a soft primary ring instead of a hard border.
 */
export default function Field({
  label, hint, icon, prefix, suffix, multiline, secure, large, style, inputStyle, surface = 'card', ...inputProps
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  return (
    <View style={style}>
      {label ? (
        <Text style={[type.footnote, { fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }]}>{label}</Text>
      ) : null}
      <View style={{
        flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: surface === 'fill' ? colors.fill : colors.card,
        borderRadius: 14, paddingHorizontal: 14,
        borderWidth: 1.5, borderColor: focused ? colors.primary : 'transparent',
        shadowColor: colors.primary, shadowOpacity: focused ? 0.18 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
      }}>
        {icon ? (
          <Ionicons name={icon} size={19} color={focused ? colors.primary : colors.textTertiary} style={{ marginRight: 10, marginTop: multiline ? 15 : 0 }} />
        ) : null}
        {prefix ? (
          <Text style={[large ? type.title1 : type.body, { color: colors.textSecondary, marginRight: 4 }]}>{prefix}</Text>
        ) : null}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secure && !reveal}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
          {...inputProps}
          style={[
            large ? type.title1 : type.body,
            {
              flex: 1, color: colors.text, paddingVertical: large ? 12 : 14, outlineStyle: 'none',
              minHeight: multiline ? 110 : undefined,
            },
            inputStyle,
          ]}
        />
        {secure ? (
          <Pressable onPress={() => setReveal(!reveal)} hitSlop={10} accessibilityLabel={reveal ? 'Hide password' : 'Show password'}>
            <Ionicons name={reveal ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.textTertiary} />
          </Pressable>
        ) : null}
        {suffix ? <Text style={[type.footnote, { color: colors.textTertiary, fontWeight: '600' }]}>{suffix}</Text> : null}
      </View>
      {hint ? (
        <Text style={[type.caption, { color: colors.textTertiary, marginTop: 6, marginLeft: 4 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}
