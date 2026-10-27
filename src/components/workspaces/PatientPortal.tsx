import React, { useState } from 'react';
import { 
  HeartHandshake, 
  CheckCircle2, 
  Calendar, 
  Phone, 
  HelpCircle, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Send, 
  AlertCircle,
  Building,
  User,
  ChevronDown,
  Sparkles,
  Languages,
  Check,
  PhoneCall
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { Patient, ComprehensionCheckResponse } from '../../types/careloop';
import { SupportedLanguage } from '../../utils/communicationTemplates';

export const PatientPortal: React.FC = () => {
  const { 
    cases, 
    patients, 
    communications,
    currentPatientId, 
    setCurrentPatientId, 
    recordPatientAcknowledgement, 
    recordComprehensionResponse,
    submitPatientQuestion, 
    updatePatientPreferences 
  } = useCareLoop();

  const currentPatient = patients.find(p => p.id === currentPatientId) || patients[0];

  // Language selection for patient portal
  const [portalLanguage, setPortalLanguage] = useState<SupportedLanguage>(
    currentPatient.preferredLanguage === 'Hindi' ? 'Hindi' : (currentPatient.preferredLanguage === 'Marathi' ? 'Marathi' : 'English')
  );

  const [questionText, setQuestionText] = useState('');
  const [requestCallback, setRequestCallback] = useState(true);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);

  // Comprehension questionnaire state
  const [comprehensionAnswers, setComprehensionAnswers] = useState<Record<string, ComprehensionCheckResponse>>({});
  const [submittedCheckNotice, setSubmittedCheckNotice] = useState<string | null>(null);

  // Preference editing
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [preferredContact, setPreferredContact] = useState<any>(currentPatient?.safeContactPreference || 'portal');
  const [contactPhone, setContactPhone] = useState(currentPatient?.phone || '(555) 0142');
  const [contactEmail, setContactEmail] = useState(currentPatient?.email || 'patient@email.example');

  // Filter cases strictly for this synthetic patient
  // CLINICAL PRIVACY RULE: Never expose other patients' data or unapproved internal clinician notes
  const patientCases = cases.filter(c => c.patientId === currentPatient.id);
  const patientComms = communications.filter(c => c.patientId === currentPatient.id);

  // Clinician approved check: only show results that have been verified by a clinician
  const approvedCases = patientCases.filter(c => c.evidenceChecklist.clinicianReviewCompleted);
  const unapprovedCount = patientCases.length - approvedCases.length;

  const handleAcknowledge = (caseId: string) => {
    recordPatientAcknowledgement(caseId, undefined, 'Patient Portal One-Click Confirmation', 'Patient confirmed receipt and understanding of follow-up care plan.');
  };

  const handleComprehensionSubmit = (commId: string, caseId: string) => {
    const existing = comprehensionAnswers[commId] || {
      understood: 'YES',
      needsHelp: 'NO',
      callbackRequested: false,
      submittedAt: new Date().toISOString(),
      patientNotes: ''
    };

    recordComprehensionResponse(commId, {
      ...existing,
      submittedAt: new Date().toISOString()
    });

    setSubmittedCheckNotice('Thank you! Your acknowledgement and care preferences have been transmitted to your care team.');
    setTimeout(() => setSubmittedCheckNotice(null), 6000);
  };

  const handleSubmitQuestion = (e: React.FormEvent, caseId: string) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    submitPatientQuestion(caseId, questionText.trim(), requestCallback);
    setQuestionSubmitted(true);
    setQuestionText('');
    setTimeout(() => setQuestionSubmitted(false), 5000);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatientPreferences(currentPatient.id, preferredContact, contactPhone, contactEmail);
    setIsEditingPreferences(false);
  };

  // Translations for Portal labels
  const uiText = {
    English: {
      portalTitle: 'Patient Care Portal',
      subtitle: 'MetroHealth System · Coordinated Care & Screening Follow-Up',
      careTeamNotice: 'Primary Care Team: Dr. Sarah Chen, MD & Maria Ramos, RN',
      screeningFollowUp: 'Follow-Up Notice',
      whatResultMeans: 'What Your Test Result Means',
      recommendedSteps: 'Recommended Next Steps & Appointments',
      haveQuestions: 'Have Questions? Message Your Care Team',
      confirmRead: 'Confirm I Have Read This Notice',
      receiptAcknowledged: 'Receipt Acknowledged',
      comprehensionTitle: 'Quick Understanding Check',
      q1: 'Do you understand the next step recommended by your doctor?',
      q2: 'Do you need help arranging care, scheduling, or transportation?',
      q3: 'Would you like our nurse coordinator to call you back?',
      submitCheck: 'Submit Acknowledgement',
      callbackOption: 'Please have a nurse call me back by phone within 24 hours',
      sendMsg: 'Send Message'
    },
    Hindi: {
      portalTitle: 'मरीज स्वास्थ्य एवं देखभाल पोर्टल',
      subtitle: 'केयरलूप हेल्थ · समन्वित जांच एवं फॉलो-अप पोर्टल',
      careTeamNotice: 'आपकी स्वास्थ्य टीम: डॉ. सारा चेन एवं मारिया रामोस (केयर समन्वयक)',
      screeningFollowUp: 'स्क्रीनिंग फॉलो-अप सूचना',
      whatResultMeans: 'आपकी जांच रिपोर्ट का क्या अर्थ है',
      recommendedSteps: 'डॉक्टर द्वारा सुझाए गए अगले कदम एवं अपॉइंटमेंट',
      haveQuestions: 'कोई प्रश्न है? अपनी केयर टीम को संदेश भेजें',
      confirmRead: 'मैंने यह सूचना पढ़ ली है और पुष्टि करता/करती हूँ',
      receiptAcknowledged: 'सूचना प्राप्ति की पुष्टि हो चुकी है',
      comprehensionTitle: 'सूचना समझ एवं सहायता जांच',
      q1: 'क्या आप डॉक्टर द्वारा सुझाए गए अगले कदम को अच्छी तरह समझ गए हैं?',
      q2: 'क्या आपको अपॉइंटमेंट तय करने या आने-जाने में कोई सहायता चाहिए?',
      q3: 'क्या आप चाहते हैं कि हमारी नर्स आपको फोन पर कॉल करे?',
      submitCheck: 'पुष्टि एवं पोच दर्ज करें',
      callbackOption: 'कृपया २४ घंटे के भीतर मुझे फोन पर कॉल करें',
      sendMsg: 'संदेश भेजें'
    },
    Marathi: {
      portalTitle: 'रुग्ण आरोग्य व काळजी पोर्टल',
      subtitle: 'केअरलूप हेल्थ · एकात्मिक तपासणी व पाठपुरावा सेवा',
      careTeamNotice: 'आपले वैद्यकीय पथक: डॉ. सारा चेन व मारिया रामोस (समन्वयक)',
      screeningFollowUp: 'तपासणी पाठपुरावा सूचना',
      whatResultMeans: 'आपल्या चाचणी अहवालाचा अर्थ',
      recommendedSteps: 'डॉक्टरांनी सुचवलेली पुढील पावले व नियोजित भेटी',
      haveQuestions: 'काही शंका आहे? आपल्या आरोग्य पथकाला संदेश पाठवा',
      confirmRead: 'मी ही सूचना वाचली असून याची पुष्टी करत आहे',
      receiptAcknowledged: 'पोच पावती नोंदवली गेली आहे',
      comprehensionTitle: 'माहिती समज व सहाय्य पडताळणी',
      q1: 'डॉक्टरांनी सुचवलेले पुढील पाऊल आपण नीट समजून घेतले आहे का?',
      q2: 'आपल्याला वेळ ठरवण्यासाठी किंवा प्रवासासाठी काही मदत हवी आहे का?',
      q3: 'आमच्या परिचारिका समन्वयकाने आपल्याला फोन करावा असे वाटते का?',
      submitCheck: 'पुष्टी पाठवा',
      callbackOption: 'कृपया २४ तासांत मला फोन करून मार्गदर्शन करावे',
      sendMsg: 'संदेश पाठवा'
    }
  }[portalLanguage];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Patient Portal Header */}
      <div className="bg-white border border-teal-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {uiText.portalTitle}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Secure Verified View
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {uiText.subtitle}
              </p>
            </div>
          </div>

          {/* Controls: Portal Language & Patient Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Language Switcher */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex items-center gap-1 text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-500 ml-1" />
              {(['English', 'Hindi', 'Marathi'] as SupportedLanguage[]).map(l => (
                <button
                  key={l}
                  onClick={() => setPortalLanguage(l)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    portalLanguage === l
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {l === 'English' ? 'EN' : (l === 'Hindi' ? 'हिन्दी' : 'मराठी')}
                </button>
              ))}
            </div>

            {/* Patient Switcher */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Simulated Patient</div>
                <select
                  value={currentPatient.id}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setCurrentPatientId(newId);
                    const p = patients.find(pt => pt.id === newId);
                    if (p?.preferredLanguage === 'Hindi') setPortalLanguage('Hindi');
                    else if (p?.preferredLanguage === 'Marathi') setPortalLanguage('Marathi');
                    else setPortalLanguage('English');
                  }}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.preferredLanguage})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Assurance Notice */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span>{uiText.careTeamNotice}</span>
          </div>
          <div>
            Preferred Contact Mode: <strong className="text-slate-700 uppercase">{currentPatient.safeContactPreference}</strong>
          </div>
        </div>

        {submittedCheckNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{submittedCheckNotice}</span>
          </div>
        )}
      </div>

      {/* Unapproved Results Notice (if any) */}
      {unapprovedCount > 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <strong className="font-semibold block">Screening Results Under Clinical Review</strong>
            We have received your recent diagnostic report. Your primary care clinician is carefully reviewing the findings to prepare your personalized next steps. Approved guidance will appear here shortly.
          </div>
        </div>
      )}

      {/* Main Approved Screening Follow-Ups */}
      {approvedCases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">No Actionable Follow-Up Required</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            You currently have no pending follow-up tests or abnormal screening notices requiring action. Contact your clinic if you have questions.
          </p>
        </div>
      ) : (
        approvedCases.map(c => {
          const isAcknowledged = c.evidenceChecklist.patientAcknowledged;
          const hasAppointment = !!c.appointmentDetail?.scheduledDate;
          const associatedComm = patientComms.find(cm => cm.caseId === c.id);
          const commId = associatedComm?.id || `COMM-${c.id}`;
          const currentAnswer = comprehensionAnswers[commId] || associatedComm?.comprehensionResponse || {
            understood: 'YES',
            needsHelp: 'NO',
            callbackRequested: false,
            submittedAt: '',
            patientNotes: ''
          };

          return (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      {uiText.screeningFollowUp}
                    </span>
                    <span className="text-xs text-slate-400">Ref #{c.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {c.testName} Follow-Up Plan
                  </h2>
                </div>

                <div>
                  {isAcknowledged ? (
                    <span className="px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {uiText.receiptAcknowledged}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(c.id)}
                      className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{uiText.confirmRead}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-6">
                {/* Clear Explanation */}
                <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-700" />
                    {uiText.whatResultMeans}
                  </h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    Your recent screening test showed a finding that requires follow-up care with our clinical team.
                    Finding summary: <strong className="text-slate-900">{c.findingsSummary}</strong>.
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    Clinician recommendation: <strong className="text-slate-900">{c.nextAction}</strong>.
                  </p>
                </div>

                {/* Comprehension Check (Feature 7) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-teal-600" />
                      {uiText.comprehensionTitle}
                    </h3>
                    {isAcknowledged && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        ✓ Response Documented
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Q1 */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800">
                        {uiText.q1}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 'YES', label: portalLanguage === 'Hindi' ? 'हाँ, पूरी तरह' : (portalLanguage === 'Marathi' ? 'होय, समजले' : 'Yes, clearly') },
                          { val: 'SOMEWHAT', label: portalLanguage === 'Hindi' ? 'कुछ हद तक' : (portalLanguage === 'Marathi' ? 'काही प्रमाणात' : 'Somewhat') },
                          { val: 'NO', label: portalLanguage === 'Hindi' ? 'नहीं, समझाएं' : (portalLanguage === 'Marathi' ? 'नाही, समजावून सांगा' : 'Need more help') }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setComprehensionAnswers(prev => ({
                              ...prev,
                              [commId]: { ...currentAnswer, understood: opt.val as any }
                            }))}
                            className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                              currentAnswer.understood === opt.val
                                ? 'bg-teal-600 text-white border-teal-700'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q2 */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800">
                        {uiText.q2}
                      </label>
                      <select
                        value={currentAnswer.needsHelp}
                        onChange={(e) => setComprehensionAnswers(prev => ({
                          ...prev,
                          [commId]: { ...currentAnswer, needsHelp: e.target.value as any }
                        }))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                      >
                        <option value="NO">No extra help needed</option>
                        <option value="SCHEDULING">Need help booking appointment slot</option>
                        <option value="TRANSPORT">Need transportation assistance</option>
                        <option value="FINANCIAL">Need insurance / copay navigation</option>
                        <option value="LANGUAGE">Need language interpreter assistance</option>
                      </select>
                    </div>

                    {/* Q3 */}
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="font-semibold text-slate-800">
                        {uiText.q3}
                      </span>
                      <input
                        type="checkbox"
                        checked={currentAnswer.callbackRequested}
                        onChange={(e) => setComprehensionAnswers(prev => ({
                          ...prev,
                          [commId]: { ...currentAnswer, callbackRequested: e.target.checked }
                        }))}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleComprehensionSubmit(commId, c.id)}
                        className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        {uiText.submitCheck}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Next Steps & Appointments */}
                <div className="border border-slate-200 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    {uiText.recommendedSteps}
                  </h3>

                  {hasAppointment ? (
                    <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Confirmed Appointment</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-100 text-teal-800 rounded">
                          {c.appointmentDetail?.status}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {new Date(c.appointmentDetail!.scheduledDate!).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })} at {new Date(c.appointmentDetail!.scheduledDate!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.appointmentDetail?.facility}</span>
                      </div>
                      {c.appointmentDetail?.notes && (
                        <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 mt-2">
                          <strong className="text-slate-900 block mb-0.5">Preparation Instructions:</strong>
                          {c.appointmentDetail.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                      <div className="font-semibold">Specialist Consultation In Progress</div>
                      <p>
                        Our care coordinator Maria Ramos, RN is coordinating with the specialty clinic to schedule your slot.
                        You will receive a phone call or text notification once a date is reserved.
                      </p>
                    </div>
                  )}
                </div>

                {/* Patient Inquiry / Questions Form */}
                <div className="border border-slate-200 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-slate-600" />
                    {uiText.haveQuestions}
                  </h3>

                  <form onSubmit={(e) => handleSubmitQuestion(e, c.id)} className="space-y-3 mt-3">
                    <textarea
                      required
                      rows={2}
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Type your question or concerns here..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={requestCallback}
                          onChange={(e) => setRequestCallback(e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300"
                        />
                        <span>{uiText.callbackOption}</span>
                      </label>

                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{uiText.sendMsg}</span>
                      </button>
                    </div>

                    {questionSubmitted && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Thank you! Your inquiry has been transmitted to your Care Coordinator Maria Ramos, RN.</span>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Communication Preferences and Contact Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Preferences Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              Communication Preferences
            </h3>
            {!isEditingPreferences && (
              <button
                onClick={() => setIsEditingPreferences(true)}
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingPreferences ? (
            <form onSubmit={handleSavePreferences} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Channel</label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="portal">Secure Patient Portal</option>
                  <option value="sms">SMS Text Message</option>
                  <option value="phone_call">Telephone Call</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPreferences(false)}
                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Contact Method:</span>
                <strong className="text-slate-800 uppercase">{currentPatient.safeContactPreference}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phone:</span>
                <strong className="text-slate-800">{currentPatient.phone}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Email:</span>
                <strong className="text-slate-800">{currentPatient.email}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Clinic Direct Contact Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Phone className="w-4 h-4 text-teal-600" />
            Contact Your Healthcare Team
          </h3>
          <div className="text-xs text-slate-600 space-y-2">
            <div>
              <span className="text-slate-500 block">Ambulatory Care Coordination Hub:</span>
              <strong className="text-slate-900 text-sm">(555) 700-CARE</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Hours of Operation:</span>
              <span className="text-slate-800">Monday – Friday: 8:00 AM – 5:00 PM</span>
            </div>
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
              For acute medical emergencies, please dial <strong>911</strong> or proceed to the nearest emergency department.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
