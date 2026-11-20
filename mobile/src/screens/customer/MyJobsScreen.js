import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyJobs } from '../../store/jobSlice';
import JobCard from '../../components/JobCard';
import { JobListSkeleton } from '../../components/Skeleton';
import { Screen, Segmented, EmptyState, Appear } from '../../components/ui';

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

  const count = myJobs.length;

  return (
    <Screen
      title="My Jobs"
      subtitle={`${count} ${count === 1 ? 'job' : 'jobs'}${filter ? ' in this view' : ' in total'}`}
      header={(
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Segmented options={FILTERS} value={filter} onChange={handleFilter} />
          {loading && count === 0 ? <View style={{ marginTop: 16, marginHorizontal: -16 }}><JobListSkeleton count={3} /></View> : null}
        </View>
      )}
      data={myJobs}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item, index }) => (
        <Appear index={index}>
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} showBidCount />
        </Appear>
      )}
      refreshing={loading && count > 0}
      onRefresh={() => handleFilter(filter)}
      ListEmptyComponent={!loading ? (
        <EmptyState
          icon="briefcase"
          title={filter ? 'Nothing here yet' : 'No jobs yet'}
          message={filter ? 'Jobs with this status will show up here.' : 'Post your first job and local pros will start sending offers.'}
          actionLabel={filter ? undefined : 'Post a job'}
          onAction={() => navigation.navigate('PostJob')}
        />
      ) : null}
    />
  );
}
