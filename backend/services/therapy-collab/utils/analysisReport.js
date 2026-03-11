function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(value) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function formatDateTime(value) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
}

function formatLabel(label = 'unknown') {
    return String(label)
        .split('_')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Unknown';
}

function getFinalSummary(analysis) {
    return analysis.doctorReview?.finalSummary || analysis.resultSummary || analysis.summary || '';
}

function getFinalTreatments(analysis) {
    const doctorPlan = analysis.doctorReview?.finalTreatmentSuggestions;
    if (Array.isArray(doctorPlan) && doctorPlan.length > 0) {
        return doctorPlan;
    }
    return Array.isArray(analysis.treatmentSuggestions) ? analysis.treatmentSuggestions : [];
}

function buildFilename(analysis) {
    const childName = analysis.child?.name || 'child';
    const safeChildName = childName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'child';
    const suffix = String(analysis._id || '').slice(-6) || 'report';
    return `${safeChildName}-treatment-report-${suffix}.html`;
}

function buildAnalysisReportHtml(analysis) {
    const childName = escapeHtml(analysis.child?.name || 'Unknown Child');
    const issue = escapeHtml(formatLabel(analysis.issueLabel));
    const urgency = escapeHtml(formatLabel(analysis.urgencyLabel));
    const summary = escapeHtml(getFinalSummary(analysis));
    const transcript = escapeHtml(analysis.transcript || 'No transcript captured.');
    const doctorName = escapeHtml(
        analysis.doctorReview?.doctorName ||
        analysis.doctorReview?.doctor?.name ||
        analysis.performedBy?.name ||
        'Doctor'
    );
    const parentName = escapeHtml(analysis.child?.parent?.name || 'Parent / Guardian');
    const treatmentStatus = escapeHtml(formatLabel(analysis.doctorReview?.treatmentStatus || 'recommended'));
    const careStage = escapeHtml(formatLabel(analysis.doctorReview?.careStage || 'awaiting_review'));
    const followUpPlan = escapeHtml(analysis.doctorReview?.followUpPlan || 'No extra follow-up plan recorded.');
    const createdAt = escapeHtml(formatDateTime(analysis.createdAt));
    const reviewedAt = escapeHtml(formatDateTime(analysis.doctorReview?.reviewedAt));
    const nextReviewDate = escapeHtml(formatDate(analysis.doctorReview?.nextReviewDate));
    const treatmentList = getFinalTreatments(analysis)
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Treatment Report</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f7f8fc; color: #1f2937; margin: 0; padding: 32px; }
    .page { max-width: 920px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden; }
    .hero { padding: 32px; background: linear-gradient(135deg, #0f172a, #1d4ed8); color: #ffffff; }
    .hero h1 { margin: 0 0 8px; font-size: 28px; }
    .hero p { margin: 0; color: rgba(255,255,255,0.8); }
    .section { padding: 28px 32px; border-top: 1px solid #e5e7eb; }
    .section h2 { margin: 0 0 16px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px; }
    .value { font-size: 15px; line-height: 1.6; color: #0f172a; }
    ul { margin: 0; padding-left: 20px; }
    li { margin-bottom: 10px; line-height: 1.6; }
    .footer { padding: 20px 32px 32px; color: #64748b; font-size: 12px; line-height: 1.6; }
    @media print { body { background: #ffffff; padding: 0; } .page { border: none; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <h1>Doctor Treatment Report</h1>
      <p>${childName} | Issued for ${parentName}</p>
    </div>
    <div class="section">
      <h2>Clinical Snapshot</h2>
      <div class="grid">
        <div class="card"><div class="label">Primary Issue</div><div class="value">${issue}</div></div>
        <div class="card"><div class="label">Urgency</div><div class="value">${urgency}</div></div>
        <div class="card"><div class="label">Analysis Created</div><div class="value">${createdAt}</div></div>
        <div class="card"><div class="label">Doctor Reviewed</div><div class="value">${reviewedAt}</div></div>
      </div>
    </div>
    <div class="section">
      <h2>Doctor Final Summary</h2>
      <div class="card"><div class="value">${summary}</div></div>
    </div>
    <div class="section">
      <h2>Final Treatment Plan</h2>
      <div class="card"><ul>${treatmentList || '<li>No treatment items recorded.</li>'}</ul></div>
    </div>
    <div class="section">
      <h2>Ongoing Care Process</h2>
      <div class="grid">
        <div class="card"><div class="label">Treatment Status</div><div class="value">${treatmentStatus}</div></div>
        <div class="card"><div class="label">Care Stage</div><div class="value">${careStage}</div></div>
        <div class="card"><div class="label">Next Review Date</div><div class="value">${nextReviewDate}</div></div>
        <div class="card"><div class="label">Reviewing Doctor</div><div class="value">${doctorName}</div></div>
      </div>
      <div class="card" style="margin-top:16px;">
        <div class="label">Follow-Up Plan</div>
        <div class="value">${followUpPlan}</div>
      </div>
    </div>
    <div class="section">
      <h2>Source Transcript</h2>
      <div class="card"><div class="value">${transcript}</div></div>
    </div>
    <div class="footer">
      This report is generated from the saved system analysis and the doctor-reviewed treatment plan. Parents should use it as a care coordination document and follow the doctor’s final guidance.
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
    buildFilename,
    buildAnalysisReportHtml
};
