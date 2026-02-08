import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';

const HomeScreen = () => {
  const [data, setData] = useState([]);

  const { data: items, isLoading, error } = useQuery('items', async () => {
    // Mock API call
    return [
      { id: 1, title: 'Item 1', description: 'Description 1' },
      { id: 2, title: 'Item 2', description: 'Description 2' },
      { id: 3, title: 'Item 3', description: 'Description 3' },
    ];
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error loading data</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;