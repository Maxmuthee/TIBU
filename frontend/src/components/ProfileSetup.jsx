import { useState } from 'react'
import { motion } from 'motion/react'
import { School, User, BookOpen, GraduationCap, ArrowRight, ListChecks } from 'lucide-react'
import { MAJORS } from '../lib/constants'

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate / Postgraduate']

const TOTAL_STEPS = 3

export default function ProfileSetup({ onSave }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [major, setMajor] = useState('')
  const [year, setYear] = useState('')
  const [currentCourses, setCurrentCourses] = useState('')

  const handleFinish = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), major, year, courses: currentCourses.trim() })
  }

  return (
    <div className="fixed inset-0 bg-usiu-blue/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Top banner */}
        <div className="bg-gradient-to-r from-usiu-blue to-slate-700 px-8 pt-8 pb-10 text-white text-center">
          <div className="w-16 h-16 bg-usiu-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <School className="w-9 h-9 text-usiu-blue" />
          </div>
          <h1 className="text-2xl font-bold font-serif">Welcome to TIBU</h1>
          <p className="text-white/70 text-sm mt-1">Your AI campus companion at USIU-Africa</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-8 -mt-3 mb-6 relative z-10">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-usiu-blue' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="px-8 pb-8 space-y-5">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">What's your name?</h2>
                <p className="text-sm text-slate-500">TIBU will use this to personalise your experience.</p>
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none text-slate-800 text-sm"
                  placeholder="e.g. Aisha Mwangi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(2)}
                />
              </div>
              <button
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="w-full bg-usiu-blue hover:bg-slate-800 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Your academic profile</h2>
                <p className="text-sm text-slate-500">
                  This helps TIBU give you more relevant answers. You can skip this.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <BookOpen className="w-3 h-3 inline mr-1" /> Major / Programme
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none text-sm bg-white text-slate-800"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                >
                  <option value="">Select your major…</option>
                  {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <GraduationCap className="w-3 h-3 inline mr-1" /> Year of Study
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-left ${
                        year === y
                          ? 'bg-usiu-blue text-white border-usiu-blue'
                          : 'border-slate-200 text-slate-600 hover:border-usiu-blue hover:text-usiu-blue'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onSave({ name: name.trim(), major: '', year: '', courses: '' })}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip academic details
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Your current courses</h2>
                <p className="text-sm text-slate-500">
                  Helps TIBU tailor study tips and match you with study partners. You can skip this.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <ListChecks className="w-3 h-3 inline mr-1" /> Courses (comma-separated)
                </label>
                <input
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none text-slate-800 text-sm"
                  placeholder="e.g. CSC 3100, MAT 2100, BUS 2050"
                  value={currentCourses}
                  onChange={(e) => setCurrentCourses(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
                />
                <p className="text-xs text-slate-400 mt-1.5">Enter course codes separated by commas.</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  Start using TIBU <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onSave({ name: name.trim(), major, year, courses: '' })}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip — I'll add courses later
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
