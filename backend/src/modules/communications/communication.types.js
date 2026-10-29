/**
 * Public Safety Communication Types & Enumerations
 * Phase 60: Add public safety communication templates
 */

export const COMMUNICATION_TYPES = {
  VERIFIED_ISSUE_ALERT: 'VERIFIED_ISSUE_ALERT',
  INCIDENT_UPDATE: 'INCIDENT_UPDATE',
  OFFICIAL_SOURCE_NOTICE: 'OFFICIAL_SOURCE_NOTICE',
};

export const COMMUNICATION_CHANNELS = {
  PUSH_NOTIFICATION: 'PUSH_NOTIFICATION',
  SMS_ALERT: 'SMS_ALERT',
  IN_APP_BANNER: 'IN_APP_BANNER',
  PUBLIC_PORTAL_BROADCAST: 'PUBLIC_PORTAL_BROADCAST',
};

export const REVIEW_STATUS = {
  PRE_APPROVED_TEMPLATE: 'PRE_APPROVED_TEMPLATE',
  AI_DRAFT_PENDING_REVIEW: 'AI_DRAFT_PENDING_REVIEW',
  APPROVED_BY_OFFICIAL: 'APPROVED_BY_OFFICIAL',
  REJECTED_BY_OFFICIAL: 'REJECTED_BY_OFFICIAL',
};

export const PUBLISH_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
};

export const SEVERITY_LEVEL = {
  INFO: 'INFO',
  ADVISORY: 'ADVISORY',
  WARNING: 'WARNING',
  DANGER_EMERGENCY: 'DANGER_EMERGENCY',
};

export const EMERGENCY_HANDOFF_CONTACTS = {
  NATIONAL_EMERGENCY: '112',
  POLICE_HOTLINE: '100',
  FIRE_HOTLINE: '101',
  AMBULANCE_EMS: '108',
  DISASTER_HELPLINE: '1077',
  WOMEN_SAFETY_HELPLINE: '1091',
};

/**
 * Mandatory Statutory Emergency Disclaimer & Handoff (ADR 0002):
 * CivIQ is a municipal civic information platform, not an emergency response service.
 * In any life-threatening situation or active road crash, citizens must call 112 immediately.
 */
export const EMERGENCY_DISCLAIMER_TEXT = {
  en: 'EMERGENCY NOTICE: For active life-threatening emergencies, medical distress, or severe road accidents, call 112 immediately. CivIQ is a civic information and coordination platform, not an emergency response command centre. Do not wait for in-app updates during an active emergency.',
  hi: 'आपातकालीन सूचना: जीवन के लिए खतरनाक आपात स्थितियों, चिकित्सीय सहायता या गंभीर सड़क दुर्घटनाओं के लिए तुरंत 112 पर कॉल करें। CivIQ एक नागरिक सूचना मंच है, आपातकालीन प्रतिक्रिया सेवा नहीं। सक्रिय आपातकाल के दौरान ऐप के अपडेट की प्रतीक्षा न करें।',
  mr: 'आपत्कालीन सूचना: जीवघेण्या आणीबाणी, वैद्यकीय मदत किंवा गंभीर रस्ते अपघातांसाठी त्वरित 112 वर संपर्क साधा. CivIQ हे नागरी माहिती व्यासपीठ असून थेट आपत्कालीन प्रतिसाद केंद्र नाही. चालू आणीबाणीच्या वेळी ॲप अपडेट्सची वाट पाहू नका.',
};
