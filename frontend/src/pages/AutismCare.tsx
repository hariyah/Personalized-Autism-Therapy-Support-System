/**
 * Autism Care tab: integrated content from the root /frontend app
 * (emotional activities, children, recommendations, emotion detection).
 * API base URL: VITE_EMOTIONAL_API_URL (e.g. http://localhost:7003/api or http://localhost:7000/emotional/api).
 */

import AutismCareApp from './autism-care/AutismCareApp.jsx';

export default function AutismCare() {
  return (
    <div className="autism-care-page">
      <AutismCareApp />
    </div>
  );
}
