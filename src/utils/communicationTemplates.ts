/**
 * Patient Communication Center Templates & Multi-Language Translation Engine
 * Supports English, Hindi (हिंदी), and Marathi (मराठी)
 * Adheres to Clinical Safety Guardrails & Cultural Accessibility Standards
 */

import { ScreeningCase, Patient, Communication } from '../types/careloop';

export type SupportedLanguage = 'English' | 'Hindi' | 'Marathi';

export interface MessageTemplate {
  id: string;
  category: 
    | 'SCREENING_READY'
    | 'APPOINTMENT_REMINDER'
    | 'ACK_REQUEST'
    | 'MISSED_APPOINTMENT'
    | 'REFERRAL_INSTRUCTIONS'
    | 'CONTACT_CARE_TEAM'
    | 'UNSUCCESSFUL_CONTACT';
  name: string;
  description: string;
  recommendedChannel: 'SMS' | 'WHATSAPP' | 'PORTAL' | 'SECURE_EMAIL' | 'CERTIFIED_MAIL' | 'PHONE_OUTREACH';
  requiresClinicianApproval: boolean;
  content: Record<SupportedLanguage, { title: string; body: string }>;
}

export const COMMUNICATION_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl-screening-ready',
    category: 'SCREENING_READY',
    name: 'Screening Result Ready for Clinician Discussion',
    description: 'Notification to patient that their screening result is available and ready for review with their clinician.',
    recommendedChannel: 'PORTAL',
    requiresClinicianApproval: true,
    content: {
      English: {
        title: 'Your Screening Result is Ready for Review — CareLoop Clinic',
        body: 'Dear {patient_name}, your recent {test_name} has been reviewed by your care team. Dr. {clinician_name} has prepared an approved follow-up plan for your care. Please view your secure patient portal or call our clinic at {clinic_phone} so we can discuss the recommended next step: {action_needed}. Please reply or click below to acknowledge that you received this message.'
      },
      Hindi: {
        title: 'आपकी स्क्रीनिंग जांच रिपोर्ट समीक्षा के लिए तैयार है — केयरलूप क्लिनिक',
        body: 'नमस्ते {patient_name} जी, आपकी हालिया {test_name} जांच की रिपोर्ट डॉक्टर {clinician_name} और आपकी स्वास्थ्य टीम द्वारा देख ली गई है। आपकी आगे की देखभाल के लिए एक सुरक्षित योजना तैयार की गई है: {action_needed}। कृपया अपने मरीज पोर्टल में विवरण देखें या हमें {clinic_phone} पर कॉल करें ताकि हम आपके सवालों के जवाब दे सकें। कृपया यह संदेश मिलने की पुष्टि करें।'
      },
      Marathi: {
        title: 'तुमचा तपासणी अहवाल डॉक्टरांच्या चर्चेसाठी तयार आहे — केअरलूप क्लिनिक',
        body: 'नमस्कार {patient_name} जी, आपल्या अलीकडील {test_name} तपासणीचा अहवाल डॉ. {clinician_name} आणि वैद्यकीय पथकाने तपासला आहे. आपल्या आरोग्याची काळजी घेण्यासाठी पुढील आवश्यक पाऊल ठरवले आहे: {action_needed}. कृपया आपले सुरक्षित रुग्ण पोर्टल तपासा किंवा पुढील माहितीसाठी आमच्याशी {clinic_phone} वर संपर्क साधा. आपल्याला हा संदेश मिळाला असल्याची कृपया पोच द्या.'
      }
    }
  },
  {
    id: 'tmpl-appt-reminder',
    category: 'APPOINTMENT_REMINDER',
    name: 'Follow-Up Appointment Reminder',
    description: 'Reminder for an upcoming follow-up or diagnostic evaluation appointment.',
    recommendedChannel: 'SMS',
    requiresClinicianApproval: false,
    content: {
      English: {
        title: 'Reminder: Upcoming Follow-Up Appointment — CareLoop',
        body: 'Hello {patient_name}, this is a friendly reminder of your upcoming follow-up visit for {test_name} scheduled on {appointment_date} at {facility_name}. Arrive 15 minutes early and bring your photo ID. Need directions, transportation assistance, or need to reschedule? Please call {clinic_phone} or confirm by replying YES.'
      },
      Hindi: {
        title: 'स्मरणपत्र: आपकी आगामी फॉलो-अप अपॉइंटमेंट — केयरलूप',
        body: 'नमस्ते {patient_name} जी, यह आपकी आगामी {test_name} फॉलो-अप जांच की याद दिलाने के लिए है, जो {appointment_date} को {facility_name} में निर्धारित है। कृपया समय से 15 मिनट पहले पहुंचें। यदि आपको आने-जाने में मदद चाहिए या समय बदलना हो, तो कृपया हमें {clinic_phone} पर कॉल करें अथवा संदेश का उत्तर देकर पुष्टि करें।'
      },
      Marathi: {
        title: 'स्मरणपत्र: तुमची आगामी फॉलो-अप अपॉइंटमेंट — केअरलूप',
        body: 'नमस्कार {patient_name} जी, {facility_name} येथे {appointment_date} रोजी आपल्या {test_name} साठी नियोजित भेटीचे हे स्मरणपत्र आहे. कृपया १५ मिनिटे आधी पोहोचा. आपल्याला वाहतुकीची मदत हवी असल्यास किंवा तारीख बदलायची असल्यास त्वरित {clinic_phone} वर कॉल करा किंवा होय (YES) पाठवून पुष्टी करा.'
      }
    }
  },
  {
    id: 'tmpl-ack-request',
    category: 'ACK_REQUEST',
    name: 'Patient Acknowledgement Request',
    description: 'Direct request for the patient to confirm receipt and understanding of care guidance.',
    recommendedChannel: 'WHATSAPP',
    requiresClinicianApproval: true,
    content: {
      English: {
        title: 'Action Required: Please Confirm Receipt of Care Notice',
        body: 'Dear {patient_name}, closing the loop on your health screening is very important to us. Dr. {clinician_name} requested that we confirm you received information regarding your {test_name}. Please reply "RECEIVED" to this message or tap the link to confirm in your portal. If you have any questions or want us to call you, please let us know at {clinic_phone}.'
      },
      Hindi: {
        title: 'आवश्यक सूचना: कृपया स्वास्थ्य संदेश प्राप्ति की पुष्टि करें',
        body: 'नमस्ते {patient_name} जी, आपके स्वास्थ्य की सुरक्षा हमारी सर्वोच्च प्राथमिकता है। डॉक्टर {clinician_name} ने अनुरोध किया है कि आपकी {test_name} जांच से जुड़ी जानकारी मिलने की पुष्टि प्राप्त की जाए। कृपया इस संदेश का उत्तर "प्राप्त हुआ" लिखकर दें या हमें {clinic_phone} पर सूचित करें। यदि आपको कोई प्रश्न पूछना हो, तो बेझिझक संपर्क करें।'
      },
      Marathi: {
        title: 'महत्त्वाची सूचना: कृपया आरोग्य संदेश मिळाल्याची पोच द्या',
        body: 'नमस्कार {patient_name} जी, आपल्या आरोग्याची पूर्ण काळजी घेणे ही आमची जबाबदारी आहे. डॉ. {clinician_name} यांनी आपल्या {test_name} बाबत पाठवलेली माहिती आपल्याला मिळाल्याची खात्री करण्याचे सुचवले आहे. कृपया "पोच मिळाली" असे उत्तर पाठवा किंवा पोर्टलवर पुष्टी करा. काही शंका असल्यास {clinic_phone} वर निःसंकोच संपर्क साधा.'
      }
    }
  },
  {
    id: 'tmpl-missed-appt',
    category: 'MISSED_APPOINTMENT',
    name: 'Missed Appointment Follow-Up',
    description: 'Supportive follow-up when a scheduled screening follow-up appointment was not attended.',
    recommendedChannel: 'PHONE_OUTREACH',
    requiresClinicianApproval: true,
    content: {
      English: {
        title: 'We Missed You Today — Let Us Help Reschedule Your Care',
        body: 'Hello {patient_name}, we noticed you were unable to attend your appointment today for your {test_name} follow-up. We care about your health and want to ensure you get the care you need. Please contact us at {clinic_phone} as soon as possible so we can help reschedule at a convenient time and answer any concerns you may have.'
      },
      Hindi: {
        title: 'हम आज आपकी सहायता के लिए उपस्थित थे — कृपया नई तारीख चुनें',
        body: 'नमस्ते {patient_name} जी, हमने देखा कि आप आज अपनी {test_name} फॉलो-अप जांच के लिए नहीं आ सके। हम आपके स्वास्थ्य के प्रति पूरी तरह प्रतिबद्ध हैं। कृपया जल्द से जल्द हमें {clinic_phone} पर कॉल करें ताकि हम आपके लिए सुविधाजनक नया समय तय कर सकें और किसी भी परेशानी में आपकी सहायता कर सकें।'
      },
      Marathi: {
        title: 'आज आपली भेट होऊ शकली नाही — कृपया नवीन वेळ ठरवा',
        body: 'नमस्कार {patient_name} जी, आज आपण {test_name} च्या नियोजित भेटीसाठी येऊ शकला नाहीत हे आमच्या निदर्शनास आले. आपले आरोग्य आमच्यासाठी अत्यंत महत्त्वाचे आहे. कृपया लवकरात लवकर {clinic_phone} वर संपर्क साधा जेणेकरून आम्ही आपल्या सोयीनुसार नवीन वेळ निश्चित करू शकू.'
      }
    }
  },
  {
    id: 'tmpl-referral-instructions',
    category: 'REFERRAL_INSTRUCTIONS',
    name: 'Referral Appointment Instructions',
    description: 'Clear step-by-step guidance on consulting a specialist provider.',
    recommendedChannel: 'SECURE_EMAIL',
    requiresClinicianApproval: true,
    content: {
      English: {
        title: 'Next Steps: Specialist Consultation Instructions — CareLoop',
        body: 'Dear {patient_name}, Dr. {clinician_name} has arranged a consultation with {facility_name} for your {test_name} follow-up ({action_needed}). The specialist team is expecting you. Please bring any current medications and your insurance card. If you need assistance with scheduling, transportation, or language interpretation, call our care coordination team at {clinic_phone}.'
      },
      Hindi: {
        title: 'अगले कदम: विशेषज्ञ डॉक्टर परामर्श निर्देश — केयरलूप',
        body: 'नमस्ते {patient_name} जी, डॉक्टर {clinician_name} ने आपकी {test_name} के संदर्भ में {facility_name} के विशेषज्ञ डॉक्टरों के साथ परामर्श की व्यवस्था की है ({action_needed})। कृपया अपनी वर्तमान दवाइयाँ और पहचान पत्र साथ रखें। यदि आपको समय तय करने, आने-जाने या भाषा अनुवादक की आवश्यकता हो, तो केयरलूप समन्वय टीम को {clinic_phone} पर कॉल करें।'
      },
      Marathi: {
        title: 'पुढील पायऱ्या: तज्ज्ञ डॉक्टरांच्या सल्लामसलतीसाठी सूचना — केअरलूप',
        body: 'नमस्कार {patient_name} जी, डॉ. {clinician_name} यांनी आपल्या {test_name} तपासणीच्या पुढील प्रक्रियेसाठी ({action_needed}) {facility_name} येथे तज्ज्ञांची भेट नियोजित केली आहे. कृपया आपली औषधांची यादी सोबत ठेवा. वेळ निश्चित करणे, प्रवास किंवा दुभाषी मदतीसाठी आमच्या समन्वय कक्षाशी {clinic_phone} वर संपर्क साधा.'
      }
    }
  },
  {
    id: 'tmpl-contact-care-team',
    category: 'CONTACT_CARE_TEAM',
    name: 'Request for Patient to Contact Care Team',
    description: 'Compassionate outreach urging patient to speak with their clinician regarding next steps.',
    recommendedChannel: 'SMS',
    requiresClinicianApproval: true,
    content: {
      English: {
        title: 'Please Contact Your Care Team — CareLoop Health',
        body: 'Dear {patient_name}, your CareLoop healthcare team would like to speak with you regarding the next steps for your recent health screening. This is an important part of your ongoing care. Please call our dedicated line at {clinic_phone} Monday through Friday between 8:00 AM and 5:00 PM. We are here to support you.'
      },
      Hindi: {
        title: 'कृपया अपनी केयर टीम से संपर्क करें — केयरलूप हेल्थ',
        body: 'नमस्ते {patient_name} जी, आपकी केयरलूप स्वास्थ्य टीम आपकी हालिया स्वास्थ्य जांच के अगले चरणों पर आपसे बात करना चाहती है। यह आपके स्वास्थ्य की निरंतर देखभाल का आवश्यक हिस्सा है। कृपया हमारे क्लिनिक नंबर {clinic_phone} पर सोमवार से शुक्रवार, सुबह ८:०० से शाम ५:०० के बीच संपर्क करें। हम आपकी सहायता के लिए तैयार हैं।'
      },
      Marathi: {
        title: 'कृपया आपल्या आरोग्य पथकाशी संपर्क साधा — केअरलूप हेल्थ',
        body: 'नमस्कार {patient_name} जी, आपल्या अलीकडील आरोग्य तपासणीच्या पुढील नियोजनाबाबत आपल्याशी चर्चा करण्याचे आपल्या केअरलूप पथकाने ठरवले आहे. हे आपल्या आरोग्यासाठी गरजेचे आहे. कृपया सोमवार ते शुक्रवार दरम्यान सकाळी ८ ते संध्याकाळी ५ या वेळेत {clinic_phone} वर कॉल करा. आम्ही आपल्या सेवेत आहोत.'
      }
    }
  },
  {
    id: 'tmpl-unsuccessful-contact',
    category: 'UNSUCCESSFUL_CONTACT',
    name: 'Administrative Follow-Up After Unsuccessful Contact',
    description: 'Documented formal notification when prior communication attempts remained unanswered.',
    recommendedChannel: 'CERTIFIED_MAIL',
    requiresClinicianApproval: true,
    content: {
      English: {
        title: 'Formal Care Notice: Follow-Up Action Required for Screening',
        body: 'Dear {patient_name}, our care coordination team has attempted to reach you several times regarding important follow-up for your {test_name}. To ensure you receive timely care and avoid delays, please contact our clinic at {clinic_phone} immediately or log into your patient portal. If you have already arranged this care elsewhere, please inform us so we can update your medical record.'
      },
      Hindi: {
        title: 'औपचारिक स्वास्थ्य सूचना: स्क्रीनिंग के लिए आवश्यक फॉलो-अप — केयरलूप',
        body: 'नमस्ते {patient_name} जी, हमारी देखभाल समन्वय टीम ने आपकी {test_name} के फॉलो-अप के संदर्भ में आपसे पूर्व में संपर्क करने का प्रयास किया था। आपके स्वास्थ्य में किसी भी विलंब से बचने के लिए, कृपया तुरंत {clinic_phone} पर कॉल करें या अपने पेशेंट पोर्टल में लॉग इन करें। यदि आपने अन्यत्र यह देखभाल प्राप्त कर ली है, तो कृपया हमें अवश्य सूचित करें ताकि आपका रिकॉर्ड अद्यतन किया जा सके।'
      },
      Marathi: {
        title: 'अधिकृत आरोग्य सूचना: तपासणीनंतर आवश्यक पाठपुरावा — केअरलूप',
        body: 'नमस्कार {patient_name} जी, आपल्या {test_name} तपासणीच्या महत्त्वाच्या पाठपुराव्यासाठी आमच्या समन्वय पथकाने यापूर्वी आपल्याशी संपर्क साधण्याचा प्रयत्न केला होता. उपचारांमध्ये कोणताही विलंब होऊ नये म्हणून कृपया त्वरित {clinic_phone} वर कॉल करा किंवा आपल्या रुग्ण पोर्टलवर लॉग इन करा. आपण इतरत्र सल्ला घेतला असल्यास कृपया तसे आम्हाला कळवा जेणेकरून नोंदी अद्ययावत करता येतील.'
      }
    }
  }
];

