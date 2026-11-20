import React, { useCallback, useRef, useState } from 'react';
import {
  Animated, View, Text, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../navigation/TabBarContext';
import { type } from '../../theme';
import Glass from './Glass';
import Tappable from './Tappable';

const NAV_HEIGHT = 48;

/** Round icon button used in navigation bars (back, bell, actions). */
export function NavButton({ icon, onPress, color, label, badge, accessibilityLabel }) {
  const { colors } = useTheme();
  return (
    <Tappable
      onPress={onPress}
      scaleTo={0.9}
      accessibilityLabel={accessibilityLabel || label || icon}
      style={{
        height: 36, minWidth: 36, paddingHorizontal: label ? 12 : 0, borderRadius: 18,
        backgroundColor: colors.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}
    >
      {icon ? <Ionicons name={icon} size={label ? 17 : 20} color={color || colors.text} /> : null}
      {label ? <Text style={[type.subhead, { fontWeight: '600', color: color || colors.primary }]}>{label}</Text> : null}
      {badge ? (
        <View style={{
          position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
          backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : null}
    </Tappable>
  );
}

/**
 * The page shell every screen uses:
 * - a translucent glass navigation bar that content scrolls underneath
 * - an iOS large title that hands over to the compact title as you scroll
 * - automatic spacing for the floating tab bar, which minimizes while scrolling down
 * - an optional sticky glass footer for the main action
 *
 * Pass `data` + `renderItem` for a list, or `children` for a scroll view.
 */
export default function Screen({
  title,
  eyebrow,
  subtitle,
  large = true,
  titleOnScroll = false,
  back,
  right,
  header,
  children,
  footer,
  refreshing,
  onRefresh,
  contentStyle,
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  listProps,
  scrollRef,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const tabBar = useTabBar();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const [footerHeight, setFooterHeight] = useState(0);

  // The tab bar only shows on the first screen of each tab's stack
  const navState = navigation.getState();
  const isTabRoot = !!tabBar && (navState?.type !== 'stack' || navState.routes[0]?.key === route.key);
  const bottomSpace = isTabRoot ? tabBar.inset : insets.bottom;

  useFocusEffect(useCallback(() => {
    tabBar?.setMinimized(false);
  }, [tabBar]));

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e) => {
        if (!isTabRoot) return;
        const y = e.nativeEvent.contentOffset.y;
        const dy = y - lastY.current;
        if (y > 80 && dy > 6) tabBar.setMinimized(true);
        else if (dy < -6 || y < 24) tabBar.setMinimized(false);
        lastY.current = y;
      },
    },
  );

  const topHeight = insets.top + NAV_HEIGHT;
  const barOpacity = scrollY.interpolate({ inputRange: [0, 24], outputRange: [0, 1], extrapolate: 'clamp' });
  // Large titles hand over to the compact title; screens that draw their own
  // heading in the content (titleOnScroll) reveal it a little later
  const compactOpacity = large || titleOnScroll
    ? scrollY.interpolate({ inputRange: large ? [30, 60] : [70, 110], outputRange: [0, 1], extrapolate: 'clamp' })
    : 1;
  // Large title fades and lifts slightly as it scrolls under the bar
  const largeOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: 'clamp' });

  const showBack = back !== undefined ? back : navigation.canGoBack() && !isTabRoot && navState?.type === 'stack' && navState.routes[0]?.key !== route.key;
  const onBack = typeof back === 'function' ? back : () => navigation.goBack();

  const headerBlock = (
    <View>
      {large ? (
        <Animated.View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14, opacity: largeOpacity }}>
          {eyebrow ? (
            <Text style={[type.footnote, { fontWeight: '600', color: colors.textSecondary, marginBottom: 2 }]}>{eyebrow}</Text>
          ) : null}
          <Text style={[type.largeTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
          {subtitle ? (
            <Text style={[type.subhead, { color: colors.textSecondary, marginTop: 4 }]}>{subtitle}</Text>
          ) : null}
        </Animated.View>
      ) : null}
      {header}
    </View>
  );

  const contentContainerStyle = [
    { paddingTop: topHeight + (large ? 0 : 8), paddingBottom: bottomSpace + footerHeight + 20 },
    contentStyle,
  ];

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={!!refreshing}
      onRefresh={onRefresh}
      tintColor={colors.textSecondary}
      colors={[colors.primary]}
      progressViewOffset={topHeight}
    />
  ) : undefined;

  const scrollProps = {
    ref: scrollRef,
    onScroll,
    scrollEventThrottle: 16,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled',
    keyboardDismissMode: 'on-drag',
    refreshControl,
    scrollIndicatorInsets: { top: topHeight, bottom: bottomSpace },
  };

  const body = data ? (
    <Animated.FlatList
      {...scrollProps}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={headerBlock}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={[contentContainerStyle, data.length === 0 && { flexGrow: 1 }]}
      {...listProps}
    />
  ) : (
    <Animated.ScrollView {...scrollProps} contentContainerStyle={contentContainerStyle}>
      {headerBlock}
      {children}
    </Animated.ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}

        {footer ? (
          <View
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            style={{ position: 'absolute', left: 0, right: 0, bottom: isTabRoot ? tabBar.inset - 4 : 0 }}
          >
            <Glass style={{
              paddingHorizontal: 16, paddingTop: 12,
              paddingBottom: isTabRoot ? 12 : Math.max(insets.bottom, 12) + 4,
              borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator,
            }}>
              {footer}
            </Glass>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      {/* Navigation bar: transparent at rest, frosted once content scrolls under it */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: topHeight }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: barOpacity }]}>
          <Glass style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator }} />
        </Animated.View>
        <View style={{ marginTop: insets.top, height: NAV_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {showBack ? <NavButton icon="chevron-back" onPress={onBack} accessibilityLabel="Back" /> : null}
          </View>
          <Animated.Text
            numberOfLines={1}
            style={[type.headline, { color: colors.text, opacity: compactOpacity, maxWidth: '58%', textAlign: 'center' }]}
          >
            {title}
          </Animated.Text>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            {right}
          </View>
        </View>
      </View>
    </View>
  );
}
