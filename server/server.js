const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mcpClient = require('./mcpClient');
const claudeService = require('./claudeService');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// ============ EPHEMERAL IN-MEMORY STATE (not persisted) ============

// Active socket connections — socketId -> { email, name, socketId }
const users = new Map();

// Collaborator online/socket state — taskId -> Map<email, { socketId, isOnline }>
const collaboratorSockets = new Map();

// Admin user email (must match frontend ADMIN_EMAIL)
const ADMIN_EMAIL = db.ADMIN_EMAIL;

// PSO Roles
const PSO_ROLES = [
  { id: 'consultant', name: 'Consultant', description: 'Implementation consultant' },
  { id: 'senior_consultant', name: 'Senior Consultant', description: 'Senior implementation consultant' },
  { id: 'principal_consultant', name: 'Principal Consultant', description: 'Principal implementation consultant' },
  { id: 'project_manager', name: 'Project Manager', description: 'Manages project delivery' },
  { id: 'solution_architect', name: 'Solution Architect', description: 'Designs technical solutions' },
  { id: 'technical_consultant', name: 'Technical Consultant', description: 'Technical implementation specialist' },
  { id: 'functional_consultant', name: 'Functional Consultant', description: 'Functional area specialist' },
  { id: 'team_lead', name: 'Team Lead', description: 'Leads consulting teams' },
  { id: 'practice_manager', name: 'Practice Manager', description: 'Manages PSO practice area' },
  { id: 'admin', name: 'Administrator', description: 'System administrator' }
];

// ============ AVA AI RESPONSE GENERATOR ============

