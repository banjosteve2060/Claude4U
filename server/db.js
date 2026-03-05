/**
 * PostgreSQL Database Module for Ava Backend
 * Replaces in-memory Maps with persistent PostgreSQL storage.
 */

const { Pool } = require('pg');

// Connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ava:ava_secret_password@localhost:5432/ava',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

// Retry helper — waits for PostgreSQL to be ready
async function waitForConnection(maxRetries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`[DB] Connected to PostgreSQL (attempt ${attempt})`);
      return;
    } catch (err) {
      console.log(`[DB] Connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// =============================================
// Schema Initialization
// =============================================

async function initSchema() {
  await waitForConnection();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. registered_users (replaces registeredUsers Map)
    await client.query(`
      CREATE TABLE IF NOT EXISTS registered_users (
        email       VARCHAR(255) PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        role        VARCHAR(50)  NOT NULL DEFAULT 'consultant',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        created_by  VARCHAR(255) NOT NULL DEFAULT 'system'
      );
    `);

    // 2. user_data (replaces userData Map) — JSONB blob for full user state
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        email        VARCHAR(255) PRIMARY KEY REFERENCES registered_users(email) ON DELETE CASCADE,
        data         JSONB        NOT NULL DEFAULT '{}',
        last_updated TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    // 3. tasks (replaces tasks Map)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id         VARCHAR(255) PRIMARY KEY,
        title      VARCHAR(500) NOT NULL DEFAULT 'Untitled Task',
        status     VARCHAR(50)  NOT NULL DEFAULT 'pending',
        folder_id  VARCHAR(255),
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    // 4. collaborators (replaces collaborators Map — persistent fields only)
    await client.query(`
      CREATE TABLE IF NOT EXISTS collaborators (
        id         UUID         PRIMARY KEY,
        task_id    VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        email      VARCHAR(255) NOT NULL,
        name       VARCHAR(255) NOT NULL,
        added_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        invited_by VARCHAR(255),
        UNIQUE(task_id, email)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_collaborators_task_id ON collaborators(task_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(email);`);

    // 5. task_messages (replaces taskMessages Map)
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_messages (
        id         UUID         PRIMARY KEY,
        task_id    VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        content    TEXT         NOT NULL,
        is_user    BOOLEAN      NOT NULL DEFAULT TRUE,
        user_id    VARCHAR(255),
        user_name  VARCHAR(255),
        user_email VARCHAR(255),
        timestamp  VARCHAR(50),
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_messages_task_id ON task_messages(task_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_messages_created ON task_messages(task_id, created_at);`);

    // 6. invitations (replaces invitations Map)
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id         SERIAL       PRIMARY KEY,
        email      VARCHAR(255) NOT NULL,
        task_id    VARCHAR(255) NOT NULL,
        invited_by VARCHAR(255),
        invited_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);`);

    // 7. shared_tasks (replaces sharedTasks Map)
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared_tasks (
        id              SERIAL       PRIMARY KEY,
        email           VARCHAR(255) NOT NULL,
        task_id         VARCHAR(255) NOT NULL,
        title           VARCHAR(500) NOT NULL DEFAULT 'Shared Task',
        shared_by       VARCHAR(255),
        shared_by_name  VARCHAR(255),
        shared_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE(email, task_id)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_shared_tasks_email ON shared_tasks(email);`);

    // 8. notifications — persistent notification history
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         UUID         PRIMARY KEY,
        email      VARCHAR(255) NOT NULL,
        type       VARCHAR(50)  NOT NULL,
        task_id    VARCHAR(255) NOT NULL,
        task_title VARCHAR(500) NOT NULL DEFAULT '',
        from_name  VARCHAR(255) NOT NULL DEFAULT '',
        from_email VARCHAR(255) NOT NULL DEFAULT '',
        message    TEXT         NOT NULL DEFAULT '',
        is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(email, is_read);`);

    // 9. user_memories — persistent memory for Ava across conversations
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_memories (
        id         UUID         PRIMARY KEY,
        email      VARCHAR(255) NOT NULL,
        memory     TEXT         NOT NULL,
        source_task_id VARCHAR(255),
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_memories_email ON user_memories(email);`);

    await client.query('COMMIT');
    console.log('[DB] Schema initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Schema initialization failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// =============================================
// Default Data Helpers
// =============================================

const getDefaultFolders = () => [
  {
    id: 'folder-0',
    name: 'My Tasks',
    isProtected: true,
    tasks: [
      { id: `task-today-${Date.now()}`, title: 'Today', status: 'pending' },
      { id: `task-absences-${Date.now()}`, title: 'Absences', status: 'pending' },
      { id: `task-timesheets-${Date.now()}`, title: 'Timesheets', status: 'pending' },
      { id: `task-expenses-${Date.now()}`, title: 'Expenses', status: 'pending' },
      { id: `task-payslips-${Date.now()}`, title: 'Payslips', status: 'pending' },
    ],
  },
  {
    id: 'folder-financials',
    name: 'Project Financials',
    isProtected: true,
    tasks: [
      { id: `task-project-overview-${Date.now()}`, title: 'Project Overview', status: 'pending' },
      { id: `task-revenue-billing-${Date.now()}`, title: 'Revenue & Billing', status: 'pending' },
      { id: `task-resource-utilisation-${Date.now()}`, title: 'Resource Utilisation', status: 'pending' },
      { id: `task-project-margins-${Date.now()}`, title: 'Project Margins', status: 'pending' },
      { id: `task-forecasting-${Date.now()}`, title: 'Forecasting', status: 'pending' },
      { id: `task-budget-tracking-${Date.now()}`, title: 'Budget Tracking', status: 'pending' },
    ],
  },
  {
    id: 'folder-shared',
    name: 'Shared with Me',
    isProtected: true,
    isSharedFolder: true,
    tasks: [],
  },
  {
    id: 'folder-notepad',
    name: 'Notepad',
    isProtected: false,
    tasks: [],
  },
];

const getDefaultUserData = () => ({
  folders: getDefaultFolders(),
  openTabs: [],
  activeTask: null,
  expandedFolders: ['folder-0', 'folder-financials', 'folder-shared', 'folder-notepad'],
  messages: {},
  unreadTasks: {},
  darkMode: false,
  quickActions: [],
});

// =============================================
// Default Users — one per PSO role
// =============================================

const ADMIN_EMAIL = 'admin@unit4.com';

const DEFAULT_USERS = [
  { email: 'admin@unit4.com',                name: 'Admin User',        role: 'admin' },
  { email: 'consultant@unit4.com',           name: 'Alex Consultant',   role: 'consultant' },
  { email: 'senior.consultant@unit4.com',    name: 'Sarah Senior',      role: 'senior_consultant' },
  { email: 'principal.consultant@unit4.com', name: 'Peter Principal',   role: 'principal_consultant' },
  { email: 'project.manager@unit4.com',      name: 'Paula Manager',     role: 'project_manager' },
  { email: 'solution.architect@unit4.com',   name: 'Sam Architect',     role: 'solution_architect' },
  { email: 'technical.consultant@unit4.com', name: 'Tom Technical',     role: 'technical_consultant' },
  { email: 'functional.consultant@unit4.com',name: 'Fiona Functional',  role: 'functional_consultant' },
  { email: 'team.lead@unit4.com',            name: 'Taylor Lead',       role: 'team_lead' },
  { email: 'practice.manager@unit4.com',     name: 'Pat Practice',      role: 'practice_manager' },
];

async function seedDefaultUsers() {
  let created = 0;
  let existing = 0;

  for (const user of DEFAULT_USERS) {
    const result = await pool.query(
      'SELECT email FROM registered_users WHERE email = $1',
      [user.email]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO registered_users (email, name, role, created_at, created_by)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [user.email, user.name, user.role, 'system']
      );
      await pool.query(
        `INSERT INTO user_data (email, data, last_updated)
         VALUES ($1, $2, NOW())`,
        [user.email, JSON.stringify(getDefaultUserData())]
      );
      created++;
    } else {
      existing++;
    }
  }

  console.log(`[DB] Default users: ${created} created, ${existing} already existed (${DEFAULT_USERS.length} total roles)`);
}

