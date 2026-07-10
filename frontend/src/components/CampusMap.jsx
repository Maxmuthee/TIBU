import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MapPin, Navigation, Search, X, Locate, ExternalLink } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getLocations, findLocation } from '../services/api'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const CAMPUS_CENTER = [-1.2170, 36.8790]
const CAMPUS_ZOOM   = 17


const CATEGORY_COLORS = {
  'Academic':            '#1a3a6b',
  'Administration':      '#6366f1',
  'Library & Learning':  '#0ea5e9',
  'Student Life':        '#10b981',
  'Sports & Recreation': '#f59e0b',
  'Access':              '#64748b',
}

const CATEGORIES = ['All', 'Academic', 'Administration', 'Library & Learning', 'Student Life', 'Sports & Recreation', 'Access']

// Coordinates sourced directly from OpenStreetMap Overpass API (USIU-Africa, Kasarani)
// Way IDs referenced where available for traceability
const FALLBACK_LOCATIONS = [
  // ── Access — OSM way 595040448 / node 5672326233
  { name: 'Main Gate (Gate A)',                   lat: -1.2197532, lng: 36.8793841, building_code: 'GATE-A', category: 'Access',             description: 'Main campus entrance off USIU Road. Security check-in for all visitors.' },

  // ── Administration — OSM ways 1075663165, 1075663167
  { name: 'Administration Block',                 lat: -1.2188232, lng: 36.8791227, building_code: 'ADMIN', category: 'Administration',     description: 'Registrar, Finance, Student Affairs, and senior administration offices.' },
  { name: 'Lilian Beam ICT Center',               lat: -1.2184731, lng: 36.8790823, building_code: 'ICT',   category: 'Administration',     description: 'Computer labs, e-learning support, IT helpdesk, and printing services.' },

  // ── Academic — OSM ways 1075663166, 1075663170, 1075663172, 1075663173, 1075663176
  //              1075663171, 1075663168, 1417712686, 1417712688, 1417712689
  //              1075687895, 1075687897
  { name: 'Chandaria School of Business',         lat: -1.2171589, lng: 36.8794834, building_code: 'CSB',    category: 'Academic',           description: 'Business school with lecture theatres, Bloomberg Trading Lab, and faculty offices.' },
  { name: 'School of Business',                   lat: -1.2175404, lng: 36.8794110, building_code: 'SB',     category: 'Academic',           description: 'Business faculty classrooms and offices.' },
  { name: 'School of Humanities & Social Sciences', lat: -1.2142389, lng: 36.8787028, building_code: 'SHSS', category: 'Academic',           description: 'Journalism, International Relations, Psychology, and Communication & Media.' },
  { name: 'Science Complex',                      lat: -1.2150682, lng: 36.8787343, building_code: 'SCI',    category: 'Academic',           description: 'Computer Science, IT, Applied Mathematics labs and lecture rooms.' },
  { name: 'School of Graduate Studies',           lat: -1.2178625, lng: 36.8796021, building_code: 'SGS',    category: 'Academic',           description: 'Graduate and postgraduate programme administration and classrooms.' },
  { name: 'E-Learning Resource Center',           lat: -1.2172755, lng: 36.8800910, building_code: 'ELC',    category: 'Academic',           description: 'Digital learning resources, online course support, and computer workstations.' },
  { name: 'E & F Lecture Halls',                  lat: -1.2182476, lng: 36.8798264, building_code: 'EF',     category: 'Academic',           description: 'Lecture halls E and F.' },
  { name: 'I & J Lecture Halls',                  lat: -1.2180813, lng: 36.8796475, building_code: 'IJ',     category: 'Academic',           description: 'Lecture halls I and J.' },
  { name: 'K & L Lecture Halls',                  lat: -1.2179121, lng: 36.8799202, building_code: 'KL',     category: 'Academic',           description: 'Lecture halls K and L.' },
  { name: 'M, N, O, P & Q Lecture Halls',         lat: -1.2178049, lng: 36.8799626, building_code: 'MNOPQ', category: 'Academic',           description: 'Lecture halls M, N, O, P, and Q.' },
  { name: 'R & T Lecture Halls',                  lat: -1.2174120, lng: 36.8801047, building_code: 'RT',     category: 'Academic',           description: 'Lecture halls R and T.' },
  { name: 'Lab 7',                                lat: -1.2184120, lng: 36.8794885, building_code: 'LAB7',   category: 'Academic',           description: 'Science and technology laboratory.' },

  // ── Library — OSM way 1411772355
  { name: 'USIU-Africa Library',                  lat: -1.2162864, lng: 36.8789390, building_code: 'LIB',   category: 'Library & Learning', description: 'Main university library. Study rooms, computer workstations, digital databases, and printing.' },

  // ── Student Life — OSM ways 1075687902/1075687903, 1411772356, 1075663163/1075663164
  { name: 'Freida Brown Student Centre',          lat: -1.2154628, lng: 36.8776308, building_code: 'SC',    category: 'Student Life',       description: 'Java House café, student lounges, meeting rooms, and Student Government office.' },
  { name: 'Auditorium',                           lat: -1.2167837, lng: 36.8783598, building_code: 'AUD',   category: 'Student Life',       description: 'Main events and convocation venue.' },
  { name: "Paul's Caffe",                         lat: -1.2182662, lng: 36.8785949, building_code: 'CAF',   category: 'Student Life',       description: 'On-campus café and dining near the administration area.' },
  { name: 'Student Hostels',                      lat: -1.2176389, lng: 36.8781597, building_code: 'HST',   category: 'Student Life',       description: 'On-campus student residential hostels.' },
]