// Canned responses used when Claude API is NOT configured.
// When Claude IS configured, these are bypassed entirely and Claude handles all responses.
const generateAvaResponse = (taskId, userMessage, userName, taskTitle = '') => {
  const message = userMessage.toLowerCase();
  const normalizedTitle = taskTitle.toLowerCase();

  if (taskId === 'task-today' || normalizedTitle.includes('today')) {
    if (message.includes('meeting') || message.includes('schedule')) {
      return `Hi ${userName}! I can help you manage your schedule. You have 3 meetings today:\n\n• 9:00 AM - Team Standup\n• 11:30 AM - Project Review\n• 2:00 PM - Client Call\n\nWould you like me to reschedule any of these or add a new meeting?`;
    }
    if (message.includes('task') || message.includes('todo') || message.includes('do today')) {
      return `Here's your task summary for today:\n\n✅ 2 tasks completed\n🔄 3 tasks in progress\n⏳ 5 tasks pending\n\nYour top priorities are:\n1. Review Q4 budget proposal\n2. Approve timesheet submissions\n3. Respond to HR inquiry\n\nWould you like me to help with any of these?`;
    }
    return `Hello ${userName}! I'm Ava, your ERP assistant. I can help you with your daily tasks, schedule, and work management. What would you like to accomplish today?`;
  }

  if (taskId === 'task-absences' || normalizedTitle.includes('absence')) {
    if (message.includes('book') || message.includes('request') || message.includes('holiday') || message.includes('leave')) {
      return `I can help you request time off! 📅\n\nYour current leave balance:\n• Annual Leave: 18 days remaining\n• Sick Leave: 10 days remaining\n• Personal Days: 3 days remaining\n\nTo request leave, please tell me:\n1. Type of leave\n2. Start date\n3. End date\n\nOr I can show you the team calendar to check availability.`;
    }
    if (message.includes('balance') || message.includes('how many') || message.includes('remaining')) {
      return `Here's your current leave balance:\n\n🏖️ **Annual Leave:** 18 days remaining (of 25)\n🏥 **Sick Leave:** 10 days remaining (of 10)\n👤 **Personal Days:** 3 days remaining (of 5)\n\nYou've used 7 days of annual leave this year. Would you like to request time off?`;
    }
    if (message.includes('team') || message.includes('who') || message.includes('calendar')) {
      return `Here's the team absence calendar for this week:\n\n• **Mon-Tue:** Sarah Johnson (Annual Leave)\n• **Wed:** No absences\n• **Thu-Fri:** Mike Chen (Conference)\n\nThe team has good coverage this week. Would you like to book some time off?`;
    }
    return `Hi ${userName}! I can help you manage absences and time off requests. I can:\n\n• Check your leave balance\n• Request time off\n• View team calendar\n• Track absence history\n\nWhat would you like to do?`;
  }

  if (taskId === 'task-timesheets' || normalizedTitle.includes('timesheet')) {
    if (message.includes('submit') || message.includes('fill') || message.includes('enter')) {
      return `I'll help you submit your timesheet! 📝\n\n**Current Week Status:** 32 of 40 hours logged\n\nHours by project:\n• Project Alpha: 16 hours\n• Client Support: 10 hours\n• Internal Meetings: 6 hours\n\nYou need to log 8 more hours. Would you like me to:\n1. Add hours to an existing project\n2. Start a new time entry\n3. Copy last week's timesheet`;
    }
    if (message.includes('approve') || message.includes('pending') || message.includes('review')) {
      return `**Timesheet Approvals Pending:** 5\n\n1. Sarah Johnson - 40 hrs (awaiting since Mon)\n2. Mike Chen - 38 hrs (awaiting since Tue)\n3. Emily Davis - 42 hrs ⚠️ overtime\n4. Tom Wilson - 40 hrs (awaiting since Wed)\n5. Lisa Brown - 36 hrs (awaiting since Wed)\n\nWould you like to approve all standard timesheets or review them individually?`;
    }
    if (message.includes('status') || message.includes('hours')) {
      return `**Your Timesheet Status:**\n\n✅ Last week: Approved (40 hours)\n🔄 This week: In Progress (32/40 hours)\n\n**Breakdown:**\n• Mon: 8 hrs ✓\n• Tue: 8 hrs ✓\n• Wed: 8 hrs ✓\n• Thu: 8 hrs ✓\n• Fri: 0 hrs (pending)\n\nDon't forget to submit by Friday 5 PM!`;
    }
    return `Hi ${userName}! I can help you with timesheets. I can:\n\n• Submit your timesheet\n• Check timesheet status\n• Review team submissions\n• Generate time reports\n\nWhat would you like to do?`;
  }

  if (taskId === 'task-expenses' || normalizedTitle.includes('expense')) {
    if (message.includes('submit') || message.includes('claim') || message.includes('add') || message.includes('new')) {
      return `I'll help you submit an expense claim! 💳\n\nPlease provide:\n1. **Amount**\n2. **Category** (Travel, Meals, Supplies, Other)\n3. **Date** of expense\n4. **Description**\n\nOr you can upload a receipt and I'll extract the details automatically.\n\n💡 Tip: Expenses under £50 are auto-approved!`;
    }
    if (message.includes('status') || message.includes('pending') || message.includes('approve')) {
      return `**Your Expense Claims:**\n\n🟢 **Approved:** £342.50 (3 claims)\n🟡 **Pending:** £128.75 (2 claims)\n🔴 **Rejected:** £0.00\n\n**Pending Claims:**\n1. Travel - London meeting - £85.00\n2. Client lunch - £43.75\n\nBoth are awaiting manager approval. Need me to send a reminder?`;
    }
    if (message.includes('policy') || message.includes('limit') || message.includes('rules')) {
      return `**Expense Policy Summary:**\n\n✈️ **Travel:** Pre-approval required over £200\n🍽️ **Meals:** £25 per person limit\n🏨 **Hotels:** £150/night max (London: £200)\n🚗 **Mileage:** £0.45 per mile\n\n📋 Receipts required for all claims over £25\n⏰ Submit within 30 days of expense\n\nNeed more details on any category?`;
    }
    return `Hi ${userName}! I can help you manage expenses. I can:\n\n• Submit new expense claims\n• Check claim status\n• Review expense policy\n• Generate expense reports\n\nWhat would you like to do?`;
  }

  if (taskId === 'task-payslips' || normalizedTitle.includes('payslip')) {
    if (message.includes('latest') || message.includes('recent') || message.includes('this month') || message.includes('view')) {
      return `**Your Latest Payslip - January 2026**\n\n💰 **Gross Pay:** £4,583.33\n\n**Deductions:**\n• Income Tax: £687.50\n• National Insurance: £412.50\n• Pension (5%): £229.17\n\n✅ **Net Pay:** £3,254.16\n\n📅 Payment Date: January 28, 2026\n\nWould you like to download the PDF or view previous payslips?`;
    }
    if (message.includes('history') || message.includes('previous') || message.includes('past')) {
      return `**Your Payslip History:**\n\n📄 January 2026 - £3,254.16 net\n📄 December 2025 - £3,254.16 net\n📄 November 2025 - £3,254.16 net\n📄 October 2025 - £3,456.28 net (incl. bonus)\n📄 September 2025 - £3,254.16 net\n\nWould you like to download any of these or see a year-to-date summary?`;
    }
    if (message.includes('tax') || message.includes('p60') || message.includes('p45')) {
      return `**Tax Documents Available:**\n\n📋 **P60 (2024-25):** Available for download\n📋 **P60 (2023-24):** Available for download\n\n**Current Tax Year Summary:**\n• Gross earnings YTD: £45,833.30\n• Tax paid YTD: £6,875.00\n• NI paid YTD: £4,125.00\n\nWould you like me to download your P60?`;
    }
    return `Hi ${userName}! I can help you with payslips and compensation. I can:\n\n• View your latest payslip\n• Access payslip history\n• Download tax documents (P60)\n• Explain deductions\n\nWhat would you like to see?`;
  }

  // ============ PROJECT FINANCIALS CANNED RESPONSES ============

  if (normalizedTitle.includes('project overview')) {
    if (message.includes('status') || message.includes('health') || message.includes('summary')) {
      return `**Active Project Portfolio Summary**\n\n**Healthy (4 projects):**\n• Contoso ERP Implementation - £1.2M | 65% complete | On track\n• Fabrikam Cloud Migration - £480K | 40% complete | On track\n• Northwind HR Module - £320K | 85% complete | Ahead of schedule\n• Woodgrove Finance Upgrade - £750K | 30% complete | On track\n\n**At Risk (2 projects):**\n• Tailspin Toys Integration - £560K | 55% complete | 2 weeks behind\n• Adventure Works Analytics - £290K | 70% complete | Budget pressure\n\n**Critical (1 project):**\n• Litware Payroll Migration - £410K | 45% complete | Scope creep\n\n**Portfolio Total:** £4.01M across 7 active projects\n\nWould you like to drill into any specific project?`;
    }
    if (message.includes('risk') || message.includes('issue') || message.includes('concern')) {
      return `**Current Project Risks & Issues:**\n\n**High Priority:**\n1. Litware Payroll - Scope expanded by 30% without change order. Recommend CR discussion this week.\n2. Tailspin Toys - Key developer on sick leave, impacting sprint velocity.\n\n**Medium Priority:**\n3. Adventure Works - Client requesting additional dashboards not in SOW.\n4. Contoso ERP - Go-live environment not yet provisioned by client IT.\n\n**Low Priority:**\n5. Fabrikam - Minor data quality issues in legacy system extract.\n\n**Action Items:** 3 risk mitigations overdue\n\nWould you like me to prepare a risk mitigation plan for any of these?`;
    }
    return `Hi ${userName}! I can help you get an overview of your project portfolio. I can:\n\n• View active project status and health indicators\n• Review project risks and issues\n• Check project milestones and timelines\n• Summarise portfolio KPIs\n\nWhat would you like to see?`;
  }

  if (normalizedTitle.includes('revenue') || normalizedTitle.includes('billing')) {
    if (message.includes('invoice') || message.includes('billing') || message.includes('outstanding')) {
      return `**Invoicing Summary - This Month:**\n\n**Invoiced:** £385,000\n**Ready to Invoice:** £142,500\n**Overdue (>30 days):** £67,200\n\n**Outstanding Invoices:**\n1. Contoso - INV-2026-041 - £95,000 - Due 15 Mar\n2. Tailspin Toys - INV-2026-038 - £67,200 - **Overdue** (45 days)\n3. Northwind - INV-2026-045 - £47,500 - Due 28 Feb\n\n**Billing Milestones This Month:**\n• Fabrikam Phase 2 sign-off: £120,000 (pending client approval)\n• Woodgrove Sprint 3 delivery: £87,500 (on track)\n\nWould you like me to chase any overdue invoices or prepare a billing forecast?`;
    }
    if (message.includes('revenue') || message.includes('recognised') || message.includes('forecast')) {
      return `**Revenue Recognition - Q1 2026:**\n\n**Monthly Breakdown:**\n• January: £410,000 (actual)\n• February: £395,000 (projected)\n• March: £450,000 (projected)\n\n**Q1 Total: £1,255,000** (target: £1,200,000) - 105%\n\n**By Revenue Type:**\n• Time & Materials: £680,000 (54%)\n• Fixed Price Milestones: £420,000 (34%)\n• Managed Services: £155,000 (12%)\n\n**YoY Growth:** +12% vs Q1 2025\n\nWould you like to see revenue by project or by client?`;
    }
    return `Hi ${userName}! I can help you manage project revenue and billing. I can:\n\n• Review invoicing status and outstanding amounts\n• Track revenue recognition and forecasts\n• Monitor billing milestones\n• Analyse revenue by client or project\n\nWhat would you like to explore?`;
  }

  if (normalizedTitle.includes('resource') || normalizedTitle.includes('utilisation')) {
    if (message.includes('rate') || message.includes('utilisation') || message.includes('utilization') || message.includes('target')) {
      return `**Resource Utilisation - February 2026:**\n\n**Target:** 80% | **Actual:** 76.5%\n\n**By Role:**\n• Senior Consultants: 84% (target: 80%)\n• Consultants: 78% (target: 80%)\n• Solution Architects: 72% (target: 75%)\n• Project Managers: 69% (target: 65%)\n• Technical Consultants: 81% (target: 80%)\n\n**Top Performers:**\n1. Sarah Senior - 91% utilisation\n2. Tom Technical - 88% utilisation\n3. Fiona Functional - 85% utilisation\n\n**Below Target:**\n1. New Hire (ramping) - 45%\n2. Sam Architect - 62% (between projects)\n\nWould you like to see capacity planning or bench time details?`;
    }
    if (message.includes('bench') || message.includes('available') || message.includes('capacity') || message.includes('free')) {
      return `**Current Bench & Availability:**\n\n**On Bench (full-time available):**\n• Junior Consultant (new hire) - Available now, completing onboarding\n• Consultant B - Available from 1 Mar (project ending)\n\n**Partially Available:**\n• Sam Architect - 40% available (3 days/week free)\n• Pat Practice - 60% available (management duties only 2 days)\n\n**Upcoming Availability (Next 30 Days):**\n• 3 consultants rolling off Northwind project (15 Mar)\n• 1 PM available after Contoso go-live (20 Mar)\n\n**Bench Cost This Month:** £18,500\n**Bench Rate:** 4.2% (target: <5%)\n\nWould you like to see demand pipeline to match available resources?`;
    }
    return `Hi ${userName}! I can help you track resource utilisation and capacity. I can:\n\n• Review utilisation rates by team and role\n• Check bench time and available resources\n• Plan capacity against project demand\n• Identify utilisation trends\n\nWhat would you like to know?`;
  }

  if (normalizedTitle.includes('margin') || normalizedTitle.includes('profitability')) {
    if (message.includes('margin') || message.includes('profit') || message.includes('gross')) {
      return `**Project Margin Analysis - February 2026:**\n\n**Portfolio Gross Margin:** 34.2% (target: 35%)\n\n**By Project:**\n• Northwind HR Module: 42% (strong)\n• Contoso ERP Implementation: 38%\n• Fabrikam Cloud Migration: 35%\n• Woodgrove Finance Upgrade: 33%\n• Adventure Works Analytics: 28% (under target)\n• Tailspin Toys Integration: 25% (overruns)\n• Litware Payroll Migration: 18% (critical)\n\n**Margin Trend:** Down 1.8% from January (scope creep on 2 projects)\n\n**Action Required:** Litware margin at risk of falling below 15% threshold\n\nWould you like a detailed cost breakdown for any project?`;
    }
    if (message.includes('cost') || message.includes('breakdown') || message.includes('expense')) {
      return `**Cost Breakdown - Active Projects:**\n\n**Labour Costs (78% of total):**\n• Billable staff: £245,000/month\n• Non-billable overhead: £32,000/month\n\n**Direct Costs (15% of total):**\n• Software licences: £28,000/month\n• Infrastructure: £12,000/month\n• Travel & expenses: £8,500/month\n\n**Indirect Costs (7% of total):**\n• Project management overhead: £15,000/month\n• Quality assurance: £7,500/month\n\n**Total Monthly Cost Base:** £348,000\n**Revenue Run Rate:** £530,000/month\n**Implied Margin:** 34.3%\n\nWould you like me to identify specific cost-saving opportunities?`;
    }
    return `Hi ${userName}! I can help you analyse project margins and profitability. I can:\n\n• Review gross margins by project\n• Analyse cost breakdowns\n• Track profitability trends\n• Identify margin improvement opportunities\n\nWhat would you like to review?`;
  }

  if (normalizedTitle.includes('forecast')) {
    if (message.includes('revenue') || message.includes('pipeline') || message.includes('outlook')) {
      return `**Revenue Forecast - 2026:**\n\n**Quarterly Outlook:**\n• Q1: £1,255,000 (95% confidence - mostly contracted)\n• Q2: £1,380,000 (75% confidence - pipeline dependent)\n• Q3: £1,200,000 (50% confidence - requires new wins)\n• Q4: £1,450,000 (40% confidence - budget season)\n\n**Full Year Forecast:** £5,285,000 (target: £5,000,000)\n\n**Pipeline by Stage:**\n• Contracted: £2,400,000\n• Verbal commitment: £850,000\n• Proposal submitted: £1,200,000\n• Qualified lead: £1,800,000\n\n**Win Rate (rolling 12m):** 38%\n\nWould you like to see forecasts by client or service line?`;
    }
    if (message.includes('resource') || message.includes('demand') || message.includes('hiring') || message.includes('plan')) {
      return `**Resource Demand Forecast - Next 90 Days:**\n\n**Current Headcount:** 24 billable resources\n**Projected Demand:** 28 FTEs needed by April\n\n**Gap Analysis:**\n• Senior Consultants: Need 2 more (1 hiring, 1 to start)\n• Solution Architects: Need 1 more (interviewing)\n• Technical Consultants: Balanced\n• Project Managers: Need 1 more for Q2 projects\n\n**Key Demand Drivers:**\n1. Woodgrove Phase 2 ramp-up: +3 FTEs from March\n2. New Contoso workstream: +2 FTEs from April\n3. Northwind wind-down: -2 FTEs from mid-March\n\n**Contractor Budget Available:** £45,000/month for gap coverage\n\nWould you like to see skills-based demand or the hiring pipeline?`;
    }
    return `Hi ${userName}! I can help you with project and resource forecasting. I can:\n\n• Review revenue forecasts and pipeline\n• Analyse resource demand planning\n• Track forecast accuracy trends\n• Model different scenarios\n\nWhat would you like to forecast?`;
  }

  if (normalizedTitle.includes('budget')) {
    if (message.includes('variance') || message.includes('actual') || message.includes('vs') || message.includes('track')) {
      return `**Budget vs Actuals - February 2026:**\n\n**Portfolio Summary:**\n• Total Budget: £4,010,000\n• Spent to Date: £2,180,000 (54%)\n• Remaining: £1,830,000\n\n**By Project:**\n• Contoso ERP - Budget: £1,200K | Actual: £680K | On track\n• Fabrikam Cloud - Budget: £480K | Actual: £210K | On track\n• Northwind HR - Budget: £320K | Actual: £285K | 89% spent, 85% done\n• Woodgrove Finance - Budget: £750K | Actual: £240K | On track\n• Tailspin Toys - Budget: £560K | Actual: £380K | 68% spent, 55% done\n• Adventure Works - Budget: £290K | Actual: £225K | 78% spent, 70% done\n• Litware Payroll - Budget: £410K | Actual: £260K | 63% spent, 45% done\n\nWould you like to see the burn rate analysis for any project?`;
    }
    if (message.includes('burn') || message.includes('rate') || message.includes('runway')) {
      return `**Burn Rate Analysis - At Risk Projects:**\n\n**Litware Payroll Migration:**\n• Monthly burn: £58,000\n• Remaining budget: £150,000\n• Runway: 2.6 months\n• Estimated completion: 4.5 months\n• **Projected overrun: £111,000 (27%)**\n\n**Tailspin Toys Integration:**\n• Monthly burn: £52,000\n• Remaining budget: £180,000\n• Runway: 3.5 months\n• Estimated completion: 4.0 months\n• **Projected overrun: £28,000 (5%)**\n\nAll other projects within 5% of planned burn.\n\n**Recommendation:** Initiate change request for Litware (£111K exposure). Schedule budget review for Tailspin.\n\nWould you like me to draft a change request or prepare a budget review pack?`;
    }
    return `Hi ${userName}! I can help you track project budgets. I can:\n\n• Compare budgets vs actuals with variance analysis\n• Analyse burn rates and project runway\n• Monitor cost overruns and underspends\n• Generate budget reports\n\nWhat would you like to review?`;
  }

  // ============ GENERIC RESPONSES ============

  if (message.includes('help') || message.includes('what can you do')) {
    return `I'm Ava, your AI-powered ERP assistant!\n\nI can help you with:\n• Managing your daily tasks\n• Booking absences and leave\n• Submitting timesheets\n• Processing expense claims\n• Viewing payslips\n• Project financials & PSO metrics\n\nJust ask me anything or select a specific task from the sidebar!`;
  }

  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return `Hello ${userName}! I'm Ava, your ERP assistant. How can I help you today?`;
  }

  if (message.includes('thank')) {
    return `You're welcome, ${userName}! Is there anything else I can help you with?`;
  }

  return `Thanks for your message, ${userName}! I'm here to help with your ERP tasks. Could you tell me more about what you need? I can assist with:\n\n• Daily task management\n• Absence requests\n• Timesheet submissions\n• Expense claims\n• Payslip queries\n• Project financials & PSO reporting\n\nJust let me know what you'd like to do!`;
};

