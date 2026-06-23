import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyJobs } from '../../store/jobSlice';
import JobCard from '../../components/JobCard';
import { colors, radius, typography } from '../../theme';

const FILTERS = [
  { key: '', label: 'All', icon: 'apps-outline' },
  { key: 'open', label: 'Open', icon: 'radio-button-on-outline' },
  { key: 'in_progress', label: 'Active', icon: 'time-outline' },
  { key: 'completed', label: 'Done', icon: 'checkmark-circle-outline' },
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
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} showBidCount />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => handleFilter(filter)} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>My Jobs</Text>
            <Text style={styles.subtitle}>{myJobs.length} {myJobs.length === 1 ? 'job' : 'jobs'} total</Text>
            <View style={styles.filters}>
              {FILTERS.map(f => {
                const active = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => handleFilter(f.key)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={f.icon} size={13} color={active ? colors.white : colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="briefcase-outline" size={36} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No jobs yet</Text>
              <Text style={styles.emptyDesc}>Post your first job to get started</Text>
            </View>
          ) : null
        }
        contentContainerStyle={myJobs.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { ...typography.h1, marginBottom: 2 },
  subtitle: { ...typography.bodySmall, marginBottom: 16 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { ...typography.h3, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { ...typography.bodySmall, textAlign: 'center' },
});
