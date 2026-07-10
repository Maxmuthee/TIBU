import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Heart,
  Phone,
  Shield,
  Users,
  Lightbulb,
  ChevronDown,
  ExternalLink,
  Sparkles,
  Clock,
  MapPin,
  CalendarCheck,
  Brain,
  Leaf,
  HandHeart,
  AlertTriangle,
} from 'lucide-react'
import { getWellnessResources } from '../services/api'
import { cn } from '../lib/utils'

/* ── Quick-access resource cards (static, always visible) ── */
const QUICK_LINKS = [
  {
    icon: Brain,
    title: 'Stress & Anxiety',
    desc: 'Breathing exercises, grounding techniques, and guided relaxation.',
    color: 'bg-violet-500',
    lightBg: 'bg-violet-50',
    lightText: 'text-violet-700',
  },
  {
    icon: Leaf,
    title: 'Mindfulness',
    desc: 'Daily mindfulness practices to stay focused and present.',
    color: 'bg-teal-500',
    lightBg: 'bg-teal-50',
    lightText: 'text-teal-700',
  },
  {
    icon: Users,
    title: 'Relationships',
    desc: 'Navigating friendships, roommates, and social pressures on campus.',
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
  },
  {
    icon: Lightbulb,
    title: 'Academic Burnout',
    desc: 'Recognise burnout early and learn healthy study-life boundaries.',
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
  },
]

function QuickCard({ item, index }) {
  const Icon = item.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', item.lightBg)}>
        <Icon className={cn('w-5 h-5', item.lightText)} />
      </div>
      <h3 className="font-semibold text-slate-800 text-sm mb-1">{item.title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed flex-1">{item.desc}</p>
    </motion.div>
  )
}

function SelfHelpTip({ tip, index }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="flex items-start gap-3 py-2"
    >
      <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
      <span className="text-sm text-slate-600 leading-relaxed">{tip}</span>
    </motion.li>
  )
}

export default function Wellness() {
  const [resources, setResources] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)

  useEffect(() => {
    getWellnessResources()
      .then((data) => setResources(data.resources))
      .catch(() => setLoadError(true))
  }, [])

  const toggle = (section) => setExpandedSection(expandedSection === section ? null : section)

  /* ── Loading skeleton / error fallback ── */
  if (!resources)
    return loadError ? (
      <div className="h-full overflow-y-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/15 backdrop-blur rounded-xl">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">Wellness Centre</h2>
            </div>
            <p className="text-white/80 text-sm leading-relaxed max-w-2xl">
              Your mental health matters. USIU's counselling services, peer support, and crisis contacts are always available.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Could not load wellness resources</p>
              <p className="text-red-600/80">
                For urgent support, contact the USIU Wellness Centre directly or call <span className="font-mono font-semibold">+254 730 116 000</span>.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_LINKS.map((item, i) => (
              <QuickCard key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="h-full overflow-y-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
          <div className="h-36 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    )

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

        {/* ── Hero Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white relative overflow-hidden"
        >
          {/* decorative circle */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-8 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-white/15 backdrop-blur rounded-xl">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Wellness Centre</h2>
          </div>
          <p className="text-white/80 text-sm leading-relaxed max-w-2xl relative z-10">
            Your mental health matters. TIBU connects you to USIU's counselling services, peer support,
            crisis contacts, and self-care resources — all in one place, whenever you need them.
          </p>
          <div className="flex gap-4 mt-4 text-xs text-white/60 relative z-10">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-300" /> Confidential</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-300" /> 24/7 Crisis Line</span>
            <span className="flex items-center gap-1.5"><HandHeart className="w-3.5 h-3.5 text-emerald-300" /> Free for Students</span>
          </div>
        </motion.div>

        {/* ── Crisis Banner ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/60 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-bold text-red-700 text-sm">{resources.crisis?.title || 'Crisis Support'}</h3>
            <span className="ml-auto text-[10px] font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Urgent
            </span>
          </div>
          <p className="text-sm text-red-600/80 mb-3 leading-relaxed">{resources.crisis?.description}</p>
          <div className="flex flex-wrap gap-3">
            {resources.crisis?.contacts?.map((c, i) => (
              <a
                key={i}
                href={`tel:${c.phone?.replace(/\s/g, '')}`}
                className="flex items-center gap-2 bg-white border border-red-200 rounded-xl px-4 py-2.5 hover:bg-red-50 transition-colors group"
              >
                <Phone className="w-4 h-4 text-red-500 group-hover:animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-red-700">{c.name}</p>
                  <p className="text-xs text-red-500 font-mono">{c.phone}</p>
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* ── Quick Topic Cards ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-usiu-gold" />
            <h3 className="font-semibold text-slate-700 text-sm">Quick Resources</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_LINKS.map((item, i) => (
              <QuickCard key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* ── Counselling & Peer Support ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Counselling Services */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-usiu-blue to-sky-500" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Heart className="w-4 h-4 text-usiu-blue" />
                </div>
                <h3 className="font-semibold text-slate-700 text-sm">{resources.counseling?.title || 'Counselling Services'}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{resources.counseling?.description}</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Location</p>
                    <p className="text-sm text-slate-600">{resources.counseling?.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hours</p>
                    <p className="text-sm text-slate-600">{resources.counseling?.hours}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Book a Session</p>
                    <p className="text-sm text-slate-600">{resources.counseling?.how_to_book}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Peer Support */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-violet-50 rounded-xl">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="font-semibold text-slate-700 text-sm">{resources.peer_support?.title || 'Peer Support'}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{resources.peer_support?.description}</p>

              <div className="bg-violet-50/60 rounded-xl p-4 border border-violet-100">
                <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-wider mb-1.5">How to Access</p>
                <p className="text-sm text-violet-700 leading-relaxed">{resources.peer_support?.how_to_access}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Self-Help Tips ── */}
        {resources.self_help?.tips?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-400" />
            <div className="p-5">
              <button
                onClick={() => toggle('selfHelp')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-700 text-sm">{resources.self_help?.title || 'Self-Help Tips'}</h3>
                    <p className="text-xs text-slate-400">{resources.self_help?.tips?.length} tips to improve your day</p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-slate-400 transition-transform',
                    expandedSection === 'selfHelp' && 'rotate-180'
                  )}
                />
              </button>
              <AnimatePresence>
                {expandedSection === 'selfHelp' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-4 space-y-0 pl-0 divide-y divide-slate-100">
                      {resources.self_help.tips.map((tip, i) => (
                        <SelfHelpTip key={i} tip={tip} index={i} />
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── Bottom affirmation ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-4"
        >
          <p className="text-xs text-slate-400 leading-relaxed">
            You're not alone. Reaching out is a sign of strength, not weakness.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
