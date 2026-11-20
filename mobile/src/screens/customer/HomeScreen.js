import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs, fetchCategories } from '../../store/jobSlice';
import JobCard from '../../components/JobCard';
import Avatar from '../../components/Avatar';
import NotificationBell from '../../components/NotificationBell';
import { JobListSkeleton } from '../../components/Skeleton';
import { Screen, Button, IconTile, SectionHeader, EmptyState, Appear, Tappable, alpha } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type, shadows } from '../../theme';
import { categoryMeta, greeting, todayLabel } from '../../utils/categories';
import { tapFeedback } from '../../utils/haptics';

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
    tapFeedback();
    const cat = selectedCategory === slug ? null : slug;
    setSelectedCategory(cat);
    dispatch(fetchJobs({ status: 'open', category: cat || undefined, search: search || undefined }));
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  const header = (
    <View>
      {/* Search */}
      <View style={{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.fill, borderRadius: 12, paddingHorizontal: 10, height: 40 }}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[type.body, { flex: 1, marginLeft: 6, color: colors.text, outlineStyle: 'none' }]}
          placeholder="Search services and jobs"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadJobs()}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => { setSearch(''); loadJobs({ search: undefined }); }} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      {/* Hero */}
      <Appear>
        <LinearGradient
          colors={colors.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ marginHorizontal: 16, marginTop: 18, borderRadius: 26, padding: 20, overflow: 'hidden' }, shadows.glow(colors.indigo)]}
        >
          <View style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.12)' }} />
          <View style={{ position: 'absolute', right: 40, bottom: -50, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={[type.caption2, { color: 'rgba(255,255,255,0.9)', letterSpacing: 0.6 }]}>PAY ONLY WHEN IT'S DONE</Text>
          </View>
          <Text style={[type.title2, { color: '#fff', marginBottom: 6 }]}>Need a hand at home?</Text>
          <Text style={[type.subhead, { color: 'rgba(255,255,255,0.85)', marginBottom: 16, maxWidth: 260 }]}>
            Describe the job, compare offers from local pros and keep your money safe in escrow.
          </Text>
          <Button title="Post a job" icon="add-circle" variant="white" size="md" onPress={() => navigation.navigate('PostJob')} style={{ alignSelf: 'flex-start' }} />
        </LinearGradient>
      </Appear>

      {/* Categories */}
      {categories.length > 0 ? (
        <>
          <SectionHeader title="Categories" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {[{ id: 0, name: 'All', slug: null }, ...categories].map((item) => {
              const active = item.slug === null ? !selectedCategory : selectedCategory === item.slug;
              const meta = item.slug === null ? { icon: 'apps', tone: 'primary' } : categoryMeta(item.slug || item.name);
              return (
                <Tappable
                  key={item.id}
                  onPress={() => handleCategoryFilter(item.slug)}
                  scaleTo={0.93}
                  haptic={false}
                  style={{
                    width: 96, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 20,
                    backgroundColor: active ? alpha(colors[meta.tone] || colors.primary, 0.14) : colors.card,
                    borderWidth: 1.5, borderColor: active ? colors[meta.tone] || colors.primary : 'transparent',
                  }}
                >
                  <IconTile icon={meta.icon} tone={meta.tone} size={40} />
                  <Text style={[type.caption, { color: colors.text, marginTop: 8, fontWeight: active ? '700' : '500' }]} numberOfLines={1}>{item.name}</Text>
                </Tappable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <SectionHeader title="Open jobs" action={pagination ? `${pagination.total} live` : undefined} />
      {loading && list.length === 0 ? <JobListSkeleton count={3} /> : null}
    </View>
  );

  return (
    <Screen
      eyebrow={todayLabel()}
      title={`${greeting()}, ${firstName}`}
      right={(
        <>
          <NotificationBell />
          <Tappable onPress={() => navigation.navigate('Profile')} scaleTo={0.9} accessibilityLabel="Profile">
            <Avatar name={user?.name} uri={user?.avatar_url} size={36} />
          </Tappable>
        </>
      )}
      header={header}
      data={list}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item, index }) => (
        <Appear index={index}>
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} />
        </Appear>
      )}
      refreshing={loading && list.length > 0}
      onRefresh={() => loadJobs()}
      ListEmptyComponent={!loading ? (
        <EmptyState icon="search" title="No jobs found" message="Try another category or search, or check back a little later." />
      ) : null}
    />
  );
}
