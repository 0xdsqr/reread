import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../lib/api";

interface WordItem {
  _id: string;
  word: string;
  definition?: string;
  context?: string;
  pageNumber?: number;
  notes?: string;
  likesCount: number;
  createdAt: number;
  book: any;
  userBook: any;
}

export default function Words() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const myWords = useQuery(api.words.listMine, {});

  // Filter words based on search query
  const filteredWords = myWords?.filter((word) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      word.word.toLowerCase().includes(query) ||
      word.definition?.toLowerCase().includes(query) ||
      word.book?.title.toLowerCase().includes(query) ||
      word.book?.author.toLowerCase().includes(query)
    );
  }) || [];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderWordItem = ({ item }: { item: WordItem }) => (
    <View style={{
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#111827',
          flex: 1,
        }}>
          {item.word}
        </Text>
        
        {item.pageNumber && (
          <Text style={{
            fontSize: 12,
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
          }}>
            p. {item.pageNumber}
          </Text>
        )}
      </View>

      {item.definition && (
        <Text style={{
          fontSize: 16,
          color: '#374151',
          marginBottom: 8,
        }}>
          {item.definition}
        </Text>
      )}

      {item.context && (
        <View style={{ 
          backgroundColor: '#f9fafb', 
          padding: 12, 
          borderRadius: 6,
          marginBottom: 8,
        }}>
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            fontStyle: 'italic',
          }}>
            "{item.context}"
          </Text>
        </View>
      )}

      {item.notes && (
        <Text style={{
          fontSize: 14,
          color: '#6b7280',
          marginBottom: 8,
        }}>
          Note: {item.notes}
        </Text>
      )}

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 8,
      }}>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
            {item.book?.title || "Unknown Book"}
          </Text>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>
            by {item.book?.author || "Unknown Author"}
          </Text>
        </View>
        
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>
            {formatDate(item.createdAt)}
          </Text>
          {item.likesCount > 0 && (
            <Text style={{ fontSize: 11, color: '#ef4444' }}>
              ❤️ {item.likesCount}
            </Text>
          )}
        </View>
      </View>
    </View>
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
        My Words
      </Text>

      <TextInput
        style={{
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginHorizontal: 16,
          marginBottom: 16,
          fontSize: 16,
        }}
        placeholder="Search words, definitions, or books..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {myWords === undefined ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#6b7280', fontSize: 16 }}>Loading...</Text>
        </View>
      ) : filteredWords.length === 0 ? (
        <View style={{ 
          flex: 1, 
          alignItems: 'center', 
          justifyContent: 'center', 
          paddingHorizontal: 32 
        }}>
          <Text style={{ 
            color: '#6b7280', 
            fontSize: 18, 
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {myWords.length === 0 
              ? "No words saved yet" 
              : "No words match your search"}
          </Text>
          <Text style={{ 
            color: '#9ca3af', 
            fontSize: 14, 
            textAlign: 'center' 
          }}>
            {myWords.length === 0 
              ? "Start reading books and save words you want to remember"
              : "Try a different search term"}
          </Text>
        </View>
      ) : (
        <>
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            marginHorizontal: 16,
            marginBottom: 8,
          }}>
            {filteredWords.length} {filteredWords.length === 1 ? 'word' : 'words'} found
          </Text>
          
          <FlatList
            data={filteredWords}
            renderItem={renderWordItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </>
      )}
    </View>
  );
}