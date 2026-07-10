import { useState } from 'react'
import {
  MessageSquare,
  BookOpen,
  Map,
  FileText,
  Briefcase,
  Users,
  Search,
  Heart,
  X,
  School,
  Sparkles,
  Award,
  ChevronDown,
} from 'lucide-react'
import { cn } from '../lib/utils'

// ── Core modules — shown always, drive the pitch objectives ──────────────────
const PRIMARY_NAV = [
  { id: 'chat',             label: 'Ask TIBU',          icon: MessageSquare, tag: 'AI Chat' },
  { id: 'microcredentials', label: 'Microcredentials',  icon: Award,         tag: null },
  { id: 'courses',          label: 'Course Advisor',    icon: BookOpen,      tag: null },
  { id: 'wellness',         label: 'Wellness',          icon: Heart,         tag: null },
  { id: 'map',              label: 'Campus Map',        icon: Map,           tag: null },
]

// ── Secondary modules — collapsed under "More" ───────────────────────────────
const SECONDARY_NAV = [
  { id: 'study-hub',    label: 'Study Hub',      icon: FileText  },
  { id: 'opportunities',label: 'Opportunities',  icon: Briefcase },
  { id: 'study-groups', label: 'Study Groups',   icon: Users     },
  { id: 'lost-found',   label: 'Lost & Found',   icon: Search    },
]


function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={() => onClick(item.id)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm group',
        active
          ? 'bg-white/15 text-usiu-gold font-semibold'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <span className={cn(
        'p-1.5 rounded-lg transition-colors flex-shrink-0',
        active ? 'bg-usiu-gold text-usiu-blue' : 'bg-white/5 group-hover:bg-white/10'
      )}>
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.tag && (
        <span className={cn(
          'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full',
          item.tag === 'New'
            ? 'bg-usiu-gold text-usiu-blue'
            : 'bg-white/10 text-white/60'
        )}>
          {item.tag}
        </span>
      )}
    </button>
  )
}

export default function Sidebar({ activeView, onNavigate, isOpen, onClose }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const secondaryActive = SECONDARY_NAV.some((n) => n.id === activeView)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 w-72 bg-usiu-blue text-white z-50 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-usiu-gold rounded-xl flex items-center justify-center shadow-lg">
          <School className="w-6 h-6 text-usiu-blue" />
        </div>
        <div>
          <h2 className="font-bold font-serif text-lg leading-tight">TIBU</h2>
          <p className="text-[10px] text-usiu-gold uppercase tracking-widest font-bold">Your campus, understood.</p>
        </div>
        <button onClick={onClose} className="lg:hidden ml-auto p-1 hover:bg-white/10 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">

        {/* Primary navigation */}
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-2">Features</p>
          <div className="space-y-0.5">
            {PRIMARY_NAV.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeView === item.id}
                onClick={onNavigate}
              />
            ))}
          </div>
        </div>

        {/* Secondary navigation — collapsible */}
        <div>
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider',
              secondaryActive
                ? 'text-usiu-gold'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', moreOpen && 'rotate-180')} />
            More features
            {secondaryActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-usiu-gold" />
            )}
          </button>

          {(moreOpen || secondaryActive) && (
            <div className="space-y-0.5 mt-0.5">
              {SECONDARY_NAV.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activeView === item.id}
                  onClick={onNavigate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-usiu-gold" />
            <p className="text-xs font-bold text-usiu-gold uppercase">Powered by AI</p>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            RAG over 3,000+ real USIU sources — web pages, handbooks, PDFs &amp; documents.
          </p>
        </div>

      </div>
    </aside>
  )
}
