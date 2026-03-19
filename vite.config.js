import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-router-dom': '/src/vendor/react-router-dom.jsx',
      '@lottiefiles/dotlottie-react': '/src/vendor/dotlottie-react.jsx',
    },
  },
})
