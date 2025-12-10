import { useState } from 'react'
import { AlertCircle, Lock, User, Sparkles } from 'lucide-react'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simple authentication check
    if ((username === 'ADMIN SHIPPING' && password === 'RIYRIS1918') ||
        (username === 'KASIE' && password === '98SAMPAI1')) {
      onLogin()
    } else {
      setError('Username atau password salah')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 animate-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8 animate-slideInLeft">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse-slow"></div>
              <div className="relative p-5 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
                <img
                  src="/logo-perusahaan.svg"
                  alt="Logo PT. Primarindo Argatile"
                  className="w-14 h-14 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
                {/* Fallback Icon jika logo tidak ada */}
                <div className="hidden w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Login Sistem</h1>
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>
          <p className="text-white/90 text-lg drop-shadow font-medium">Sistem Pencatatan Barang Pecah</p>
          <p className="text-white/80 text-sm mt-1">PT. Primarindo Argatile</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 animate-scaleIn">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50/90 backdrop-blur-sm border-2 border-red-300 rounded-xl animate-slideInRight shadow-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base touch-manipulation transition-all duration-300 hover:border-blue-300 input-glow font-medium bg-white/50"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base touch-manipulation transition-all duration-300 hover:border-purple-300 input-glow font-medium bg-white/50"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 touch-manipulation btn-glow hover:shadow-blue-500/50 hover:scale-105 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Masuk...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Masuk Sekarang
                  </div>
                )}
              </span>
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="font-bold text-slate-700 text-sm">Informasi Login</p>
              </div>
              <p className="text-slate-600 text-sm mb-1">Harap Hubungi Admin Untuk Login</p>
              <p className="text-slate-800 font-semibold text-sm">Riyant Adhitya Adji S.Kom.</p>
            </div>
          </div>
        </div>

        {/* Company Footer */}
        <div className="text-center mt-8 animate-slideInRight">
          <div className="bg-white/20 backdrop-blur-md rounded-xl px-6 py-4 border border-white/30 shadow-xl">
            <p className="text-sm text-white font-medium drop-shadow">
              © {new Date().getFullYear()} Shipping & Marketing PT. Primarindo Argatile
            </p>
            <p className="text-xs text-white/80 mt-1">All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
