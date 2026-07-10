import { useState, useEffect, useMemo } from 'react'
import { Briefcase, Calendar, Search, X } from 'lucide-react'
import { getInternships, getEvents } from '../services/api'
import { cn } from '../lib/utils'

export default function Opportunities() {
  const [internships, setInternships] = useState([])
  const [events, setEvents] = useState([])
  const [tab, setTab] = useState('internships')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getInternships().then((d) => setInternships(d.opportunities)).catch(() => {})
    getEvents().then((d) => setEvents(d.events)).catch(() => {})
  }, [])

  const filteredInternships = useMemo(() => {
    if (!search.trim()) return internships
    const q = search.toLowerCase()
    return internships.filter(
      (o) =>
        o.title?.toLowerCase().includes(q) ||
        o.company?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        o.type?.toLowerCase().includes(q)
    )
  }, [internships, search])

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events
    const q = search.toLowerCase()
    return events.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    )
  }, [events, search])

  const activeList = tab === 'internships' ? filteredInternships : filteredEvents

  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4 md:p-8 space-y-4">
      {/* Tabs + search row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2">
          <button
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'internships'
                ? 'bg-usiu-blue text-white shadow-lg shadow-usiu-blue/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
            onClick={() => { setTab('internships'); setSearch('') }}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Internships & Jobs
            </span>
          </button>
          <button
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'events'
                ? 'bg-usiu-blue text-white shadow-lg shadow-usiu-blue/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
            onClick={() => { setTab('events'); setSearch('') }}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Events
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none"
            placeholder={tab === 'internships' ? 'Search by title, company…' : 'Search by title, category…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results count when filtering */}
      {search && (
        <p className="text-xs text-slate-400">
          {activeList.length} result{activeList.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Internships */}
      {tab === 'internships' && (
        filteredInternships.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {search ? `No internships match "${search}".` : 'No opportunities posted yet. Check back soon or visit the Career Services office.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-2 text-xs text-usiu-blue hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInternships.map((opp) => (
              <div key={opp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">{opp.type}</span>
                <h3 className="font-semibold text-slate-700 mt-2">{opp.title}</h3>
                <p className="text-sm font-semibold text-usiu-blue">{opp.company}</p>
                <p className="text-sm text-slate-500 mt-2">{opp.description}</p>
                {opp.requirements && <p className="text-xs text-slate-500 mt-2"><strong>Requirements:</strong> {opp.requirements}</p>}
                {opp.deadline && <p className="text-xs text-red-500 font-semibold mt-2">Deadline: {opp.deadline}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {/* Events */}
      {tab === 'events' && (
        filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {search ? `No events match "${search}".` : 'No events posted yet. Check back soon or visit the Student Affairs office.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-2 text-xs text-usiu-blue hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">{evt.category}</span>
                <h3 className="font-semibold text-slate-700 mt-2">{evt.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{evt.description}</p>
                <p className="text-xs text-slate-400 mt-2">{evt.date} &bull; {evt.location}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