/**
 * Replace placeholders in template text safely using structured case information
 */
export function populateTemplateText(
  rawText: string,
  patient: Patient,
  screeningCase: ScreeningCase,
  extra?: { appointmentDate?: string; facilityName?: string; clinicPhone?: string }
): string {
  const clinicPhone = extra?.clinicPhone || '(555) 700-CARE';
  const appointmentDate = extra?.appointmentDate || screeningCase.appointmentDetail?.scheduledDate || 'upcoming scheduled date';
  const facilityName = extra?.facilityName || screeningCase.appointmentDetail?.facility || screeningCase.performingFacility || 'CareLoop Diagnostic Center';
  const clinicianName = screeningCase.orderingPhysician || patient.primaryClinician || 'Dr. Sarah Chen, MD';

  return rawText
    .replace(/{patient_name}/g, `${patient.firstName} ${patient.lastName}`)
    .replace(/{clinician_name}/g, clinicianName.replace(/^Dr\.\s*/, ''))
    .replace(/{test_name}/g, screeningCase.testName)
    .replace(/{action_needed}/g, screeningCase.nextAction || 'Clinician-guided evaluation')
    .replace(/{clinic_phone}/g, clinicPhone)
    .replace(/{appointment_date}/g, appointmentDate)
    .replace(/{facility_name}/g, facilityName);
}

