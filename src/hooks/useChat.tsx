'use client'

import { useState } from 'react'
import type { ChatMessage } from '@/types'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (userMessage: string) => {
    setIsLoading(true)
    
    // Add user message
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      })

      const data = await response.json()
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.response,
        recommendedTrade: data.recommendedTrade
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return { messages, sendMessage, isLoading }
}
