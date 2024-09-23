"use client"

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AIResponseFormatter from '@/components/AIResponseFormatter';

interface ChatInputProps {
  mealId: string;
  initialMessages: Message[];
}

interface Message {
  id: number;
  meal_id: string;
  content: string;
  is_ai: boolean;
  created_at: string;
  truncated?: boolean;
}

export default function ChatInput({ mealId, initialMessages }: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessageId = Date.now();
    const aiMessageId = userMessageId + 1;

    setMessages(prevMessages => [
      ...prevMessages,
      { id: userMessageId, meal_id: mealId, content: inputMessage, is_ai: false, created_at: new Date().toISOString() },
      { id: aiMessageId, meal_id: mealId, content: '', is_ai: true, created_at: new Date().toISOString() }
    ]);

    setInputMessage('');

    startTransition(async () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      eventSourceRef.current = new EventSource(`/api/chat-stream?message=${encodeURIComponent(inputMessage)}&mealId=${mealId}`);

      let fullResponse = '';
      let isTruncated = false;

      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.chunk === "[TRUNCATED]") {
          isTruncated = true;
          fullResponse += data.chunk.replace("[TRUNCATED]", "");
          updateAIMessage(aiMessageId, fullResponse, true);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
        } else {
          fullResponse += data.chunk;
          updateAIMessage(aiMessageId, fullResponse, false);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('EventSource failed:', error);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
    });
  };

  const updateAIMessage = (messageId: number, content: string, truncated: boolean) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, content: content, truncated: truncated } : msg
      )
    );
  };

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      <div 
        id="message-container" 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[575px]"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.is_ai ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`flex flex-col max-w-[70%] p-4 rounded-2xl ${
                msg.is_ai 
                  ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-gray-800 shadow-md' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-800 shadow'
              } ${msg.is_ai ? 'self-start' : 'self-end'}`}
            >
              {msg.is_ai ? (
                <AIResponseFormatter response={msg.content || "Loading.."} truncated={msg.truncated} />
              ) : (
                <p className="text-base">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about the meal..."
            className="w-full p-4 pr-16 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm text-gray-800"
            disabled={isPending}
          />
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300 shadow-md"
            disabled={isPending}
          >
            {isPending ? (
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}