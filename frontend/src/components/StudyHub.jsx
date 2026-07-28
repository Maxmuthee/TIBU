import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FileText, Upload, BookOpen, Download, Loader2 } from 'lucide-react'
import { getPapers, uploadPaper, downloadPaperUrl } from '../services/api'

/* ═══════════════════════════════════════════════════════════════════════ */
/* Past Papers                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */
function PastPapersTab() {
  const [papers, setPapers] = useState([])
  const [courseFilter, setCourseFilter] = useState('')
  const [uploadMode, setUploadMode] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadPapers() }, [])

  const loadPapers = async () => {
    try { setPapers((await getPapers(courseFilter)).papers) } catch { /* */ }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const form = e.target
    setUploading(true)
    try {
      await uploadPaper(new FormData(form))
      form.reset()
      setUploadMode(false)
      loadPapers()
    } catch { alert('Upload failed. Please try again.') }
    finally { setUploading(false) }
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
            <h3 className="font-semibold text-slate-700 text-sm">Upload a Past Paper</h3>
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
            <button
              className="w-full bg-usiu-blue hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              type="submit"
              disabled={uploading}
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : 'Upload'}
            </button>
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
/* Main StudyHub Component                                               */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function StudyHub() {
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
            Browse and share past papers contributed by fellow USIU-Africa students.
            Upload a paper to help others, or download what you need to revise.
          </p>
          <div className="flex gap-4 mt-4 text-xs text-white/60 relative z-10">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-usiu-gold" /> Past Papers</span>
            <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5 text-usiu-gold" /> Upload</span>
            <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-usiu-gold" /> Download</span>
          </div>
        </motion.div>

        {/* ── Past Papers ── */}
        <PastPapersTab />
      </div>
    </div>
  )
}
