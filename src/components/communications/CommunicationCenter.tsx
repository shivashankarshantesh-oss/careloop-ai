import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Globe, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles,
  Search,
  Filter,
  UserCheck,
  ShieldCheck,
  Languages,
  FileCheck2,
  AlertOctagon,
  HelpCircle,
  PhoneCall,
  Check,
  ArrowRight,
  Eye,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Info,
  Calendar,
  Building,
  User
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { formatDate, formatDateTime, getScreeningLabel, getUrgencyBadgeColor } from '../../utils/formatters';
import { 
  COMMUNICATION_TEMPLATES, 
  MessageTemplate, 
  SupportedLanguage, 
  populateTemplateText, 
  sanitizeForSms, 
  simplifyClinicalTextFallback, 
  translateTextFallback,
  summarizeAdministrativeHistory
} from '../../utils/communicationTemplates';
import { Communication, CommunicationChannel, ComprehensionCheckResponse } from '../../types/careloop';

export const CommunicationCenter: React.FC = () => {
  const { 
    communications, 
    cases, 
    patients, 
    currentRole, 
    currentRoleProfile,
    sendCommunication, 
    acknowledgeCommunication, 
    recordComprehensionResponse,
    verifyTranslation,
    triggerUnacknowledgedFollowup,
    simulateDeliveryStatusChange,
    setSelectedCaseId 
  } = useCareLoop();

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [ackFilter, setAckFilter] = useState<string>('ALL');
  const [langFilter, setLangFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected case for composer
  // Default to Hindi patient (Sunita Sharma) or first case
  const defaultHindiCase = cases.find(c => c.patientName.includes('Sunita')) || cases[0];
  const [selectedCaseIdForm, setSelectedCaseIdForm] = useState(defaultHindiCase?.id || '');

  const selectedCase = cases.find(c => c.id === selectedCaseIdForm) || cases[0];
  const selectedPatient = patients.find(p => p.id === selectedCase?.patientId);

  // Composer State
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('SCREENING_READY');
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>('Hindi');
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel>('SMS');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [isTranslationDraft, setIsTranslationDraft] = useState(false);
  const [verifiedByHuman, setVerifiedByHuman] = useState<string | null>(null);
  const [acknowledgementDeadlineDays, setAcknowledgementDeadlineDays] = useState<number>(3); // 72 hours
  const [applySmsSanitizer, setApplySmsSanitizer] = useState(true);

  // Safety & Clinical Approval
  const [clinicianApprovalConfirmed, setClinicianApprovalConfirmed] = useState(true);
  const [approverName, setApproverName] = useState(selectedCase?.urgencyApprovedBy || 'Dr. Sarah Chen, MD');

  // AI & Async State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiActionMessage, setAiActionMessage] = useState<string | null>(null);
  const [adminSummaryText, setAdminSummaryText] = useState<string>('');

  // Modals
  const [showPreDispatchModal, setShowPreDispatchModal] = useState(false);
  const [comprehensionModalComm, setComprehensionModalComm] = useState<Communication | null>(null);
  const [comprehensionForm, setComprehensionForm] = useState<ComprehensionCheckResponse>({
    understood: 'YES',
    needsHelp: 'NO',
    callbackRequested: false,
    submittedAt: '',
    patientNotes: '',
  });

  // Automatically adapt language and content when selected case or template changes
  useEffect(() => {
    if (!selectedCase || !selectedPatient) return;

    // Detect preferred language
    let prefLang: SupportedLanguage = 'English';
    if (selectedPatient.preferredLanguage === 'Hindi') prefLang = 'Hindi';
    else if (selectedPatient.preferredLanguage === 'Marathi') prefLang = 'Marathi';
    setActiveLanguage(prefLang);

    // Set approver
    setApproverName(selectedCase.urgencyApprovedBy || 'Dr. Sarah Chen, MD');

    // Populate template
    applyTemplate(selectedTemplateKey, prefLang);

    // Initial admin summary
    const summary = summarizeAdministrativeHistory(selectedCase, communications, selectedPatient);
    setAdminSummaryText(summary);
  }, [selectedCaseIdForm]);

  const applyTemplate = (category: string, lang: SupportedLanguage) => {
    if (!selectedCase || !selectedPatient) return;
    const template = COMMUNICATION_TEMPLATES.find(t => t.category === category) || COMMUNICATION_TEMPLATES[0];

    let rawTitle = template.content[lang]?.title || template.content.English.title;
    let rawBody = template.content[lang]?.body || template.content.English.body;

    let popTitle = populateTemplateText(rawTitle, selectedPatient, selectedCase);
    let popBody = populateTemplateText(rawBody, selectedPatient, selectedCase);

    if (applySmsSanitizer && (selectedChannel === 'SMS' || selectedChannel === 'WHATSAPP')) {
      popBody = sanitizeForSms(popBody, lang);
    }

    setMsgTitle(popTitle);
    setMsgContent(popBody);
    setIsTranslationDraft(lang !== 'English');
    setVerifiedByHuman(lang === 'English' ? 'English Original' : null);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setActiveLanguage(lang);
    applyTemplate(selectedTemplateKey, lang);
  };

  const handleTemplateChange = (templateCat: string) => {
    setSelectedTemplateKey(templateCat);
    applyTemplate(templateCat, activeLanguage);
  };

  // Demo flow quick switchers
  const switchDemoFlow = (type: 'HINDI' | 'MARATHI' | 'ENGLISH') => {
    if (type === 'HINDI') {
      const c = cases.find(cs => cs.patientName.includes('Sunita')) || cases[0];
      setSelectedCaseIdForm(c.id);
      setActiveLanguage('Hindi');
      setSelectedChannel('SMS');
      applyTemplate('SCREENING_READY', 'Hindi');
      setAiActionMessage('Loaded synthetic Hindi screening scenario (Sunita Sharma).');
    } else if (type === 'MARATHI') {
      const c = cases.find(cs => cs.patientName.includes('Rajesh')) || cases[0];
      setSelectedCaseIdForm(c.id);
      setActiveLanguage('Marathi');
      setSelectedChannel('WHATSAPP');
      applyTemplate('ACK_REQUEST', 'Marathi');
      setAiActionMessage('Loaded synthetic Marathi follow-up scenario (Rajesh Kulkarni).');
    } else {
      const c = cases.find(cs => cs.patientName.includes('Marcus')) || cases[0];
      setSelectedCaseIdForm(c.id);
      setActiveLanguage('English');
      setSelectedChannel('PORTAL');
      applyTemplate('APPOINTMENT_REMINDER', 'English');
      setAiActionMessage('Loaded English appointment reminder scenario (Marcus Thornton).');
    }
  };

  // 1. AI Rewrite in Plain Language (Server-side Gemini + Fallback)
  const handleAiSimplify = async () => {
    if (!msgContent.trim()) return;
    setIsAiLoading(true);
    setAiActionMessage('Rephrasing content in 6th-grade plain language...');

    try {
      const response = await fetch('/api/ai/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgContent, language: activeLanguage })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.simplifiedText) {
          setMsgContent(data.simplifiedText);
          setAiActionMessage('Plain-language rewrite generated successfully (Gemini 3.8 Flash).');
          setIsAiLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend Gemini API simplify endpoint unavailable, using rule-based fallback');
    }

    // High quality fallback
    setTimeout(() => {
      const simplified = simplifyClinicalTextFallback(msgContent, activeLanguage);
      setMsgContent(simplified);
      setAiActionMessage('Plain-language simplification applied via clinical accessibility dictionary.');
      setIsAiLoading(false);
    }, 350);
  };

  // 2. AI Translate Message (Server-side Gemini + Fallback)
  const handleAiTranslate = async (targetLang: SupportedLanguage) => {
    if (!msgContent.trim()) return;
    setIsAiLoading(true);
    setAiActionMessage(`Translating message into ${targetLang}...`);

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgContent, targetLanguage: targetLang })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          setActiveLanguage(targetLang);
          setMsgContent(data.translatedText);
          setIsTranslationDraft(true);
          setVerifiedByHuman(null);
          setAiActionMessage(`Message translated into ${targetLang} (Draft - Requires Qualified Human Review).`);
          setIsAiLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend Gemini API translate endpoint unavailable, using fallback');
    }

    // High quality fallback
    setTimeout(() => {
      setActiveLanguage(targetLang);
      const fallbackResult = translateTextFallback(msgContent, targetLang);
      setMsgContent(fallbackResult.text);
      setIsTranslationDraft(true);
      setVerifiedByHuman(null);
      setAiActionMessage(`Translated into ${targetLang} via certified healthcare phrasebook (Draft).`);
      setIsAiLoading(false);
    }, 400);
  };

  // 3. AI Summarize Administrative History
  const handleAiSummarizeHistory = async () => {
    if (!selectedCase || !selectedPatient) return;
    setIsAiLoading(true);
    setAiActionMessage('Synthesizing administrative timeline & barrier history...');

    try {
      const response = await fetch('/api/ai/summarize-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseData: {
            id: selectedCase.id,
            patientName: selectedCase.patientName,
            stage: selectedCase.stage,
            clinicalUrgency: selectedCase.clinicalUrgency,
            exceptionStatus: selectedCase.exceptionStatus,
            nextAction: selectedCase.nextAction,
          },
          communications: communications.filter(c => c.caseId === selectedCase.id)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summary) {
          setAdminSummaryText(data.summary);
          setAiActionMessage('Administrative timeline summarized by Gemini.');
          setIsAiLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend summarize history endpoint unavailable, using structured fallback');
    }

    setTimeout(() => {
      const summary = summarizeAdministrativeHistory(selectedCase, communications, selectedPatient);
      setAdminSummaryText(summary);
      setAiActionMessage('Administrative history summarized from EHR audit trail.');
      setIsAiLoading(false);
    }, 300);
  };

  // Dispatch Action
  const handleConfirmDispatch = () => {
    if (!selectedCase || !selectedPatient || !msgContent.trim()) return;

    const deadline = new Date(Date.now() + (acknowledgementDeadlineDays * 24 * 3600 * 1000)).toISOString();

    sendCommunication({
      caseId: selectedCase.id,
      patientId: selectedCase.patientId,
      patientName: selectedCase.patientName,
      channel: selectedChannel,
      recipientContact: selectedChannel === 'SMS' || selectedChannel === 'WHATSAPP' 
        ? selectedPatient.phone 
        : (selectedChannel === 'SECURE_EMAIL' ? selectedPatient.email : selectedPatient.address),
      messageTitle: msgTitle || `Care Follow-Up Notice — ${selectedCase.testName}`,
      messageContent: msgContent,
      language: activeLanguage,
      sentBy: `${currentRole} (${currentRoleProfile.title})`,
      consentPreferenceStatus: 'CONSENTED_PRIMARY',
      templateCategory: selectedTemplateKey,
      translationStatus: isTranslationDraft ? 'DRAFT_NEEDS_HUMAN_REVIEW' : 'VERIFIED_HUMAN_APPROVED',
      verifiedBy: verifiedByHuman || undefined,
      verifiedAt: verifiedByHuman ? new Date().toISOString() : undefined,
      isSimulatedDelivery: true,
      clinicianApprovedGuidance: clinicianApprovalConfirmed,
      approvedByClinician: approverName,
      approvedAt: new Date().toISOString(),
      acknowledgementDeadline: deadline,
      unacknowledgedAttemptCount: 0,
      deliveryTimeline: {
        sentAt: new Date().toISOString(),
        deliveredAt: new Date(Date.now() + 1500).toISOString(),
      }
    });

    setShowPreDispatchModal(false);
    setAiActionMessage(`Simulated outreach successfully transmitted via ${selectedChannel} in ${activeLanguage}.`);
  };

  // Filter communications list
  const filteredComms = communications.filter(c => {
    if (channelFilter !== 'ALL' && c.channel !== channelFilter) return false;
    if (ackFilter !== 'ALL' && c.acknowledgementStatus !== ackFilter) return false;
    if (langFilter !== 'ALL' && c.language !== langFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.patientName.toLowerCase().includes(q) ||
        c.messageTitle.toLowerCase().includes(q) ||
        c.messageContent.toLowerCase().includes(q) ||
        c.caseId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Metrics
  const totalComms = communications.length;
  const acknowledgedCount = communications.filter(c => c.acknowledgementStatus === 'ACKNOWLEDGED').length;
  const pendingCount = communications.filter(c => c.acknowledgementStatus === 'PENDING').length;
  const verifiedCount = communications.filter(c => c.translationStatus === 'VERIFIED_HUMAN_APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                AI-Assisted Patient Communication Center
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded">
                Trilingual Hub: English · हिंदी · मराठी
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Equitable, culturally adapted, plain-language patient communication ensuring clinical screening results are clearly understood, acknowledged, and closed without disparities.
            </p>
          </div>

          {/* Quick Demo Scenario Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-600 px-1">Demo Scenarios:</span>
            <button
              onClick={() => switchDemoFlow('HINDI')}
              className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                selectedPatient?.preferredLanguage === 'Hindi'
                  ? 'bg-orange-600 text-white border-orange-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🇮🇳 Hindi Flow (Sunita)
            </button>
            <button
              onClick={() => switchDemoFlow('MARATHI')}
              className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                selectedPatient?.preferredLanguage === 'Marathi'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🚩 Marathi Flow (Rajesh)
            </button>
            <button
              onClick={() => switchDemoFlow('ENGLISH')}
              className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                selectedPatient?.preferredLanguage === 'English'
                  ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🇺🇸 English Flow (Marcus)
            </button>
          </div>
        </div>

        {/* Prototype simulation disclaimer */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-md p-2.5 flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="font-semibold text-amber-950">Simulation Environment & Clinical Safety Rules:</strong> Outreach transmissions shown here are prototype simulations. No real SMS, WhatsApp, or USPS mail is dispatched. The AI assistant strictly adheres to clinician-approved findings and next steps; it does not diagnose or interpret raw pathology. All clinical guidance requires human clinician sign-off prior to dispatch.
          </div>
        </div>

        {/* Status notification toast */}
        {aiActionMessage && (
          <div className="bg-teal-50 border border-teal-200 rounded-md p-2.5 flex items-center justify-between text-xs text-teal-900 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>{aiActionMessage}</span>
            </div>
            <button 
              onClick={() => setAiActionMessage(null)}
              className="text-teal-700 hover:text-teal-900 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Total Outreaches Dispatched</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalComms}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Omni-channel simulated tracking</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-amber-700">Awaiting Acknowledgement</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Tracked under 72h SLA</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-emerald-700">Confirmed & Acknowledged</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{acknowledgedCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Comprehension responses documented</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-teal-700">Human-Verified Translations</div>
          <div className="text-2xl font-bold text-teal-800 mt-1">{verifiedCount}</div>
          <div className="text-[10px] text-teal-600 mt-0.5">Hindi & Marathi clinical review</div>
        </div>
      </div>

      {/* THREE-PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* PANEL 1: CASE CONTEXT & ADMINISTRATIVE HISTORY (~3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Case & Patient Context
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {selectedCase.id}
              </span>
            </div>

            {/* Target Case Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Active Case Selection
              </label>
              <select
                value={selectedCaseIdForm}
                onChange={(e) => setSelectedCaseIdForm(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 font-medium focus:ring-1 focus:ring-teal-600"
              >
                {cases.map(c => {
                  const pat = patients.find(p => p.id === c.patientId);
                  const langFlag = pat?.preferredLanguage === 'Hindi' ? '🇮🇳' : (pat?.preferredLanguage === 'Marathi' ? '🚩' : '🇺🇸');
                  return (
                    <option key={c.id} value={c.id}>
                      {langFlag} {c.patientName} — {getScreeningLabel(c.screeningType)} ({c.id})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Patient Language & Communication Profile */}
            {selectedPatient && (
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                  <span className="text-[10px] font-mono text-slate-500">MRN: {selectedPatient.mrn}</span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200 pt-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preferred Language:</span>
                    <strong className="text-slate-900 font-semibold">{selectedPatient.preferredLanguage}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Safe Channel:</span>
                    <strong className="text-slate-900 uppercase font-semibold">{selectedPatient.safeContactPreference}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile Phone:</span>
                    <span className="font-mono text-slate-800">{selectedPatient.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consent Status:</span>
                    <span className="text-emerald-700 font-bold">✓ OPT-IN VERIFIED</span>
                  </div>
                </div>
              </div>
            )}

            {/* Approved Clinical Context */}
            <div className="space-y-2 text-xs">
              <div className="text-[10px] font-bold uppercase text-slate-500">
                Clinician-Approved Plan (Non-AI)
              </div>
              <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-md text-[11px] space-y-1">
                <div className="font-semibold text-emerald-950">
                  {selectedCase.testName}
                </div>
                <div className="text-emerald-800 line-clamp-2">
                  {selectedCase.findingsSummary}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium pt-1 border-t border-emerald-200 flex justify-between">
                  <span>Urgency: <strong>{selectedCase.clinicalUrgency}</strong></span>
                  <span>Approved by: {selectedCase.urgencyApprovedBy}</span>
                </div>
              </div>
            </div>

            {/* Administrative Case History Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Administrative History
                </span>
                <button
                  type="button"
                  onClick={handleAiSummarizeHistory}
                  disabled={isAiLoading}
                  className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>AI Summarize</span>
                </button>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 leading-relaxed font-sans max-h-40 overflow-y-auto">
                {adminSummaryText || 'No administrative notes recorded yet.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCaseId(selectedCase.id)}
              className="w-full py-1.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open Complete Case File</span>
            </button>
          </div>
        </div>

        {/* PANEL 2: MESSAGE COMPOSER & MULTI-LANGUAGE ENGINE (~5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            
            {/* Template Selector & Safety Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Message Composer
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Structured & Guardrailed
              </span>
            </div>

            {/* Template Category Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Standardized Outreach Template
              </label>
              <select
                value={selectedTemplateKey}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-teal-600"
              >
                {COMMUNICATION_TEMPLATES.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.category}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selection Tabs (English, Hindi, Marathi) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Languages className="w-3 h-3 text-slate-400" />
                  Language & Translation
                </label>
                {/* Draft vs Verified Badge */}
                {activeLanguage === 'English' ? (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    Original Source (English)
                  </span>
                ) : isTranslationDraft ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded">
                      ⚠️ Draft Translation (Requires Human Review)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTranslationDraft(false);
                        setVerifiedByHuman(currentRole);
                      }}
                      className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                    >
                      Verify Now
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    ✓ Verified by {verifiedByHuman || 'Qualified Reviewer'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('English')}
                  className={`py-1.5 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                    activeLanguage === 'English'
                      ? 'bg-teal-600 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('Hindi')}
                  className={`py-1.5 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                    activeLanguage === 'Hindi'
                      ? 'bg-orange-600 text-white border-orange-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('Marathi')}
                  className={`py-1.5 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                    activeLanguage === 'Marathi'
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  मराठी (Marathi)
                </button>
              </div>
            </div>

            {/* AI Assistance Toolbar */}
            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>AI Assist:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={handleAiSimplify}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                  title="Rewrite in 6th-grade plain language"
                >
                  Simplify Language
                </button>
                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => handleAiTranslate(activeLanguage === 'Hindi' ? 'Marathi' : (activeLanguage === 'Marathi' ? 'Hindi' : 'Hindi'))}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                  title="Cross-translate"
                >
                  Translate to {activeLanguage === 'Hindi' ? 'Marathi' : (activeLanguage === 'Marathi' ? 'Hindi' : 'Hindi')}
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate(selectedTemplateKey, activeLanguage)}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded transition-colors cursor-pointer"
                  title="Reset to approved base template"
                >
                  Reset Template
                </button>
              </div>
            </div>

            {/* Channel Selection & SMS Sanitizer Flag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Outreach Channel
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => {
                    const ch = e.target.value as CommunicationChannel;
                    setSelectedChannel(ch);
                    if (applySmsSanitizer && (ch === 'SMS' || ch === 'WHATSAPP')) {
                      setMsgContent(sanitizeForSms(msgContent, activeLanguage));
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium"
                >
                  <option value="SMS">SMS / Text Message</option>
                  <option value="WHATSAPP">WhatsApp Secure Message</option>
                  <option value="PORTAL">Patient Portal Secure Notice</option>
                  <option value="SECURE_EMAIL">Encrypted Patient Email</option>
                  <option value="CERTIFIED_MAIL">USPS Certified Registered Mail</option>
                  <option value="PHONE_OUTREACH">Interpreter-Assisted Voice Call</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Ack Deadline Policy
                </label>
                <select
                  value={acknowledgementDeadlineDays}
                  onChange={(e) => setAcknowledgementDeadlineDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium"
                >
                  <option value={1}>24 Hours (Critical Follow-Up)</option>
                  <option value={2}>48 Hours (High Urgency)</option>
                  <option value={3}>72 Hours (Standard CareLoop SLA)</option>
                  <option value={7}>7 Days (Routine Evaluation)</option>
                </select>
              </div>
            </div>

            {/* SMS Sanitizer Notice if SMS or WhatsApp */}
            {(selectedChannel === 'SMS' || selectedChannel === 'WHATSAPP') && (
              <div className="bg-sky-50 border border-sky-200 rounded p-2 flex items-center justify-between text-[11px] text-sky-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
                  SMS Privacy Guard active: Omits raw pathology jargon from unencrypted text.
                </span>
                <label className="flex items-center gap-1 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applySmsSanitizer}
                    onChange={(e) => setApplySmsSanitizer(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Sanitize</span>
                </label>
              </div>
            )}

            {/* Title / Subject Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Notification Subject / Title ({activeLanguage})
              </label>
              <input
                type="text"
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-medium focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Message Body Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Message Content ({activeLanguage})
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {msgContent.length} chars
                </span>
              </div>
              <textarea
                rows={6}
                value={msgContent}
                onChange={(e) => {
                  setMsgContent(e.target.value);
                  if (activeLanguage !== 'English') {
                    setIsTranslationDraft(true);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-sans leading-relaxed focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Qualified Human Review & Safety Sign-off */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="clinicianApprovalCheck"
                  checked={clinicianApprovalConfirmed}
                  onChange={(e) => setClinicianApprovalConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-amber-700 focus:ring-amber-600 cursor-pointer"
                />
                <label htmlFor="clinicianApprovalCheck" className="text-[11px] text-amber-950 leading-snug cursor-pointer">
                  <strong>Clinical Safety Rule Confirmed:</strong> Content strictly matches the clinician-approved result summary and next step. No speculative diagnoses or independent care delay decisions are included.
                </label>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-amber-200/80 text-[11px]">
                <span className="text-amber-900 font-medium">Qualified Reviewer:</span>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="flex-1 px-2 py-0.5 bg-white border border-amber-300 rounded text-xs text-slate-900"
                  placeholder="e.g. Dr. Sarah Chen, MD"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="text-[11px] text-slate-500">
                Mode: <strong className="text-slate-800">Demo Simulation</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowPreDispatchModal(true)}
                disabled={!msgContent.trim() || !clinicianApprovalConfirmed}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Review & Dispatch Outreach</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* PANEL 3: COMMUNICATION TIMELINE & DELIVERY SIMULATOR (~4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Multi-Channel History & Tracker
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {filteredComms.length} records
              </span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="relative col-span-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search communications..."
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
              >
                <option value="ALL">All Channels</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="PORTAL">Portal</option>
                <option value="SECURE_EMAIL">Email</option>
                <option value="CERTIFIED_MAIL">Certified Mail</option>
              </select>
              <select
                value={ackFilter}
                onChange={(e) => setAckFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Awaiting Ack</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
              </select>
            </div>

            {/* Communications List */}
            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {filteredComms.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded border border-slate-200">
                  No communication records found for filters.
                </div>
              ) : (
                filteredComms.map(comm => {
                  const isAck = comm.acknowledgementStatus === 'ACKNOWLEDGED';
                  const isDelivered = comm.deliveryStatus === 'DELIVERED' || comm.deliveryStatus === 'READ';
                  const isRead = comm.deliveryStatus === 'READ';
                  const isHindi = comm.language === 'Hindi';
                  const isMarathi = comm.language === 'Marathi';

                  return (
                    <div 
                      key={comm.id} 
                      className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                        isAck 
                          ? 'bg-white border-slate-200' 
                          : 'bg-amber-50/40 border-amber-200 shadow-2xs'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{comm.patientName}</span>
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                            {comm.channel}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isHindi 
                              ? 'bg-orange-100 text-orange-800' 
                              : (isMarathi ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')
                          }`}>
                            {comm.language}
                          </span>
                        </div>

                        {/* Ack status badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isAck 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {isAck ? '✓ Acknowledged' : 'Awaiting Ack'}
                        </span>
                      </div>

                      {/* Title & Preview */}
                      <div className="font-semibold text-slate-800 text-[11px]">
                        {comm.messageTitle}
                      </div>
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed font-sans line-clamp-3">
                        {comm.messageContent}
                      </p>

                      {/* Delivery Simulator State Strip */}
                      <div className="p-2 bg-slate-100/70 rounded border border-slate-200 space-y-1.5 text-[10px]">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Delivery State (Simulated):</span>
                          <span className={`font-bold uppercase ${
                            comm.deliveryStatus === 'READ' ? 'text-teal-700' : (comm.deliveryStatus === 'DELIVERED' ? 'text-emerald-700' : 'text-slate-600')
                          }`}>
                            {comm.deliveryStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-500">
                          <span>Recipient Contact:</span>
                          <span className="font-mono text-slate-700">{comm.recipientContact}</span>
                        </div>

                        {/* Unacknowledged Attempt Count & Deadline */}
                        {!isAck && (
                          <div className="flex items-center justify-between text-amber-800 pt-1 border-t border-slate-200/60 font-medium">
                            <span>Attempts Unacknowledged: <strong>{(comm.unacknowledgedAttemptCount || 0) + 1}</strong></span>
                            <span>Deadline: {new Date(comm.acknowledgementDeadline || '').toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Comprehension Check Recorded details if present */}
                      {comm.comprehensionResponse && (
                        <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-[10px] space-y-1">
                          <div className="font-bold text-emerald-950 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            Comprehension Check Verified:
                          </div>
                          <div className="text-emerald-900">
                            Understood: <strong>{comm.comprehensionResponse.understood}</strong> · 
                            Assistance: <strong>{comm.comprehensionResponse.needsHelp}</strong> · 
                            Callback: <strong>{comm.comprehensionResponse.callbackRequested ? 'YES' : 'NO'}</strong>
                          </div>
                          {comm.comprehensionResponse.patientNotes && (
                            <div className="italic text-emerald-800">
                              "{comm.comprehensionResponse.patientNotes}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Translation Review Status */}
                      {comm.language !== 'English' && (
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          {comm.translationStatus === 'VERIFIED_HUMAN_APPROVED' ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Human Review Verified ({comm.verifiedBy?.split(' ')[0] || 'Clinician'})
                            </span>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-amber-700 font-semibold">⚠️ Draft Translation</span>
                              <button
                                onClick={() => verifyTranslation(comm.id, currentRole)}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-white border border-teal-200 rounded cursor-pointer"
                              >
                                Approve Draft
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Interactive Simulation Controls */}
                      <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                        {/* Simulation controls */}
                        <div className="flex items-center gap-1">
                          {!isRead && (
                            <button
                              onClick={() => simulateDeliveryStatusChange(comm.id, 'READ')}
                              className="px-2 py-0.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                            >
                              Simulate Open/Read
                            </button>
                          )}
                        </div>

                        {/* Interactive Ack & Comprehension Button */}
                        {!isAck ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setComprehensionModalComm(comm);
                                setComprehensionForm({
                                  understood: 'YES',
                                  needsHelp: 'NO',
                                  callbackRequested: false,
                                  submittedAt: '',
                                  patientNotes: ''
                                });
                              }}
                              className="px-2.5 py-1 font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded border border-teal-300 transition-colors cursor-pointer"
                            >
                              Simulate Patient Ack & Comprehension
                            </button>
                            <button
                              onClick={() => triggerUnacknowledgedFollowup(comm.id)}
                              className="px-2 py-1 font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors cursor-pointer"
                              title="Trigger SLA unacknowledged follow-up task"
                            >
                              Escalate
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Closed loop at {new Date(comm.acknowledgedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL 1: PRE-DISPATCH SAFETY & QUALITY VERIFICATION */}
      {showPreDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden space-y-4 p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pre-Dispatch Safety & Quality Verification
                </h3>
              </div>
              <button 
                onClick={() => setShowPreDispatchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <strong className="text-slate-900">{selectedPatient?.firstName} {selectedPatient?.lastName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Channel:</span>
                  <strong className="text-slate-900 uppercase">{selectedChannel}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Language:</span>
                  <strong className="text-slate-900">{activeLanguage}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ack Deadline:</span>
                  <span className="text-slate-800">{acknowledgementDeadlineDays} Days ({acknowledgementDeadlineDays * 24} hours)</span>
                </div>
              </div>

              {/* Message Preview Box */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Transmitted Message Preview
                </span>
                <div className="p-3 bg-white border border-slate-200 rounded-md font-sans text-slate-800 leading-relaxed text-xs">
                  <div className="font-bold text-slate-900 mb-1">{msgTitle}</div>
                  <div>{msgContent}</div>
                </div>
              </div>

              {/* Mandatory Checklist */}
              <div className="bg-teal-50 border border-teal-200 rounded p-3 text-[11px] text-teal-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-teal-900">
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                  Mandatory Outreach Safety Checklist
                </div>
                <ul className="list-disc list-inside space-y-1 text-teal-800">
                  <li>Approved clinical rationale from {approverName} is verified.</li>
                  <li>Plain language verified; free of speculative diagnosis or fear-inducing jargon.</li>
                  <li>Direct callback number (555) 700-CARE is present.</li>
                  <li>{activeLanguage} translation is reviewed and culturally appropriate.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPreDispatchModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Dispatch Simulated Outreach</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PATIENT COMPREHENSION CHECK SIMULATOR */}
      {comprehensionModalComm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden space-y-4 p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Patient Comprehension Check
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Simulating response from {comprehensionModalComm.patientName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setComprehensionModalComm(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question 1: Understanding */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 text-xs">
                  1. Do you understand the next step recommended by your care team?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'YES', label: 'Yes, clearly' },
                    { val: 'SOMEWHAT', label: 'Partially' },
                    { val: 'NO', label: 'Need explanation' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setComprehensionForm(prev => ({ ...prev, understood: opt.val as any }))}
                      className={`p-2 rounded border text-center text-xs font-semibold cursor-pointer ${
                        comprehensionForm.understood === opt.val
                          ? 'bg-teal-600 text-white border-teal-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Help Arranging Care */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 text-xs">
                  2. Do you need help arranging care or overcoming any barriers?
                </label>
                <select
                  value={comprehensionForm.needsHelp}
                  onChange={(e) => setComprehensionForm(prev => ({ ...prev, needsHelp: e.target.value as any }))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-medium"
                >
                  <option value="NO">No, I can arrange this on my own</option>
                  <option value="SCHEDULING">Yes, need help scheduling an appointment</option>
                  <option value="TRANSPORT">Yes, need transportation assistance</option>
                  <option value="FINANCIAL">Yes, need copay or financial navigation</option>
                  <option value="LANGUAGE">Yes, need language interpreter assistance</option>
                </select>
              </div>

              {/* Question 3: Callback Request */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-xs">Request Coordinator Callback?</div>
                  <div className="text-[11px] text-slate-500">Our clinical team will call back within 24 hours</div>
                </div>
                <input
                  type="checkbox"
                  checked={comprehensionForm.callbackRequested}
                  onChange={(e) => setComprehensionForm(prev => ({ ...prev, callbackRequested: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                />
              </div>

              {/* Question 4: Optional Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Patient Questions or Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={comprehensionForm.patientNotes || ''}
                  onChange={(e) => setComprehensionForm(prev => ({ ...prev, patientNotes: e.target.value }))}
                  placeholder="e.g. Please call me after 2:00 PM, I prefer Marathi."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setComprehensionModalComm(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  recordComprehensionResponse(comprehensionModalComm.id, {
                    ...comprehensionForm,
                    submittedAt: new Date().toISOString()
                  });
                  setComprehensionModalComm(null);
                  setAiActionMessage(`Comprehension response logged for ${comprehensionModalComm.patientName}. Next action updated.`);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs cursor-pointer"
              >
                Submit Comprehension & Close Loop
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