/**
 * SMS Sanitizer to prevent leaking unnecessary sensitive health details in plain SMS/WhatsApp
 */
export function sanitizeForSms(text: string, language: SupportedLanguage): string {
  if (language === 'Hindi') {
    return text
      .replace(/बायोप्सी|कार्सिनोमा|कैंसर|सस्पिशियस/gi, 'आवश्यक चिकित्सकीय जांच')
      .replace(/(\. )/g, '.\n');
  } else if (language === 'Marathi') {
    return text
      .replace(/बायोप्सी|कार्सिनोमा|कॅन्सर|संशयास्पद/gi, 'वैद्यकीय सल्ला')
      .replace(/(\. )/g, '.\n');
  }
  // English SMS sanitizer
  return text
    .replace(/biopsy|malignancy|carcinoma|highly suspicious|TI-RADS 5|BI-RADS 4/gi, 'recommended health follow-up')
    .replace(/(\. )/g, '.\n');
}

/**
 * Plain-language rewriter fallback (simpler 6th-grade level, compassionate)
 */
export function simplifyClinicalTextFallback(text: string, language: SupportedLanguage): string {
  if (language === 'Hindi') {
    return text
      .replace(/समन्वय/g, 'मदद')
      .replace(/अनुशंसा/g, 'सलाह')
      .replace(/निर्धारित/g, 'तय')
      .replace(/आवश्यक/g, 'ज़रूरी')
      .replace(/परामर्श/g, 'बातचीत');
  }
  if (language === 'Marathi') {
    return text
      .replace(/समन्वय/g, 'मदत')
      .replace(/अनुशंसा/g, 'सल्ला')
      .replace(/नियोजित/g, 'ठरलेले')
      .replace(/आवश्यक/g, 'गरजेचे')
      .replace(/सल्लामसलत/g, 'चर्चा');
  }
  return text
    .replace(/evaluation/gi, 'check-up')
    .replace(/diagnostic/gi, 'follow-up')
    .replace(/consultation/gi, 'discussion with your doctor')
    .replace(/subsequent/gi, 'next')
    .replace(/expeditiously/gi, 'soon')
    .replace(/utilize/gi, 'use')
    .replace(/pursuant to/gi, 'based on');
}