// ============ REST API ENDPOINTS ============

// Health check endpoint for sync status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: users.size
  });
});

// ============ USER MANAGEMENT ENDPOINTS ============

// Check if user exists (for login validation)
app.get('/api/users/:email/exists', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const exists = (await db.userExists(email)) || email === ADMIN_EMAIL;
    res.json({ exists });
  } catch (err) {
    console.error('Error checking user existence:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all registered users (admin only)
app.get('/api/users', async (req, res) => {
  try {
    const rows = await db.getAllUsers();
    const userList = rows.map(row => {
      const data = row.data || {};
      return {
        email: row.email,
        name: row.name,
        role: row.role,
        createdAt: row.created_at,
        lastUpdated: row.last_updated || null,
        taskCount: (data.folders || []).reduce((sum, f) => sum + (f.tasks?.length || 0), 0)
      };
    });
    res.json(userList);
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new user (admin only)
app.post('/api/users', async (req, res) => {
  try {
    const { email, name, role, createdBy } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const emailLower = email.toLowerCase();

    if (!emailLower.endsWith('@unit4.com')) {
      return res.status(400).json({ error: 'Only @unit4.com emails allowed' });
    }

    if (await db.userExists(emailLower)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = await db.createUser(emailLower, name, role || 'consultant', createdBy || ADMIN_EMAIL);
    await db.saveUserData(emailLower, db.getDefaultUserData());

    console.log(`User created: ${emailLower}`);
    res.status(201).json({
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.created_at,
      createdBy: newUser.created_by
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a user (admin only)
app.delete('/api/users/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();

    if (email === ADMIN_EMAIL) {
      return res.status(400).json({ error: 'Cannot delete admin user' });
    }

    if (!(await db.userExists(email))) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.deleteSharedTasksByEmail(email);
    await db.deleteUser(email); // CASCADE handles user_data

    console.log(`User deleted: ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user data (folders, tasks, settings, etc.)
app.get('/api/users/:email/data', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();

    // Check if user exists (or is admin)
    const userInfo = await db.findUser(email);
    if (!userInfo && email !== ADMIN_EMAIL) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create user data
    let dataRow = await db.getUserData(email);
    let data;
    if (!dataRow) {
      data = db.getDefaultUserData();
      await db.saveUserData(email, data);
    } else {
      data = dataRow.data;
    }

    // Build user info response
    const user = userInfo
      ? { email: userInfo.email, name: userInfo.name, role: userInfo.role, createdAt: userInfo.created_at, createdBy: userInfo.created_by }
      : { email, name: email.split('@')[0] };

    res.json({ user, data });
  } catch (err) {
    console.error('Error getting user data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save user data
app.put('/api/users/:email/data', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const { folders, openTabs, activeTask, expandedFolders, messages, unreadTasks, darkMode, quickActions, name } = req.body;

    // Check if user exists
    if (!(await db.userExists(email))) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get existing data or defaults
    const existingRow = await db.getUserData(email);
    const existingData = existingRow?.data || db.getDefaultUserData();

    const updatedData = {
      folders: folders !== undefined ? folders : existingData.folders,
      openTabs: openTabs !== undefined ? openTabs : existingData.openTabs,
      activeTask: activeTask !== undefined ? activeTask : existingData.activeTask,
      expandedFolders: expandedFolders !== undefined ? expandedFolders : existingData.expandedFolders,
      messages: messages !== undefined ? messages : existingData.messages,
      unreadTasks: unreadTasks !== undefined ? unreadTasks : existingData.unreadTasks,
      darkMode: darkMode !== undefined ? darkMode : existingData.darkMode,
      quickActions: quickActions !== undefined ? quickActions : existingData.quickActions,
      lastUpdated: new Date().toISOString()
    };

    await db.saveUserData(email, updatedData);

    // Update user name if provided
    if (name) {
      await db.updateUserName(email, name);
    }

    res.json({ success: true, data: updatedData });
  } catch (err) {
    console.error('Error saving user data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ END USER MANAGEMENT ENDPOINTS ============

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const rows = await db.getAllTasks();
    res.json(rows.map(r => ({
      id: r.id,
      title: r.title,
      status: r.status,
      folderId: r.folder_id,
      createdAt: r.created_at
    })));
  } catch (err) {
    console.error('Error getting tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task by ID
app.get('/api/tasks/:taskId', async (req, res) => {
  try {
    const task = await db.getTask(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({
      id: task.id,
      title: task.title,
      status: task.status,
      folderId: task.folder_id,
      createdAt: task.created_at
    });
  } catch (err) {
    console.error('Error getting task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a task and all associated data
app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    await db.deleteTask(taskId); // CASCADE handles collaborators + messages
    collaboratorSockets.delete(taskId); // Clean up ephemeral state

    // Notify connected clients
    io.to(`task:${taskId}`).emit('task:deleted', { taskId });

    console.log(`Task deleted: ${taskId}`);
    res.json({ success: true, taskId });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new task with unique ID
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, status = 'pending', folderId, customId } = req.body;
    const taskId = customId || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const row = await db.createTask(taskId, title, status, folderId);
    const task = {
      id: row.id,
      title: row.title,
      status: row.status,
      folderId: row.folder_id,
      createdAt: row.created_at
    };

    io.emit('task:created', task);
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get collaborators for a task
app.get('/api/tasks/:taskId/collaborators', async (req, res) => {
  try {
    await db.ensureTaskExists(req.params.taskId);
    const rows = await db.getCollaborators(req.params.taskId);
    const socketState = collaboratorSockets.get(req.params.taskId) || new Map();

    // Merge persistent DB data + ephemeral socket state
    const result = rows.map(c => ({
      id: c.id,
      email: c.email,
      name: c.name,
      addedAt: c.added_at,
      invitedBy: c.invited_by,
      isOnline: socketState.get(c.email)?.isOnline || false,
      socketId: socketState.get(c.email)?.socketId || null
    }));
    res.json(result);
  } catch (err) {
    console.error('Error getting collaborators:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks shared with a specific user
app.get('/api/users/:email/shared-tasks', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const rows = await db.getSharedTasks(email);
    res.json(rows.map(r => ({
      taskId: r.task_id,
      title: r.title,
      sharedBy: r.shared_by,
      sharedByName: r.shared_by_name,
      sharedAt: r.shared_at
    })));
  } catch (err) {
    console.error('Error getting shared tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add collaborator to a task
app.post('/api/tasks/:taskId/collaborators', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { email, name, invitedBy, invitedByName, taskTitle } = req.body;

    // Auto-create task if it doesn't exist
    await db.ensureTaskExists(taskId, taskTitle || 'Shared Task');

    // Update task title if provided
    if (taskTitle) {
      await db.updateTaskTitle(taskId, taskTitle);
    }

    // Check if already a collaborator
    if (await db.collaboratorExists(taskId, email)) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    const collabId = uuidv4();
    const collaboratorRow = await db.addCollaborator(taskId, collabId, email, name || email.split('@')[0], invitedBy);

    // Store invitation
    await db.addInvitation(email, taskId, invitedBy);

    // Store shared task info
    const task = await db.getTask(taskId);
    const sharedTaskResult = await db.addSharedTask(
      email.toLowerCase(),
      taskId,
      taskTitle || task?.title || 'Shared Task',
      invitedBy,
      invitedByName || invitedBy?.split('@')[0] || 'Someone'
    );

    // Notify the recipient if they're online
    if (sharedTaskResult) {
      const sharedTaskInfo = {
        taskId,
        title: sharedTaskResult.title,
        sharedBy: sharedTaskResult.shared_by,
        sharedByName: sharedTaskResult.shared_by_name,
        sharedAt: sharedTaskResult.shared_at
      };
      for (const [socketId, user] of users.entries()) {
        if (user.email?.toLowerCase() === email.toLowerCase()) {
          io.to(socketId).emit('task:shared', sharedTaskInfo);
        }
      }
    }

    const responseCollaborator = {
      id: collaboratorRow.id,
      email: collaboratorRow.email,
      name: collaboratorRow.name,
      addedAt: collaboratorRow.added_at,
      invitedBy: collaboratorRow.invited_by,
      isOnline: false,
      socketId: null
    };

    // Notify all connected clients about the new collaborator
    io.to(`task:${taskId}`).emit('collaborator:added', { taskId, collaborator: responseCollaborator });

    res.status(201).json(responseCollaborator);
  } catch (err) {
    console.error('Error adding collaborator:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove collaborator from a task
app.delete('/api/tasks/:taskId/collaborators/:email', async (req, res) => {
  try {
    const { taskId, email } = req.params;
    const emailLower = decodeURIComponent(email).toLowerCase();

    await db.removeCollaborator(taskId, emailLower);
    await db.removeSharedTask(emailLower, taskId);

    // Clean up ephemeral state
    const socketState = collaboratorSockets.get(taskId);
    if (socketState) socketState.delete(emailLower);

    // Notify the user if they're online
    for (const [socketId, user] of users.entries()) {
      if (user.email?.toLowerCase() === emailLower) {
        io.to(socketId).emit('task:unshared', { taskId });
      }
    }

    // Notify all connected clients in the task room
    io.to(`task:${taskId}`).emit('collaborator:removed', { taskId, email });

    res.json({ success: true });
  } catch (err) {
    console.error('Error removing collaborator:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a task
app.get('/api/tasks/:taskId/messages', async (req, res) => {
  try {
    const rows = await db.getTaskMessages(req.params.taskId);
    res.json(rows.map(m => ({
      id: m.id,
      content: m.content,
      isUser: m.is_user,
      userId: m.user_id,
      userName: m.user_name,
      userEmail: m.user_email,
      timestamp: m.timestamp,
      createdAt: m.created_at
    })));
  } catch (err) {
    console.error('Error getting messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add message to a task
app.post('/api/tasks/:taskId/messages', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, isUser, userId, userName } = req.body;

    const id = uuidv4();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const row = await db.addTaskMessage(taskId, id, content, isUser, userId, userName, null, timestamp);

    const message = {
      id: row.id,
      content: row.content,
      isUser: row.is_user,
      userId: row.user_id,
      userName: row.user_name,
      timestamp: row.timestamp,
      createdAt: row.created_at
    };

    // Broadcast to all clients in the task room
    io.to(`task:${taskId}`).emit('message:new', { taskId, message });

    res.status(201).json(message);
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get share link for a task
app.get('/api/tasks/:taskId/share-link', async (req, res) => {
  try {
    const { taskId } = req.params;
    await db.ensureTaskExists(taskId);

    // Generate a shareable link
    const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${taskId}`;
    res.json({ shareLink, taskId });
  } catch (err) {
    console.error('Error getting share link:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ SOCKET.IO CONNECTION HANDLING ============

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  let currentUser = null;
  let joinedTasks = new Set();

  // User authentication/identification
  socket.on('user:identify', async ({ email, name }) => {
    currentUser = { email, name, socketId: socket.id };
    users.set(socket.id, currentUser);

    try {
      // Check for pending invitations
      const userInvitations = await db.getInvitations(email);
      if (userInvitations.length > 0) {
        socket.emit('invitations:pending', userInvitations.map(inv => ({
          taskId: inv.task_id,
          invitedBy: inv.invited_by,
          invitedAt: inv.invited_at
        })));
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }

    console.log(`User identified: ${email}`);
  });

  // Join a task room for real-time updates
  socket.on('task:join', async ({ taskId }) => {
    socket.join(`task:${taskId}`);
    joinedTasks.add(taskId);

    try {
      // Update ephemeral online status
      if (currentUser?.email) {
        if (!collaboratorSockets.has(taskId)) {
          collaboratorSockets.set(taskId, new Map());
        }
        collaboratorSockets.get(taskId).set(currentUser.email, {
          socketId: socket.id,
          isOnline: true
        });
        io.to(`task:${taskId}`).emit('collaborator:online', { taskId, email: currentUser.email });
      }

      // Send collaborators (merged persistent + ephemeral)
      const rows = await db.getCollaborators(taskId);
      const socketState = collaboratorSockets.get(taskId) || new Map();
      const taskCollaborators = rows.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name,
        addedAt: c.added_at,
        invitedBy: c.invited_by,
        isOnline: socketState.get(c.email)?.isOnline || false,
        socketId: socketState.get(c.email)?.socketId || null
      }));
      socket.emit('task:collaborators', { taskId, collaborators: taskCollaborators });

      // Send existing messages
      const messageRows = await db.getTaskMessages(taskId);
      const messages = messageRows.map(m => ({
        id: m.id,
        content: m.content,
        isUser: m.is_user,
        userId: m.user_id,
        userName: m.user_name,
        userEmail: m.user_email,
        timestamp: m.timestamp,
        createdAt: m.created_at
      }));
      socket.emit('task:messages', { taskId, messages });
    } catch (err) {
      console.error('Error in task:join:', err);
    }

    console.log(`User ${socket.id} joined task: ${taskId}`);
  });

  // Leave a task room
  socket.on('task:leave', ({ taskId }) => {
    socket.leave(`task:${taskId}`);
    joinedTasks.delete(taskId);

    // Update ephemeral online status
    const socketState = collaboratorSockets.get(taskId);
    if (socketState && currentUser?.email) {
      const entry = socketState.get(currentUser.email);
      if (entry && entry.socketId === socket.id) {
        socketState.set(currentUser.email, { socketId: null, isOnline: false });
        io.to(`task:${taskId}`).emit('collaborator:offline', { taskId, email: currentUser.email });
      }
    }

    console.log(`User ${socket.id} left task: ${taskId}`);
  });

  // Real-time message sending
  socket.on('message:send', async ({ taskId, content, isUser }) => {
    if (!currentUser) {
      socket.emit('error', { message: 'User not identified' });
      return;
    }

    const id = uuidv4();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Persist the message
    try {
      await db.addTaskMessage(taskId, id, content, isUser,
        currentUser.email, currentUser.name, currentUser.email, timestamp);
    } catch (err) {
      console.error('Error saving message:', err);
    }

    const message = {
      id,
      content,
      isUser,
      userId: currentUser.email,
      userName: currentUser.name,
      userEmail: currentUser.email,
      timestamp,
      createdAt: new Date().toISOString()
    };

    // Broadcast to all clients in the task room
    io.to(`task:${taskId}`).emit('message:new', { taskId, message });

    // Generate Ava's response after a short delay (simulates thinking)
    if (isUser) {
      // Pre-fetch task title for Ava response
      let taskTitle = '';
      try {
        const task = await db.getTask(taskId);
        taskTitle = task?.title || '';
      } catch (err) { /* ignore */ }

      // Show typing indicator
      io.to(`task:${taskId}`).emit('typing:user', {
        taskId,
        user: { email: 'ava@unit4.com', name: 'Ava' },
        isTyping: true
      });

      // Generate Ava's response — use Claude API if configured, else fallback
      const generateAndSendAvaResponse = async () => {
        let avaContent;
        let source = 'fallback';

        if (claudeService.isConfigured()) {
          try {
            // Build message history for context
            let recentMessages = [];
            try {
              const history = await db.getTaskMessages(taskId);
              recentMessages = history.slice(-10).map(m => ({
                content: m.content,
                isUser: m.is_user
              }));
            } catch (err) { /* use empty history */ }

            // Add the current user message
            recentMessages.push({ content, isUser: true });

            const taskContext = taskTitle ? { title: taskTitle, category: taskTitle } : null;
            const response = await claudeService.chat(recentMessages, {
              taskContext,
              userName: currentUser.name
            });

            avaContent = response.content;
            source = 'claude';
            console.log(`[AI] Claude response for task ${taskId} (${response.usage?.input_tokens || '?'}+${response.usage?.output_tokens || '?'} tokens)`);
          } catch (err) {
            console.error('[AI] Claude API error, falling back to canned responses:', err.message);
            avaContent = generateAvaResponse(taskId, content, currentUser.name, taskTitle);
          }
        } else {
          // Claude not configured — use canned responses
          avaContent = generateAvaResponse(taskId, content, currentUser.name, taskTitle);
        }

        // Stop typing indicator
        io.to(`task:${taskId}`).emit('typing:user', {
          taskId,
          user: { email: 'ava@unit4.com', name: 'Ava' },
          isTyping: false
        });

        // Persist and broadcast Ava's response
        const avaId = uuidv4();
        const avaTimestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        try {
          await db.addTaskMessage(taskId, avaId, avaContent, false,
            'ava@unit4.com', 'Ava', 'ava@unit4.com', avaTimestamp);
        } catch (err) {
          console.error('Error saving Ava response:', err);
        }

        const avaResponse = {
          id: avaId,
          content: avaContent,
          isUser: false,
          userId: 'ava@unit4.com',
          userName: 'Ava',
          userEmail: 'ava@unit4.com',
          timestamp: avaTimestamp,
          source,
          createdAt: new Date().toISOString()
        };

        // Broadcast Ava's response
        io.to(`task:${taskId}`).emit('message:new', { taskId, message: avaResponse });
      };

      // Small delay before starting (typing indicator feel), then generate
      setTimeout(() => {
        generateAndSendAvaResponse().catch(err => {
          console.error('[AI] Unexpected error generating response:', err);
          // Stop typing indicator on error
          io.to(`task:${taskId}`).emit('typing:user', {
            taskId,
            user: { email: 'ava@unit4.com', name: 'Ava' },
            isTyping: false
          });
        });
      }, 500);
    }
  });

  // Typing indicator
  socket.on('typing:start', ({ taskId }) => {
    if (currentUser) {
      socket.to(`task:${taskId}`).emit('typing:user', {
        taskId,
        user: { email: currentUser.email, name: currentUser.name },
        isTyping: true
      });
    }
  });

  socket.on('typing:stop', ({ taskId }) => {
    if (currentUser) {
      socket.to(`task:${taskId}`).emit('typing:user', {
        taskId,
        user: { email: currentUser.email, name: currentUser.name },
        isTyping: false
      });
    }
  });

  // Cursor position for collaborative editing (future feature)
  socket.on('cursor:move', ({ taskId, position }) => {
    if (currentUser) {
      socket.to(`task:${taskId}`).emit('cursor:update', {
        taskId,
        user: { email: currentUser.email, name: currentUser.name },
        position
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Update ephemeral online status for all joined tasks
    joinedTasks.forEach(taskId => {
      const socketState = collaboratorSockets.get(taskId);
      if (socketState) {
        for (const [email, state] of socketState.entries()) {
          if (state.socketId === socket.id) {
            socketState.set(email, { socketId: null, isOnline: false });
            io.to(`task:${taskId}`).emit('collaborator:offline', { taskId, email });
          }
        }
      }
    });

    users.delete(socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ CLAUDE AI ENDPOINTS ============

// Configure Claude API key
app.post('/api/claude/configure', (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  claudeService.setApiKey(apiKey);
  res.json({ success: true, configured: true });
});

// Check if Claude is configured
app.get('/api/claude/status', (req, res) => {
  res.json({
    configured: claudeService.isConfigured(),
    model: 'claude-sonnet-4-20250514'
  });
});

// Send a message to Claude and get a response
app.post('/api/claude/chat', async (req, res) => {
  const { messages, taskContext, userName } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Get available MCP tools for context
  const availableTools = mcpClient.getAllTools();

  try {
    if (claudeService.isConfigured()) {
      const response = await claudeService.chat(messages, {
        taskContext,
        availableTools,
        userName
      });
      res.json({
        success: true,
        content: response.content,
        model: response.model,
        usage: response.usage,
        source: 'claude'
      });
    } else {
      // Claude not configured — use canned responses
      const lastMessage = messages[messages.length - 1];
      const content = generateAvaResponse(
        taskContext?.title || '',
        lastMessage?.content || '',
        userName || 'there',
        taskContext?.title || ''
      );
      res.json({
        success: true,
        content,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Claude chat error:', error);
    const lastMessage = messages[messages.length - 1];
    const content = generateAvaResponse(
      taskContext?.title || '',
      lastMessage?.content || '',
      userName || 'there',
      taskContext?.title || ''
    );
    res.json({
      success: true,
      content,
      source: 'fallback',
      error: error.message
    });
  }
});

// ============ MCP PLUGIN ENDPOINTS ============

// Connect to an MCP plugin
app.post('/api/mcp/connect', async (req, res) => {
  const { plugin } = req.body;

  if (!plugin || !plugin.id || !plugin.command) {
    return res.status(400).json({ error: 'Plugin configuration is required' });
  }

  try {
    const result = await mcpClient.connect(plugin);
    res.json(result);
  } catch (error) {
    console.error('MCP connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect from an MCP plugin
app.post('/api/mcp/disconnect', (req, res) => {
  const { pluginId } = req.body;

  if (!pluginId) {
    return res.status(400).json({ error: 'Plugin ID is required' });
  }

  try {
    mcpClient.disconnect(pluginId);
    res.json({ success: true });
  } catch (error) {
    console.error('MCP disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get status of a plugin connection
app.get('/api/mcp/status/:pluginId', (req, res) => {
  const { pluginId } = req.params;
  const status = mcpClient.getStatus(pluginId);
  res.json(status);
});

// Get all connected plugins
app.get('/api/mcp/plugins', (req, res) => {
  const plugins = mcpClient.getConnectedPlugins();
  res.json(plugins);
});

// Get all discovered tools from all connected plugins
app.get('/api/mcp/tools', (req, res) => {
  const tools = mcpClient.getAllTools();
  res.json(tools);
});

// Execute a tool on an MCP plugin
app.post('/api/mcp/execute', async (req, res) => {
  const { pluginId, toolName, args } = req.body;

  if (!pluginId || !toolName) {
    return res.status(400).json({ error: 'Plugin ID and tool name are required' });
  }

  try {
    const result = await mcpClient.executeTool(pluginId, toolName, args || {});
    res.json({ success: true, result });
  } catch (error) {
    console.error('MCP execute error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh tools from a connected plugin
app.post('/api/mcp/refresh/:pluginId', async (req, res) => {
  const { pluginId } = req.params;
  const connection = mcpClient.connections.get(pluginId);

  if (!connection || connection.status !== 'connected') {
    return res.status(400).json({ error: 'Plugin is not connected' });
  }

  try {
    const tools = await mcpClient.discoverTools(connection);
    res.json({ success: true, tools });
  } catch (error) {
    console.error('MCP refresh error:', error);
    res.status(500).json({ error: error.message });
  }
});

// MCP event forwarding via WebSocket
mcpClient.on('connected', (data) => {
  io.emit('mcp:connected', data);
});

mcpClient.on('disconnected', (data) => {
  io.emit('mcp:disconnected', data);
});

mcpClient.on('error', (data) => {
  io.emit('mcp:error', data);
});

// ============ SERVER STARTUP ============

const PORT = process.env.PORT || 3001;

// Initialize database, then start server
async function start() {
  try {
    await db.initSchema();
    await db.seedAdminUser();
    console.log('Database initialized successfully');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Ava Backend Server running on port ${PORT}`);
      console.log(`WebSocket server ready for connections`);
      console.log(`PostgreSQL connected via DATABASE_URL`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

start();
