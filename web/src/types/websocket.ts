import type { User, Channel } from './messages'

export type WebSocketMessage =
  | MessageEvent
  | UserJoinedEvent
  | UserLeftEvent
  | ErrorEvent
  | RecipeUrlRequestEvent
  | RecipeAdditionsEvent
  | RecipeProgressEvent

export interface MessageEvent {
  type: 'MESSAGE'
  payload: MessagePayload
  timestamp: string
}

export interface UserJoinedEvent {
  type: 'USER_JOINED'
  payload: UserEventPayload
  timestamp: string
}

export interface UserLeftEvent {
  type: 'USER_LEFT'
  payload: UserEventPayload
  timestamp: string
}

export interface ErrorEvent {
  type: 'ERROR'
  payload: ErrorPayload
  timestamp: string
}

export interface ErrorPayload {
  message: string
  code?: string
}

export interface RecipeUrlRequestEvent {
  type: 'RECIPE_URL_REQUEST'
  payload: RecipeUrlRequestPayload
  timestamp: string
}

export interface MessagePayload {
  id: string
  sender: User
  channel: Channel
  text: string
  sentAt: string
}

export interface UserEventPayload {
  user: User
  channelId: string
}

export interface RecipeUrlRequestPayload {
  id: string
  sender: User
  channel: Channel
  url: string
  sentAt: string
}

export interface RecipeUrlRequestData {
  sharerId: string
  sharerName: string
  url: string
}

export interface RecipeAdditionsEvent {
  type: 'RECIPE_ADDITIONS'
  payload: RecipeAdditionsPayload
  timestamp: string
}

export interface RecipeAdditionsPayload {
  status: string
  list: Recipe[]
}

export interface Recipe {
  id: string
  name: string
  url: string
  image?: string | null
  ingredients: Ingredient[]
  sharerId: string
  sharerName: string
  createdAt: string
  updatedAt: string
}

export interface Ingredient {
  name: string
  groceryItem?: GroceryItem | null
  quantity?: string | null
  unit?: string | null
}

export interface GroceryItem {
  id: string
  name: string
  category: string
}

export interface RecipeProgressEvent {
  type: 'RECIPE_PROGRESS'
  payload: RecipeProgressPayload
  timestamp: string
}

export interface RecipeProgressPayload {
  request: RecipeUrlRequestPayload
  phase: string
  status: string
  message: string
}
