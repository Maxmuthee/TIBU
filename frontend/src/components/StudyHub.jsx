import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Markdown from 'react-markdown'
import {
  FileText,
  Upload,
  Brain,
  MessageCircle,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  RotateCcw,
  Zap,
  GraduationCap,
  Download,
} from 'lucide-react'
import { getPapers, uploadPaper, generateQuiz, studyAsk, downloadPaperUrl } from '../services/api'
import { cn } from '../lib/utils'

/* ═══════════════════════════════════════════════════════════════════════ */
/* Past Papers Tab (existing functionality, restyled)                    */
/* ═══════════════════════════════════════════════════════════════════════ */
function PastPapersTab() {
  const [papers, setPapers] = useState([])
  const [courseFilter, setCourseFilter] = useState('')
  const [uploadMode, setUploadMode] = useState(false)

  useEffect(() => { loadPapers() }, [])

  const loadPapers = async () => {
    try { setPapers((await getPapers(courseFilter)).papers) } catch { /* */ }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const form = e.target
    try {
      await uploadPaper(new FormData(form))
      form.reset()
      setUploadMode(false)
      loadPapers()
    } catch { alert('Upload failed. Please try again.') }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm"
          type="text"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          placeholder="Filter by course code (e.g., CSC 3100)"
        />
        <button className="bg-usiu-blue hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all text-sm" onClick={loadPapers}>Search</button>
        <button
          className="bg-usiu-gold hover:bg-yellow-400 text-usiu-blue font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 text-sm"
          onClick={() => setUploadMode(!uploadMode)}
        >
          <Upload className="w-4 h-4" />
          {uploadMode ? 'Cancel' : 'Upload'}
        </button>
      </div>

      <AnimatePresence>
        {uploadMode && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleUpload} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-700 text-sm">Upload Study Material</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">File</label>
              <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" type="file" name="file" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Course Code</label>
              <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm" type="text" name="course_code" placeholder="e.g., CSC 3100" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title (optional)</label>
              <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm" type="text" name="title" placeholder="e.g., Final Exam 2025" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Year (optional)</label>
              <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm" type="text" name="year" placeholder="e.g., 2025" />
            </div>
            <button className="w-full bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all text-sm" type="submit">Upload</button>
          </motion.form>
        )}
      </AnimatePresence>

      {papers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            No papers uploaded yet. Be the first to contribute! Click <strong className="text-usiu-blue">Upload</strong> above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <motion.div key={paper.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col">
              <h3 className="font-semibold text-slate-700 text-sm">{paper.title}</h3>
              <div className="flex gap-2 mt-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">{paper.course_code}</span>
                {paper.year && <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">{paper.year}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-3">{paper.filename} &bull; {(paper.size_bytes / 1024).toFixed(1)} KB</p>
              <a
                href={downloadPaperUrl(paper.id)}
                download={paper.filename}
                className="mt-4 flex items-center justify-center gap-2 bg-usiu-blue hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Quiz Generator Tab                                                    */
/* ═══════════════════════════════════════════════════════════════════════ */
const DIFFICULTIES = [
  { id: 'Easy', label: 'Easy', desc: 'Factual recall', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'Medium', label: 'Medium', desc: 'Understanding', color: 'bg-amber-100 text-amber-700' },
  { id: 'Hard', label: 'Hard', desc: 'Analysis', color: 'bg-rose-100 text-rose-700' },
]

const Q_COUNTS = [3, 5, 10]

function QuizGeneratorTab() {
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('Medium')
  const [loading, setLoading] = useState(false)
  const [quiz, setQuiz] = useState(null)          // { questions, sources }
  const [answers, setAnswers] = useState({})       // { 0: 'A', 1: 'C', ... }
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  // Track which question index the user is currently on (for progress bar)
  const [currentQ, setCurrentQ] = useState(0)

  const handleGenerate = async (e, overrideTopic) => {
    if (e) e.preventDefault()
    const useTopic = overrideTopic ?? topic
    setLoading(true)
    setQuiz(null)
    setAnswers({})
    setSubmitted(false)
    setError('')
    setCurrentQ(0)
    try {
      const data = await generateQuiz({ topic: useTopic, num_questions: numQuestions, difficulty })
      if (data.error) {
        setError(data.error)
      } else if (!data.questions?.length) {
        setError('No questions were generated. Try a different topic.')
      } else {
        setQuiz(data)
      }
    } catch {
      setError('Failed to generate quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (qIdx, letter) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [qIdx]: letter }))
    // Advance progress bar to next unanswered question
    setCurrentQ((prev) => Math.max(prev, qIdx + 1))
  }

  const score = quiz?.questions
    ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0)
    : 0
  const total = quiz?.questions?.length ?? 0

  // Topics of questions the user got wrong — for retry
  const wrongTopics = quiz?.questions
    ? quiz.questions
        .filter((_, i) => answers[i] !== quiz.questions[i].correct_answer)
        .map((q) => q.question.split(' ').slice(0, 6).join(' '))
        .join(', ')
    : ''

  const handleReset = () => {
    setQuiz(null)
    setAnswers({})
    setSubmitted(false)
    setError('')
    setTopic('')
    setCurrentQ(0)
  }

  const handleRetryWrong = () => {
    const retryTopic = `${topic} — focusing on: ${wrongTopics}`
    setTopic(retryTopic)
    handleGenerate(null, retryTopic)
  }

  // Score feedback
  const pct = total > 0 ? score / total : 0
  const scoreLabel = pct > 0.8 ? 'Excellent work!' : pct > 0.6 ? 'Good effort!' : 'Keep practising!'

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Input form ── */}
      {!quiz && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleGenerate}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-usiu-gold" />
            <h3 className="font-semibold text-slate-700 text-sm">Generate a Quiz</h3>
          </div>
          <p className="text-xs text-slate-500">
            Enter any USIU topic and TIBU will generate a quiz from the university knowledge base. Great for revision!
          </p>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Topic *</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., USIU fee structure, computer science courses, campus facilities"
              required
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all',
                    difficulty === d.id
                      ? `${d.color} border-current`
                      : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
                  )}
                >
                  {d.label}
                  <span className="block text-[10px] font-normal opacity-70">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Number of questions */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Questions</label>
            <div className="flex gap-2">
              {Q_COUNTS.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
                    numQuestions === n
                      ? 'bg-usiu-blue/10 text-usiu-blue border-usiu-blue/30'
                      : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating quiz…</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate Quiz</>
            )}
          </button>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </motion.form>
      )}

      {/* ── Quiz display ── */}
      {quiz && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Header with progress bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Quiz: {topic}</h3>
              <p className="text-xs text-slate-400">{total} questions · {difficulty}</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-usiu-blue transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> New Quiz
            </button>
          </div>

          {/* Progress bar */}
          {!submitted && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Question {Math.min(currentQ + 1, total)} of {total}</span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-usiu-blue rounded-full transition-all duration-300"
                  style={{ width: `${(Object.keys(answers).length / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Score summary card */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'rounded-2xl p-6 text-center',
                  pct > 0.8
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                    : pct > 0.6
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                    : 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                )}
              >
                <p className="text-3xl font-bold">{score} / {total}</p>
                <p className="text-sm opacity-90 mt-1">{scoreLabel}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  {Math.round(pct * 100)}% — {score} correct, {total - score} incorrect
                </p>
                {total - score > 0 && (
                  <button
                    onClick={handleRetryWrong}
                    className="mt-4 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Wrong Answers
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Questions */}
          {quiz.questions.map((q, qIdx) => {
            const userAnswer = answers[qIdx]
            const isCorrect = userAnswer === q.correct_answer
            return (
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * qIdx }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-usiu-blue/10 text-usiu-blue text-xs font-bold flex items-center justify-center mt-0.5">
                    {qIdx + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{q.question}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-10">
                  {q.options.map((option) => {
                    const letter = option.charAt(0)
                    const isSelected = userAnswer === letter
                    const showCorrect = submitted && letter === q.correct_answer
                    const showWrong = submitted && isSelected && !isCorrect

                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleAnswer(qIdx, letter)}
                        disabled={submitted}
                        className={cn(
                          'text-left px-4 py-3 rounded-xl text-xs border-2 transition-all',
                          !submitted && isSelected && 'bg-usiu-blue/10 border-usiu-blue/30 text-usiu-blue font-semibold',
                          !submitted && !isSelected && 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600',
                          showCorrect && 'bg-emerald-50 border-emerald-400 text-emerald-700 font-semibold',
                          showWrong && 'bg-red-50 border-red-300 text-red-600',
                          submitted && !showCorrect && !showWrong && 'bg-slate-50 border-transparent text-slate-400',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {showCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                          {showWrong && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                          {option}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Explanation */}
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-10 mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100"
                  >
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-700">Explanation:</strong> {q.explanation}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )
          })}

          {/* Submit / Sources */}
          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < total}
              className="w-full bg-usiu-gold hover:bg-yellow-400 text-usiu-blue font-bold py-3 rounded-xl transition-all disabled:opacity-40 text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Submit Answers ({Object.keys(answers).length}/{total} answered)
            </button>
          ) : (
            quiz.sources?.length > 0 && (
              <p className="text-xs text-slate-400 text-center">Sources: {quiz.sources.join(', ')}</p>
            )
          )}
        </motion.div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Study Q&A Tab                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'tibu_study_qa_messages'

function StudyQATab() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch { /* storage full */ }
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      // Build conversation history from previous messages
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

      const data = await studyAsk({ question, conversation_history: history })
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I couldn\'t process that question. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] max-w-3xl">
      {/* Header row with clear button */}
      {messages.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY) }}
            className="text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Clear session
          </button>
        </div>
      )}
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="p-4 bg-indigo-50 rounded-2xl mb-4">
              <GraduationCap className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-600 text-sm mb-1">Study with TIBU</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Ask study questions about any USIU topic. TIBU will give you detailed, tutor-style explanations grounded in real university data.
            </p>
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {[
                'What are the core courses for Computer Science?',
                'Explain the USIU grading system',
                'What clubs are available on campus?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion) }}
                  className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-usiu-blue transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-usiu-blue text-white rounded-br-md'
                  : 'bg-white border border-slate-200 shadow-sm text-slate-700 rounded-bl-md'
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="markdown-body text-sm">
                  <Markdown>{msg.content}</Markdown>
                  {msg.sources?.length > 0 && (
                    <p className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      Sources: {msg.sources.join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-usiu-blue" />
              <span className="text-xs text-slate-400">TIBU is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 mt-auto border-t border-slate-100">
        <input
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a study question…"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-usiu-blue hover:bg-slate-800 text-white p-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Main StudyHub Component                                               */
/* ═══════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'papers', label: 'Past Papers', icon: FileText },
  { id: 'quiz', label: 'Quiz Generator', icon: Brain },
  { id: 'qa', label: 'Study Q&A', icon: MessageCircle },
]

export default function StudyHub() {
  const [tab, setTab] = useState('papers')

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

        {/* ── Hero Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-usiu-blue via-indigo-700 to-violet-700 rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-12 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-usiu-gold rounded-xl">
              <BookOpen className="w-5 h-5 text-usiu-blue" />
            </div>
            <h2 className="text-xl font-bold">Study Hub</h2>
          </div>
          <p className="text-white/80 text-sm leading-relaxed max-w-2xl relative z-10">
            Your AI-powered study companion. Browse past papers, generate quizzes from the USIU knowledge base,
            or ask TIBU study questions — like having a personal tutor available 24/7.
          </p>
          <div className="flex gap-4 mt-4 text-xs text-white/60 relative z-10">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-usiu-gold" /> Past Papers</span>
            <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-usiu-gold" /> AI Quizzes</span>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-usiu-gold" /> RAG-Powered</span>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  tab === t.id
                    ? 'bg-white text-usiu-blue shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ── */}
        {tab === 'papers' && <PastPapersTab />}
        {tab === 'quiz' && <QuizGeneratorTab />}
        {tab === 'qa' && <StudyQATab />}
      </div>
    </div>
  )
}