// Keep backward-compatible alias
const seedAdminUser = seedDefaultUsers;

// =============================================
// User Queries
// =============================================

async function findUser(email) {
  const result = await pool.query(
    'SELECT * FROM registered_users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function userExists(email) {
  const result = await pool.query(
    'SELECT 1 FROM registered_users WHERE email = $1',
    [email]
  );
  return result.rows.length > 0;
}

async function createUser(email, name, role, createdBy) {
  const result = await pool.query(
    `INSERT INTO registered_users (email, name, role, created_at, created_by)
     VALUES ($1, $2, $3, NOW(), $4) RETURNING *`,
    [email, name, role, createdBy]
  );
  return result.rows[0];
}

async function deleteUser(email) {
  await pool.query('DELETE FROM registered_users WHERE email = $1', [email]);
}

async function getAllUsers() {
  const result = await pool.query(`
    SELECT ru.email, ru.name, ru.role, ru.created_at,
           ud.last_updated, ud.data
    FROM registered_users ru
    LEFT JOIN user_data ud ON ru.email = ud.email
    ORDER BY ud.last_updated DESC NULLS LAST
  `);
  return result.rows;
}

async function updateUserName(email, name) {
  await pool.query(
    'UPDATE registered_users SET name = $1 WHERE email = $2',
    [name, email]
  );
}

// =============================================
// User Data Queries (JSONB)
// =============================================

async function getUserData(email) {
  const result = await pool.query(
    'SELECT data, last_updated FROM user_data WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function saveUserData(email, data) {
  const result = await pool.query(
    `INSERT INTO user_data (email, data, last_updated)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (email) DO UPDATE
       SET data = $2::jsonb, last_updated = NOW()
     RETURNING *`,
    [email, JSON.stringify(data)]
  );
  return result.rows[0];
}

// =============================================
// Task Queries
// =============================================

async function getTask(taskId) {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE id = $1',
    [taskId]
  );
  return result.rows[0] || null;
}

async function createTask(id, title, status, folderId) {
  const result = await pool.query(
    `INSERT INTO tasks (id, title, status, folder_id, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [id, title, status, folderId]
  );
  return result.rows[0];
}

async function ensureTaskExists(taskId, title = 'Untitled Task') {
  const result = await pool.query(
    `INSERT INTO tasks (id, title, status, folder_id, created_at)
     VALUES ($1, $2, 'pending', 'folder-0', NOW())
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [taskId, title]
  );
  if (result.rows.length > 0) {
    console.log(`[DB] Auto-created task: ${taskId}`);
  }
}

async function deleteTask(taskId) {
  await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
}

async function getAllTasks() {
  const result = await pool.query('SELECT * FROM tasks');
  return result.rows;
}

async function updateTaskTitle(taskId, title) {
  await pool.query(
    'UPDATE tasks SET title = $1 WHERE id = $2',
    [title, taskId]
  );
}

// =============================================
// Collaborator Queries
// =============================================

async function getCollaborators(taskId) {
  const result = await pool.query(
    'SELECT * FROM collaborators WHERE task_id = $1 ORDER BY added_at',
    [taskId]
  );
  return result.rows;
}

async function addCollaborator(taskId, id, email, name, invitedBy) {
  const result = await pool.query(
    `INSERT INTO collaborators (id, task_id, email, name, added_at, invited_by)
     VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING *`,
    [id, taskId, email, name, invitedBy]
  );
  return result.rows[0];
}

async function removeCollaborator(taskId, email) {
  await pool.query(
    'DELETE FROM collaborators WHERE task_id = $1 AND LOWER(email) = LOWER($2)',
    [taskId, email]
  );
}

async function collaboratorExists(taskId, email) {
  const result = await pool.query(
    'SELECT 1 FROM collaborators WHERE task_id = $1 AND LOWER(email) = LOWER($2)',
    [taskId, email]
  );
  return result.rows.length > 0;
}

// =============================================
// Task Message Queries
// =============================================

async function getTaskMessages(taskId) {
  const result = await pool.query(
    'SELECT * FROM task_messages WHERE task_id = $1 ORDER BY created_at',
    [taskId]
  );
  return result.rows;
}

async function getRecentTaskMessages(taskId, limit = 10) {
  const result = await pool.query(
    `SELECT * FROM (
       SELECT * FROM task_messages WHERE task_id = $1 ORDER BY created_at DESC LIMIT $2
     ) sub ORDER BY created_at ASC`,
    [taskId, limit]
  );
  return result.rows;
}

async function addTaskMessage(taskId, id, content, isUser, userId, userName, userEmail, timestamp) {
  const result = await pool.query(
    `INSERT INTO task_messages (id, task_id, content, is_user, user_id, user_name, user_email, timestamp, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
    [id, taskId, content, isUser, userId, userName, userEmail, timestamp]
  );
  return result.rows[0];
}

// =============================================
// Invitation Queries
// =============================================

async function getInvitations(email) {
  const result = await pool.query(
    'SELECT * FROM invitations WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return result.rows;
}

async function addInvitation(email, taskId, invitedBy) {
  await pool.query(
    `INSERT INTO invitations (email, task_id, invited_by, invited_at)
     VALUES ($1, $2, $3, NOW())`,
    [email, taskId, invitedBy]
  );
}

// =============================================
// Shared Task Queries
// =============================================

async function getSharedTasks(email) {
  const result = await pool.query(
    'SELECT * FROM shared_tasks WHERE LOWER(email) = LOWER($1) ORDER BY shared_at',
    [email]
  );
  return result.rows;
}

async function addSharedTask(email, taskId, title, sharedBy, sharedByName) {
  const result = await pool.query(
    `INSERT INTO shared_tasks (email, task_id, title, shared_by, shared_by_name, shared_at)
     VALUES (LOWER($1), $2, $3, $4, $5, NOW())
     ON CONFLICT (email, task_id) DO NOTHING
     RETURNING *`,
    [email, taskId, title, sharedBy, sharedByName]
  );
  return result.rows[0] || null;
}

async function removeSharedTask(email, taskId) {
  await pool.query(
    'DELETE FROM shared_tasks WHERE LOWER(email) = LOWER($1) AND task_id = $2',
    [email, taskId]
  );
}

async function deleteSharedTasksByEmail(email) {
  await pool.query(
    'DELETE FROM shared_tasks WHERE LOWER(email) = LOWER($1)',
    [email]
  );
}

// =============================================
// Notification Queries
// =============================================

async function getNotifications(email, limit = 50) {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE LOWER(email) = LOWER($1)
     ORDER BY created_at DESC
     LIMIT $2`,
    [email, limit]
  );
  return result.rows;
}

async function getUnreadNotificationCount(email) {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE LOWER(email) = LOWER($1) AND is_read = FALSE`,
    [email]
  );
  return parseInt(result.rows[0].count, 10);
}

async function addNotification(id, email, type, taskId, taskTitle, fromName, fromEmail, message) {
  const result = await pool.query(
    `INSERT INTO notifications (id, email, type, task_id, task_title, from_name, from_email, message, is_read, created_at)
     VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8, FALSE, NOW()) RETURNING *`,
    [id, email, type, taskId, taskTitle, fromName, fromEmail, message]
  );
  return result.rows[0];
}

async function markNotificationRead(id, email) {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND LOWER(email) = LOWER($2)`,
    [id, email]
  );
}