function makeIcon(color, selected = false) {
  const size = selected ? 30 : 24
  const pulse = selected
    ? `<div style="position:absolute;inset:-8px;border-radius:50%;background:${color};opacity:0.2;animation:rpl 1.8s infinite ease-in-out"></div>`
    : ''
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px">
      ${pulse}
      <div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>
    </div>
    <style>@keyframes rpl{0%,100%{transform:scale(1);opacity:.2}50%{transform:scale(1.5);opacity:.05}}</style>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  })
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(59,130,246,0.2)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function FlyTo({ position }) {
  const map = useMap()
  useEffect(() => { if (position) map.flyTo(position, 18, { duration: 1.2 }) }, [position, map])
  return null
}

function CategoryPill({ label, active, onClick }) {
  return (
    <button
      onClick={() => onClick(label)}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
        active
          ? 'bg-usiu-blue text-white border-usiu-blue shadow-sm'
          : 'bg-white text-slate-500 border-slate-200 hover:border-usiu-blue/40 hover:text-usiu-blue'
      }`}
    >
      {label}
    </button>
  )
}

function LocationCard({ loc, selected, onClick }) {
  const color = CATEGORY_COLORS[loc.category] || '#1a3a6b'
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(loc)}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${
        selected
          ? 'border-usiu-blue bg-usiu-blue/5 shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: color + '18' }}>
          <MapPin className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-800 text-sm leading-snug">{loc.name}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5"
              style={{ color, background: color + '18' }}>
              {loc.building_code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{loc.description}</p>
        </div>
      </div>
    </motion.button>
  )
}

export default function CampusMap() {
  const [locations, setLocations]           = useState([])
  const [search, setSearch]                 = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedLoc, setSelectedLoc]       = useState(null)
  const [flyTo, setFlyTo]                   = useState(null)
  const [userPos, setUserPos]               = useState(null)
  const [locating, setLocating]             = useState(false)
  const [error, setError]                   = useState(null)
  const [activeTab, setActiveTab] = useState('map')

  useEffect(() => {
    getLocations()
      .then((d) => setLocations(d.locations || FALLBACK_LOCATIONS))
      .catch(() => setLocations(FALLBACK_LOCATIONS))
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!search.trim()) return
    setError(null)
    try {
      const data = await findLocation(search)
      if (data.found && data.locations?.length > 0) {
        const loc = data.locations[0]
        setSelectedLoc(loc)
        setFlyTo([loc.lat, loc.lng])
        setActiveTab('map')
      } else {
        setError(data.message || 'Location not found.')
      }
    } catch {
      const lower = search.toLowerCase()
      const match = locations.filter(
        (l) => l.name.toLowerCase().includes(lower) || l.description?.toLowerCase().includes(lower)
      )
      if (match.length > 0) {
        setSelectedLoc(match[0])
        setFlyTo([match[0].lat, match[0].lng])
        setActiveTab('map')
      } else {
        setError('No locations found. Try "library", "CSB", or "administration".')
      }
    }
  }

  const handleLocateMe = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(coords)
        setFlyTo(coords)
        setLocating(false)
      },
      () => {
        setError('Location access denied. Enable it in your browser settings.')
        setLocating(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const openGoogleMaps = (loc) => {
    const url = userPos
      ? `https://www.google.com/maps/dir/${userPos[0]},${userPos[1]}/${loc.lat},${loc.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleSelectLoc = (loc) => {
    setSelectedLoc(loc)
    setFlyTo([loc.lat, loc.lng])
    setActiveTab('map')
  }

  const clearSearch = () => {
    setSearch('')
    setError(null)
    setSelectedLoc(null)
  }

  const filteredLocations = locations.filter(
    (l) => activeCategory === 'All' || l.category === activeCategory
  )

  const distanceTo = (loc) => {
    if (!userPos) return null
    const dx = (userPos[0] - loc.lat) * 111000
    const dy = (userPos[1] - loc.lng) * 111000 * Math.cos(loc.lat * Math.PI / 180)
    return Math.round(Math.sqrt(dx * dx + dy * dy))
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-4">

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Campus Navigator</h2>
            <p className="text-sm text-slate-500">USIU-Africa · Kasarani, Nairobi</p>
          </div>
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center gap-2 bg-usiu-blue hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all disabled:opacity-60 flex-shrink-0"
          >
            <Locate className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Locating...' : 'Locate Me'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-usiu-blue/20 focus:border-usiu-blue outline-none transition-all text-sm text-slate-700 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search building, department, or facility..."
            />
            {search && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          <button type="submit" className="bg-usiu-blue hover:bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-usiu-blue/20 transition-all text-sm">
            Find
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-shrink-0">
            {['map', 'list'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab ? 'bg-white text-usiu-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'map' ? 'Map' : 'Directory'}
              </button>
            ))}
          </div>
          {activeTab === 'list' && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((c) => (
                <CategoryPill key={c} label={c} active={activeCategory === c} onClick={setActiveCategory} />
              ))}
            </div>
          )}
        </div>

        {activeTab === 'map' && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '440px' }}>
              <MapContainer center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM} style={{ height: '100%', width: '100%' }} zoomControl>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {flyTo && <FlyTo position={flyTo} />}
                {userPos && (
                  <Marker position={userPos} icon={userIcon}>
                    <Popup><span className="text-xs font-semibold">You are here</span></Popup>
                  </Marker>
                )}
                {locations.map((loc, i) => {
                  const color = CATEGORY_COLORS[loc.category] || '#1a3a6b'
                  const selected = selectedLoc?.name === loc.name
                  return (
                    <Marker
                      key={i}
                      position={[loc.lat, loc.lng]}
                      icon={makeIcon(color, selected)}
                      eventHandlers={{ click: () => setSelectedLoc(loc) }}
                    >
                      <Popup minWidth={190}>
                        <div className="space-y-1 py-1">
                          <p className="font-bold text-slate-800 text-sm">{loc.name}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{loc.description}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              {loc.building_code}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ color, background: color + '18' }}>
                              {loc.category}
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>

            <AnimatePresence>
              {selectedLoc && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: (CATEGORY_COLORS[selectedLoc.category] || '#1a3a6b') + '18' }}>
                      <MapPin className="w-5 h-5" style={{ color: CATEGORY_COLORS[selectedLoc.category] || '#1a3a6b' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm">{selectedLoc.name}</p>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {selectedLoc.building_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedLoc.description}</p>
                      {distanceTo(selectedLoc) !== null && (
                        <p className="text-xs text-usiu-blue mt-1.5 flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {distanceTo(selectedLoc)}m from your location
                        </p>
                      )}
                      <button
                        onClick={() => openGoogleMaps(selectedLoc)}
                        className="mt-2 inline-flex items-center gap-1.5 bg-usiu-blue hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in Google Maps
                      </button>
                    </div>
                    <button onClick={() => setSelectedLoc(null)} className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
              {Object.entries(CATEGORY_COLORS).map(([label, color]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLocations.length === 0 ? (
              <p className="text-sm text-slate-400 col-span-2 text-center py-10">No locations in this category.</p>
            ) : (
              filteredLocations.map((loc, i) => (
                <LocationCard key={i} loc={loc} selected={selectedLoc?.name === loc.name} onClick={handleSelectLoc} />
              ))
            )}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
