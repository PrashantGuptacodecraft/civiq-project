/**
 * Disaster Alert Test & Seed Fixtures
 * Phase 62: Build official alert ingestion adapter
 *
 * Provides realistic CAP v1.2 XML, CAP JSON, and RSS alert feeds
 * representing official warnings from SACHET NDMA, IMD, and municipal disaster cells.
 */

import { computeHmacSignature, computePayloadDigest } from './alert-signature.js';

export const SAMPLE_ALERT_SECRET_KEY = 'civiq-disaster-alert-ndma-hmac-key-2026';

/**
 * 1. Authentic CAP 1.2 XML: NDMA SACHET Severe Flood Warning for Pune Mutha Basin
 */
export const SACHET_PUNE_FLOOD_CAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-IN-MH-PUN-2026-1030-001</identifier>
  <sender>sachet-alerts@ndma.gov.in</sender>
  <sent>2026-10-30T04:00:00+05:30</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <source>NDMA SACHET Early Warning Network</source>
  <info>
    <category>Met</category>
    <event>Severe Urban Flooding &amp; Causeway Overflow</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>DisasterType</valueName>
      <value>URBAN_FLOODING_WATERLOGGING</value>
    </eventCode>
    <effective>2026-10-30T04:00:00+05:30</effective>
    <onset>2026-10-30T04:30:00+05:30</onset>
    <expires>2026-10-31T06:00:00+05:30</expires>
    <senderName>National Disaster Management Authority (NDMA)</senderName>
    <headline>Severe Flood Warning: Khadakwasla Dam Spillway Discharge in Mutha River Basin</headline>
    <description>Emergency discharge of 45,000 cusecs from Khadakwasla Dam due to intense catchment rainfall. Sinhagad Road riverbank societies, Pulgate culvert, and Deccan riverside causeway experiencing severe inundation.</description>
    <instruction>Immediate evacuation for ground floor residences along Sinhagad Road river corridor. Move to designated PMC municipal shelters. Avoid low-lying river causeways including Baba Bhide Bridge. Call PMC Disaster Cell at 020-25501269 or 112.</instruction>
    <web>https://sachet.ndma.gov.in/alerts/CAP-IN-MH-PUN-2026-1030-001</web>
    <contact>PMC Emergency Operations Center: 020-25501269</contact>
    <parameter>
      <valueName>JurisdictionId</valueName>
      <value>mh-pune-pmc</value>
    </parameter>
    <parameter>
      <valueName>DamDischargeCusecs</valueName>
      <value>45000</value>
    </parameter>
    <area>
      <areaDesc>Pune Municipal Corporation - Mutha River Corridor (Vitthalwadi to Deccan)</areaDesc>
      <polygon>18.4800,73.8200 18.4900,73.8400 18.5200,73.8600 18.5350,73.8500 18.5150,73.8300 18.4900,73.8150 18.4800,73.8200</polygon>
    </area>
  </info>
</alert>`;

/**
 * 2. Authentic CAP 1.2 XML: India Meteorological Department (IMD) Red Alert Nowcast
 */
export const IMD_PUNE_NOWCAST_CAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>IMD-NOWCAST-MH-2026-1030-088</identifier>
  <sender>mausam.pune@imd.gov.in</sender>
  <sent>2026-10-30T05:00:00+05:30</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <source>IMD Doppler Weather Radar Pune</source>
  <info>
    <category>Met</category>
    <event>Extremely Heavy Rainfall &amp; Cloudburst Threat</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <effective>2026-10-30T05:00:00+05:30</effective>
    <onset>2026-10-30T05:15:00+05:30</onset>
    <expires>2026-10-30T12:00:00+05:30</expires>
    <senderName>India Meteorological Department, Regional Meteorological Centre Pune</senderName>
    <headline>RED ALERT: Extremely Intense Precipitation &amp; Gale Winds Over Pune &amp; Ghat Areas</headline>
    <description>Severe meso-scale convective cluster delivering rainfall rates exceeding 40mm/hr over Katraj, Sinhagad, and surrounding hillsides. High risk of localized flash floods, slope failure, and road blockages.</description>
    <instruction>Stay indoors. Postpone all non-essential road travel through ghat roads including Katraj and Bhor ghats. Keep emergency battery backups ready.</instruction>
    <web>https://mausam.imd.gov.in/pune/nowcast/2026-1030-088</web>
    <contact>IMD Pune Forecaster Desk: 020-25535201</contact>
    <area>
      <areaDesc>Pune District and Western Ghat Ridges</areaDesc>
      <polygon>18.4000,73.8000 18.4600,73.8900 18.5600,73.8900 18.5600,73.8000 18.4000,73.8000</polygon>
      <circle>18.4500,73.8500,15.0</circle>
    </area>
  </info>
</alert>`;

/**
 * 3. Authentic CAP JSON: PCMC Disaster Management Cell Hazmat Advisory
 */
