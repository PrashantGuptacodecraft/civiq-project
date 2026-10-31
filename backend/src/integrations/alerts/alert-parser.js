/**
 * Disaster Alert Ingestion Parser
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - CAP v1.2 XML parser (ITU-T X.1303 / OASIS standard)
 * - CAP JSON parser (standard REST schema used by SACHET / USGS)
 * - RSS 2.0 / Atom alert feed parser
 * - GeoJSON coordinate normalization from CAP space-delimited lat,lng pairs
 * - Strict verbatim content preservation and source authority attribution
 */

import { createHash } from 'crypto';
import {
  ALERT_FORMATS,
  ALERT_SEVERITY,
  ALERT_URGENCY,
  ALERT_CERTAINTY,
  ALERT_STATUS,
  ALERT_MSG_TYPE,
  ALERT_SOURCE_AUTHORITY,
  DISASTER_STATUTORY_DISCLAIMER,
} from './alert-adapter.types.js';

/**
 * Decodes XML entities and CDATA sections.
 */
function cleanXmlText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

/**
 * Extracts inner content of the first matching XML tag.
 */
function extractXmlTag(xml, tagName) {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? cleanXmlText(match[1]) : null;
}

/**
 * Extracts inner contents of all matching XML tags.
 */
function extractXmlTagsAll(xml, tagName) {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tagName}>`, 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(cleanXmlText(match[1]));
  }
  return matches;
}

/**
 * Converts CAP polygon string ("lat,lng lat,lng ...") into GeoJSON Polygon coordinates.
 * CAP Standard defines coordinates as: "lat,lng lat,lng lat,lng ..."
 * GeoJSON Standard defines coordinates as: [ [ [lng, lat], [lng, lat], ... ] ]
 */
export function convertCapPolygonToGeoJson(capPolygonStr) {
  if (!capPolygonStr || typeof capPolygonStr !== 'string') {
    return null;
  }

  const rawPairs = capPolygonStr.trim().split(/\s+/);
  const ring = [];

  for (const pair of rawPairs) {
    const parts = pair.split(',');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        // GeoJSON uses [longitude, latitude]
        ring.push([lng, lat]);
      }
    }
  }

  if (ring.length < 3) {
    return null;
  }

  // Ensure closed polygon ring (first point == last point)
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

/**
 * Converts CAP circle string ("lat,lng,radius_km") into structured circle geometry.
 */
export function convertCapCircle(capCircleStr) {
  if (!capCircleStr || typeof capCircleStr !== 'string') {
    return null;
  }

  const parts = capCircleStr.trim().split(',');
  if (parts.length >= 3) {
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    const radiusKm = parseFloat(parts[2].trim());
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && !Number.isNaN(radiusKm)) {
      return { latitude: lat, longitude: lng, radiusKm };
    }
  }
  return null;
}

/**
 * Parses CAP v1.2 XML string.
 * @param {string} xmlString - Raw CAP XML string
 * @param {Object} options - Parsing options
 * @returns {Object} Normalized CAP alert object
 */
export function parseCapXml(xmlString, options = {}) {
  if (typeof xmlString !== 'string' || !xmlString.trim()) {
    throw new Error('Invalid CAP XML: payload must be a non-empty string.');
  }

  // Validate alert root tag
  if (!/<(?:[a-zA-Z0-9_-]+:)?alert[\s>]/i.test(xmlString)) {
    throw new Error('Invalid CAP XML: missing root <alert> element.');
  }

  const identifier = extractXmlTag(xmlString, 'identifier');
  if (!identifier) {
    throw new Error('Invalid CAP XML: missing required <identifier> element.');
  }

  const sender = extractXmlTag(xmlString, 'sender') || 'unknown-sender';
  const sent = extractXmlTag(xmlString, 'sent') || new Date().toISOString();
  const status = extractXmlTag(xmlString, 'status') || ALERT_STATUS.ACTUAL;
  const msgType = extractXmlTag(xmlString, 'msgType') || ALERT_MSG_TYPE.ALERT;
  const scope = extractXmlTag(xmlString, 'scope') || 'Public';
  const references = extractXmlTag(xmlString, 'references') || null;
  const source = extractXmlTag(xmlString, 'source') || null;

  // Extract <info> blocks
  const infoBlocksRaw = extractXmlTagsAll(xmlString, 'info');
  const infoBlock = infoBlocksRaw.length > 0 ? infoBlocksRaw[0] : xmlString;

  const category = extractXmlTag(infoBlock, 'category') || 'Other';
  const event = extractXmlTag(infoBlock, 'event') || 'Disaster Advisory';
  const urgency = extractXmlTag(infoBlock, 'urgency') || ALERT_URGENCY.UNKNOWN;
  const severity = extractXmlTag(infoBlock, 'severity') || ALERT_SEVERITY.UNKNOWN;
  const certainty = extractXmlTag(infoBlock, 'certainty') || ALERT_CERTAINTY.UNKNOWN;
  const effective = extractXmlTag(infoBlock, 'effective') || sent;
  const onset = extractXmlTag(infoBlock, 'onset') || effective;
  const expires = extractXmlTag(infoBlock, 'expires') || null;
  const senderName = extractXmlTag(infoBlock, 'senderName') || sender;
  const headline = extractXmlTag(infoBlock, 'headline') || event;
  const description = extractXmlTag(infoBlock, 'description') || '';
  const instruction = extractXmlTag(infoBlock, 'instruction') || '';
  const web = extractXmlTag(infoBlock, 'web') || null;
  const contact = extractXmlTag(infoBlock, 'contact') || null;

  // Extract area info
  const areaBlock = extractXmlTag(infoBlock, 'area') || '';
  const areaDesc = extractXmlTag(areaBlock, 'areaDesc') || 'Affected Region';
  const polygonStr = extractXmlTag(areaBlock, 'polygon') || null;
  const circleStr = extractXmlTag(areaBlock, 'circle') || null;

  const polygonGeometry = convertCapPolygonToGeoJson(polygonStr);
  const circleGeometry = convertCapCircle(circleStr);

  // Extract parameters
  const parameters = {};
  const paramBlocks = extractXmlTagsAll(infoBlock, 'parameter');
  for (const p of paramBlocks) {
    const valName = extractXmlTag(p, 'valueName');
    const val = extractXmlTag(p, 'value');
    if (valName && val) {
      parameters[valName] = val;
    }
  }

  // Extract eventCodes
  const eventCodes = {};
  const eventCodeBlocks = extractXmlTagsAll(infoBlock, 'eventCode');
  for (const ec of eventCodeBlocks) {
    const valName = extractXmlTag(ec, 'valueName');
    const val = extractXmlTag(ec, 'value');
    if (valName && val) {
      eventCodes[valName] = val;
    }
  }

  return {
    format: ALERT_FORMATS.CAP_XML_1_2,
    identifier,
    sender,
    sent,
    status,
    msgType,
    scope,
    references,
    source,
    category,
    event,
    urgency,
    severity,
    certainty,
    effective,
    onset,
    expires,
    senderName,
    headline,
    description,
    instruction,
    web,
    contact,
    areaDesc,
    rawPolygon: polygonStr,
    polygonGeometry,
    circleGeometry,
    parameters,
    eventCodes,
  };
}

/**
 * Parses CAP JSON object or JSON string.
 * @param {string|Object} jsonPayload - CAP JSON payload
 * @param {Object} options - Parsing options
 * @returns {Object} Normalized CAP alert object
 */
export function parseCapJson(jsonPayload, options = {}) {
  const data = typeof jsonPayload === 'string' ? JSON.parse(jsonPayload) : jsonPayload;

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid CAP JSON: payload must be a valid JSON object.');
  }

  const identifier = data.identifier || data.id || data.alertId;
  if (!identifier) {
    throw new Error('Invalid CAP JSON: missing required "identifier" field.');
  }

  const sender = data.sender || data.senderId || 'unknown-sender';
  const sent = data.sent || data.sentAt || new Date().toISOString();
  const status = data.status || ALERT_STATUS.ACTUAL;
  const msgType = data.msgType || data.messageType || ALERT_MSG_TYPE.ALERT;
  const scope = data.scope || 'Public';
  const references = data.references || null;
  const source = data.source || null;

  // Extract info: could be array or single object
  const infoArray = Array.isArray(data.info) ? data.info : data.info ? [data.info] : [data];
  const info = infoArray[0] || {};

  const category = info.category || 'Other';
  const event = info.event || data.event || 'Disaster Advisory';
  const urgency = info.urgency || ALERT_URGENCY.UNKNOWN;
  const severity = info.severity || ALERT_SEVERITY.UNKNOWN;
  const certainty = info.certainty || ALERT_CERTAINTY.UNKNOWN;
  const effective = info.effective || sent;
  const onset = info.onset || effective;
  const expires = info.expires || null;
  const senderName = info.senderName || sender;
  const headline = info.headline || event;
  const description = info.description || '';
  const instruction = info.instruction || '';
  const web = info.web || data.web || null;
  const contact = info.contact || null;

  // Extract area info
  let areaDesc = 'Affected Region';
  let polygonStr = null;
  let polygonGeometry = null;
  let circleGeometry = null;

  const areas = Array.isArray(info.area) ? info.area : info.area ? [info.area] : [];
  if (areas.length > 0) {
    const area = areas[0];
    areaDesc = area.areaDesc || area.name || areaDesc;

    if (typeof area.polygon === 'string') {
      polygonStr = area.polygon;
      polygonGeometry = convertCapPolygonToGeoJson(area.polygon);
    } else if (area.polygon && area.polygon.type === 'Polygon') {
      polygonGeometry = area.polygon;
    } else if (Array.isArray(area.coordinates)) {
      polygonGeometry = { type: 'Polygon', coordinates: [area.coordinates] };
    }

    if (typeof area.circle === 'string') {
      circleGeometry = convertCapCircle(area.circle);
    } else if (area.circle && typeof area.circle === 'object') {
      circleGeometry = area.circle;
    }
  } else if (data.polygonGeometry) {
    polygonGeometry = data.polygonGeometry;
  }

  return {
    format: ALERT_FORMATS.CAP_JSON_1_2,
    identifier,
    sender,
    sent,
    status,
    msgType,
    scope,
    references,
    source,
    category,
    event,
    urgency,
    severity,
    certainty,
    effective,
    onset,
    expires,
    senderName,
    headline,
    description,
    instruction,
    web,
    contact,
    areaDesc,
    rawPolygon: polygonStr,
    polygonGeometry,
    circleGeometry,
    parameters: info.parameters || data.parameters || {},
    eventCodes: info.eventCodes || data.eventCodes || {},
  };
}

/**
 * Parses RSS 2.0 or Atom Feed containing alert items.
 * @param {string} feedXml - Raw RSS/Atom XML
 * @param {Object} options - Options
 * @returns {Array<Object>} List of normalized alert objects
 */
export function parseRssAtomAlertFeed(feedXml, options = {}) {
  if (typeof feedXml !== 'string' || !feedXml.trim()) {
    throw new Error('Invalid RSS/Atom Feed: payload must be a non-empty string.');
  }

  const items = [];
  // Check for RSS <item> tags
  const rawItems = extractXmlTagsAll(feedXml, 'item');
  if (rawItems.length > 0) {
    for (const rawItem of rawItems) {
      // Check if item contains an embedded <cap:alert> or <alert>
      if (/<(?:[a-zA-Z0-9_-]+:)?alert[\s>]/i.test(rawItem)) {
        try {
          items.push(parseCapXml(rawItem, options));
          continue;
        } catch {
          // Fallback to RSS parsing below
        }
      }

      const guid = extractXmlTag(rawItem, 'guid') || extractXmlTag(rawItem, 'id');
      const title = extractXmlTag(rawItem, 'title') || 'Alert Bulletin';
      const description = extractXmlTag(rawItem, 'description') || '';
      const link = extractXmlTag(rawItem, 'link') || null;
      const pubDate = extractXmlTag(rawItem, 'pubDate') || new Date().toISOString();
      const severity = extractXmlTag(rawItem, 'severity') || extractXmlTag(rawItem, 'cap:severity') || ALERT_SEVERITY.UNKNOWN;
      const urgency = extractXmlTag(rawItem, 'urgency') || extractXmlTag(rawItem, 'cap:urgency') || ALERT_URGENCY.UNKNOWN;
      const event = extractXmlTag(rawItem, 'event') || extractXmlTag(rawItem, 'cap:event') || title;
      const instruction = extractXmlTag(rawItem, 'instruction') || extractXmlTag(rawItem, 'cap:instruction') || '';
      const polygonStr = extractXmlTag(rawItem, 'polygon') || extractXmlTag(rawItem, 'georss:polygon') || null;

      const polygonGeometry = convertCapPolygonToGeoJson(polygonStr);

      items.push({
        format: ALERT_FORMATS.RSS_2_0,
        identifier: guid || `RSS-${Date.now()}-${items.length}`,
        sender: 'RSS Feed Alert Provider',
        sent: pubDate,
        status: ALERT_STATUS.ACTUAL,
        msgType: ALERT_MSG_TYPE.ALERT,
        scope: 'Public',
        category: 'Safety',
        event,
        urgency,
        severity,
        certainty: ALERT_CERTAINTY.LIKELY,
        effective: pubDate,
        onset: pubDate,
        expires: null,
        senderName: 'Government Bulletin RSS Feed',
        headline: title,
        description,
        instruction,
        web: link,
        contact: null,
        areaDesc: 'Monitored Region',
        rawPolygon: polygonStr,
        polygonGeometry,
        circleGeometry: null,
        parameters: {},
        eventCodes: {},
      });
    }
    return items;
  }

  // Check for Atom <entry> tags
  const rawEntries = extractXmlTagsAll(feedXml, 'entry');
  if (rawEntries.length > 0) {
    for (const rawEntry of rawEntries) {
      if (/<(?:[a-zA-Z0-9_-]+:)?alert[\s>]/i.test(rawEntry)) {
        try {
          items.push(parseCapXml(rawEntry, options));
          continue;
        } catch {}
      }

      const id = extractXmlTag(rawEntry, 'id');
      const title = extractXmlTag(rawEntry, 'title') || 'Alert Entry';
      const summary = extractXmlTag(rawEntry, 'summary') || extractXmlTag(rawEntry, 'content') || '';
      const updated = extractXmlTag(rawEntry, 'updated') || new Date().toISOString();

      items.push({
        format: ALERT_FORMATS.ATOM_1_0,
        identifier: id || `ATOM-${Date.now()}-${items.length}`,
        sender: 'Atom Feed Provider',
        sent: updated,
        status: ALERT_STATUS.ACTUAL,
        msgType: ALERT_MSG_TYPE.ALERT,
        scope: 'Public',
        category: 'Safety',
        event: title,
        urgency: ALERT_URGENCY.UNKNOWN,
        severity: ALERT_SEVERITY.UNKNOWN,
        certainty: ALERT_CERTAINTY.LIKELY,
        effective: updated,
        onset: updated,
        expires: null,
        senderName: 'Government Atom Feed',
        headline: title,
        description: summary,
        instruction: '',
        web: null,
        contact: null,
        areaDesc: 'Monitored Region',
        rawPolygon: null,
        polygonGeometry: null,
        circleGeometry: null,
        parameters: {},
        eventCodes: {},
      });
    }
    return items;
  }

  throw new Error('Unsupported feed structure: no <item> or <entry> elements detected.');
}

/**
 * Normalizes an alert payload into a standardized CivIQ Ingested Official Alert Record.
 *
 * Enforces AGENTS.md and ADR 0002 mandates:
 * 1. Preserves verbatim official content without rewrites.
 * 2. Emits explicit source authority attribution and statutory disclaimers.
 * 3. Computes cryptographic payload hash for provenance tracking.
 */
export function normalizeIngestedAlert(parsedData, rawPayload, options = {}) {
  const authority = options.sourceAuthority || ALERT_SOURCE_AUTHORITY.SACHET_NDMA;
  const now = new Date().toISOString();

  const payloadString =
    typeof rawPayload === 'string'
      ? rawPayload
      : JSON.stringify(rawPayload);

  const rawPayloadHash = createHash('sha256').update(payloadString).digest('hex');

  // Internal CivIQ unique ingested alert identifier
  const internalId = `alt-${authority.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${parsedData.identifier}`;

  return {
    id: internalId,
    externalIdentifier: parsedData.identifier,
    format: parsedData.format,
    sourceAuthority: authority,
    sourceAgency: parsedData.senderName || parsedData.sender,
    senderEmailOrId: parsedData.sender,
    status: parsedData.status,
    msgType: parsedData.msgType,
    scope: parsedData.scope,
    references: parsedData.references,

    // Verbatim Official Alert Content (Strictly Unrewritten)
    verbatimHeadline: parsedData.headline,
    verbatimDescription: parsedData.description,
    verbatimInstruction: parsedData.instruction,
    verbatimAreaDesc: parsedData.areaDesc,
    isVerbatimOfficialText: true,

    // Standard Alert Categorization & Lifecycle
    category: parsedData.category,
    event: parsedData.event,
    severity: parsedData.severity,
    urgency: parsedData.urgency,
    certainty: parsedData.certainty,

    // Spatial Boundaries
    affectedPolygon: parsedData.polygonGeometry,
    affectedCircle: parsedData.circleGeometry,
    rawPolygon: parsedData.rawPolygon,

    // Temporal Validity
    sentAt: parsedData.sent,
    effectiveAt: parsedData.effective,
    onsetAt: parsedData.onset,
    expiresAt: parsedData.expires,
    ingestedAt: now,

    // Source Metadata & Provenance
    web: parsedData.web,
    contact: parsedData.contact,
    parameters: parsedData.parameters,
    eventCodes: parsedData.eventCodes,

    // Cryptographic Provenance
    provenance: {
      rawPayloadHash,
      signatureVerificationStatus: options.signatureStatus || 'UNSIGNED_TRUSTED_SOURCE',
      signatureAlgorithm: options.signatureAlgorithm || 'SHA256-DIGEST',
      signatureVerifiedAt: now,
      feedUrl: options.feedUrl || null,
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
    },
  };
}
