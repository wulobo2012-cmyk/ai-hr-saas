import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 👇 这里的代码就是为了解决“两个React”的问题
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})