export const PCMC_HAZMAT_CAP_JSON = {
  identifier: 'PCMC-DISASTER-HAZ-2026-002',
  sender: 'disastercell@pcmcindia.gov.in',
  sent: '2026-10-30T02:00:00+05:30',
  status: 'Actual',
  msgType: 'Alert',
  scope: 'Public',
  source: 'PCMC Hazmat Rapid Response Unit',
  info: [
    {
      category: 'CBRNE',
      event: 'Industrial Chlorine Vapor Emission',
      urgency: 'Immediate',
      severity: 'Moderate',
      certainty: 'Observed',
      effective: '2026-10-30T02:00:00+05:30',
      onset: '2026-10-30T02:05:00+05:30',
      expires: '2026-10-30T10:00:00+05:30',
      senderName: 'PCMC Fire and Emergency Services & Disaster Cell',
      headline: 'Atmospheric Hazmat Advisory: Containment Order for Bhosari MIDC Sector 7',
      description:
        'Localized gaseous chlorine emission from industrial cylinder yard. Atmospheric dispersion across 800-meter radius affecting Sector 7 and adjacent residential fringe.',
      instruction:
        'Residents within 1 km downwind should remain indoors with doors and windows closed. Cover nose and mouth with wet cloth if vapor odor is detected. Evacuate only if directed by PCMC Fire personnel.',
      web: 'https://pcmcindia.gov.in/disaster/alerts/HAZ-2026-002',
      contact: 'PCMC Fire Emergency Control: 101 / 020-27422222',
      parameters: {
        JurisdictionId: 'mh-pune-pcmc',
        Substance: 'Chlorine (UN 1017)',
        RadiusMeters: '800',
      },
      area: [
        {
          areaDesc: 'PCMC MIDC Bhosari Sector 7 Industrial Area & Residential Fringe',
          polygon: '18.6200,73.8300 18.6200,73.8550 18.6400,73.8550 18.6400,73.8300 18.6200,73.8300',
        },
      ],
    },
  ],
};

/**
 * 4. Authentic RSS 2.0 Feed with CAP items
 */
export const MAHARASHTRA_DISASTER_RSS_FEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2" xmlns:georss="http://www.georss.org/georss">
  <channel>
    <title>Maharashtra State Disaster Alert RSS Feed</title>
    <link>https://sdma.maharashtra.gov.in/rss/alerts</link>
    <description>Official Early Warning Emergency Alert Feed for Maharashtra State</description>
    <pubDate>2026-10-30T05:30:00+05:30</pubDate>
    <item>
      <guid>CAP-IN-MH-PUN-2026-1030-001</guid>
      <title>Severe Flood Warning: Khadakwasla Dam Spillway Discharge</title>
      <link>https://sachet.ndma.gov.in/alerts/CAP-IN-MH-PUN-2026-1030-001</link>
      <description>Emergency discharge of 45,000 cusecs from Khadakwasla Dam. Mutha river corridor inundation.</description>
      <pubDate>2026-10-30T04:00:00+05:30</pubDate>
      <cap:severity>Severe</cap:severity>
      <cap:urgency>Immediate</cap:urgency>
      <cap:event>Urban Flooding</cap:event>
      <cap:instruction>Immediate evacuation for low-lying Sinhagad Road communities.</cap:instruction>
      <georss:polygon>18.4800,73.8200 18.4900,73.8400 18.5200,73.8600 18.5350,73.8500 18.5150,73.8300 18.4800,73.8200</georss:polygon>
    </item>
    <item>
      <guid>REF-DDMA-PUN-LS-2026-03</guid>
      <title>Katraj Ghat Slope Failure &amp; Rockfall Hazard</title>
      <link>https://pune.gov.in/disaster/alerts/LS-03</link>
      <description>Hillside debris flow blocking Old Katraj Tunnel bypass.</description>
      <pubDate>2026-10-30T05:15:00+05:30</pubDate>
      <cap:severity>Moderate</cap:severity>
      <cap:urgency>Expected</cap:urgency>
      <cap:event>Landslide</cap:event>
      <cap:instruction>Route traffic via New Katraj Tunnel. Clear roadway perimeter.</cap:instruction>
      <georss:polygon>18.4200,73.8450 18.4200,73.8700 18.4450,73.8750 18.4450,73.8500 18.4200,73.8450</georss:polygon>
    </item>
  </channel>
</rss>`;

/**
 * Pre-computed signatures for tests
 */
export const VALID_SACHET_HMAC_SIGNATURE = computeHmacSignature(
  SACHET_PUNE_FLOOD_CAP_XML,
  SAMPLE_ALERT_SECRET_KEY
);

export const VALID_IMD_HMAC_SIGNATURE = computeHmacSignature(
  IMD_PUNE_NOWCAST_CAP_XML,
  SAMPLE_ALERT_SECRET_KEY
);

export const VALID_PCMC_HMAC_SIGNATURE = computeHmacSignature(
  PCMC_HAZMAT_CAP_JSON,
  SAMPLE_ALERT_SECRET_KEY
);

export const INVALID_HMAC_SIGNATURE = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
