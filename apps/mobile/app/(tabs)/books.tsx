import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { api } from "../../lib/api";

const statusOptions = [
  { key: "all", label: "All Books" },
  { key: "reading", label: "Reading" },
  { key: "want-to-read", label: "Want to Read" },
  { key: "finished", label: "Finished" },
];

interface BookItem {
  userBook: any;
  book: any;
  wordsCount: number;
}

export default function Books() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  const myBooks = useQuery(api.userBooks.listMine, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  const renderStatusFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 16 }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {statusOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={{
            backgroundColor: selectedStatus === option.key ? '#3b82f6' : '#f3f4f6',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginRight: 8,
          }}
          onPress={() => setSelectedStatus(option.key)}
        >
          <Text style={{
            color: selectedStatus === option.key ? 'white' : '#374151',
            fontWeight: '500',
          }}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return '#22c55e';
      case 'finished': return '#6366f1';
      case 'want-to-read': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'reading': return 'Reading';
      case 'finished': return 'Finished';
      case 'want-to-read': return 'Want to Read';
      default: return status;
    }
  };

  const renderBookItem = ({ item }: { item: BookItem }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/book/${item.userBook._id}`)}
      style={{
      flexDirection: 'row',
      backgroundColor: '#fff',
      padding: 16,
      marginBottom: 12,
      marginHorizontal: 16,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    }}>
      {item.book?.coverUrl ? (
        <Image
          source={{ uri: item.book.coverUrl }}
          style={{ width: 60, height: 80, borderRadius: 4, marginRight: 12 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{
          width: 60,
          height: 80,
          backgroundColor: '#e5e5e5',
          borderRadius: 4,
          marginRight: 12,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>📚</Text>
        </View>
      )}
      
      <View style={{ flex: 1 }}>
        <Text style={{
          fontWeight: '600',
          fontSize: 16,
          color: '#111827',
          marginBottom: 4,
        }} numberOfLines={2}>
          {item.book?.title || "Unknown Title"}
        </Text>
        
        <Text style={{
          color: '#6b7280',
          marginBottom: 8,
          fontSize: 14,
        }} numberOfLines={1}>
          by {item.book?.author || "Unknown Author"}
        </Text>

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginTop: 'auto'
        }}>
          <View style={{
            backgroundColor: getStatusColor(item.userBook.status),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
              {getStatusLabel(item.userBook.status)}
            </Text>
          </View>

          <Text style={{ color: '#6b7280', fontSize: 12 }}>
            {item.wordsCount} {item.wordsCount === 1 ? 'word' : 'words'}
          </Text>
        </View>

        {item.userBook.notes && (
          <Text style={{
            color: '#6b7280',
            fontSize: 12,
            marginTop: 8,
            fontStyle: 'italic'
          }} numberOfLines={2}>
            "{item.userBook.notes}"
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        margin: 16,
        marginBottom: 8,
      }}>
        My Books
      </Text>

      {renderStatusFilter()}

      {myBooks === undefined ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#6b7280', fontSize: 16 }}>Loading...</Text>
        </View>
      ) : myBooks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ 
            color: '#6b7280', 
            fontSize: 18, 
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {selectedStatus === "all" 
              ? "No books in your library yet" 
              : `No ${selectedStatus.replace('-', ' ')} books`}
          </Text>
          <Text style={{ 
            color: '#9ca3af', 
            fontSize: 14, 
            textAlign: 'center' 
          }}>
            Use the Search tab to add books to your library
          </Text>
        </View>
      ) : (
        <FlatList
          data={myBooks}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.userBook._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}