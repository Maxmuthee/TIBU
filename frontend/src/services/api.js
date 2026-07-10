// In development, Vite proxies /api → localhost:8000.
// In production (Azure Static Web Apps), VITE_API_URL is injected at build time.
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// Chat
export const askTibu = (question, conversationHistory = [], userProfile = null) =>
  request('/chat/ask', {
    method: 'POST',
    body: JSON.stringify({
      question,
      conversation_history: conversationHistory,
      user_profile: userProfile ? { name: userProfile.name, major: userProfile.major, year: userProfile.year } : null,
    }),
  });

// Courses
export const getCourseAdvice = (profile) =>
  request('/courses/advise', { method: 'POST', body: JSON.stringify(profile) });

// Campus Map
export const getLocations = () => request('/map/locations');
export const findLocation = (destination) =>
  request('/map/find', { method: 'POST', body: JSON.stringify({ destination }) });

// Study Hub
export const getPapers = (courseCode = '') =>
  request(`/study-hub/papers?course_code=${courseCode}`);
export const uploadPaper = async (formData) => {
  const res = await fetch(`${API_BASE}/study-hub/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
};
export const downloadPaperUrl = (paperId) => `${API_BASE}/study-hub/papers/${paperId}/download`;
export const generateQuiz = ({ topic, num_questions = 5, difficulty = 'Medium' }) =>
  request('/study-hub/generate-quiz', { method: 'POST', body: JSON.stringify({ topic, num_questions, difficulty }) });
export const studyAsk = ({ question, conversation_history = [] }) =>
  request('/study-hub/study-ask', { method: 'POST', body: JSON.stringify({ question, conversation_history }) });

// Opportunities
export const getInternships = () => request('/opportunities/internships');
export const getEvents = (category = '') =>
  request(`/opportunities/events?category=${category}`);

// Study Groups
export const getStudyProfiles = () => request('/study-groups/profiles');
export const registerStudyProfile = (profile) =>
  request('/study-groups/register', { method: 'POST', body: JSON.stringify(profile) });
export const findStudyMatches = (profile) =>
  request('/study-groups/match', { method: 'POST', body: JSON.stringify(profile) });

// Lost & Found
export const getLostFoundItems = (type = '') =>
  request(`/lost-found/items?item_type=${type}`);
export const reportLostFound = (item) =>
  request('/lost-found/report', { method: 'POST', body: JSON.stringify(item) });

// Wellness
export const getWellnessResources = () => request('/wellness/resources');
export const getCrisisInfo = () => request('/wellness/crisis');

// Microcredentials
export const getMicrocredentialCatalog = ({ field = '', level = '', search = '' } = {}) =>
  request(`/microcredentials/catalog?field=${encodeURIComponent(field)}&level=${encodeURIComponent(level)}&search=${encodeURIComponent(search)}`);
export const getMicrocredentialRecommendations = (profile) =>
  request('/microcredentials/recommend', { method: 'POST', body: JSON.stringify(profile) });
