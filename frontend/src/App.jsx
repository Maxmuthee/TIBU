import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, Sun, Moon, Type } from 'lucide-react'
import AdminPanel from './components/AdminPanel'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import CourseAdvisor from './components/CourseAdvisor'
import CampusMap from './components/CampusMap'
import StudyHub from './components/StudyHub'
import Opportunities from './components/Opportunities'
import LostFound from './components/LostFound'
import Wellness from './components/Wellness'
import Microcredentials from './components/Microcredentials'
import ProfileSetup from './components/ProfileSetup'
import { useProfile } from './hooks/useProfile'
import { cn } from './lib/utils'

const VIEW_TITLES = {
  chat: 'Ask TIBU',
  courses: 'Smart Course Advisor',
  map: 'Campus Navigator',
  'study-hub': 'Study Hub & Past Papers',
  opportunities: 'Opportunities',
  'lost-found': 'Lost & Found',
  wellness: 'Wellness & Mental Health',
  microcredentials: 'Microcredentials Hub',
}

export default function App() {
  // Admin panel — only accessible at /admin, not linked anywhere in the UI
  if (window.location.pathname === '/admin') return <AdminPanel />
  const [activeView, setActiveView] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  const { profile, saveProfile, isSetup } = useProfile()

  const showProfileSetup = !isSetup || editingProfile

  // Apply accessibility classes to <html> element
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('high-contrast', highContrast)
    root.classList.toggle('large-text', largeText)
  }, [highContrast, largeText])

  // Update document title on view change
  useEffect(() => {
    const title = VIEW_TITLES[activeView]
    document.title = title ? `TIBU — ${title}` : 'TIBU'
  }, [activeView])

  const handleNavigate = (view) => {
    setActiveView(view)
    setSidebarOpen(false)
  }

  const handleQuickLink = (query) => {
    setActiveView('chat')
    setChatInput(query)
    setSidebarOpen(false)
  }

  const handleSaveProfile = (data) => {
    saveProfile(data)
    setEditingProfile(false)
  }

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return (
          <Chat
            externalInput={chatInput}
            onInputConsumed={() => setChatInput('')}
            profile={profile}
            onEditProfile={() => setEditingProfile(true)}
          />
        )
      case 'courses': return <CourseAdvisor />
      case 'map': return <CampusMap />
      case 'study-hub': return <StudyHub />
      case 'opportunities': return <Opportunities />
      case 'lost-found': return <LostFound />
      case 'wellness': return <Wellness />
      case 'microcredentials': return <Microcredentials />
      default: return <Chat profile={profile} onEditProfile={() => setEditingProfile(true)} />
    }
  }

  return (
    <div className="flex h-screen bg-usiu-light overflow-hidden">
      {/* Profile setup modal — shown on first visit or when editing */}
      <AnimatePresence>
        {showProfileSetup && (
          <ProfileSetup
            key="profile-setup"
            initialData={profile}
            onSave={handleSaveProfile}
          />
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h1 className="text-sm font-bold text-slate-700">{VIEW_TITLES[activeView]}</h1>
            </div>
          </div>

          {/* Accessibility controls */}
          <div className="flex items-center gap-1" role="toolbar" aria-label="Accessibility options">
            <button
              onClick={() => setLargeText(!largeText)}
              title={largeText ? 'Standard text size' : 'Large text mode'}
              aria-pressed={largeText}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                largeText
                  ? 'bg-usiu-blue text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">A+</span>
            </button>
            <button
              onClick={() => setHighContrast(!highContrast)}
              title={highContrast ? 'Standard contrast' : 'High contrast mode'}
              aria-pressed={highContrast}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                highContrast
                  ? 'bg-usiu-blue text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              {highContrast ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{highContrast ? 'Standard' : 'High Contrast'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
