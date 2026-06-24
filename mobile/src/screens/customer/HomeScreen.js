import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs, fetchCategories } from '../../store/jobSlice';
import JobCard from '../../components/JobCard';
import { radius, shadows } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../../components/NotificationBell';

const CATEGORY_ICONS = {
  cleaning: 'sparkles-outline',
  plumbing: 'water-outline',
  electrical: 'flash-outline',
  gardening: 'leaf-outline',
  moving: 'cube-outline',
  painting: 'brush-outline',
  carpentry: 'hammer-outline',
  default: 'build-outline',
};

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { list, categories, loading, pagination } = useSelector((state) => state.jobs);
  const { user } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
    loadJobs();
  }, []);

  const loadJobs = (params = {}) => {
    dispatch(fetchJobs({
      status: 'open',
      search: search || undefined,
      category: selectedCategory || undefined,
      ...params,
    }));
  };

  const handleCategoryFilter = (slug) => {
    const cat = selectedCategory === slug ? null : slug;
    setSelectedCategory(cat);
    dispatch(fetchJobs({ status: 'open', category: cat || undefined, search: search || undefined }));
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const Header = () => (
    <View style={{ backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />

      {/* Top bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, backgroundColor: colors.gradientStart }}>
        <View>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{getGreeting()},</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 }}>{user?.name?.split(' ')[0] || 'there'} 👋</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <NotificationBell light />
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 16, backgroundColor: colors.gradientStart }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 14, ...shadows.sm }}>
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={{ marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text }}
            placeholder="Search services, jobs..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadJobs()}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); loadJobs({ search: undefined }); }}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={{ width: 46, height: 46, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' }}
          onPress={() => loadJobs()}
        >
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <FlatList
          horizontal
          data={[{ id: 0, name: 'All', slug: null }, ...categories]}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const active = item.slug === null ? !selectedCategory : selectedCategory === item.slug;
            const iconName = CATEGORY_ICONS[item.slug] || CATEGORY_ICONS.default;
            return (
              <TouchableOpacity
                style={[
                  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, marginRight: 8 },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => handleCategoryFilter(item.slug)}
                activeOpacity={0.75}
              >
                <Ionicons name={iconName} size={14} color={active ? '#fff' : colors.textSecondary} style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : colors.textSecondary }}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14 }}
        />
      )}

      {/* Section header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Available Jobs</Text>
        {pagination ? (
          <View style={{ backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, borderColor: colors.primaryBorder }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{pagination.total}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} colors={colors} />
        )}
        ListHeaderComponent={Header}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadJobs} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Ionicons name="search-outline" size={36} color={colors.textTertiary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8, textAlign: 'center' }}>No jobs found</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>Try adjusting your filters or check back later</Text>
            </View>
          ) : null
        }
        contentContainerStyle={list.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
      />
    </View>
  );
}
