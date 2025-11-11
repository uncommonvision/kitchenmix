import { useEffect, useState, useCallback, useRef } from 'react'
import { websocketService, handleConnectionAck, type ConnectionState } from '@/services/websocket'
import type { WebSocketMessage, MessagePayload, RecipeUrlRequestPayload, RecipeUrlRequestData } from '@/types'

interface UseMessagingServiceOptions {
  uuid: string
  autoConnect?: boolean
  onConnectionChange?: (connected: boolean, state: ConnectionState) => void
}

interface UseMessagingServiceReturn {
  isConnected: boolean
  connectionState: ConnectionState
  error: Error | null
  sendMessage: (message: Omit<MessagePayload, 'id' | 'sentAt'>) => void
  sendRecipeUrlRequest: (payload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'>) => void
  onMessage: (callback: (message: WebSocketMessage) => void) => () => void
  reconnect: () => Promise<void>
  disconnect: () => void
}

export function useMessagingService(options: UseMessagingServiceOptions): UseMessagingServiceReturn {
  const { uuid, autoConnect = true, onConnectionChange } = options

  const [error, setError] = useState<Error | null>(null)
  const [, forceUpdate] = useState({})

  const onConnectionChangeRef = useRef(onConnectionChange)

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange
  }, [onConnectionChange])

  useEffect(() => {
    const unsubscribe = websocketService.onStateChange((state) => {
      onConnectionChangeRef.current?.(state === 'connected', state)
      forceUpdate({})
    })

    if (autoConnect && uuid) {
      const connect = async () => {
        try {
          setError(null)
          await websocketService.connect(uuid)
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to connect')
          setError(error)
        }
      }
      connect()
    }

    return unsubscribe
  }, [uuid, autoConnect])

  const connectionState = websocketService.getConnectionState()
  const isConnected = websocketService.isConnected()

  useEffect(() => {
    const unsubscribeAck = handleConnectionAck(() => { })

    return unsubscribeAck
  }, [])

  const reconnect = useCallback(async () => {
    try {
      setError(null)
      await websocketService.connect(uuid)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reconnect')
      setError(error)
    }
  }, [uuid])

  const disconnect = useCallback(() => {
    websocketService.disconnect()
  }, [])

  const sendMessage = (message: Omit<MessagePayload, 'id' | 'sentAt'>) => {
    if (!websocketService.isConnected()) {
      console.error('WebSocket not connected')
      return
    }

    const chatMessage: WebSocketMessage = {
      type: 'MESSAGE',
      payload: {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sentAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }

    websocketService.send('CHAT_MESSAGE', chatMessage)
  }

  const sendRecipeUrlRequest = (payload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'>) => {
    if (!websocketService.isConnected()) {
      console.error('WebSocket not connected')
      return
    }

    const wsData: RecipeUrlRequestData = {
      senderId: payload.sender.id,
      senderName: payload.sender.name,
      sessionId: payload.channel.id,
      url: payload.url,
    }

    // const recipeSubmission: WebSocketMessage = {
    //   type: 'RECIPE_URL_REQUEST',
    //   payload: {
    //     ...payload,
    //     id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    //     sentAt: new Date().toISOString()
    //   },
    //   timestamp: new Date().toISOString()
    // }

    websocketService.send('RECIPE_URL_REQUEST', wsData)
  }

  const onMessage = useCallback((callback: (message: WebSocketMessage) => void) => {
    const unsubscribeChatMessage = websocketService.on('CHAT_MESSAGE', (data: WebSocketMessage) => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in messaging callback:', error)
      }
    })

    const unsubscribeUserJoined = websocketService.on('USER_JOINED', (data: any) => {
      try {
        const userJoinedEvent: WebSocketMessage = {
          type: 'USER_JOINED',
          payload: {
            user: {
              id: data.userId,
              name: data.userName
            },
            channelId: data.sessionId
          },
          timestamp: new Date().toISOString()
        }
        callback(userJoinedEvent)
      } catch (error) {
        console.error('Error in user joined callback:', error)
      }
    })

    const unsubscribeUserLeft = websocketService.on('USER_LEFT', (data: any) => {
      try {
        const userLeftEvent: WebSocketMessage = {
          type: 'USER_LEFT',
          payload: {
            user: {
              id: data.userId,
              name: data.userName
            },
            channelId: data.sessionId
          },
          timestamp: new Date().toISOString()
        }
        callback(userLeftEvent)
      } catch (error) {
        console.error('Error in user left callback:', error)
      }
    })

    const unsubscribeRecipeSubmission = websocketService.on('RECIPE_URL_REQUEST', (data: RecipeUrlRequestData) => {
      try {
        const recipeSubmissionEvent: WebSocketMessage = {
          type: 'RECIPE_URL_REQUEST',
          payload: {
            id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sender: {
              id: data.senderId,
              name: data.senderName
            },
            channel: {
              id: data.sessionId,
              name: 'General'
            },
            url: data.url,
            sentAt: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
        callback(recipeSubmissionEvent)
      } catch (error) {
        console.error('Error in recipe submission callback:', error)
      }
    })

    const unsubscribeRecipeProgress = websocketService.on('RECIPE_PROGRESS', (data: any) => {
      try {
        // Transform backend's flat structure to frontend's nested structure
        const recipeProgressEvent: WebSocketMessage = {
          type: 'RECIPE_PROGRESS',
          payload: {
            request: {
              id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sender: {
                id: data.request.senderId,
                name: data.request.senderName
              },
              channel: {
                id: data.request.sessionId,
                name: 'General'
              },
              url: data.request.url,
              sentAt: new Date().toISOString()
            },
            phase: data.phase,
            status: data.status,
            message: data.message
          },
          timestamp: new Date().toISOString()
        }
        callback(recipeProgressEvent)
      } catch (error) {
        console.error('Error in recipe progress callback:', error)
      }
    })

    const unsubscribeRecipeResponse = websocketService.on('RECIPE_URL_RESPONSE', (data: any) => {
      try {
        // Transform backend's flat structure to frontend's nested structure
        const recipeResponseEvent: WebSocketMessage = {
          type: 'RECIPE_URL_RESPONSE',
          payload: {
            status: data.status,
            request: {
              id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sender: {
                id: data.request.senderId,
                name: data.request.senderName
              },
              channel: {
                id: data.request.sessionId,
                name: 'General'
              },
              url: data.request.url,
              sentAt: new Date().toISOString()
            },
            recipe: data.recipe
          },
          timestamp: new Date().toISOString()
        }
        callback(recipeResponseEvent)
      } catch (error) {
        console.error('Error in recipe response callback:', error)
      }
    })

    return () => {
      unsubscribeChatMessage()
      unsubscribeUserJoined()
      unsubscribeUserLeft()
      unsubscribeRecipeSubmission()
      unsubscribeRecipeProgress()
      unsubscribeRecipeResponse()
    }
  }, [])

  return {
    isConnected,
    connectionState,
    error,
    sendMessage,
    sendRecipeUrlRequest,
    onMessage,
    reconnect,
    disconnect
  }
}
