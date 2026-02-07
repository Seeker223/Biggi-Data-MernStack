import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Simple header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-primary">Biggi Data Web</h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
                <p className="text-gray-600 mb-6">
                  React Native app converted to React Web
                </p>
                <button className="btn-primary">
                  Get Started
                </button>
              </div>
            } />
          </Routes>
        </main>
        
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  )
}

export default App