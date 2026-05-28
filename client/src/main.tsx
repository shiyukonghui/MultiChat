import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// React 18 入口：使用 createRoot 渲染根组件
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
