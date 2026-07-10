import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Users, Mail, CheckCircle2, XCircle } from 'lucide-react'
import { findStudyMatches, registerStudyProfile } from '../services/api'
import { cn } from '../lib/utils'

function MatchScoreBadge({ score }) {
  const pct = Math.round(score * 100)
  const colorClass =
    score > 0.8
      ? 'bg-emerald-100 text-emerald-700'
      : score > 0.6
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-600'
  return (
    <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-bold', colorClass)}>
      {pct}% match
    </span>
  )
}

export default function StudyGroups() {
  const [courses, setCourses] = useState('')
  const [style, setStyle] = useState('any')
  const [availability, setAvailability] = useState('')
  const [matches, setMatches] = useState(null)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [matchError, setMatchError] = useState(null)
  const [editing, setEditing] = useState(false)

  const showError = useCallback((msg) => {
    setMatchError(msg)
    setTimeout(() => setMatchError(null), 4000)
  }, [])

  const myCourseList = courses.split(',').map((c) => c.trim()).filter(Boolean)

  const handleMatch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMatches(null)
    // Register the profile so this user is discoverable, then find matches
    try {
      setRegistering(true)
      await registerStudyProfile({
        name: 'Me',
        courses: myCourseList,
        learning_style: style,
        availability,
      })
      setRegistered(true)
      setEditing(false)
      setRegistering(false)
    } catch {
      setRegistering(false)
      // Non-fatal — still attempt matching
    }
    try {
      const data = await findStudyMatches({
        name: 'Me',
        courses: myCourseList,
        learning_style: style,
        availability,
      })
      setMatches(data.matches)
    } catch {
      showError('Matching failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <form onSubmit={handleMatch} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Find Study Partners</h3>
          {registered && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-usiu-blue hover:underline font-semibold"
            >
              Edit preferences
            </button>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Current Courses (comma-separated)</label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all"
            value={courses}
            onChange={(e) => setCourses(e.target.value)}
            placeholder="e.g., CSC 3100, MAT 2100"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Learning Style</label>
          <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all bg-white" value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="any">Any</option>
            <option value="collaborative">Collaborative (group discussions)</option>
            <option value="visual">Visual (diagrams, videos)</option>
            <option value="solo-practice">Solo Practice (problem sets)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Availability</label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g., weekday evenings, weekends"
          />
        </div>
        <button
          className="w-full bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all disabled:opacity-50"
          type="submit"
          disabled={loading || registering}
        >
          {loading ? 'Finding matches…' : registered && !editing ? 'Find Study Partners Again' : 'Find Study Partners'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel editing
          </button>
        )}
      </form>

      {/* Registration success toast */}
      <AnimatePresence>
        {registered && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-sm text-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile registered! You're now visible to other students.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match error toast */}
      <AnimatePresence>
        {matchError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-sm text-red-700"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{matchError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {matches !== null && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700">
            {matches.length > 0 ? `Found ${matches.length} match${matches.length !== 1 ? 'es' : ''}!` : 'No matches yet — check back soon!'}
          </h3>

          {matches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No study profiles yet. Be the first to register!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m, i) => {
                const sharedCourses = myCourseList.filter((c) =>
                  m.courses?.some((mc) => mc.toLowerCase() === c.toLowerCase())
                )
                const primaryCourse = sharedCourses[0] || myCourseList[0] || 'Study Group'
                const mailtoHref = `mailto:?subject=TIBU Study Group — ${encodeURIComponent(primaryCourse)}&body=Hi! I found you via TIBU — the USIU-Africa campus AI. I'd love to study ${encodeURIComponent(primaryCourse)} together. When are you available?`

                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-usiu-blue" />
                        <h3 className="font-semibold text-slate-700">{m.name}</h3>
                      </div>
                      <MatchScoreBadge score={m.match_score} />
                    </div>
                    <p className="text-sm text-slate-500"><strong className="text-slate-600">Courses:</strong> {m.courses?.join(', ')}</p>
                    <p className="text-sm text-slate-500 mt-1"><strong className="text-slate-600">Style:</strong> {m.learning_style}</p>
                    <p className="text-sm text-slate-500 mt-1"><strong className="text-slate-600">Available:</strong> {m.availability}</p>

                    {sharedCourses.length > 0 && (
                      <p className="text-xs text-usiu-blue mt-2">
                        <strong>Why matched:</strong> Shares {sharedCourses.join(', ')}
                      </p>
                    )}

                    <a
                      href={mailtoHref}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-usiu-blue/10 hover:bg-usiu-blue/20 text-usiu-blue font-semibold text-xs py-2.5 rounded-xl transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send Email
                    </a>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
