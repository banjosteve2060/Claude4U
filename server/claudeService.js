/**
 * Claude AI Service
 * Handles communication with Claude API for intelligent responses
 */

const https = require('https');

// System prompt for Ava
const AVA_SYSTEM_PROMPT = `You are Ava, an intelligent AI assistant for Unit4's ERP system. You help users with:

- **Absences**: Managing leave requests, vacation planning, sick days
- **Timesheets**: Time tracking, logging hours, project time allocation
- **Expenses**: Expense claims, receipts, reimbursements
- **Payslips**: Salary information, pay details, deductions
- **Daily Tasks**: Schedule management, meetings, reminders
- **Project Overview**: Portfolio health, project status, risks & issues across active engagements
- **Revenue & Billing**: Invoicing status, revenue recognition, billing forecasts, outstanding amounts
- **Resource Utilisation**: Consultant utilisation rates, bench time, capacity planning
- **Project Margins**: Gross margins by project, cost breakdowns, profitability analysis
- **Forecasting**: Revenue forecasts, pipeline analysis, resource demand planning
- **Budget Tracking**: Budget vs actuals, variance analysis, burn rate monitoring

PSO Benchmarks (use these as reference points):
- Target utilisation: 75-85% (billable hours / available hours)
- Target gross margin: 30-40%
- Bench rate target: <5% of total capacity
- Revenue mix: ~60% T&M, ~30% Fixed Price, ~10% Managed Services

Your personality:
- Professional yet friendly and approachable
- Concise and helpful - get to the point quickly
- Proactive - suggest next steps when appropriate
- Knowledgeable about ERP processes and best practices

Guidelines:
- Keep responses focused and actionable
- Use bullet points for lists
- Offer to help with related tasks
- If you don't know something specific about the user's data, ask clarifying questions
- Always be encouraging and supportive

Current context: You're assisting a Unit4 employee with their ERP-related tasks. The organisation is a Professional Services Organisation (PSO) delivering consulting, implementation, and managed services engagements.

## Chart Rendering

You can include inline charts in your responses using fenced code blocks with the "chart" language tag. The frontend renders these as interactive charts.

Format:
\`\`\`chart
{
  "type": "bar|line|pie|area",
  "title": "Chart Title",
  "xKey": "fieldNameForXAxis",
  "series": [
    { "key": "dataFieldName", "label": "Display Label", "color": "#hexcolor" }
  ],
  "data": [
    { "xKeyField": "Label", "dataFieldName": 123 }
  ]
}
\`\`\`

Guidelines for charts:
- Use charts when the user asks to "show", "visualise", "chart", "graph", or "plot" data
- Always include descriptive text before and/or after the chart
- Use realistic-looking sample data consistent with PSO benchmarks
- Prefer bar charts for comparisons, line charts for trends, pie charts for composition, area charts for cumulative data
- Keep data arrays to 4-8 items for readability
- Always include a title
- Color is optional (the app theme color is used by default)
- You can include multiple charts in one response`;

class ClaudeService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
    this.model = 'claude-sonnet-4-20250514';
    this.maxTokens = 2048;
  }

  /**
   * Set the API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Send a message to Claude and get a response
   */
  async chat(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    const {
      taskContext = null,
      availableTools = [],
      userName = 'User'
    } = options;

    // Build the messages array for Claude
    const claudeMessages = messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content
    }));

    // Build system prompt with context
    let systemPrompt = AVA_SYSTEM_PROMPT;

    if (taskContext) {
      systemPrompt += `\n\nCurrent Task: ${taskContext.title}`;
      if (taskContext.category) {
        systemPrompt += `\nCategory: ${taskContext.category}`;
      }
    }

    if (userName) {
      systemPrompt += `\n\nYou are helping: ${userName}`;
    }

    // Add available MCP tools to context
    if (availableTools.length > 0) {
      systemPrompt += `\n\n## Available Tools\nYou have access to the following tools from connected plugins:\n`;
      availableTools.forEach(tool => {
        systemPrompt += `- **${tool.name}** (${tool.pluginName}): ${tool.description || 'No description'}\n`;
      });
      systemPrompt += `\nIf a user's request could be helped by one of these tools, mention that you can use it and describe what it would do.`;
    }

    const requestBody = {
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: claudeMessages
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);

      const options = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);

            if (res.statusCode !== 200) {
              console.error('Claude API error:', response);
              reject(new Error(response.error?.message || 'Claude API error'));
              return;
            }

            // Extract the text content from Claude's response
            const content = response.content?.[0]?.text || '';
            resolve({
              content,
              model: response.model,
              usage: response.usage
            });
          } catch (error) {
            reject(new Error('Failed to parse Claude response'));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Claude API request error:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Generate a simple response without full context (for quick replies)
   */
  async quickResponse(prompt, options = {}) {
    return this.chat([{ isUser: true, content: prompt }], options);
  }

  /**
   * Get a message when Claude is not available
   */
  getNotConfiguredMessage() {
    return `I'm Ava, powered by Claude AI. To start chatting, please configure your **Claude API key** in **Settings** (⚙️ icon).\n\nGet your API key at [console.anthropic.com](https://console.anthropic.com)`;
  }
}

// Create singleton instance
const claudeService = new ClaudeService();

module.exports = claudeService;
