import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../lib/api";

export default function BookDetail() {
  const { id } = useLocalSearchParams();
  const [showAddWord, setShowAddWord] = useState(false);
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [context, setContext] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [notes, setNotes] = useState("");

  const userBookId = id as string;
  
  // We need to get the userBook and related data
  const myBooks = useQuery(api.userBooks.listMine, {});
  const currentBook = myBooks?.find(book => book.userBook._id === userBookId);
  
  const wordsForBook = useQuery(api.words.listForBook, 
    currentBook ? { userBookId: currentBook.userBook._id } : "skip"
  );
  
  const addWord = useMutation(api.words.add);

  const handleAddWord = async () => {
    if (!word.trim()) {
      Alert.alert("Error", "Please enter a word");
      return;
    }

    try {
      await addWord({
        userBookId,
        word: word.trim(),
        definition: definition.trim() || undefined,
        context: context.trim() || undefined,
        pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setWord("");
      setDefinition("");
      setContext("");
      setPageNumber("");
      setNotes("");
      setShowAddWord(false);
      
      Alert.alert("Success", "Word added successfully!");
    } catch (error) {
      console.error("Error adding word:", error);
      Alert.alert("Error", "Failed to add word");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  if (!currentBook) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6b7280', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  const { book, userBook } = currentBook;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Stack.Screen 
        options={{ 
          title: book?.title || "Book Detail",
          headerBackTitle: "Books"
        }} 
      />
      
      <ScrollView>
        {/* Book Header */}
        <View style={{
          backgroundColor: '#fff',
          padding: 20,
          marginBottom: 8,
        }}>
          <View style={{ flexDirection: 'row' }}>
            {book?.coverUrl ? (
              <Image
                source={{ uri: book.coverUrl }}
                style={{ width: 80, height: 120, borderRadius: 8, marginRight: 16 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                width: 80,
                height: 120,
                backgroundColor: '#e5e5e5',
                borderRadius: 8,
                marginRight: 16,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: '#6b7280', fontSize: 16 }}>📚</Text>
              </View>
            )}
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: 8,
              }}>
                {book?.title || "Unknown Title"}
              </Text>
              
              <Text style={{
                fontSize: 16,
                color: '#6b7280',
                marginBottom: 12,
              }}>
                by {book?.author || "Unknown Author"}
              </Text>

              <View style={{
                backgroundColor: getStatusColor(userBook.status),
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                alignSelf: 'flex-start',
                marginBottom: 8,
              }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                  {getStatusLabel(userBook.status)}
                </Text>
              </View>

              {book?.firstPublishYear && (
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                  Published {book.firstPublishYear}
                </Text>
              )}
            </View>
          </View>

          {userBook.notes && (
            <View style={{
              backgroundColor: '#f9fafb',
              padding: 12,
              borderRadius: 8,
              marginTop: 16,
            }}>
              <Text style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic' }}>
                "{userBook.notes}"
              </Text>
            </View>
          )}
        </View>

        {/* Words Section */}
        <View style={{
          backgroundColor: '#fff',
          padding: 20,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#111827',
            }}>
              My Words ({wordsForBook?.length || 0})
            </Text>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={() => setShowAddWord(true)}
            >
              <Text style={{ color: 'white', fontWeight: '500' }}>
                + Add Word
              </Text>
            </TouchableOpacity>
          </View>

          {wordsForBook?.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ color: '#6b7280', fontSize: 16, textAlign: 'center' }}>
                No words saved for this book yet
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 4 }}>
                Tap "Add Word" to save vocabulary as you read
              </Text>
            </View>
          ) : (
            <View>
              {wordsForBook?.map((word) => (
                <View
                  key={word._id}
                  style={{
                    backgroundColor: '#f9fafb',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: '#111827',
                      flex: 1,
                    }}>
                      {word.word}
                    </Text>
                    
                    {word.pageNumber && (
                      <Text style={{
                        fontSize: 12,
                        color: '#6b7280',
                        backgroundColor: '#fff',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                      }}>
                        p. {word.pageNumber}
                      </Text>
                    )}
                  </View>

                  {word.definition && (
                    <Text style={{
                      fontSize: 16,
                      color: '#374151',
                      marginBottom: 8,
                    }}>
                      {word.definition}
                    </Text>
                  )}

                  {word.context && (
                    <Text style={{
                      fontSize: 14,
                      color: '#6b7280',
                      fontStyle: 'italic',
                      marginBottom: 8,
                    }}>
                      "{word.context}"
                    </Text>
                  )}

                  {word.notes && (
                    <Text style={{
                      fontSize: 14,
                      color: '#6b7280',
                    }}>
                      Note: {word.notes}
                    </Text>
                  )}

                  <Text style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    marginTop: 8,
                  }}>
                    Added {formatDate(word.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Word Modal */}
      <Modal
        visible={showAddWord}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          }}>
            <TouchableOpacity onPress={() => setShowAddWord(false)}>
              <Text style={{ color: '#ef4444', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Add Word</Text>
            
            <TouchableOpacity onPress={handleAddWord}>
              <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: '500' }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
              Word *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                marginBottom: 16,
              }}
              placeholder="Enter the word"
              value={word}
              onChangeText={setWord}
              autoCapitalize="none"
            />

            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
              Definition
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                marginBottom: 16,
                minHeight: 80,
              }}
              placeholder="What does this word mean?"
              value={definition}
              onChangeText={setDefinition}
              multiline
              textAlignVertical="top"
            />

            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
              Context
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                marginBottom: 16,
                minHeight: 80,
              }}
              placeholder="How was it used in the book?"
              value={context}
              onChangeText={setContext}
              multiline
              textAlignVertical="top"
            />

            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
              Page Number
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                marginBottom: 16,
              }}
              placeholder="Page number (optional)"
              value={pageNumber}
              onChangeText={setPageNumber}
              keyboardType="numeric"
            />

            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
              Notes
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                marginBottom: 16,
                minHeight: 80,
              }}
              placeholder="Personal notes about this word"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}