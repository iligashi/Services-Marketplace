import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs, fetchCategories } from '../../store/jobSlice';
import JobCard from '../../components/JobCard';
import { colors, radius, shadows, typography } from '../../theme';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
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

  const Header = () => (
    <View style={styles.headerSection}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingLabel}>Welcome back,</Text>
          <Text style={styles.greetingName}>{user?.name?.split(' ')[0] || 'there'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Text style={styles.profileInitial}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>{'⌕'}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for services..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadJobs()}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); loadJobs({ search: undefined }); }}>
            <Text style={styles.clearSearch}>{'\u2715'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.slug && styles.categoryChipActive]}
            onPress={() => handleCategoryFilter(item.slug)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryText, selectedCategory === item.slug && styles.categoryTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Available Jobs</Text>
        <Text style={styles.resultsCount}>
          {pagination ? `${pagination.total} found` : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} />
        )}
        ListHeaderComponent={Header}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadJobs} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'📋'}</Text>
            <Text style={styles.emptyTitle}>{loading ? 'Finding jobs...' : 'No jobs found'}</Text>
            <Text style={styles.emptySubtitle}>
              {loading ? 'Hang tight!' : 'Try adjusting your filters or check back later'}
            </Text>
          </View>
        }
        contentContainerStyle={list.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  headerSection: { paddingBottom: 8 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  greetingLabel: { ...typography.bodySmall },
  greetingName: { ...typography.h2, fontSize: 24 },
  profileBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    ...shadows.md,
  },
  profileInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: 16,
    borderRadius: radius.lg, paddingHorizontal: 16,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  searchIcon: { fontSize: 20, color: colors.textTertiary, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  clearSearch: { fontSize: 16, color: colors.textTertiary, padding: 4 },

  categoryList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  categoryChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: radius.full, marginRight: 8,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { ...typography.buttonSmall, fontSize: 13, color: colors.textSecondary },
  categoryTextActive: { color: '#fff' },

  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4,
  },
  resultsTitle: { ...typography.h3 },
  resultsCount: { ...typography.bodySmall, fontSize: 12 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },
});
