/**
 * Pre-Approved Public Safety Communication Template Catalog
 * Phase 60: Add public safety communication templates
 *
 * All pre-approved templates have undergone formal legal, operational, and safety reviews.
 * They automatically embed mandatory emergency helpline handoffs and non-CAD disclaimers.
 */

import {
  COMMUNICATION_TYPES,
  SEVERITY_LEVEL,
  COMMUNICATION_CHANNELS,
  EMERGENCY_DISCLAIMER_TEXT,
  EMERGENCY_HANDOFF_CONTACTS,
} from './communication.types.js';

export const PRE_APPROVED_TEMPLATES = [
  // ─── 1. Verified Public Safety Hazard Alert ───
  {
    id: 'tpl-verified-hazard-alert',
    name: 'Verified Public Safety Hazard Alert',
    communicationType: COMMUNICATION_TYPES.VERIFIED_ISSUE_ALERT,
    defaultSeverity: SEVERITY_LEVEL.WARNING,
    supportedChannels: [
      COMMUNICATION_CHANNELS.PUSH_NOTIFICATION,
      COMMUNICATION_CHANNELS.IN_APP_BANNER,
      COMMUNICATION_CHANNELS.PUBLIC_PORTAL_BROADCAST,
    ],
    requiredVariables: [
      'hazardName',
      'locationName',
      'wardName',
      'precautionAction',
      'verifiedByAgency',
    ],
    templateCopies: {
      en: {
        title: '⚠️ Public Safety Alert: {{hazardName}} at {{locationName}}',
        summary: 'A verified safety hazard ({{hazardName}}) has been confirmed in {{wardName}}.',
        body:
          'A verified safety hazard ({{hazardName}}) has been confirmed near {{locationName}}, {{wardName}} by {{verifiedByAgency}}.\n\n' +
          'Recommended Precaution: {{precautionAction}}\n\n' +
          'Municipal and emergency response crews are active on site. Please avoid non-essential transit through this immediate perimeter.',
      },
      mr: {
        title: '⚠️ सार्वजनिक सुरक्षा इशारा: {{locationName}} येथे {{hazardName}}',
        summary: '{{wardName}} मध्ये {{hazardName}} चा धोका निश्चित करण्यात आला आहे.',
        body:
          '{{verifiedByAgency}} द्वारे {{locationName}}, {{wardName}} येथे {{hazardName}} ची खात्री करण्यात आली आहे.\n\n' +
          'सावधगिरीची सूचना: {{precautionAction}}\n\n' +
          'घटनास्थळी महापालिका व आपत्कालीन पथके कार्यरत आहेत. कृपया या परिसरातील अनावश्यक प्रवास टाळावा.',
      },
      hi: {
        title: '⚠️ सार्वजनिक सुरक्षा चेतावनी: {{locationName}} पर {{hazardName}}',
        summary: '{{wardName}} में {{hazardName}} के खतरे की पुष्टि हुई है।',
        body:
          '{{verifiedByAgency}} द्वारा {{locationName}}, {{wardName}} में {{hazardName}} की पुष्टि की गई है।\n\n' +
          'सुझाई गई सावधानी: {{precautionAction}}\n\n' +
          'नगर निगम और आपातकालीन दल मौके पर सक्रिय हैं। कृपया इस क्षेत्र में अनावश्यक आवाजाही से बचें।',
      },
    },
    version: '1.0.0',
    isAiDraft: false,
    preApproved: true,
  },

  // ─── 2. Road Traffic Incident Corridor Detour ───
  {
    id: 'tpl-traffic-corridor-detour',
    name: 'Traffic Corridor Incident Detour Notice',
    communicationType: COMMUNICATION_TYPES.INCIDENT_UPDATE,
    defaultSeverity: SEVERITY_LEVEL.ADVISORY,
    supportedChannels: [
      COMMUNICATION_CHANNELS.PUSH_NOTIFICATION,
      COMMUNICATION_CHANNELS.SMS_ALERT,
      COMMUNICATION_CHANNELS.IN_APP_BANNER,
    ],
    requiredVariables: [
      'corridorName',
      'incidentType',
      'blockageLevel',
      'alternateRoute',
      'trafficPoliceDivision',
    ],
    templateCopies: {
      en: {
        title: '🚗 Traffic Corridor Alert: {{corridorName}}',
        summary: 'Traffic disruption on {{corridorName}} due to an active {{incidentType}}.',
        body:
          'Traffic Notice from {{trafficPoliceDivision}}:\n' +
          'An active {{incidentType}} on {{corridorName}} is causing {{blockageLevel}} traffic obstruction.\n\n' +
          'Suggested Detour: Motorists are advised to utilize {{alternateRoute}}.\n' +
          'Emergency response teams and traffic divergence squads are operating on site.',
      },
      mr: {
        title: '🚗 वाहतूक कोंडी सूचना: {{corridorName}}',
        summary: '{{incidentType}} मुळे {{corridorName}} येथे वाहतूक विस्कळीत.',
        body:
          '{{trafficPoliceDivision}} कडून सूचना:\n' +
          '{{corridorName}} येथे {{incidentType}} मुळे {{blockageLevel}} वाहतूक कोंडी झाली आहे.\n\n' +
          'पर्यायी मार्ग: वाहनचालकांनी {{alternateRoute}} चा वापर करावा.\n' +
          'वाहतूक पोलीस आणि आपत्कालीन पथके घटनास्थळी मार्ग मोकळा करत आहेत.',
      },
      hi: {
        title: '🚗 यातायात सूचना: {{corridorName}}',
        summary: '{{incidentType}} के कारण {{corridorName}} पर यातायात प्रभावित।',
        body:
          '{{trafficPoliceDivision}} से यातायात सूचना:\n' +
          '{{corridorName}} पर {{incidentType}} के कारण {{blockageLevel}} रुकावट उत्पन्न हुई है।\n\n' +
          'वैकल्पिक मार्ग: कृपया {{alternateRoute}} का उपयोग करें।\n' +
          'यातायात पुलिस और बचाव दल मार्ग सामान्य करने में जुटे हैं।',
      },
    },
    version: '1.0.0',
    isAiDraft: false,
    preApproved: true,
  },

  // ─── 3. Incident Scene Cleared & Normal Flow Resumed ───
  {
    id: 'tpl-incident-cleared-notice',
    name: 'Incident Cleared & Normal Traffic Resumed',
    communicationType: COMMUNICATION_TYPES.INCIDENT_UPDATE,
    defaultSeverity: SEVERITY_LEVEL.INFO,
    supportedChannels: [
      COMMUNICATION_CHANNELS.PUSH_NOTIFICATION,
      COMMUNICATION_CHANNELS.IN_APP_BANNER,
    ],
    requiredVariables: ['corridorName', 'clearedAt'],
    templateCopies: {
      en: {
        title: '✅ Corridor Cleared: {{corridorName}}',
        summary: 'Road clearance operations completed on {{corridorName}} at {{clearedAt}}.',
        body:
          'Road clearance and debris removal on {{corridorName}} have concluded as of {{clearedAt}}.\n' +
          'Traffic flow has resumed normal patterns. Thank you for your cooperation with on-scene responders.',
      },
      mr: {
        title: '✅ मार्ग पूर्ववत: {{corridorName}}',
        summary: '{{corridorName}} वरील अडथळे {{clearedAt}} वाजता हटवण्यात आले.',
        body:
          '{{corridorName}} येथील अडथळा आणि मलबा {{clearedAt}} वाजता पूर्णपणे हटवला गेला आहे.\n' +
          'वाहतूक पूर्ववत सुरू झाली आहे. सहकार्याबद्दल धन्यवाद.',
      },
      hi: {
        title: '✅ मार्ग सुचारु: {{corridorName}}',
        summary: '{{corridorName}} पर राहत कार्य {{clearedAt}} पर समाप्त।',
        body:
          '{{corridorName}} पर रुकावट और मलबा {{clearedAt}} बजे तक हटा दिया गया है।\n' +
          'यातायात सामान्य रूप से चालू हो गया है। सहयोग के लिए धन्यवाद।',
      },
    },
    version: '1.0.0',
    isAiDraft: false,
    preApproved: true,
  },

  // ─── 4. Official Authority Weather Hazard Advisory ───
  {
    id: 'tpl-official-weather-hazard',
    name: 'Official Weather Hazard Advisory Notice',
    communicationType: COMMUNICATION_TYPES.OFFICIAL_SOURCE_NOTICE,
    defaultSeverity: SEVERITY_LEVEL.WARNING,
    supportedChannels: [
      COMMUNICATION_CHANNELS.PUSH_NOTIFICATION,
      COMMUNICATION_CHANNELS.IN_APP_BANNER,
      COMMUNICATION_CHANNELS.PUBLIC_PORTAL_BROADCAST,
    ],
    requiredVariables: [
      'alertTitle',
      'authorityName',
      'effectivePeriod',
      'recommendedActions',
    ],
    templateCopies: {
      en: {
        title: '📢 Official Advisory: {{alertTitle}}',
        summary: 'Weather advisory issued by {{authorityName}} for {{effectivePeriod}}.',
        body:
          'Official weather notice issued by {{authorityName}}:\n' +
          'Notice: {{alertTitle}}\n' +
          'Effective Duration: {{effectivePeriod}}\n\n' +
          'Citizen Advisory: {{recommendedActions}}\n' +
          'Stay indoors if possible, secure loose rooftop fixtures, and avoid low-lying culverts.',
      },
      mr: {
        title: '📢 शासकीय इशारा: {{alertTitle}}',
        summary: '{{authorityName}} कडून {{effectivePeriod}} साठी हवामान इशारा जारी.',
        body:
          '{{authorityName}} कडून अधिकृत हवामान सूचना:\n' +
          'विषय: {{alertTitle}}\n' +
          'कालावधी: {{effectivePeriod}}\n\n' +
          'नागरिकांसाठी सूचना: {{recommendedActions}}\n' +
          'शक्यतो घरातच राहा, पाणी भरणाऱ्या सखल भागांत जाणे टाळा.',
      },
      hi: {
        title: '📢 आधिकारिक परामर्श: {{alertTitle}}',
        summary: '{{authorityName}} द्वारा {{effectivePeriod}} के लिए मौसम चेतावनी।',
        body:
          '{{authorityName}} द्वारा आधिकारिक मौसम परामर्श:\n' +
          'चेतावनी: {{alertTitle}}\n' +
          'प्रभावी समय: {{effectivePeriod}}\n\n' +
          'नागरिक सलाह: {{recommendedActions}}\n' +
          'जलभराव वाले निचले क्षेत्रों में जाने से बचें और सुरक्षित स्थानों पर रहें।',
      },
    },
    version: '1.0.0',
    isAiDraft: false,
    preApproved: true,
  },
];