/**
 * Trilingual Translation Fallback Engine (English <-> Hindi <-> Marathi)
 */
export function translateTextFallback(
  text: string,
  targetLang: SupportedLanguage
): { text: string; isDraft: boolean } {
  // If target is English
  if (targetLang === 'English') {
    // Check known phrases
    if (text.includes('स्क्रीनिंग जांच रिपोर्ट') || text.includes('तपासणी अहवाल')) {
      return {
        text: 'Dear Patient, your recent health screening has been reviewed by Dr. Sarah Chen and your care team. An approved follow-up plan has been prepared. Please view your secure portal or contact CareLoop Clinic at (555) 700-CARE to coordinate next steps. Please confirm you received this message.',
        isDraft: true
      };
    }
    return {
      text: 'CareLoop Notice: Your care team has reviewed your health screening. Please check your secure portal or call our clinic at (555) 700-CARE to confirm next steps.',
      isDraft: true
    };
  }

  // If target is Hindi
  if (targetLang === 'Hindi') {
    return {
      text: 'केयरलूप स्वास्थ्य सूचना: डॉक्टर द्वारा आपकी हालिया जांच की समीक्षा पूरी कर ली गई है। आपके सुरक्षित स्वास्थ्य के लिए अगला कदम तय किया गया है। कृपया अपने पोर्टल में विवरण देखें या (555) 700-CARE पर कॉल करके पुष्टि करें।',
      isDraft: true
    };
  }

  // If target is Marathi
  return {
    text: 'केअरलूप आरोग्य सूचना: आपल्या तपासणीचा अहवाल डॉक्टरांनी तपासला आहे. पुढील आवश्यक उपचारांचे नियोजन केले गेले आहे. कृपया रुग्ण पोर्टलवर तपासा किंवा पुढील मार्गदर्शनासाठी (555) 700-CARE वर त्वरित संपर्क साधा.',
    isDraft: true
  };
}

