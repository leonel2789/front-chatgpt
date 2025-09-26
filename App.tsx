import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  useEffect(() => {
    loadApiKey();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const loadApiKey = async () => {
    try {
      const key = await AsyncStorage.getItem('openai_api_key');
      if (key) setApiKey(key);
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'Nueva conversación',
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !apiKey) return;

    let conversation = currentConversation;

    if (!conversation) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: inputMessage.slice(0, 50) + (inputMessage.length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date()
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      conversation = newConversation;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setConversations(prev => prev.map(c =>
      c.id === conversation!.id
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    ));

    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            ...conversation.messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: currentInput }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.choices[0].message.content,
        role: 'assistant',
        timestamp: new Date()
      };

      setConversations(prev => prev.map(c =>
        c.id === conversation!.id
          ? { ...c, messages: [...c.messages, assistantMessage] }
          : c
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un error al procesar tu mensaje. Verifica tu API key y conexión.',
        role: 'assistant',
        timestamp: new Date()
      };

      setConversations(prev => prev.map(c =>
        c.id === conversation!.id
          ? { ...c, messages: [...c.messages, errorMessage] }
          : c
      ));
      Alert.alert('Error', 'Error al enviar mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    try {
      await AsyncStorage.setItem('openai_api_key', apiKey);
      setShowSettings(false);
      Alert.alert('Éxito', 'API Key guardada correctamente');
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'No se pudo guardar la API Key');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <TouchableOpacity
              onPress={createNewConversation}
              style={styles.newChatBtn}
            >
              <Text style={styles.newChatBtnText}>+ Nueva conversación</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              style={styles.settingsBtn}
            >
              <Text style={styles.settingsBtnText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.conversationsList}>
            {conversations.map(conversation => (
              <TouchableOpacity
                key={conversation.id}
                style={[
                  styles.conversationItem,
                  currentConversationId === conversation.id && styles.conversationItemActive
                ]}
                onPress={() => setCurrentConversationId(conversation.id)}
              >
                <Text style={styles.conversationTitle} numberOfLines={1}>
                  {conversation.title}
                </Text>
                <TouchableOpacity
                  onPress={() => deleteConversation(conversation.id)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.mainContent}>
          {currentConversation ? (
            <>
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
              >
                {currentConversation.messages.map(message => (
                  <View key={message.id} style={[
                    styles.message,
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage
                  ]}>
                    <View style={[
                      styles.messageIcon,
                      message.role === 'user' ? styles.userIcon : styles.assistantIcon
                    ]}>
                      <Text style={styles.iconText}>
                        {message.role === 'user' ? '👤' : '🤖'}
                      </Text>
                    </View>
                    <View style={[
                      styles.messageContent,
                      message.role === 'user' ? styles.userMessageContent : styles.assistantMessageContent
                    ]}>
                      <Text style={[
                        styles.messageText,
                        message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                      ]}>
                        {message.content}
                      </Text>
                    </View>
                  </View>
                ))}
                {isLoading && (
                  <View style={[styles.message, styles.assistantMessage]}>
                    <View style={[styles.messageIcon, styles.assistantIcon]}>
                      <Text style={styles.iconText}>🤖</Text>
                    </View>
                    <View style={[styles.messageContent, styles.assistantMessageContent]}>
                      <Text style={styles.loadingText}>Escribiendo...</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    placeholder="Escribe tu mensaje aquí..."
                    editable={!isLoading && !!apiKey}
                    style={styles.messageInput}
                    multiline
                    placeholderTextColor="#8e8ea0"
                  />
                  <TouchableOpacity
                    onPress={sendMessage}
                    disabled={!inputMessage.trim() || isLoading || !apiKey}
                    style={[
                      styles.sendBtn,
                      (!inputMessage.trim() || isLoading || !apiKey) && styles.sendBtnDisabled
                    ]}
                  >
                    <Text style={styles.sendBtnText}>📤</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.welcomeScreen}>
              <Text style={styles.welcomeTitle}>ChatGPT Clone</Text>
              <Text style={styles.welcomeText}>
                Selecciona una conversación o crea una nueva para empezar
              </Text>
              {!apiKey && (
                <Text style={styles.apiWarning}>
                  ⚠️ Configura tu API key de OpenAI en Configuración
                </Text>
              )}
            </View>
          )}
        </View>

        <Modal
          visible={showSettings}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Configuración</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>API Key de OpenAI:</Text>
                <TextInput
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="sk-..."
                  style={styles.apiInput}
                  secureTextEntry
                  placeholderTextColor="#8e8ea0"
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowSettings(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveApiKey}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#202123',
    borderRightWidth: 1,
    borderRightColor: '#444654',
  },
  sidebarHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444654',
    flexDirection: 'row',
    gap: 8,
  },
  newChatBtn: {
    flex: 1,
    backgroundColor: '#10a37f',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  newChatBtnText: {
    color: 'white',
    fontWeight: '500',
  },
  settingsBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444654',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    color: '#c5c5d2',
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
    padding: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  conversationItemActive: {
    backgroundColor: '#40414f',
  },
  conversationTitle: {
    flex: 1,
    color: '#c5c5d2',
    fontSize: 14,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: 4,
  },
  deleteBtnText: {
    color: '#8e8ea0',
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#343541',
  },
  welcomeScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    marginBottom: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  welcomeText: {
    color: '#8e8ea0',
    textAlign: 'center',
    marginBottom: 8,
  },
  apiWarning: {
    color: '#fbbf24',
    fontWeight: '500',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  message: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '100%',
  },
  userMessage: {
    flexDirection: 'row-reverse',
  },
  assistantMessage: {
    flexDirection: 'row',
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  userIcon: {
    backgroundColor: '#10a37f',
  },
  assistantIcon: {
    backgroundColor: '#40414f',
  },
  iconText: {
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  userMessageContent: {
    backgroundColor: '#10a37f',
  },
  assistantMessageContent: {
    backgroundColor: '#444654',
  },
  messageText: {
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#c5c5d2',
  },
  loadingText: {
    color: '#8e8ea0',
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#444654',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#40414f',
    borderWidth: 1,
    borderColor: '#565869',
    borderRadius: 8,
    padding: 12,
    color: '#c5c5d2',
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    backgroundColor: '#10a37f',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#40414f',
    borderRadius: 8,
    padding: 32,
    width: '90%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#565869',
  },
  modalTitle: {
    color: '#fff',
    marginBottom: 24,
    fontSize: 24,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#c5c5d2',
    marginBottom: 8,
    fontWeight: '500',
  },
  apiInput: {
    backgroundColor: '#202123',
    borderWidth: 1,
    borderColor: '#565869',
    borderRadius: 6,
    padding: 12,
    color: '#c5c5d2',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#565869',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelBtnText: {
    color: '#8e8ea0',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#10a37f',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '500',
  },
});