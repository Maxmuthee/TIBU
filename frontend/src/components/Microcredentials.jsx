import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Markdown from 'react-markdown'
import {
  Award,
  Search,
  Sparkles,
  Clock,
  BarChart2,
  BookMarked,
  ChevronDown,
  ExternalLink,
  Filter,
  X,
} from 'lucide-react'
import { getMicrocredentialCatalog, getMicrocredentialRecommendations } from '../services/api'
import { cn } from '../lib/utils'
import { MAJORS } from '../lib/constants'

const PLATFORM_COLORS = {
  Coursera: 'bg-blue-100 text-blue-700',
  edX: 'bg-red-100 text-red-700',
  'AWS Training': 'bg-orange-100 text-orange-700',
  'Microsoft Learn': 'bg-sky-100 text-sky-700',
  Udemy: 'bg-purple-100 text-purple-700',
}

const LEVEL_COLORS = {
  Beginner: 'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-rose-100 text-rose-700',
}

const FIELD_COLORS = {
  Technology: 'bg-indigo-500',
  Business: 'bg-emerald-500',
  Creative: 'bg-pink-500',
  Health: 'bg-teal-500',
  Law: 'bg-slate-500',
  Environment: 'bg-lime-600',
}

function CourseCard({ course }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Coloured top bar */}
      <div className={cn('h-1.5 w-full', FIELD_COLORS[course.field] ?? 'bg-slate-400')} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1">{course.title}</h3>
            <p className="text-xs text-slate-500">{course.provider}</p>
          </div>
          {course.certificate && (
            <span title="Certificate included" className="flex-shrink-0 text-usiu-gold">
              <Award className="w-5 h-5" />
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', PLATFORM_COLORS[course.platform] ?? 'bg-slate-100 text-slate-600')}>
            {course.platform}
          </span>
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', LEVEL_COLORS[course.level])}>
            {course.level}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            {course.duration}
          </span>
        </div>

        {/* Description */}
        <p className={cn('text-xs text-slate-600 leading-relaxed', !expanded && 'line-clamp-2')}>
          {course.description}
        </p>
        {course.description.length > 100 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-usiu-blue font-medium mt-1 hover:underline flex items-center gap-0.5"
          >
            {expanded ? 'Less' : 'More'}
            <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
          </button>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mt-3">
          {course.skills.map((skill) => (
            <span key={skill} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {skill}
            </span>
          ))}
        </div>

        {/* Enroll button */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <a
            href={`https://www.${course.platform.toLowerCase().replace(/\s+/g, '')}.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-usiu-blue hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Enroll on {course.platform}
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default function Microcredentials() {
  const [tab, setTab] = useState('browse')

  // Catalog state
  const [courses, setCourses] = useState([])
  const [fields, setFields] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setCatalogLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeField, setActiveField] = useState('')
  const [activeLevel, setActiveLevel] = useState('')

  // Recommendation state
  const [major, setMajor] = useState('')
  const [interests, setInterests] = useState('')
  const [careerGoal, setCareerGoal] = useState('')
  const [recommendation, setRecommendation] = useState(null)
  const [recLoading, setRecLoading] = useState(false)

  useEffect(() => {
    fetchCatalog()
  }, [search, activeField, activeLevel])

  const fetchCatalog = async () => {
    setCatalogLoading(true)
    try {
      const data = await getMicrocredentialCatalog({ field: activeField, level: activeLevel, search })
      setCourses(data.courses)
      setFields(data.fields)
      setLevels(data.levels)
    } catch {
      setCourses([])
    } finally {
      setCatalogLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setActiveField('')
    setActiveLevel('')
  }

  const handleRecommend = async (e) => {
    e.preventDefault()
    setRecLoading(true)
    try {
      const data = await getMicrocredentialRecommendations({
        major,
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
        career_goal: careerGoal,
      })
      setRecommendation(data)
    } catch {
      setRecommendation({ answer: 'Sorry, I could not generate recommendations. Please try again.' })
    } finally {
      setRecLoading(false)
    }
  }

  const hasFilters = search || activeField || activeLevel

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-r from-usiu-blue to-slate-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-usiu-gold rounded-xl">
              <BookMarked className="w-5 h-5 text-usiu-blue" />
            </div>
            <h2 className="text-xl font-bold">Microcredentials Hub</h2>
          </div>
          <p className="text-white/80 text-sm leading-relaxed max-w-2xl">
            Earn industry-recognised certificates alongside your USIU degree. Short, focused courses from Google,
            IBM, Yale, Microsoft, and more — designed to make you job-ready in Kenya and beyond.
          </p>
          <div className="flex gap-4 mt-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-usiu-gold" /> 20 Courses</span>
            <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-usiu-gold" /> All Levels</span>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-usiu-gold" /> AI-Powered Matching</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          {[
            { id: 'browse', label: 'Browse Catalog' },
            { id: 'recommend', label: 'AI Recommendations' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === t.id
                  ? 'bg-white text-usiu-blue shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.id === 'recommend' && <Sparkles className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Browse Tab ── */}
        {tab === 'browse' && (
          <div className="space-y-4">
            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none"
                  placeholder="Search courses, skills, providers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none bg-white"
                  value={activeField}
                  onChange={(e) => setActiveField(e.target.value)}
                >
                  <option value="">All Fields</option>
                  {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <select
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none bg-white"
                  value={activeLevel}
                  onChange={(e) => setActiveLevel(e.target.value)}
                >
                  <option value="">All Levels</option>
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Active filter pills */}
            {hasFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Filter className="w-3 h-3" /> Filters:
                </span>
                {activeField && (
                  <span className="flex items-center gap-1 bg-usiu-blue/10 text-usiu-blue text-xs font-medium px-2.5 py-1 rounded-full">
                    {activeField}
                    <button onClick={() => setActiveField('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {activeLevel && (
                  <span className="flex items-center gap-1 bg-usiu-blue/10 text-usiu-blue text-xs font-medium px-2.5 py-1 rounded-full">
                    {activeLevel}
                    <button onClick={() => setActiveLevel('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {search && (
                  <span className="flex items-center gap-1 bg-usiu-blue/10 text-usiu-blue text-xs font-medium px-2.5 py-1 rounded-full">
                    "{search}"
                    <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-rose-500 transition-colors">
                  Clear all
                </button>
              </div>
            )}

            {/* Results count */}
            {!loading && (
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{courses.length}</span> courses
              </p>
            )}

            {/* Course grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 h-52 animate-pulse" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No courses match your filters.</p>
                <button onClick={clearFilters} className="mt-2 text-xs text-usiu-blue hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ── AI Recommendations Tab ── */}
        {tab === 'recommend' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-usiu-gold" />
                <h3 className="font-semibold text-slate-700">Tell TIBU about yourself</h3>
              </div>
              <p className="text-xs text-slate-500">
                TIBU's AI will analyse our full microcredential catalog and recommend the 4 courses
                that best complement your degree and career goals.
              </p>

              <form onSubmit={handleRecommend} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Your Major *
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm bg-white"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    required
                  >
                    <option value="">Select your major…</option>
                    {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Career Goal
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    placeholder="e.g., Software Engineer at a tech startup, Investment Banker, NGO Manager"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Skills / Interests (comma-separated)
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g., data analysis, entrepreneurship, design"
                  />
                </div>

                <button
                  type="submit"
                  disabled={recLoading}
                  className="w-full bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {recLoading ? 'Analysing your profile…' : 'Get My Personalised Recommendations'}
                </button>
              </form>
            </div>

            {/* Recommendation result */}
            <AnimatePresence>
              {recommendation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-usiu-gold rounded-lg">
                      <Sparkles className="w-4 h-4 text-usiu-blue" />
                    </div>
                    <h3 className="font-semibold text-slate-700">TIBU's Recommendations for You</h3>
                  </div>
                  <div className="markdown-body text-sm">
                    <Markdown>{recommendation.answer}</Markdown>
                  </div>
                  {recommendation.sources?.length > 0 && (
                    <p className="mt-4 text-xs text-slate-400">Sources: {recommendation.sources.join(', ')}</p>
                  )}
                  <p className="mt-4 text-xs text-slate-400 border-t pt-3">
                    Browse the <button onClick={() => setTab('browse')} className="text-usiu-blue underline">full catalog</button> to explore all available courses.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
