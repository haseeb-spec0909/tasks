/**
 * Google Calendar service
 * Handles calendar event management and synchronization
 */

import { google } from 'googleapis';
import config from '../config/index.js';

const calendar = google.calendar('v3');

/**
 * Initialize OAuth2 client with user tokens
 * @param {Object} userTokens - User's OAuth tokens
 * @returns {Object} Authenticated OAuth2 client
 */
export function initClient(userTokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );

  oauth2Client.setCredentials(userTokens);
  return oauth2Client;
}

/**
 * Get calendar events with optional incremental sync
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} timeMin - RFC 3339 timestamp (inclusive)
 * @param {string} timeMax - RFC 3339 timestamp (exclusive)
 * @param {string} syncToken - Sync token for incremental sync (optional)
 * @returns {Promise<Object>} Events and sync token
 */
export async function getEvents(client, timeMin, timeMax, syncToken = null) {
  try {
    const params = {
      auth: client,
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    };

    if (syncToken) {
      params.syncToken = syncToken;
      delete params.timeMin;
      delete params.timeMax;
    }

    const response = await calendar.events.list(params);

    return {
      events: response.data.items || [],
      nextSyncToken: response.data.nextSyncToken || null,
      nextPageToken: response.data.nextPageToken || null,
    };
  } catch (err) {
    console.error('Error fetching calendar events:', err.message);
    throw err;
  }
}

/**
 * Create calendar event with TimeIntel extended properties
 * @param {Object} client - Authenticated OAuth2 client
 * @param {Object} event - Event data
 * @returns {Promise<Object>} Created event
 */
export async function createEvent(client, event) {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      timeZone,
      taskId,
      source,
      wpCode,
    } = event;

    const eventData = {
      summary: title,
      description,
      start: { dateTime: startTime, timeZone },
      end: { dateTime: endTime, timeZone },
      extendedProperties: {
        private: {
          timeintel_managed: 'true',
          task_id: taskId,
          source,
          wp_code: wpCode || '',
        },
      },
    };

    const response = await calendar.events.insert({
      auth: client,
      calendarId: 'primary',
      resource: eventData,
    });

    return response.data;
  } catch (err) {
    console.error('Error creating calendar event:', err.message);
    throw err;
  }
}

/**
 * Update calendar event
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} eventId - Event ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated event
 */
export async function updateEvent(client, eventId, updates) {
  try {
    const { summary, description, startTime, endTime, timeZone } = updates;

    const eventData = {};
    if (summary) eventData.summary = summary;
    if (description) eventData.description = description;
    if (startTime) eventData.start = { dateTime: startTime, timeZone };
    if (endTime) eventData.end = { dateTime: endTime, timeZone };

    const response = await calendar.events.update({
      auth: client,
      calendarId: 'primary',
      eventId,
      resource: eventData,
    });

    return response.data;
  } catch (err) {
    console.error('Error updating calendar event:', err.message);
    throw err;
  }
}

/**
 * Delete calendar event
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export async function deleteEvent(client, eventId) {
  try {
    await calendar.events.delete({
      auth: client,
      calendarId: 'primary',
      eventId,
    });
  } catch (err) {
    console.error('Error deleting calendar event:', err.message);
    throw err;
  }
}

/**
 * Batch create events (up to 50)
 * @param {Object} client - Authenticated OAuth2 client
 * @param {Object[]} events - Array of event objects
 * @returns {Promise<Object[]>} Created events
 */
export async function batchCreateEvents(client, events) {
  const results = [];

  // Batch in groups of 10 to avoid rate limits
  for (let i = 0; i < events.length; i += 10) {
    const batch = events.slice(i, i + 10);
    const batchResults = await Promise.all(
      batch.map(event => createEvent(client, event).catch(err => ({ error: err.message })))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Get free/busy information
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} timeMin - Start time
 * @param {string} timeMax - End time
 * @param {string[]} calendars - Calendar IDs
 * @returns {Promise<Object>} Busy times
 */
export async function getFreeBusy(client, timeMin, timeMax, calendars = ['primary']) {
  try {
    const response = await calendar.freebusy.query({
      auth: client,
      resource: {
        timeMin,
        timeMax,
        items: calendars.map(id => ({ id })),
      },
    });

    return response.data.calendars;
  } catch (err) {
    console.error('Error querying free/busy:', err.message);
    throw err;
  }
}

/**
 * Setup watch channel for push notifications
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} userId - User ID
 * @param {string} webhookUrl - Webhook URL
 * @returns {Promise<Object>} Channel info
 */
export async function setupWatchChannel(client, userId, webhookUrl) {
  try {
    const response = await calendar.events.watch({
      auth: client,
      calendarId: 'primary',
      resource: {
        id: `timeintel-${userId}-${Date.now()}`,
        type: 'web_hook',
        address: webhookUrl,
      },
    });

    return {
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiration: response.data.expiration,
    };
  } catch (err) {
    console.error('Error setting up watch channel:', err.message);
    throw err;
  }
}

/**
 * Renew watch channel
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} channelId - Channel ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<Object>} Updated channel info
 */
export async function renewWatchChannel(client, channelId, resourceId) {
  try {
    const response = await calendar.channels.stop({
      auth: client,
      resource: {
        id: channelId,
        resourceId,
      },
    });

    return response.data;
  } catch (err) {
    console.error('Error renewing watch channel:', err.message);
    throw err;
  }
}

/**
 * Classify calendar event using Vertex AI Gemini
 * @param {string} eventSummary - Event title
 * @param {string[]} attendees - Attendee email addresses
 * @returns {Promise<Object>} Classification result
 */
export async function classifyEvent(eventSummary, attendees = []) {
  try {
    // Placeholder for Vertex AI integration
    // This will be called from vertexAI service
    const categories = ['one_on_one', 'team_meeting', 'external_meeting', 'personal_event'];
    
    // Simple heuristic classification for now
    if (attendees.length === 0) {
      return { category: 'personal_event', confidence: 0.95 };
    }
    if (attendees.length === 1) {
      return { category: 'one_on_one', confidence: 0.90 };
    }
    
    return { category: 'team_meeting', confidence: 0.85 };
  } catch (err) {
    console.error('Error classifying event:', err.message);
    throw err;
  }
}

export default {
  initClient,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  batchCreateEvents,
  getFreeBusy,
  setupWatchChannel,
  renewWatchChannel,
  classifyEvent,
};
