import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      try {
        const { data } = await api.get('/jobs', { params: { status: 'open' } });
        setJobs(data.jobs);
      } catch {}
    } finally { setLoading(false); }
  };

  useEffect(() => { loadJobs(); }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />
      <FlatList
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.navigate('SubmitBid', { job: item })}
            showDistance={!!item.distance}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadJobs} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Browse Jobs</Text>
            {!loading && (
              <Text style={styles.subtitle}>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} available</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="location-outline" size={36} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No nearby jobs</Text>
              <Text style={styles.emptyDesc}>Update your location in profile to see jobs near you</Text>
            </View>
          ) : null
        }
        contentContainerStyle={jobs.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodySmall, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { ...typography.h3, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },
});
