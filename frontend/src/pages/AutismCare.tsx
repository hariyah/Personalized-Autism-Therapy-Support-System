/**
 * Autism Care tab: integrated content from the root /frontend app
 * (emotional activities, children, recommendations, emotion detection).
 * API base URL: set VITE_EMOTIONAL_API_URL (default http://localhost:7000/emotional/api via gateway).
 */

import AutismCareApp from './autism-care/AutismCareApp.jsx';

export default function AutismCare() {
  return (
    <div className="autism-care-page">
      <AutismCareApp />
    </div>
  );
}