/**
 * Summarize administrative case history (structured facts, contact attempts, barrier notes)
 */
export function summarizeAdministrativeHistory(
  screeningCase: ScreeningCase,
  comms: Communication[],
  patient: Patient
): string {
  const caseComms = comms.filter(c => c.caseId === screeningCase.id);
  const attempts = caseComms.length;
  const acks = caseComms.filter(c => c.acknowledgementStatus === 'ACKNOWLEDGED').length;
  const preferred = patient.safeContactPreference?.toUpperCase() || 'SMS';
  const language = patient.preferredLanguage || 'English';

  let summary = `Patient ${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn}) is currently at workflow stage [${screeningCase.stage.replace(/_/g, ' ')}] with clinical urgency [${screeningCase.clinicalUrgency}]. `;
  summary += `Preferred channel: ${preferred}, preferred language: ${language}. `;

  if (attempts === 0) {
    summary += `No outreach attempts dispatched yet. Initial notification deadline is pending.`;
  } else {
    summary += `Total ${attempts} outreach attempt(s) recorded, with ${acks} confirmed acknowledgement(s). `;
    const last = caseComms[0];
    summary += `Last outreach via ${last.channel} sent at ${new Date(last.sentAt).toLocaleDateString()}, status: ${last.acknowledgementStatus}. `;
    if (last.acknowledgementStatus === 'PENDING') {
      summary += `Currently awaiting patient response under SLA.`;
    }
  }

  if (screeningCase.exceptionStatus && screeningCase.exceptionStatus !== 'NONE') {
    summary += ` Active exception flag: [${screeningCase.exceptionStatus} - ${screeningCase.exceptionReason || 'Barrier documented'}].`;
  }

  return summary;
}