async function markAllNotificationsRead(email) {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE LOWER(email) = LOWER($1) AND is_read = FALSE`,
    [email]
  );
}

// =============================================
// User Memory Queries
// =============================================

async function getUserMemories(email, limit = 20) {
  const result = await pool.query(
    `SELECT * FROM user_memories
     WHERE LOWER(email) = LOWER($1)
     ORDER BY created_at DESC
     LIMIT $2`,
    [email, limit]
  );
  return result.rows;
}

async function addUserMemory(id, email, memory, sourceTaskId) {
  const result = await pool.query(
    `INSERT INTO user_memories (id, email, memory, source_task_id, created_at)
     VALUES ($1, LOWER($2), $3, $4, NOW()) RETURNING *`,
    [id, email, memory, sourceTaskId]
  );
  return result.rows[0];
}

async function deleteUserMemory(id, email) {
  await pool.query(
    `DELETE FROM user_memories WHERE id = $1 AND LOWER(email) = LOWER($2)`,
    [id, email]
  );
}

async function clearUserMemories(email) {
  await pool.query(
    `DELETE FROM user_memories WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
}

// =============================================
// Exports
// =============================================

module.exports = {
  pool,
  initSchema,
  seedAdminUser,
  seedDefaultUsers,
  DEFAULT_USERS,
  getDefaultUserData,
  getDefaultFolders,
  ADMIN_EMAIL,
  // Users
  findUser,
  userExists,
  createUser,
  deleteUser,
  getAllUsers,
  updateUserName,
  // User Data
  getUserData,
  saveUserData,
  // Tasks
  getTask,
  createTask,
  deleteTask,
  getAllTasks,
  ensureTaskExists,
  updateTaskTitle,
  // Collaborators
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  collaboratorExists,
  // Task Messages
  getTaskMessages,
  getRecentTaskMessages,
  addTaskMessage,
  // Invitations
  getInvitations,
  addInvitation,
  // Shared Tasks
  getSharedTasks,
  addSharedTask,
  removeSharedTask,
  deleteSharedTasksByEmail,
  // Notifications
  getNotifications,
  getUnreadNotificationCount,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  // User Memories
  getUserMemories,
  addUserMemory,
  deleteUserMemory,
  clearUserMemories,
};
