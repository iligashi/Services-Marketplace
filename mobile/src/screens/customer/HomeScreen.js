import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs, fetchCategories } from '../../store/jobSlice';
import JobCard from '../../components/JobCard';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { list, categories, loading, pagination } = useSelector((state) => state.jobs);
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

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search jobs..."
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => loadJobs()}
        returnKeyType="search"
      />

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.slug && styles.categoryChipActive]}
            onPress={() => handleCategoryFilter(item.slug)}
          >
            <Text style={[styles.categoryText, selectedCategory === item.slug && { color: '#fff' }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
      />

      <FlatList
        data={list}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadJobs} />}
        ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading...' : 'No jobs found'}</Text>}
        contentContainerStyle={list.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchInput: { margin: 12, backgroundColor: '#fff', padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#dfe6e9' },
  categoryList: { paddingHorizontal: 12, maxHeight: 50, marginBottom: 8 },
  categoryChip: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#dfe6e9' },
  categoryChipActive: { backgroundColor: '#0984e3', borderColor: '#0984e3' },
  categoryText: { fontSize: 14, color: '#2d3436' },
  emptyText: { textAlign: 'center', color: '#636e72', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
