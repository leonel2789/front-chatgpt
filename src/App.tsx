import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Trash2 } from 'lucide-react';
import './App.css';

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

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      createNewConversation();
      conversation = {
        id: Date.now().toString(),
        title: inputMessage.slice(0, 50) + (inputMessage.length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date()
      };
      setConversations(prev => [conversation!, ...prev]);
      setCurrentConversationId(conversation.id);
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
            { role: 'user', content: inputMessage }
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setShowSettings(false);
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <button
            onClick={createNewConversation}
            className="new-chat-btn"
          >
            + Nueva conversación
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="settings-btn"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="conversations-list">
          {conversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${currentConversationId === conversation.id ? 'active' : ''}`}
              onClick={() => setCurrentConversationId(conversation.id)}
            >
              <span className="conversation-title">{conversation.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conversation.id);
                }}
                className="delete-btn"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        {currentConversation ? (
          <>
            <div className="messages-container">
              {currentConversation.messages.map(message => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-icon">
                    {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className="message-content">
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message assistant">
                  <div className="message-icon">
                    <Bot size={20} />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje aquí..."
                  disabled={isLoading || !apiKey}
                  className="message-input"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || !apiKey}
                  className="send-btn"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="welcome-screen">
            <h1>ChatGPT Clone</h1>
            <p>Selecciona una conversación o crea una nueva para empezar</p>
            {!apiKey && (
              <p className="api-warning">
                ⚠️ Configura tu API key de OpenAI en Configuración
              </p>
            )}
          </div>
        )}
      </div>

      {showSettings && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Configuración</h2>
            <div className="form-group">
              <label htmlFor="apiKey">API Key de OpenAI:</label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="api-input"
              />
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowSettings(false)} className="cancel-btn">
                Cancelar
              </button>
              <button onClick={saveApiKey} className="save-btn">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;