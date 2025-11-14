import { createContext, useContext, useState } from 'react'
import type { Recipe } from '../types/websocket'
import type { ReactNode } from 'react'

export interface RecipeContextValue {
  recipes: Recipe[]
  selectedRecipes: string[]
  loading: boolean
  setLoading: (loading: boolean) => void
  addRecipe: (recipe: Recipe) => void
  selectRecipe: (id: string, selected: boolean) => void
  clearSelection: () => void
  getSelectedRecipes: () => Recipe[]
  removeRecipe: (id: string) => void
}

export interface RecipeProviderProps {
  children: ReactNode
}

const RecipeContext = createContext<RecipeContextValue | null>(null)

export function RecipeProvider({ children }: RecipeProviderProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addRecipe = (recipe: Recipe) => {
    setRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id)
      if (exists) {
        return prev.map(r => r.id === recipe.id ? recipe : r)
      }
      return [...prev, recipe]
    })
  }

  const selectRecipe = (id: string, selected: boolean) => {
    setSelectedRecipes(prev => {
      if (selected) {
        return prev.includes(id) ? prev : [...prev, id]
      } else {
        return prev.filter(recipeId => recipeId !== id)
      }
    })
  }

  const clearSelection = () => {
    setSelectedRecipes([])
  }

  const getSelectedRecipes = (): Recipe[] => {
    return recipes.filter(recipe => selectedRecipes.includes(recipe.id))
  }

  const removeRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id))
    setSelectedRecipes(prev => prev.filter(recipeId => recipeId !== id))
  }

  const contextValue: RecipeContextValue = {
    recipes,
    selectedRecipes,
    loading,
    setLoading,
    addRecipe,
    selectRecipe,
    clearSelection,
    getSelectedRecipes,
    removeRecipe
  }

  return (
    <RecipeContext.Provider value={contextValue}>
      {children}
    </RecipeContext.Provider>
  )
}

export function useRecipeContext(): RecipeContextValue {
  const context = useContext(RecipeContext)
  if (!context) {
    throw new Error('useRecipeContext must be used within a RecipeProvider')
  }
  return context
}