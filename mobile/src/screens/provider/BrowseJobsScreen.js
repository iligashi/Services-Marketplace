import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import api from '../../api/axios.instance';
import JobCard from '../../components/JobCard';

export default function BrowseJobsScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/provider/nearby-jobs');
      setJobs(data.jobs);
    } catch {
      // Fallback to all open jobs
      const { data } = await api.get('/jobs', { params: { status: 'open' } });
      setJobs(data.jobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.navigate('SubmitBid', { job: item })}
            showDistance={!!item.distance}
          />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadJobs} />}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading...' : 'No nearby jobs'}</Text>}
        contentContainerStyle={jobs.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  empty: { textAlign: 'center', color: '#636e72', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
