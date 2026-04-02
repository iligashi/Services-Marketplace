import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyJobs } from '../../store/jobSlice';
import JobCard from '../../components/JobCard';
import { colors, radius, typography } from '../../theme';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

export default function MyJobsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { myJobs, loading } = useSelector((state) => state.jobs);
  const [filter, setFilter] = useState('');

  useEffect(() => { dispatch(fetchMyJobs()); }, []);

  const handleFilter = (key) => {
    setFilter(key);
    dispatch(fetchMyJobs(key ? { status: key } : {}));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={myJobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} showBidCount />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => handleFilter(filter)} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.pageTitle}>My Jobs</Text>
            <View style={styles.filters}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                  onPress={() => handleFilter(f.key)}
                >
                  <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'📝'}</Text>
            <Text style={styles.emptyTitle}>{loading ? 'Loading...' : 'No jobs yet'}</Text>
            <Text style={styles.emptySubtitle}>Post your first job to get started</Text>
          </View>
        }
        contentContainerStyle={myJobs.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { ...typography.h1, marginBottom: 16 },
  filters: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.buttonSmall, fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: '#fff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptySubtitle: { ...typography.bodySmall },
});
