import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Markdown from 'react-markdown'
import { BookOpen, Sparkles, RotateCcw, ChevronRight, GraduationCap, Lightbulb, ListChecks } from 'lucide-react'
import { getCourseAdvice } from '../services/api'
import { cn } from '../lib/utils'
import { MAJORS } from '../lib/constants'

export default function CourseAdvisor() {
  const [major, setMajor] = useState('')
  const [completed, setCompleted] = useState('')
  const [interests, setInterests] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (major === 'other') {
      setError('Please type your programme name in the field below.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await getCourseAdvice({
        major,
        completed_courses: completed.split(',').map((c) => c.trim()).filter(Boolean),
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
      })
      setResult(data)
    } catch {
      setError('Unable to reach the advisor right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setMajor('')
    setCompleted('')
    setInterests('')
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-usiu-blue flex items-center justify-center flex-shrink-0 shadow-lg shadow-usiu-blue/25">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Smart Course Advisor</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Get AI-powered course recommendations tailored to your USIU programme and goals.
            </p>
          </div>
        </div>

        {/* Form card */}
        <motion.form
          onSubmit={handleSubmit}
          layout
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-usiu-blue" />
            <span className="text-sm font-semibold text-slate-700">Your Academic Profile</span>
          </div>

          <div className="p-6 space-y-5">
            {/* Major */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Major / Programme <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white",
                    "focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all",
                    "text-slate-700 appearance-none cursor-pointer",
                    !major && "text-slate-400"
                  )}
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                >
                  <option value="" disabled>Select your programme…</option>
                  {MAJORS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="other">Other</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
              {major === 'other' && (
                <input
                  className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all"
                  placeholder="Type your programme name…"
                  onChange={(e) => setMajor(e.target.value === '' ? 'other' : e.target.value)}
                />
              )}
            </div>

            {/* Completed courses */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completed Courses
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-slate-700 placeholder:text-slate-400"
                value={completed}
                onChange={(e) => setCompleted(e.target.value)}
                placeholder="e.g., CSC 1100, CSC 1200, MAT 1100"
              />
              <p className="text-[11px] text-slate-400">Separate course codes with commas</p>
            </div>

            {/* Interests */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Areas of Interest
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-slate-700 placeholder:text-slate-400"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g., AI, cybersecurity, entrepreneurship"
              />
              <p className="text-[11px] text-slate-400">Helps TIBU tailor recommendations to your goals</p>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "bg-usiu-blue hover:bg-slate-800 text-white font-semibold py-3 rounded-xl",
                "shadow-lg shadow-usiu-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analyzing your profile…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Recommendations
                </>
              )}
            </button>
            {(result || error) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                title="Start over"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Result header */}
              <div className="px-6 py-4 bg-gradient-to-r from-usiu-blue/5 to-transparent border-b border-slate-100 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-usiu-gold/20 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-semibold text-slate-700">TIBU's Recommendations</span>
                <span className="ml-auto text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Powered by RAG
                </span>
              </div>

              {/* Markdown body */}
              <div className="px-6 py-5">
                <div className="markdown-body prose prose-sm max-w-none text-slate-700">
                  <Markdown>{result.answer}</Markdown>
                </div>
              </div>

              {/* Sources */}
              {result.sources?.length > 0 && (
                <div className="px-6 pb-5 flex flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider self-center">Sources</span>
                  {result.sources.map((src, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium"
                    >
                      <BookOpen className="w-3 h-3" />
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom padding for scroll breathing room */}
        <div className="h-4" />
      </div>
    </div>
  )
}
