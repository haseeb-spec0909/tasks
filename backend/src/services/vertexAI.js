/**
 * Vertex AI service
 * Integrates with Google's Vertex AI for Gemini LLM capabilities
 */

import { VertexAI } from '@google-cloud/vertexai';
import config from '../config/index.js';

let vertexAI = null;

/**
 * Initialize Vertex AI client
 * @returns {VertexAI}
 */
export function initClient() {
  if (vertexAI) {
    return vertexAI;
  }

  vertexAI = new VertexAI({
    project: config.GCP_PROJECT_ID,
    location: config.VERTEX_AI_LOCATION,
  });

  return vertexAI;
}

/**
 * Classify calendar event using Gemini
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Classification result
 */
export async function classifyCalendarEvent(eventData) {
  try {
    const client = initClient();
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `Classify this calendar event into ONE of these categories:
    - one_on_one: 1:1 meetings with one other person
    - team_meeting: Group meetings with 2+ attendees
    - external_meeting: Meetings with external parties/customers
    - personal_event: Personal time, lunch, breaks, etc.

    Event details:
    - Title: ${eventData.summary}
    - Attendees: ${eventData.attendees?.join(', ') || 'None listed'}
    - Description: ${eventData.description || 'None'}

    Respond with ONLY the category name and a confidence score (0-1).
    Format: {category: "...", confidence: 0.XX}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    // Parse response
    try {
      const match = text.match(/\{category:\s*"([^"]+)",\s*confidence:\s*([\d.]+)\}/);
      if (match) {
        return {
          category: match[1],
          confidence: parseFloat(match[2]),
        };
      }
    } catch (err) {
      console.error('Error parsing classification response:', err.message);
    }

    // Default fallback
    return {
      category: 'team_meeting',
      confidence: 0.5,
    };
  } catch (err) {
    console.error('Error classifying event:', err.message);
    throw err;
  }
}

/**
 * Parse natural language using NLU
 * Supports function calling for intents
 * @param {string} text - Natural language text
 * @param {Object} context - User context
 * @returns {Promise<Object>} Parsed intent
 */
export async function parseNaturalLanguage(text, context = {}) {
  try {
    const client = initClient();
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-pro',
    });

    const tools = {
      functions: [
        {
          name: 'GET_SCHEDULE',
          description: 'Get user schedule for a date or time range',
          parameters: {
            type: 'object',
            properties: {
              dateRange: {
                type: 'string',
                description: 'Date range like "today", "this week", "tomorrow"',
              },
            },
          },
        },
        {
          name: 'GET_TASKS',
          description: 'Get list of tasks with optional filters',
          parameters: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter like "overdue", "today", "high priority"' },
            },
          },
        },
        {
          name: 'MARK_COMPLETE',
          description: 'Mark a task as complete',
          parameters: {
            type: 'object',
            properties: {
              taskDescription: { type: 'string', description: 'Task name or description' },
            },
          },
        },
        {
          name: 'UPDATE_PROGRESS',
          description: 'Update task progress percentage',
          parameters: {
            type: 'object',
            properties: {
              taskDescription: { type: 'string', description: 'Task name' },
              progressPct: { type: 'number', description: 'Progress percentage 0-100' },
            },
          },
        },
        {
          name: 'ADD_TASK',
          description: 'Create a new task',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title' },
              dueDate: { type: 'string', description: 'Due date' },
              priority: { type: 'string', description: 'Priority: high, medium, low' },
            },
          },
        },
        {
          name: 'RESCHEDULE',
          description: 'Reschedule a task to a different date/time',
          parameters: {
            type: 'object',
            properties: {
              taskDescription: { type: 'string', description: 'Task name' },
              newDateTime: { type: 'string', description: 'New date/time' },
            },
          },
        },
        {
          name: 'CHECK_CAPACITY',
          description: 'Check available time/capacity',
          parameters: {
            type: 'object',
            properties: {
              dateRange: { type: 'string', description: 'Date range to check' },
            },
          },
        },
        {
          name: 'GET_TEAM_STATUS',
          description: 'Get team status and workload (manager only)',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'GET_OVERDUE',
          description: 'Get overdue tasks',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'SETTINGS',
          description: 'Update user settings',
          parameters: {
            type: 'object',
            properties: {
              setting: { type: 'string', description: 'Setting name' },
              value: { type: 'string', description: 'Setting value' },
            },
          },
        },
      ],
    };

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text }],
        },
      ],
      tools,
      systemInstruction: `You are a helpful work intelligence assistant. Parse user requests into actions.
        Always respond with a JSON object containing:
        - intent: The primary intent/function to call
        - parameters: Object with function parameters
        - followUp: Optional clarification message if needed`,
    });

    const text_ = response.response.text();

    try {
      // Try to extract JSON from response
      const jsonMatch = text_.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('Error parsing intent response:', err.message);
    }

    return {
      intent: 'UNKNOWN',
      parameters: {},
    };
  } catch (err) {
    console.error('Error parsing natural language:', err.message);
    throw err;
  }
}

/**
 * Generate explanation for scheduling result
 * @param {Object} schedulingResult - Scheduling result object
 * @returns {Promise<string>} Explanation text
 */
export async function generateScheduleExplanation(schedulingResult) {
  try {
    const client = initClient();
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `Briefly explain (2-3 sentences) why these tasks were scheduled this way:
    ${JSON.stringify(schedulingResult, null, 2)}
    
    Explain considering: deadlines, priorities, focus time blocks, and meeting conflicts.`;

    const response = await model.generateContent(prompt);
    return response.response.text();
  } catch (err) {
    console.error('Error generating schedule explanation:', err.message);
    return 'Tasks have been scheduled based on deadlines and priorities.';
  }
}

/**
 * Generate summary of scheduling conflicts
 * @param {Object[]} conflicts - Array of conflict objects
 * @returns {Promise<string>} Conflict summary
 */
export async function generateConflictSummary(conflicts) {
  try {
    if (!conflicts || conflicts.length === 0) {
      return 'No scheduling conflicts detected.';
    }

    const client = initClient();
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `Summarize these scheduling conflicts concisely (1-2 sentences):
    ${JSON.stringify(conflicts, null, 2)}
    
    Mention which tasks conflict and suggest a resolution.`;

    const response = await model.generateContent(prompt);
    return response.response.text();
  } catch (err) {
    console.error('Error generating conflict summary:', err.message);
    return 'There are scheduling conflicts that need resolution.';
  }
}

export default {
  initClient,
  classifyCalendarEvent,
  parseNaturalLanguage,
  generateScheduleExplanation,
  generateConflictSummary,
};
