import { createBrowserRouter, Navigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import App from './App'
import HomePage from './pages/HomePage'
import MixPage from './pages/MixPage'
import NotFoundPage from './pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to={`/mixes/${uuidv4()}`} replace />
      },
      {
        path: 'home',
        element: <HomePage />
      },
      {
        path: 'mixes',
        element: <Navigate to={`/mixes/${uuidv4()}`} replace />
      },
      {
        path: '/mixes/:id',
        element: <MixPage />
      },
      {
        path: 'not-found',
        element: <NotFoundPage />
      },
      {
        path: '*',
        element: <Navigate to="/not-found" replace />
      }
    ]
  }
])
