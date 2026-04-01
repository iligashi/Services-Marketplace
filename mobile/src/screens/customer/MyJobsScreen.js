import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyJobs } from '../../store/jobSlice';
import JobCard from '../../components/JobCard';

export default function MyJobsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { myJobs, loading } = useSelector((state) => state.jobs);

  useEffect(() => {
    dispatch(fetchMyJobs());
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={myJobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} showBidCount />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchMyJobs())} />}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading...' : 'No jobs posted yet'}</Text>}
        contentContainerStyle={myJobs.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  empty: { textAlign: 'center', color: '#636e72', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
