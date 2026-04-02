import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import api from '../../api/axios.instance';
import JobCard from '../../components/JobCard';
import { colors, typography } from '../../theme';

export default function BrowseJobsScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/provider/nearby-jobs');
      setJobs(data.jobs);
    } catch {
      try { const { data } = await api.get('/jobs', { params: { status: 'open' } }); setJobs(data.jobs); }
      catch {}
    } finally { setLoading(false); }
  };

  useEffect(() => { loadJobs(); }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('SubmitBid', { job: item })} showDistance={!!item.distance} />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadJobs} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Available Jobs</Text>
            <Text style={styles.subtitle}>{jobs.length} jobs near you</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'🔍'}</Text>
            <Text style={styles.emptyTitle}>{loading ? 'Searching...' : 'No nearby jobs'}</Text>
            <Text style={styles.emptySubtitle}>Update your location in profile to see jobs near you</Text>
          </View>
        }
        contentContainerStyle={jobs.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodySmall, marginTop: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptySubtitle: { ...typography.bodySmall, textAlign: 'center' },
});
