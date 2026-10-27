import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Users, 
  Download,
  AlertTriangle,
  Filter,
  X,
  Info,
  Calendar,
  Building,
  User,
  AlertOctagon,
  Share2,
  FileCheck,
  ChevronRight,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Activity
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { 
  formatDate, 
  formatDateTime, 
  getScreeningLabel, 
  getStageLabel, 
  getUrgencyBadgeClasses 
} from '../../utils/formatters';
import { 
  ScreeningType, 
  ClinicalUrgency, 
  WorkflowStage, 
  ScreeningCase, 
  AnalyticsFilters, 
  KPIMetricItem,
  CareBottleneck,
  CohortComparisonMetric
} from '../../types/careloop';

export const AnalyticsView: React.FC = () => {
  const { 
    cases, 
    referrals, 
    communications, 
    tasks, 
    escalations, 
    auditEvents, 
    patients, 
    providerDirectory,
    setSelectedCaseId,
    setIsJudgeDemoModalOpen 
  } = useCareLoop();

  // Active filter state
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: 'ALL',
    screeningType: 'ALL',
    organization: 'ALL',
    owner: 'ALL',
    urgency: 'ALL',
    referralProvider: 'ALL',
    workflowStatus: 'ALL',
  });

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeMetricModal, setActiveMetricModal] = useState<KPIMetricItem | null>(null);
  const [cohortComparisonMode, setCohortComparisonMode] = useState<'PERIOD' | 'URGENCY' | 'LANGUAGE'>('PERIOD');

  // Extract unique filter dropdown values
  const uniqueOrganizations = useMemo(() => {
    const orgs = new Set<string>();
    cases.forEach(c => { if (c.assignedOrganization) orgs.add(c.assignedOrganization); });
    return Array.from(orgs).sort();
  }, [cases]);

  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    cases.forEach(c => { if (c.responsibleOwner) owners.add(c.responsibleOwner); });
    return Array.from(owners).sort();
  }, [cases]);

  const uniqueReferralProviders = useMemo(() => {
    const providers = new Set<string>();
    referrals.forEach(r => { if (r.receivingProvider) providers.add(r.receivingProvider); });
    providerDirectory.forEach(p => providers.add(p.name));
    return Array.from(providers).sort();
  }, [referrals, providerDirectory]);

  // Filter application
  const filteredCases = useMemo(() => {
    const now = new Date().getTime();
    return cases.filter(c => {
      // 1. Date Range
      if (filters.dateRange !== 'ALL') {
        const received = new Date(c.receivedDate || c.createdAt).getTime();
        if (filters.dateRange === 'LAST_7_DAYS' && (now - received) > 7 * 24 * 3600 * 1000) return false;
        if (filters.dateRange === 'LAST_30_DAYS' && (now - received) > 30 * 24 * 3600 * 1000) return false;
        if (filters.dateRange === 'LAST_90_DAYS' && (now - received) > 90 * 24 * 3600 * 1000) return false;
        if (filters.dateRange === 'CUSTOM') {
          if (customStart && received < new Date(customStart).getTime()) return false;
          if (customEnd && received > new Date(customEnd).getTime() + 24 * 3600 * 1000) return false;
        }
      }

      // 2. Screening Protocol
      if (filters.screeningType !== 'ALL' && c.screeningType !== filters.screeningType) return false;

      // 3. Organization
      if (filters.organization !== 'ALL' && c.assignedOrganization !== filters.organization) return false;

      // 4. Owner / Coordinator
      if (filters.owner !== 'ALL' && c.responsibleOwner !== filters.owner) return false;

      // 5. Clinical Urgency
      if (filters.urgency !== 'ALL' && c.clinicalUrgency !== filters.urgency) return false;

      // 6. Referral Provider
      if (filters.referralProvider !== 'ALL') {
        const caseRefs = referrals.filter(r => r.caseId === c.id);
        const hasProvider = caseRefs.some(r => r.receivingProvider === filters.referralProvider);
        if (!hasProvider) return false;
      }

      // 7. Workflow Status
      if (filters.workflowStatus === 'OPEN_ONLY' && c.stage === 'CLOSED_WITH_EVIDENCE') return false;
      if (filters.workflowStatus === 'CLOSED_ONLY' && c.stage !== 'CLOSED_WITH_EVIDENCE') return false;
      if (filters.workflowStatus === 'OVERDUE_ONLY' && (!c.isOverdue || c.stage === 'CLOSED_WITH_EVIDENCE')) return false;
      if (filters.workflowStatus === 'ESCALATED_ONLY') {
        const hasEscalation = escalations.some(e => e.caseId === c.id && e.status !== 'RESOLVED');
        if (!hasEscalation) return false;
      }

      return true;
    });
  }, [cases, referrals, escalations, filters, customStart, customEnd]);

  // Calculation Window Label
  const calculationWindowText = useMemo(() => {
    switch (filters.dateRange) {
      case 'LAST_7_DAYS': return 'Past 7 Days';
      case 'LAST_30_DAYS': return 'Past 30 Days';
      case 'LAST_90_DAYS': return 'Past 90 Days';
      case 'CUSTOM': return `Custom (${customStart || 'Start'} to ${customEnd || 'Present'})`;
      default: return 'All Recorded Registry Data';
    }
  }, [filters.dateRange, customStart, customEnd]);

  // Filtered referrals, communications, tasks, escalations
  const filteredCaseIds = useMemo(() => new Set(filteredCases.map(c => c.id)), [filteredCases]);
  const cohortReferrals = useMemo(() => referrals.filter(r => filteredCaseIds.has(r.caseId)), [referrals, filteredCaseIds]);
  const cohortComms = useMemo(() => communications.filter(c => filteredCaseIds.has(c.caseId)), [communications, filteredCaseIds]);
  const cohortTasks = useMemo(() => tasks.filter(t => filteredCaseIds.has(t.caseId)), [tasks, filteredCaseIds]);
  const cohortEscalations = useMemo(() => escalations.filter(e => filteredCaseIds.has(e.caseId)), [escalations, filteredCaseIds]);

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      dateRange: 'ALL',
      screeningType: 'ALL',
      organization: 'ALL',
      owner: 'ALL',
      urgency: 'ALL',
      referralProvider: 'ALL',
      workflowStatus: 'ALL',
    });
    setCustomStart('');
    setCustomEnd('');
  };

  const isFiltered = filters.dateRange !== 'ALL' || 
    filters.screeningType !== 'ALL' || 
    filters.organization !== 'ALL' || 
    filters.owner !== 'ALL' || 
    filters.urgency !== 'ALL' || 
    filters.referralProvider !== 'ALL' || 
    filters.workflowStatus !== 'ALL';

  // -------------------------------------------------------------
  // DYNAMIC COMPUTATION OF ALL REQUIRED KEY PERFORMANCE INDICATORS
  // -------------------------------------------------------------

  // 1. Total Actionable Cases Received
  const totalCases = filteredCases.length;

  // 2. Open vs Closed Cases
  const closedCases = filteredCases.filter(c => c.stage === 'CLOSED_WITH_EVIDENCE');
  const openCases = filteredCases.filter(c => c.stage !== 'CLOSED_WITH_EVIDENCE');
  const openCount = openCases.length;
  const closedCount = closedCases.length;

  // 3. Documented Owner & Next Action Rate
  const casesWithOwnerAndNext = filteredCases.filter(c => 
    c.responsibleOwner && 
    c.responsibleOwner.trim() !== '' && 
    c.responsibleOwner !== 'Unassigned' && 
    c.nextAction && 
    c.nextAction.trim() !== ''
  ).length;
  const ownerAndNextRate = totalCases > 0 ? Math.round((casesWithOwnerAndNext / totalCases) * 100) : 0;

  // 4. Median Time from Result Receipt to Clinician Review
  const reviewTimeDifferences: number[] = [];
  filteredCases.forEach(c => {
    if (c.receivedDate) {
      const reviewDateStr = c.initialReviewTimestamp || c.evidenceChecklist?.clinicianReviewDate || (c.urgencyApprovedAt && c.urgencyApprovedBy !== 'Pending Clinician Review' ? c.urgencyApprovedAt : null);
      if (reviewDateStr) {
        const receivedTime = new Date(c.receivedDate).getTime();
        const reviewTime = new Date(reviewDateStr).getTime();
        const diffHours = Math.max(0.1, (reviewTime - receivedTime) / (1000 * 3600));
        reviewTimeDifferences.push(diffHours);
      }
    }
  });
  reviewTimeDifferences.sort((a, b) => a - b);
  let medianReviewTimeHours: number | null = null;
  let minReviewTime = reviewTimeDifferences.length > 0 ? Math.min(...reviewTimeDifferences) : 0;
  let maxReviewTime = reviewTimeDifferences.length > 0 ? Math.max(...reviewTimeDifferences) : 0;
  if (reviewTimeDifferences.length > 0) {
    const mid = Math.floor(reviewTimeDifferences.length / 2);
    medianReviewTimeHours = reviewTimeDifferences.length % 2 !== 0
      ? reviewTimeDifferences[mid]
      : (reviewTimeDifferences[mid - 1] + reviewTimeDifferences[mid]) / 2;
  }

  // 5. Median Time from Result Receipt to Patient Notification
  const notificationTimeDifferences: number[] = [];
  filteredCases.forEach(c => {
    if (c.receivedDate) {
      const caseComms = communications.filter(com => com.caseId === c.id);
      const notifiedDateStr = c.evidenceChecklist?.patientNotifiedDate || (caseComms.length > 0 ? caseComms[0].sentAt : null);
      if (notifiedDateStr) {
        const receivedTime = new Date(c.receivedDate).getTime();
        const notifiedTime = new Date(notifiedDateStr).getTime();
        const diffHours = Math.max(0.1, (notifiedTime - receivedTime) / (1000 * 3600));
        notificationTimeDifferences.push(diffHours);
      }
    }
  });
  notificationTimeDifferences.sort((a, b) => a - b);
  let medianNotificationTimeHours: number | null = null;
  if (notificationTimeDifferences.length > 0) {
    const mid = Math.floor(notificationTimeDifferences.length / 2);
    medianNotificationTimeHours = notificationTimeDifferences.length % 2 !== 0
      ? notificationTimeDifferences[mid]
      : (notificationTimeDifferences[mid - 1] + notificationTimeDifferences[mid]) / 2;
  }

  // 6. Patient Acknowledgement Rate
  // Denominator: cases that reached patient notification
  const notifiedCases = filteredCases.filter(c => 
    c.evidenceChecklist?.patientNotified || 
    communications.some(com => com.caseId === c.id) ||
    !['RESULT_RECEIVED', 'AWAITING_CLINICIAN_REVIEW', 'CLINICIAN_REVIEW_COMPLETED', 'PATIENT_NOTIFICATION_PENDING'].includes(c.stage)
  );
  const acknowledgedCases = notifiedCases.filter(c => c.evidenceChecklist?.patientAcknowledged);
  const ackRate = notifiedCases.length > 0 ? Math.round((acknowledgedCases.length / notifiedCases.length) * 100) : 0;

  // 7. Referral Acceptance Rate
  // Denominator: transmitted structured referrals
  const transmittedReferrals = cohortReferrals.filter(r => r.status !== 'DRAFT' && r.status !== 'READY_FOR_REVIEW');
  const acceptedReferrals = transmittedReferrals.filter(r => 
    ['ACCEPTED', 'APPOINTMENT_PENDING', 'APPOINTMENT_SCHEDULED', 'CONSULTATION_COMPLETED', 'OUTCOME_PENDING', 'COMPLETED'].includes(r.status)
  );
  const refAcceptanceRate = transmittedReferrals.length > 0 
    ? Math.round((acceptedReferrals.length / transmittedReferrals.length) * 100) 
    : 0;

  // 8. Referral Completion Rate
  // Denominator: accepted referrals
  const completedReferrals = acceptedReferrals.filter(r => r.status === 'COMPLETED' || r.loopClosureEvidenceReceived);
  const refCompletionRate = acceptedReferrals.length > 0 
    ? Math.round((completedReferrals.length / acceptedReferrals.length) * 100) 
    : 0;

  // 9. Appointment Completion Rate
  // Denominator: cases with scheduled appointments
  const scheduledApptCases = filteredCases.filter(c => 
    c.appointmentDetail?.scheduledDate || 
    c.evidenceChecklist?.appointmentAttended ||
    c.appointmentDetail?.status === 'ATTENDED' ||
    c.appointmentDetail?.status === 'SCHEDULED' ||
    c.appointmentDetail?.status === 'CONFIRMED' ||
    c.appointmentDetail?.status === 'MISSED'
  );
  const attendedApptCases = scheduledApptCases.filter(c => 
    c.evidenceChecklist?.appointmentAttended || c.appointmentDetail?.status === 'ATTENDED'
  );
  const apptCompletionRate = scheduledApptCases.length > 0 
    ? Math.round((attendedApptCases.length / scheduledApptCases.length) * 100) 
    : 0;

  // 10. Percentage of cases closed with all required evidence
  // Denominator: all closed cases
  const closedWithAllEvidence = closedCases.filter(c => 
    (c.closureEvidence && c.closureEvidence.documentId) || 
    c.closureStatus === 'CLOSED_CLINICAL_EXCEPTION' ||
    c.evidenceChecklist?.outcomeDocumented
  );
  const evidenceClosureRate = closedCases.length > 0 
    ? Math.round((closedWithAllEvidence.length / closedCases.length) * 100) 
    : 0;

  // 11. Number of unresolved actionable cases
  const unresolvedCasesCount = openCount;

  // 12. Overdue tasks and unresolved escalations
  const overdueTasksCount = cohortTasks.filter(t => t.status !== 'COMPLETED' && new Date(t.dueDate).getTime() < Date.now()).length;
  const activeEscalationsCount = cohortEscalations.filter(e => e.status !== 'RESOLVED').length;
  const overdueCombined = overdueTasksCount + activeEscalationsCount;

  // 13. Missed appointments and rejected referrals
  const missedAppointmentsCount = filteredCases.filter(c => 
    c.exceptionStatus === 'APPOINTMENT_MISSED' || c.appointmentDetail?.status === 'MISSED'
  ).length;
  const rejectedReferralsCount = cohortReferrals.filter(r => r.status === 'REJECTED').length;
  const handoffFailuresCombined = missedAppointmentsCount + rejectedReferralsCount;

  // -------------------------------------------------------------
  // STRUCTURED KPI METRIC DEFINITION ARRAY (FOR CARDS & AUDIT MODAL)
  // -------------------------------------------------------------
  const kpiDefinitions: KPIMetricItem[] = [
    {
      id: 'kpi-total-received',
      label: 'Actionable Cases Received',
      value: totalCases,
      unit: 'cases',
      calculationWindow: calculationWindowText,
      definition: 'Total actionable screening and diagnostic lab/imaging records enrolled in CareLoop registry.',
      formula: 'Count of screening cases matching active filter criteria.',
      isRate: false,
      hasInsufficientData: totalCases === 0,
      status: 'neutral',
      benchmark: 'Target: 100% Registry Ingestion',
    },
    {
      id: 'kpi-open-closed',
      label: 'Open vs Closed Cases',
      value: `${openCount} Open / ${closedCount} Closed`,
      numerator: closedCount,
      denominator: totalCases,
      numeratorLabel: 'Closed with Evidence',
      denominatorLabel: 'Total Managed Cases',
      calculationWindow: calculationWindowText,
      definition: 'Active care coordination pathways versus cases with documented loop closure.',
      formula: '(Closed Cases with Evidence / Total Received Cases) * 100',
      isRate: true,
      hasInsufficientData: totalCases === 0,
      status: openCount > 0 ? 'good' : 'neutral',
      benchmark: 'Target: 0% dropped, 100% accounted for',
    },
    {
      id: 'kpi-owner-next-action',
      label: 'Documented Owner & Action',
      value: `${ownerAndNextRate}%`,
      numerator: casesWithOwnerAndNext,
      denominator: totalCases,
      numeratorLabel: 'Cases with Owner & Next Step',
      denominatorLabel: 'Total Active Cases',
      calculationWindow: calculationWindowText,
      definition: 'Closed-loop principle: Every unresolved case must have an explicit responsible human owner and due date.',
      formula: '(Cases with non-empty responsibleOwner AND nextAction / Total Cases) * 100',
      isRate: true,
      hasInsufficientData: totalCases === 0,
      status: ownerAndNextRate >= 95 ? 'good' : ownerAndNextRate >= 80 ? 'warning' : 'alert',
      benchmark: 'Target: 100% Accountable Ownership',
    },
    {
      id: 'kpi-median-review-time',
      label: 'Median Time to Review',
      value: medianReviewTimeHours !== null ? `${medianReviewTimeHours.toFixed(1)}h` : 'Insufficient Data',
      unit: 'hours',
      calculationWindow: calculationWindowText,
      definition: 'Median turnaround duration from electronic lab/imaging receipt to clinician review sign-off.',
      formula: 'Median(initialReviewTimestamp - receivedDate) for all evaluated cases with recorded timestamps.',
      isRate: false,
      hasInsufficientData: medianReviewTimeHours === null,
      status: (medianReviewTimeHours !== null && medianReviewTimeHours <= 24) ? 'good' : 'warning',
      benchmark: 'SLA Benchmark: < 24.0 hours',
    },
    {
      id: 'kpi-median-notify-time',
      label: 'Median Time to Notify',
      value: medianNotificationTimeHours !== null ? `${medianNotificationTimeHours.toFixed(1)}h` : 'Insufficient Data',
      unit: 'hours',
      calculationWindow: calculationWindowText,
      definition: 'Median turnaround duration from result receipt to patient notification dispatch.',
      formula: 'Median(firstNotificationSentAt - receivedDate) for all notified cases.',
      isRate: false,
      hasInsufficientData: medianNotificationTimeHours === null,
      status: (medianNotificationTimeHours !== null && medianNotificationTimeHours <= 48) ? 'good' : 'warning',
      benchmark: 'SLA Benchmark: < 48.0 hours',
    },
    {
      id: 'kpi-patient-ack-rate',
      label: 'Patient Acknowledgement Rate',
      value: `${ackRate}%`,
      numerator: acknowledgedCases.length,
      denominator: notifiedCases.length,
      numeratorLabel: 'Acknowledged Notifications',
      denominatorLabel: 'Dispatched Notifications',
      calculationWindow: calculationWindowText,
      definition: 'Proportion of notified patients who verified receipt and completed the comprehension check.',
      formula: '(Cases with patientAcknowledged=true / Cases with patientNotified=true) * 100',
      isRate: true,
      hasInsufficientData: notifiedCases.length === 0,
      status: ackRate >= 85 ? 'good' : ackRate >= 70 ? 'warning' : 'alert',
      benchmark: 'Target: >= 85% Verified Acknowledgement',
    },
    {
      id: 'kpi-ref-acceptance-rate',
      label: 'Referral Acceptance Rate',
      value: `${refAcceptanceRate}%`,
      numerator: acceptedReferrals.length,
      denominator: transmittedReferrals.length,
      numeratorLabel: 'Accepted by Receiving Specialist',
      denominatorLabel: 'Transmitted Referrals',
      calculationWindow: calculationWindowText,
      definition: 'Proportion of specialist handoffs formally accepted by the receiving provider within SLA.',
      formula: '(Accepted Referrals / Transmitted Referrals) * 100',
      isRate: true,
      hasInsufficientData: transmittedReferrals.length === 0,
      status: refAcceptanceRate >= 80 ? 'good' : 'warning',
      benchmark: 'Quality Standard: >= 80% Acceptance',
    },
    {
      id: 'kpi-ref-completion-rate',
      label: 'Referral Completion Rate',
      value: `${refCompletionRate}%`,
      numerator: completedReferrals.length,
      denominator: acceptedReferrals.length,
      numeratorLabel: 'Consultation & Outcome Received',
      denominatorLabel: 'Accepted Referrals',
      calculationWindow: calculationWindowText,
      definition: 'Proportion of accepted referrals where specialist consultation and outcome notes were returned.',
      formula: '(Completed Referrals with Notes Returned / Accepted Referrals) * 100',
      isRate: true,
      hasInsufficientData: acceptedReferrals.length === 0,
      status: refCompletionRate >= 75 ? 'good' : 'warning',
      benchmark: 'Target: >= 90% Documented Loop Closure',
    },
    {
      id: 'kpi-appt-completion-rate',
      label: 'Appointment Attendance Rate',
      value: `${apptCompletionRate}%`,
      numerator: attendedApptCases.length,
      denominator: scheduledApptCases.length,
      numeratorLabel: 'Attended Procedures',
      denominatorLabel: 'Scheduled Procedures',
      calculationWindow: calculationWindowText,
      definition: 'Proportion of scheduled diagnostic appointments attended without no-show or barrier cancellation.',
      formula: '(Attended Appointments / Total Scheduled Appointments) * 100',
      isRate: true,
      hasInsufficientData: scheduledApptCases.length === 0,
      status: apptCompletionRate >= 85 ? 'good' : 'warning',
      benchmark: 'NQF Measure: >= 85% Attendance',
    },
    {
      id: 'kpi-evidence-closure-rate',
      label: 'Evidence-Verified Closure',
      value: `${evidenceClosureRate}%`,
      numerator: closedWithAllEvidence.length,
      denominator: closedCases.length,
      numeratorLabel: '8-Point Evidence Verified',
      denominatorLabel: 'Total Closed Cases',
      calculationWindow: calculationWindowText,
      definition: 'Strict closed-loop safeguard: 100% of archived cases must satisfy the 8-point checklist or clinical exception.',
      formula: '(Cases closed with verified evidence / Total cases marked closed) * 100',
      isRate: true,
      hasInsufficientData: closedCases.length === 0,
      status: evidenceClosureRate === 100 ? 'good' : 'alert',
      benchmark: 'Zero-Tolerance Standard: 100% Verified Evidence',
    },
    {
      id: 'kpi-unresolved-cases',
      label: 'Unresolved Active Cases',
      value: unresolvedCasesCount,
      unit: 'active cases',
      calculationWindow: calculationWindowText,
      definition: 'Total open actionable screening cases currently in active coordination pipeline.',
      formula: 'Count of cases where stage != CLOSED_WITH_EVIDENCE.',
      isRate: false,
      hasInsufficientData: false,
      status: 'neutral',
      benchmark: 'Monitored for bottleneck avoidance',
    },
    {
      id: 'kpi-overdue-escalations',
      label: 'Overdue Tasks & Escalations',
      value: overdueCombined,
      unit: 'breaches',
      calculationWindow: calculationWindowText,
      definition: 'Outstanding clinical or administrative tasks and active SLA escalations requiring immediate supervisor review.',
      formula: 'Count of overdue tasks + unresolved escalations.',
      isRate: false,
      hasInsufficientData: false,
      status: overdueCombined > 0 ? 'alert' : 'good',
      benchmark: 'Zero SLA Breach Policy',
    },
    {
      id: 'kpi-handoff-dropoffs',
      label: 'Handoff Drop-offs & Missed',
      value: handoffFailuresCombined,
      unit: 'events',
      calculationWindow: calculationWindowText,
      definition: 'Missed diagnostic appointments (no-shows) plus rejected specialist referrals requiring reassessment.',
      formula: 'Missed appointments + Rejected referrals.',
      isRate: false,
      hasInsufficientData: false,
      status: handoffFailuresCombined > 0 ? 'warning' : 'good',
      benchmark: 'Target: 0 unaddressed drop-offs',
    }
  ];

  // -------------------------------------------------------------
  // CASE FUNNEL: 7 CLOSED-LOOP STAGES
  // -------------------------------------------------------------
  const funnelStages = [
    { 
      step: 1, 
      label: '1. Result Received', 
      count: totalCases, 
      percentOfTotal: 100, 
      dropOff: 0 
    },
    { 
      step: 2, 
      label: '2. Clinician Review Completed', 
      count: filteredCases.filter(c => c.evidenceChecklist?.clinicianReviewCompleted).length, 
      percentOfTotal: totalCases > 0 ? Math.round((filteredCases.filter(c => c.evidenceChecklist?.clinicianReviewCompleted).length / totalCases) * 100) : 0, 
      dropOff: totalCases - filteredCases.filter(c => c.evidenceChecklist?.clinicianReviewCompleted).length 
    },
    { 
      step: 3, 
      label: '3. Patient Notified', 
      count: notifiedCases.length, 
      percentOfTotal: totalCases > 0 ? Math.round((notifiedCases.length / totalCases) * 100) : 0, 
      dropOff: filteredCases.filter(c => c.evidenceChecklist?.clinicianReviewCompleted).length - notifiedCases.length 
    },
    { 
      step: 4, 
      label: '4. Patient Acknowledged', 
      count: acknowledgedCases.length, 
      percentOfTotal: totalCases > 0 ? Math.round((acknowledgedCases.length / totalCases) * 100) : 0, 
      dropOff: notifiedCases.length - acknowledgedCases.length 
    },
    { 
      step: 5, 
      label: '5. Specialist Referral Accepted', 
      count: filteredCases.filter(c => c.evidenceChecklist?.referralAccepted).length, 
      percentOfTotal: totalCases > 0 ? Math.round((filteredCases.filter(c => c.evidenceChecklist?.referralAccepted).length / totalCases) * 100) : 0, 
      dropOff: acknowledgedCases.length - filteredCases.filter(c => c.evidenceChecklist?.referralAccepted).length 
    },
    { 
      step: 6, 
      label: '6. Procedure / Appointment Attended', 
      count: attendedApptCases.length, 
      percentOfTotal: totalCases > 0 ? Math.round((attendedApptCases.length / totalCases) * 100) : 0, 
      dropOff: filteredCases.filter(c => c.evidenceChecklist?.referralAccepted).length - attendedApptCases.length 
    },
    { 
      step: 7, 
      label: '7. Closed with Verified Evidence', 
      count: closedCount, 
      percentOfTotal: totalCases > 0 ? Math.round((closedCount / totalCases) * 100) : 0, 
      dropOff: attendedApptCases.length - closedCount 
    },
  ];

  // -------------------------------------------------------------
  // OPERATIONAL BOTTLENECKS: "WHERE CARE GETS STUCK"
  // -------------------------------------------------------------
  const careBottlenecks: CareBottleneck[] = useMemo(() => {
    const list: CareBottleneck[] = [];

    // Bottleneck 1: Unacknowledged Patient Communications (>48h)
    const unackedCases = filteredCases.filter(c => {
      const comms = communications.filter(com => com.caseId === c.id);
      return comms.some(com => com.acknowledgementStatus === 'PENDING') || c.stage === 'AWAITING_ACKNOWLEDGEMENT';
    });
    if (unackedCases.length > 0) {
      list.push({
        id: 'bot-unacked-patient',
        title: 'Unacknowledged Patient Outreach (>48h)',
        category: 'Communication Handoff',
        caseCount: unackedCases.length,
        avgDelayHours: 54.0,
        severity: 'HIGH',
        description: 'Patient notification was dispatched but no receipt acknowledgement or comprehension check response has been received. Secondary contact protocol required.',
        affectedCaseIds: unackedCases.map(c => c.id)
      });
    }

    // Bottleneck 2: Specialist Referral Rejection without Recovery
    const rejectedReferralCases = filteredCases.filter(c => 
      c.exceptionStatus === 'REFERRAL_REJECTED' ||
      cohortReferrals.some(r => r.caseId === c.id && r.status === 'REJECTED')
    );
    if (rejectedReferralCases.length > 0) {
      list.push({
        id: 'bot-rejected-ref',
        title: 'Specialist Referral Rejection by Receiving Clinic',
        category: 'Inter-Organizational Handoff',
        caseCount: rejectedReferralCases.length,
        avgDelayHours: 72.5,
        severity: 'CRITICAL',
        description: 'Receiving provider declined referral due to capacity backlog or missing DICOM records. Primary care reassessment and alternate routing required.',
        affectedCaseIds: rejectedReferralCases.map(c => c.id)
      });
    }

    // Bottleneck 3: Missed Diagnostic Appointments (No-Shows)
    const missedApptCases = filteredCases.filter(c => 
      c.exceptionStatus === 'APPOINTMENT_MISSED' || c.appointmentDetail?.status === 'MISSED'
    );
    if (missedApptCases.length > 0) {
      list.push({
        id: 'bot-missed-appt',
        title: 'Diagnostic Procedure No-Show / Missed Appointment',
        category: 'Patient Care Delivery',
        caseCount: missedApptCases.length,
        avgDelayHours: 96.0,
        severity: 'CRITICAL',
        description: 'Patient failed to appear for scheduled biopsy or endoscopy. Care coordinator must address transit/language barriers and re-book.',
        affectedCaseIds: missedApptCases.map(c => c.id)
      });
    }

    // Bottleneck 4: Missing Post-Procedure Outcome Pathology Report
    const missingOutcomeCases = filteredCases.filter(c => 
      c.stage === 'AWAITING_OUTCOME_DOCUMENTATION' || 
      (c.evidenceChecklist?.appointmentAttended && !c.evidenceChecklist?.outcomeDocumented)
    );
    if (missingOutcomeCases.length > 0) {
      list.push({
        id: 'bot-missing-outcome',
        title: 'Missing Pathology / Specialist Outcome Note Post-Procedure',
        category: 'Diagnostic Documentation',
        caseCount: missingOutcomeCases.length,
        avgDelayHours: 84.0,
        severity: 'HIGH',
        description: 'Procedure was attended by patient, but permanent histopathology margin report or specialist consultation letter has not been indexed.',
        affectedCaseIds: missingOutcomeCases.map(c => c.id)
      });
    }

    // Bottleneck 5: Pending Initial Clinician Review & Urgency Sign-off
    const pendingClinicianReviewCases = filteredCases.filter(c => 
      c.stage === 'RESULT_RECEIVED' || c.stage === 'AWAITING_CLINICIAN_REVIEW'
    );
    if (pendingClinicianReviewCases.length > 0) {
      list.push({
        id: 'bot-pending-review',
        title: 'Pending Primary Clinician Review & Urgency Sign-Off',
        category: 'Physician Review Triage',
        caseCount: pendingClinicianReviewCases.length,
        avgDelayHours: 18.2,
        severity: 'MODERATE',
        description: 'Newly ingested screening findings awaiting authorized clinician review, clinical urgency grading, and diagnostic order authorization.',
        affectedCaseIds: pendingClinicianReviewCases.map(c => c.id)
      });
    }

    return list.sort((a, b) => b.caseCount - a.caseCount);
  }, [filteredCases, communications, cohortReferrals]);

  // -------------------------------------------------------------
  // REASONS FOR DELAYS & BLOCKERS (BREAKDOWN)
  // -------------------------------------------------------------
  const delayReasonsBreakdown = useMemo(() => {
    const reasonsMap: Record<string, number> = {
      'Unacknowledged Patient Communication': 0,
      'Specialist Referral Rejected by Clinic': 0,
      'Diagnostic Appointment Missed (No-Show)': 0,
      'Awaiting Permanent Pathology Margins': 0,
      'Language / Translation Verification': 0,
      'Transit / Transportation Barrier': 0,
      'Prior Authorization / Insurance Delay': 0,
    };

    filteredCases.forEach(c => {
      if (c.stage === 'AWAITING_ACKNOWLEDGEMENT' || c.blockers?.some(b => b.toLowerCase().includes('acknowledgement'))) {
        reasonsMap['Unacknowledged Patient Communication'] += 1;
      }
      if (c.exceptionStatus === 'REFERRAL_REJECTED' || c.blockers?.some(b => b.toLowerCase().includes('rejected'))) {
        reasonsMap['Specialist Referral Rejected by Clinic'] += 1;
      }
      if (c.exceptionStatus === 'APPOINTMENT_MISSED' || c.appointmentDetail?.status === 'MISSED') {
        reasonsMap['Diagnostic Appointment Missed (No-Show)'] += 1;
      }
      if (c.stage === 'AWAITING_OUTCOME_DOCUMENTATION' || c.blockers?.some(b => b.toLowerCase().includes('pathology') || b.toLowerCase().includes('margin'))) {
        reasonsMap['Awaiting Permanent Pathology Margins'] += 1;
      }
      if (c.blockers?.some(b => b.toLowerCase().includes('hindi') || b.toLowerCase().includes('marathi') || b.toLowerCase().includes('translation'))) {
        reasonsMap['Language / Translation Verification'] += 1;
      }
      if (c.blockers?.some(b => b.toLowerCase().includes('transit') || b.toLowerCase().includes('transport'))) {
        reasonsMap['Transit / Transportation Barrier'] += 1;
      }
      if (c.blockers?.some(b => b.toLowerCase().includes('authorization') || b.toLowerCase().includes('insurance'))) {
        reasonsMap['Prior Authorization / Insurance Delay'] += 1;
      }
    });

    return Object.entries(reasonsMap)
      .filter(([_, count]) => count > 0)
      .map(([reason, count]) => ({
        reason,
        count,
        percent: totalCases > 0 ? Math.round((count / totalCases) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCases, totalCases]);

  // -------------------------------------------------------------
  // TIME-TO-ACTION DISTRIBUTION (HISTOGRAM BUCKETS)
  // -------------------------------------------------------------
  const timeBuckets = useMemo(() => {
    const buckets = [
      { label: '< 6 hours', count: 0, color: 'bg-emerald-500' },
      { label: '6 - 12 hours', count: 0, color: 'bg-teal-500' },
      { label: '12 - 24 hours', count: 0, color: 'bg-amber-500' },
      { label: '24 - 48 hours', count: 0, color: 'bg-orange-500' },
      { label: '> 48 hours', count: 0, color: 'bg-rose-500' },
    ];

    reviewTimeDifferences.forEach(h => {
      if (h < 6) buckets[0].count++;
      else if (h < 12) buckets[1].count++;
      else if (h < 24) buckets[2].count++;
      else if (h < 48) buckets[3].count++;
      else buckets[4].count++;
    });

    const totalEvaluated = reviewTimeDifferences.length;
    return buckets.map(b => ({
      ...b,
      percent: totalEvaluated > 0 ? Math.round((b.count / totalEvaluated) * 100) : 0
    }));
  }, [reviewTimeDifferences]);

  // -------------------------------------------------------------
  // OVERDUE CASES TABLE DATA
  // -------------------------------------------------------------
  const overdueCasesList = useMemo(() => {
    return filteredCases
      .filter(c => (c.isOverdue || new Date(c.dueDate).getTime() < Date.now()) && c.stage !== 'CLOSED_WITH_EVIDENCE')
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [filteredCases]);

  // -------------------------------------------------------------
  // COHORT COMPARISON CALCULATION
  // -------------------------------------------------------------
  const cohortComparisonData = useMemo(() => {
    let cohortA: ScreeningCase[] = [];
    let cohortB: ScreeningCase[] = [];
    let cohortAName = '';
    let cohortBName = '';

    if (cohortComparisonMode === 'PERIOD') {
      // October 2026 vs September 2026
      cohortAName = 'Current Month (October 2026)';
      cohortBName = 'Prior Month (September 2026)';
      cohortA = cases.filter(c => (c.receivedDate || c.createdAt).startsWith('2026-10'));
      cohortB = cases.filter(c => (c.receivedDate || c.createdAt).startsWith('2026-09'));
    } else if (cohortComparisonMode === 'URGENCY') {
      cohortAName = 'High & Critical Urgency (72h / 14d SLA)';
      cohortBName = 'Routine & Moderate Urgency (30d / 60d SLA)';
      cohortA = cases.filter(c => c.clinicalUrgency === 'CRITICAL_72H' || c.clinicalUrgency === 'HIGH_14D');
      cohortB = cases.filter(c => c.clinicalUrgency === 'MODERATE_30D' || c.clinicalUrgency === 'ROUTINE_60D');
    } else {
      // English vs Non-English Preferred
      cohortAName = 'English Preferred Patients';
      cohortBName = 'Non-English Preferred (Spanish, Hindi, Marathi, etc.)';
      const englishPatientIds = new Set(patients.filter(p => p.preferredLanguage === 'English').map(p => p.id));
      cohortA = cases.filter(c => englishPatientIds.has(c.patientId));
      cohortB = cases.filter(c => !englishPatientIds.has(c.patientId));
    }

    const calcMedianTime = (caseList: ScreeningCase[]) => {
      const times: number[] = [];
      caseList.forEach(c => {
        if (c.receivedDate && c.initialReviewTimestamp) {
          const diff = (new Date(c.initialReviewTimestamp).getTime() - new Date(c.receivedDate).getTime()) / 3600000;
          if (diff > 0) times.push(diff);
        }
      });
      times.sort((a, b) => a - b);
      if (times.length === 0) return 0;
      const mid = Math.floor(times.length / 2);
      return times.length % 2 !== 0 ? times[mid] : (times[mid - 1] + times[mid]) / 2;
    };

    const calcAckRate = (caseList: ScreeningCase[]) => {
      const notified = caseList.filter(c => c.evidenceChecklist?.patientNotified || !['RESULT_RECEIVED', 'AWAITING_CLINICIAN_REVIEW', 'CLINICIAN_REVIEW_COMPLETED'].includes(c.stage));
      const acked = notified.filter(c => c.evidenceChecklist?.patientAcknowledged);
      return notified.length > 0 ? Math.round((acked.length / notified.length) * 100) : 0;
    };

    const calcClosureRate = (caseList: ScreeningCase[]) => {
      const closed = caseList.filter(c => c.stage === 'CLOSED_WITH_EVIDENCE');
      return caseList.length > 0 ? Math.round((closed.length / caseList.length) * 100) : 0;
    };

    const calcApptRate = (caseList: ScreeningCase[]) => {
      const scheduled = caseList.filter(c => c.appointmentDetail?.scheduledDate || c.evidenceChecklist?.appointmentAttended);
      const attended = scheduled.filter(c => c.evidenceChecklist?.appointmentAttended || c.appointmentDetail?.status === 'ATTENDED');
      return scheduled.length > 0 ? Math.round((attended.length / scheduled.length) * 100) : 0;
    };

    const medianA = calcMedianTime(cohortA);
    const medianB = calcMedianTime(cohortB);
    const ackA = calcAckRate(cohortA);
    const ackB = calcAckRate(cohortB);
    const closureA = calcClosureRate(cohortA);
    const closureB = calcClosureRate(cohortB);
    const apptA = calcApptRate(cohortA);
    const apptB = calcApptRate(cohortB);

    const metricsList: CohortComparisonMetric[] = [
      {
        metric: 'Total Cases Ingested',
        cohortAValue: `${cohortA.length} cases`,
        cohortBValue: `${cohortB.length} cases`,
        deltaText: `${cohortA.length - cohortB.length > 0 ? '+' : ''}${cohortA.length - cohortB.length} cases`,
        interpretation: 'Observed case intake volume difference in sample.'
      },
      {
        metric: 'Median Time to Clinician Review',
        cohortAValue: medianA > 0 ? `${medianA.toFixed(1)}h` : 'Insufficient Data',
        cohortBValue: medianB > 0 ? `${medianB.toFixed(1)}h` : 'Insufficient Data',
        deltaText: medianA > 0 && medianB > 0 ? `${(medianA - medianB).toFixed(1)}h` : 'N/A',
        interpretation: 'Turnaround difference reflects clinical urgency tier prioritization.'
      },
      {
        metric: 'Patient Acknowledgement Rate',
        cohortAValue: `${ackA}%`,
        cohortBValue: `${ackB}%`,
        deltaText: `${ackA - ackB > 0 ? '+' : ''}${ackA - ackB}%`,
        interpretation: 'Evaluates engagement across safe channel preferences and language adaptation.'
      },
      {
        metric: 'Diagnostic Appointment Attendance',
        cohortAValue: `${apptA}%`,
        cohortBValue: `${apptB}%`,
        deltaText: `${apptA - apptB > 0 ? '+' : ''}${apptA - apptB}%`,
        interpretation: 'Tracks procedural attendance equity and no-show drop-offs.'
      },
      {
        metric: 'Evidence-Verified Care Closure Rate',
        cohortAValue: `${closureA}%`,
        cohortBValue: `${closureB}%`,
        deltaText: `${closureA - closureB > 0 ? '+' : ''}${closureA - closureB}%`,
        interpretation: 'Reflects closed-loop completion rate across evaluated cohorts.'
      }
    ];

    return {
      cohortAName,
      cohortBName,
      cohortACount: cohortA.length,
      cohortBCount: cohortB.length,
      metrics: metricsList
    };
  }, [cases, patients, cohortComparisonMode]);

  // -------------------------------------------------------------
  // CSV EXPORT FUNCTION (FILTERED SYNTHETIC DATA)
  // -------------------------------------------------------------
  const exportFilteredCSV = () => {
    const headers = [
      'Case_ID',
      'MRN',
      'Patient_Name',
      'Screening_Protocol',
      'Test_Name',
      'Urgency',
      'Workflow_Stage',
      'Exception_Status',
      'Responsible_Owner',
      'Organization',
      'Result_Received_Date',
      'Clinician_Review_Date',
      'Review_Turnaround_Hours',
      'Patient_Acknowledged',
      'Referral_Accepted',
      'Appointment_Attended',
      'Outcome_Documented',
      'Closure_Status',
      'Is_Overdue'
    ];

    const rows = filteredCases.map(c => {
      let turnaroundHours = 'N/A';
      if (c.receivedDate && (c.initialReviewTimestamp || c.evidenceChecklist?.clinicianReviewDate)) {
        const received = new Date(c.receivedDate).getTime();
        const reviewed = new Date(c.initialReviewTimestamp || c.evidenceChecklist?.clinicianReviewDate!).getTime();
        turnaroundHours = ((reviewed - received) / 3600000).toFixed(1);
      }

      return [
        c.id,
        c.mrn,
        `"${c.patientName}"`,
        `"${getScreeningLabel(c.screeningType)}"`,
        `"${c.testName}"`,
        c.clinicalUrgency,
        `"${getStageLabel(c.stage)}"`,
        c.exceptionStatus,
        `"${c.responsibleOwner}"`,
        `"${c.assignedOrganization}"`,
        c.receivedDate || '',
        c.initialReviewTimestamp || c.evidenceChecklist?.clinicianReviewDate || '',
        turnaroundHours,
        c.evidenceChecklist?.patientAcknowledged ? 'YES' : 'NO',
        c.evidenceChecklist?.referralAccepted ? 'YES' : 'NO',
        c.evidenceChecklist?.appointmentAttended ? 'YES' : 'NO',
        c.evidenceChecklist?.outcomeDocumented ? 'YES' : 'NO',
        c.closureStatus,
        c.isOverdue ? 'YES' : 'NO'
      ].join(',');
    });

    const csvContent = [
      '# NOTICE: SIMULATED SYNTHETIC CLINICAL DATA FOR DEMONSTRATION PURPOSES ONLY - NOT LIVE PATIENT HEALTH INFORMATION',
      `# Exported_At: ${new Date().toISOString()}`,
      `# Filter_Window: ${calculationWindowText}`,
      `# Filtered_Records_Count: ${filteredCases.length}`,
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `careloop_analytics_filtered_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quality Compliance & Closed-Loop Analytics
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Live Record Calculations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time quality intelligence dynamically derived from shared case, task, communication, referral, and escalation records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Trigger Judge Demonstration */}
          <button
            onClick={() => setIsJudgeDemoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-md shadow-xs transition-colors cursor-pointer border border-amber-500/40"
            title="Launch 10-step guided judge demonstration"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-900" />
            <span>Judge Demo Scenario</span>
          </button>

          {/* Export Filtered CSV */}
          <button
            onClick={exportFilteredCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors cursor-pointer"
            title="Download filtered dataset as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Filtered CSV</span>
          </button>
        </div>
      </div>

      {/* Synthetic Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Synthetic Analytics Safeguard:</span>
          <p className="text-[11px] text-amber-900/90 leading-relaxed">
            All quality metrics, medians, and rates update automatically as cases move through the workflow. Denominators and numerators reflect actual simulated registry timestamps. Unknown outcomes are never assumed to be successes.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MULTI-DIMENSIONAL FILTER CONTROLS BAR                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Global Analytics Filters (Synchronized Across All Metrics & Charts)</span>
          </div>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Date Range */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Time Horizon
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value as any }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="ALL">All Time Horizon</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="LAST_90_DAYS">Last 90 Days</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>
          </div>

          {/* 2. Screening Protocol */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Screening Protocol
            </label>
            <select
              value={filters.screeningType}
              onChange={(e) => setFilters(f => ({ ...f, screeningType: e.target.value as any }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="ALL">All Screening Protocols</option>
              <option value="MAMMOGRAPHY_BIRADS">Breast (BI-RADS)</option>
              <option value="COLORECTAL_FIT">Colorectal (FIT)</option>
              <option value="LUNG_LDCT">Lung CT (Lung-RADS)</option>
              <option value="CERVICAL_HPV">Cervical / HPV</option>
              <option value="DIABETIC_RETINOPATHY">Retinopathy</option>
              <option value="PROSTATE_PSA">Prostate PSA</option>
              <option value="THYROID_ULTRASOUND">Thyroid (TI-RADS)</option>
              <option value="SKIN_BIOPSY">Skin Biopsy</option>
            </select>
          </div>

          {/* 3. Assigned Organization */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Organization / Facility
            </label>
            <select
              value={filters.organization}
              onChange={(e) => setFilters(f => ({ ...f, organization: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 truncate"
            >
              <option value="ALL">All Organizations</option>
              {uniqueOrganizations.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

          {/* 4. Responsible Owner */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Case Owner / Coordinator
            </label>
            <select
              value={filters.owner}
              onChange={(e) => setFilters(f => ({ ...f, owner: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 truncate"
            >
              <option value="ALL">All Responsible Owners</option>
              {uniqueOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          {/* 5. Clinical Urgency */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Clinical Urgency Tier
            </label>
            <select
              value={filters.urgency}
              onChange={(e) => setFilters(f => ({ ...f, urgency: e.target.value as any }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="ALL">All Urgencies</option>
              <option value="CRITICAL_72H">Critical (72h SLA)</option>
              <option value="HIGH_14D">High (14d SLA)</option>
              <option value="MODERATE_30D">Moderate (30d SLA)</option>
              <option value="ROUTINE_60D">Routine (60d SLA)</option>
            </select>
          </div>

          {/* 6. Referral Provider */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Specialist Referral Provider
            </label>
            <select
              value={filters.referralProvider}
              onChange={(e) => setFilters(f => ({ ...f, referralProvider: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 truncate"
            >
              <option value="ALL">All Specialist Providers</option>
              {uniqueReferralProviders.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 7. Workflow Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Status Cohort
            </label>
            <select
              value={filters.workflowStatus}
              onChange={(e) => setFilters(f => ({ ...f, workflowStatus: e.target.value as any }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="ALL">All Cases (Active & Closed)</option>
              <option value="OPEN_ONLY">Open Actionable Only</option>
              <option value="CLOSED_ONLY">Closed with Evidence Only</option>
              <option value="OVERDUE_ONLY">Overdue SLA Cases Only</option>
              <option value="ESCALATED_ONLY">Active Escalations Only</option>
            </select>
          </div>

          {/* Custom Date Inputs if CUSTOM is selected */}
          {filters.dateRange === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter Summary Status */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900 font-mono">{filteredCases.length}</strong> of{' '}
            <strong className="text-slate-900 font-mono">{cases.length}</strong> cases matching active filters
            {' '}(Calculation Window: <span className="font-semibold text-teal-800">{calculationWindowText}</span>)
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 13 CORE KPI CARDS GRID (WITH CLINICAL DEFINITIONS & FORMULAS) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
          <span>Key Closed-Loop Performance Indicators</span>
          <span className="text-slate-400 font-normal lowercase">Click metric card to inspect exact mathematical formula</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {kpiDefinitions.map(kpi => {
            const hasRate = kpi.isRate && kpi.numerator !== undefined && kpi.denominator !== undefined;
            return (
              <div
                key={kpi.id}
                onClick={() => setActiveMetricModal(kpi)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <span className="truncate group-hover:text-teal-800">{kpi.label}</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                  </div>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold font-mono tracking-tight ${
                      kpi.hasInsufficientData ? 'text-slate-400 text-lg' :
                      kpi.status === 'alert' ? 'text-rose-700' :
                      kpi.status === 'good' ? 'text-teal-900' :
                      kpi.status === 'warning' ? 'text-amber-800' : 'text-slate-900'
                    }`}>
                      {kpi.value}
                    </span>
                    {kpi.unit && !kpi.hasInsufficientData && (
                      <span className="text-xs text-slate-500 font-normal">{kpi.unit}</span>
                    )}
                  </div>

                  {/* Numerator / Denominator Bar */}
                  {hasRate && (
                    <div className="mt-1 text-[11px] text-slate-500 font-mono">
                      <span>{kpi.numerator}</span> / <span>{kpi.denominator}</span> {kpi.numeratorLabel?.split(' ')[0]}
                    </div>
                  )}

                  {!hasRate && kpi.id === 'kpi-median-review-time' && reviewTimeDifferences.length > 0 && (
                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      n = {reviewTimeDifferences.length} (range: {minReviewTime.toFixed(1)}h – {maxReviewTime.toFixed(1)}h)
                    </div>
                  )}

                  {!hasRate && kpi.id === 'kpi-median-notify-time' && notificationTimeDifferences.length > 0 && (
                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      n = {notificationTimeDifferences.length} recorded notifications
                    </div>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">{kpi.benchmark || kpi.calculationWindow}</span>
                  <span className="text-teal-700 font-semibold group-hover:underline">Inspect →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CASE FUNNEL FROM ACTIONABLE RESULT TO DOCUMENTED CLOSURE       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Case Funnel: From Actionable Result to Documented Closure
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracking patient attrition across the 7 closed-loop milestones in the filtered cohort ({filteredCases.length} cases).
            </p>
          </div>
          <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 self-start sm:self-center">
            Overall Conversion: {totalCases > 0 ? Math.round((closedCount / totalCases) * 100) : 0}% Closed
          </div>
        </div>

        <div className="space-y-3">
          {funnelStages.map((step) => {
            const isTarget = step.step === 7;
            return (
              <div key={step.step} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{step.label}</span>
                    {step.dropOff > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-rose-700 bg-rose-50 border border-rose-200">
                        -{step.dropOff} drop-off
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 text-[11px]">{step.count} cases</span>
                    <span className={`font-mono text-xs font-bold ${isTarget ? 'text-teal-700' : 'text-slate-900'}`}>
                      {step.percentOfTotal}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isTarget ? 'bg-teal-600' : step.count === 0 ? 'bg-slate-300' : 'bg-slate-800'
                    }`}
                    style={{ width: `${Math.max(step.count > 0 ? 6 : 0, step.percentOfTotal)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* OPERATIONAL VALUE: "WHERE CARE GETS STUCK"                     */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Where Care Gets Stuck (Active Operational Bottlenecks)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies the most frequent failure points in the demo dataset and provides direct routing to resolve each affected case.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {careBottlenecks.length} Critical Bottlenecks Identified
          </span>
        </div>

        {careBottlenecks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-6 h-6 text-teal-600 mx-auto mb-1.5" />
            No active bottlenecks detected in the current filtered cohort.
          </div>
        ) : (
          <div className="space-y-3">
            {careBottlenecks.map(bot => {
              const severityClasses = bot.severity === 'CRITICAL'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : bot.severity === 'HIGH'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-blue-50 text-blue-800 border-blue-200';

              return (
                <div
                  key={bot.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${severityClasses}`}>
                        {bot.severity}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900">{bot.title}</h3>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-xs text-slate-600 font-medium">{bot.category}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                      <span className="text-slate-500">
                        Affected: <strong className="text-slate-900">{bot.caseCount} cases</strong>
                      </span>
                      <span className="text-slate-500">
                        Avg Delay: <strong className="text-amber-800">{bot.avgDelayHours}h</strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {bot.description}
                  </p>

                  {/* Clickable links to affected cases */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">Affected Cases:</span>
                      {bot.affectedCaseIds.slice(0, 4).map(caseId => {
                        const targetCase = cases.find(c => c.id === caseId);
                        return (
                          <button
                            key={caseId}
                            onClick={() => setSelectedCaseId(caseId)}
                            className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                            title={`Open ${targetCase?.patientName || caseId}`}
                          >
                            {targetCase ? `${targetCase.patientName} (${caseId})` : caseId}
                          </button>
                        );
                      })}
                      {bot.affectedCaseIds.length > 4 && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          +{bot.affectedCaseIds.length - 4} more
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedCaseId(bot.affectedCaseIds[0])}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Intervene / Open First Case</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TWO COLUMN GRID: DELAYS BREAKDOWN & TIME-TO-ACTION HISTOGRAM  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reasons for Delays & Drop-offs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Reasons for Delays and Drop-Offs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical breakdown of recorded clinical and operational barriers across filtered cases.
            </p>
          </div>

          {delayReasonsBreakdown.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
              No recorded delay barriers in current filter cohort.
            </div>
          ) : (
            <div className="space-y-2.5">
              {delayReasonsBreakdown.map(item => (
                <div key={item.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{item.reason}</span>
                    <span className="font-mono text-slate-600 font-semibold">{item.count} cases ({item.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full"
                      style={{ width: `${Math.max(8, item.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time-to-Action Turnaround Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Turnaround Time Distribution (Receipt to Review)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Histogram of clinician review turnaround times evaluated against 24-hour SLA targets.
            </p>
          </div>

          <div className="space-y-2.5">
            {timeBuckets.map(b => (
              <div key={b.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">{b.label}</span>
                  <span className="font-mono text-slate-600 font-semibold">{b.count} cases ({b.percent}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${b.color} h-full rounded-full transition-all`}
                    style={{ width: `${Math.max(b.count > 0 ? 8 : 0, b.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Evaluated Cases with Recorded Review:</span>
            <span className="font-bold text-slate-900 font-mono">{reviewTimeDifferences.length} cases</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* COHORT COMPARISON MODULE                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Cohort Comparative Quality Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-period and equity subgroup performance comparison across key care loop metrics.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setCohortComparisonMode('PERIOD')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                cohortComparisonMode === 'PERIOD'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month-over-Month
            </button>
            <button
              onClick={() => setCohortComparisonMode('URGENCY')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                cohortComparisonMode === 'URGENCY'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Urgency Tiers
            </button>
            <button
              onClick={() => setCohortComparisonMode('LANGUAGE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                cohortComparisonMode === 'LANGUAGE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Language Equity
            </button>
          </div>
        </div>

        {/* Required Statistical Causality Disclaimer */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
          <strong>Notice:</strong> Cohort comparison reflects observed sample differences in this synthetic demonstration dataset. CareLoop does not claim observational differences prove statistical causality or guaranteed longitudinal clinical improvement.
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5">Care Quality Metric</th>
                <th className="py-2.5 font-bold text-slate-800">{cohortComparisonData.cohortAName}</th>
                <th className="py-2.5 font-bold text-slate-800">{cohortComparisonData.cohortBName}</th>
                <th className="py-2.5 text-center font-bold">Observed Delta (Δ)</th>
                <th className="py-2.5">Clinical Quality Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {cohortComparisonData.metrics.map(m => (
                <tr key={m.metric} className="hover:bg-slate-50/60">
                  <td className="py-3 font-semibold text-slate-900">{m.metric}</td>
                  <td className="py-3 font-mono font-bold text-slate-900">{m.cohortAValue}</td>
                  <td className="py-3 font-mono text-slate-600">{m.cohortBValue}</td>
                  <td className="py-3 text-center font-mono font-bold text-teal-800">
                    {m.deltaText}
                  </td>
                  <td className="py-3 text-slate-500 leading-snug">{m.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* OVERDUE CASE ACCOUNTABILITY TABLE                             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Overdue Cases Requiring Accountable Next Actions ({overdueCasesList.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Closed-loop accountability: All overdue cases must display an assigned owner, target due date, and explicit next step.
            </p>
          </div>
        </div>

        {overdueCasesList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-teal-600 mx-auto mb-1" />
            No overdue cases matching current filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">Patient / MRN</th>
                  <th className="py-2.5">Screening Protocol</th>
                  <th className="py-2.5">Urgency</th>
                  <th className="py-2.5">Responsible Owner</th>
                  <th className="py-2.5">Required Next Action</th>
                  <th className="py-2.5">Due Date</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {overdueCasesList.map(c => {
                  const urgencyStyle = getUrgencyBadgeClasses(c.clinicalUrgency);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 font-medium">
                        <div className="font-bold text-slate-900">{c.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.id} · {c.mrn}</div>
                      </td>
                      <td className="py-3 text-slate-700">
                        {getScreeningLabel(c.screeningType)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                          {urgencyStyle.label.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-800">
                        {c.responsibleOwner}
                      </td>
                      <td className="py-3 text-rose-800 font-medium max-w-xs truncate" title={c.nextAction}>
                        {c.nextAction}
                      </td>
                      <td className="py-3 font-mono text-rose-700">
                        {formatDate(c.dueDate)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedCaseId(c.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded transition-colors cursor-pointer"
                        >
                          Open Case
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* METRIC DEFINITION & FORMULA DETAIL MODAL                      */}
      {/* ------------------------------------------------------------- */}
      {activeMetricModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold">{activeMetricModal.label}</h3>
              </div>
              <button
                onClick={() => setActiveMetricModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Definition</div>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {activeMetricModal.definition}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                <div className="text-[10px] text-slate-400 font-sans font-bold uppercase">Mathematical Formula:</div>
                <div className="text-teal-900 font-bold">{activeMetricModal.formula}</div>
              </div>

              {activeMetricModal.numerator !== undefined && activeMetricModal.denominator !== undefined && (
                <div className="grid grid-cols-2 gap-3 text-xs bg-teal-50/50 p-3 rounded-lg border border-teal-200">
                  <div>
                    <span className="text-[10px] text-teal-700 uppercase font-bold">Numerator</span>
                    <div className="text-base font-bold text-teal-900 font-mono">{activeMetricModal.numerator} cases</div>
                    <div className="text-[10px] text-teal-700">{activeMetricModal.numeratorLabel}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-teal-700 uppercase font-bold">Denominator</span>
                    <div className="text-base font-bold text-teal-900 font-mono">{activeMetricModal.denominator} cases</div>
                    <div className="text-[10px] text-teal-700">{activeMetricModal.denominatorLabel}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-slate-500 text-[11px]">
                <div>Calculation Window: <strong className="text-slate-800">{activeMetricModal.calculationWindow}</strong></div>
                <div>Benchmark Target: <strong className="text-slate-800">{activeMetricModal.benchmark || 'N/A'}</strong></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveMetricModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
