import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, ChevronRight, ChevronLeft, Sparkles, MessageSquare,
  FolderOpen, Users, Bell, Moon, Share2, Bot, CheckCircle2,
  Rocket, Star, Zap, ArrowRight, PartyPopper, Briefcase,
  Clock, FileText, DollarSign, Calendar, Settings, BarChart3,
  Target, Layers, Code, Database, GitBranch, Shield, UserCog,
  Building, TrendingUp, PieChart, Workflow, ClipboardCheck
} from 'lucide-react';

// Role-specific onboarding configurations
// Each role gets tailored content that speaks to their specific needs
const ROLE_ONBOARDING_CONFIG = {
  consultant: {
    welcomeTitle: 'Welcome, Consultant! 🎯',
    welcomeSubtitle: 'Your Implementation Command Center',
    welcomeDescription: 'Ava is designed to streamline your daily implementation work. Let me show you how to manage client tasks, track time, and collaborate effectively.',
    welcomeFeatures: [
      { icon: Bot, text: 'AI assistance for implementation queries' },
      { icon: Clock, text: 'Easy timesheet management' },
      { icon: Users, text: 'Client collaboration tools' },
    ],
    taskFolderDescription: 'Your personal workspace for managing implementation tasks. Track your Today items, log time, and manage expenses all in one place.',
    chatTip: 'Try asking "Help me draft a status update for my current project"',
    quickActionsDescription: 'Quick access to common consultant tasks: log time, request absence, submit expenses.',
    toolsPanelDescription: 'Access implementation tools, view ERP documentation, and track your task progress.',
    sharingDescription: 'Collaborate with senior consultants and project managers. Share task updates in real-time.',
    completeTitle: 'Ready to Implement! 🚀',
    completeDescription: 'Start by selecting a task and let Ava help you work more efficiently.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'You\'re all set up' },
      { icon: Clock, text: 'Track time easily with Ava' },
      { icon: Target, text: 'Hit your billable targets' },
    ]
  },
  senior_consultant: {
    welcomeTitle: 'Welcome, Senior Consultant! 🌟',
    welcomeSubtitle: 'Lead with Confidence',
    welcomeDescription: 'Ava helps you mentor junior team members while managing complex implementations. Access advanced features and insights.',
    welcomeFeatures: [
      { icon: Bot, text: 'Advanced AI for complex scenarios' },
      { icon: Users, text: 'Team collaboration & mentoring' },
      { icon: BarChart3, text: 'Project insights & analytics' },
    ],
    taskFolderDescription: 'Manage multiple implementation streams. Your tasks include today\'s priorities, team reviews, and project milestones.',
    chatTip: 'Try asking "What are the best practices for data migration in Unit4?"',
    quickActionsDescription: 'Senior-level shortcuts: review team timesheets, approve tasks, generate status reports.',
    toolsPanelDescription: 'Access advanced tools, review team progress, and manage escalations efficiently.',
    sharingDescription: 'Mentor juniors by sharing knowledge tasks. Coordinate with project managers on deliverables.',
    completeTitle: 'Lead the Way! 🏆',
    completeDescription: 'Your expertise combined with Ava\'s AI creates exceptional client outcomes.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'Advanced features unlocked' },
      { icon: Users, text: 'Mentor your team effectively' },
      { icon: TrendingUp, text: 'Drive project success' },
    ]
  },
  principal_consultant: {
    welcomeTitle: 'Welcome, Principal Consultant! 👑',
    welcomeSubtitle: 'Strategic Implementation Excellence',
    welcomeDescription: 'Ava provides you with strategic insights and comprehensive project oversight. Guide complex transformations with AI support.',
    welcomeFeatures: [
      { icon: Bot, text: 'Strategic AI recommendations' },
      { icon: Layers, text: 'Multi-project orchestration' },
      { icon: PieChart, text: 'Executive dashboards & insights' },
    ],
    taskFolderDescription: 'Your strategic command center. Oversee multiple projects, track critical milestones, and ensure delivery excellence.',
    chatTip: 'Try asking "Summarize the risks across my active projects"',
    quickActionsDescription: 'Executive shortcuts: portfolio overview, escalation management, strategic reviews.',
    toolsPanelDescription: 'Access executive tools, cross-project analytics, and resource optimization insights.',
    sharingDescription: 'Coordinate across project teams and align with practice leadership on strategic initiatives.',
    completeTitle: 'Strategic Excellence Awaits! ✨',
    completeDescription: 'Drive transformational outcomes with Ava as your strategic partner.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'Executive features activated' },
      { icon: Layers, text: 'Multi-project visibility' },
      { icon: Target, text: 'Strategic alignment tools' },
    ]
  },
  project_manager: {
    welcomeTitle: 'Welcome, Project Manager! 📊',
    welcomeSubtitle: 'Delivery Excellence Dashboard',
    welcomeDescription: 'Ava is your project delivery partner. Track milestones, manage resources, and keep stakeholders informed effortlessly.',
    welcomeFeatures: [
      { icon: Bot, text: 'AI-powered project insights' },
      { icon: Calendar, text: 'Schedule & milestone tracking' },
      { icon: Users, text: 'Team & stakeholder management' },
    ],
    taskFolderDescription: 'Your project control center. Monitor deliverables, track team capacity, and manage project health indicators.',
    chatTip: 'Try asking "Generate a project status update for this week"',
    quickActionsDescription: 'PM essentials: update project status, review team timesheets, send stakeholder updates.',
    toolsPanelDescription: 'Access project management tools, Gantt views, resource allocation, and risk registers.',
    sharingDescription: 'Coordinate with consultants, share project updates with stakeholders, and collaborate with other PMs.',
    completeTitle: 'Deliver with Confidence! 📈',
    completeDescription: 'Keep your projects on track with Ava\'s intelligent project support.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'PM dashboard ready' },
      { icon: Calendar, text: 'Never miss a milestone' },
      { icon: Users, text: 'Team collaboration enabled' },
    ]
  },
  solution_architect: {
    welcomeTitle: 'Welcome, Solution Architect! 🏗️',
    welcomeSubtitle: 'Design Technical Excellence',
    welcomeDescription: 'Ava supports your architectural decisions with technical insights and integration knowledge. Design robust solutions faster.',
    welcomeFeatures: [
      { icon: Bot, text: 'Technical AI assistance' },
      { icon: Code, text: 'Integration patterns & APIs' },
      { icon: Database, text: 'Data architecture support' },
    ],
    taskFolderDescription: 'Your technical workspace. Manage design tasks, integration specifications, and architecture reviews.',
    chatTip: 'Try asking "What are the integration options for Unit4 with Salesforce?"',
    quickActionsDescription: 'Architect shortcuts: review design docs, check API specs, validate data models.',
    toolsPanelDescription: 'Access technical documentation, integration tools, and architecture decision records.',
    sharingDescription: 'Collaborate with technical consultants on designs. Share architecture decisions with project teams.',
    completeTitle: 'Architect the Future! 🔧',
    completeDescription: 'Build elegant solutions with Ava\'s technical knowledge at your fingertips.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'Technical tools ready' },
      { icon: Code, text: 'Integration support active' },
      { icon: GitBranch, text: 'Design collaboration enabled' },
    ]
  },
  technical_consultant: {
    welcomeTitle: 'Welcome, Technical Consultant! 💻',
    welcomeSubtitle: 'Build & Configure with Power',
    welcomeDescription: 'Ava helps you with configurations, customizations, and technical troubleshooting. Get answers to complex technical questions fast.',
    welcomeFeatures: [
      { icon: Bot, text: 'Technical troubleshooting AI' },
      { icon: Code, text: 'Configuration assistance' },
      { icon: Database, text: 'Data management tools' },
    ],
    taskFolderDescription: 'Your technical task list. Track configurations, customizations, bug fixes, and technical deliverables.',
    chatTip: 'Try asking "How do I configure workflow approval in Unit4 ERP?"',
    quickActionsDescription: 'Tech shortcuts: access config guides, log technical issues, review change requests.',
    toolsPanelDescription: 'Access development tools, configuration wizards, and technical documentation.',
    sharingDescription: 'Collaborate with architects on technical designs. Share solutions with other technical consultants.',
    completeTitle: 'Code Your Success! 🖥️',
    completeDescription: 'Solve technical challenges faster with Ava\'s deep product knowledge.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'Tech environment ready' },
      { icon: Code, text: 'Config assistance active' },
      { icon: Database, text: 'Data tools available' },
    ]
  },
  functional_consultant: {
    welcomeTitle: 'Welcome, Functional Consultant! 📋',
    welcomeSubtitle: 'Process Excellence Partner',
    welcomeDescription: 'Ava understands business processes and helps you map requirements to solutions. Transform client needs into working systems.',
    welcomeFeatures: [
      { icon: Bot, text: 'Business process AI guidance' },
      { icon: Workflow, text: 'Process mapping tools' },
      { icon: ClipboardCheck, text: 'Requirements management' },
    ],
    taskFolderDescription: 'Your functional workspace. Manage requirements, process designs, testing activities, and user training.',
    chatTip: 'Try asking "What\'s the best practice for procure-to-pay in Unit4?"',
    quickActionsDescription: 'Functional shortcuts: capture requirements, update process maps, track testing progress.',
    toolsPanelDescription: 'Access functional documentation, process templates, and testing checklists.',
    sharingDescription: 'Collaborate with technical consultants on specifications. Share process designs with clients.',
    completeTitle: 'Transform Processes! 🔄',
    completeDescription: 'Bridge business needs and technical solutions with Ava\'s functional expertise.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'Functional tools ready' },
      { icon: Workflow, text: 'Process templates available' },
      { icon: ClipboardCheck, text: 'Requirements tracking active' },
    ]
  },
  team_lead: {
    welcomeTitle: 'Welcome, Team Lead! 👥',
    welcomeSubtitle: 'Lead Your Team to Success',
    welcomeDescription: 'Ava helps you balance delivery with people management. Track team performance, coordinate workloads, and drive results.',
    welcomeFeatures: [
      { icon: Bot, text: 'Team management AI insights' },
      { icon: Users, text: 'Resource coordination' },
      { icon: BarChart3, text: 'Performance dashboards' },
    ],
    taskFolderDescription: 'Your leadership hub. Monitor team tasks, review timesheets, manage escalations, and track deliverables.',
    chatTip: 'Try asking "Summarize my team\'s utilization this week"',
    quickActionsDescription: 'Leadership shortcuts: approve timesheets, assign tasks, review team capacity.',
    toolsPanelDescription: 'Access team management tools, capacity planning, and performance metrics.',
    sharingDescription: 'Coordinate with project managers on resourcing. Share updates with your team members.',
    completeTitle: 'Lead with Impact! 💪',
    completeDescription: 'Empower your team and drive exceptional delivery with Ava\'s support.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'Leadership dashboard ready' },
      { icon: Users, text: 'Team oversight enabled' },
      { icon: TrendingUp, text: 'Performance tracking active' },
    ]
  },
  practice_manager: {
    welcomeTitle: 'Welcome, Practice Manager! 🎯',
    welcomeSubtitle: 'Shape the Practice\'s Future',
    welcomeDescription: 'Ava provides practice-wide insights and strategic intelligence. Drive growth, optimize utilization, and develop your people.',
    welcomeFeatures: [
      { icon: Bot, text: 'Strategic practice AI' },
      { icon: Building, text: 'Practice health metrics' },
      { icon: TrendingUp, text: 'Growth & revenue insights' },
    ],
    taskFolderDescription: 'Your practice command center. Strategic initiatives, resource planning, capability development, and market opportunities.',
    chatTip: 'Try asking "What skills should we develop in the practice this quarter?"',
    quickActionsDescription: 'Practice shortcuts: review utilization, approve investments, strategic planning.',
    toolsPanelDescription: 'Access practice analytics, forecasting tools, and strategic planning resources.',
    sharingDescription: 'Align with leadership on strategy. Share practice updates with team leads and consultants.',
    completeTitle: 'Shape the Future! 🌟',
    completeDescription: 'Build a world-class practice with Ava\'s strategic partnership.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'Practice dashboard active' },
      { icon: Building, text: 'Strategic tools enabled' },
      { icon: TrendingUp, text: 'Growth analytics ready' },
    ]
  },
  admin: {
    welcomeTitle: 'Welcome, Administrator! ⚙️',
    welcomeSubtitle: 'System Control Center',
    welcomeDescription: 'Ava gives you complete control over the platform. Manage users, configure settings, and ensure smooth operations.',
    welcomeFeatures: [
      { icon: Bot, text: 'Admin AI assistance' },
      { icon: Shield, text: 'User & access management' },
      { icon: Settings, text: 'System configuration' },
    ],
    taskFolderDescription: 'Your admin workspace. System maintenance, user management, configuration tasks, and platform monitoring.',
    chatTip: 'Try asking "How do I add a new MCP plugin integration?"',
    quickActionsDescription: 'Admin shortcuts: manage users, configure plugins, review system health.',
    toolsPanelDescription: 'Access admin tools, user management, plugin configuration, and system settings.',
    sharingDescription: 'Coordinate with leadership on system changes. Support users with platform questions.',
    completeTitle: 'System Ready! 🔐',
    completeDescription: 'Keep the platform running smoothly with Ava\'s administrative support.',
    completeFeatures: [
      { icon: CheckCircle2, text: 'Admin privileges active' },
      { icon: Shield, text: 'Security controls enabled' },
      { icon: Settings, text: 'Full configuration access' },
    ]
  }
};

// Default config for unknown roles
const DEFAULT_ONBOARDING_CONFIG = {
  welcomeTitle: 'Welcome to Ava! 🎉',
  welcomeSubtitle: 'Your AI-Powered ERP Assistant',
  welcomeDescription: 'Let me show you around and help you get started with the key features that will supercharge your productivity.',
  welcomeFeatures: [
    { icon: Bot, text: 'AI-powered task assistance' },
    { icon: Users, text: 'Real-time collaboration' },
    { icon: Zap, text: 'Smart workflow automation' },
  ],
  taskFolderDescription: 'Your personal workspace with pre-configured categories: Today, Absences, Timesheets, Expenses, and Payslips.',
  chatTip: 'Try asking "What absences do I have this month?"',
  quickActionsDescription: 'One-click shortcuts to common tasks. These adapt based on the task you\'re working on!',
  toolsPanelDescription: 'Access powerful tools, see processing progress, and manage your workflow from this panel.',
  sharingDescription: 'Share tasks with colleagues for real-time collaboration. See who\'s online and work together seamlessly.',
  completeTitle: 'You\'re All Set! 🚀',
  completeDescription: 'You\'ve completed the tour! Ava is ready to help you manage your ERP tasks efficiently.',
  completeFeatures: [
    { icon: CheckCircle2, text: 'Tour completed successfully' },
    { icon: Star, text: 'Start by selecting a task' },
    { icon: MessageSquare, text: 'Ask Ava anything!' },
  ]
};

// Generate onboarding steps based on role
const getOnboardingSteps = (userRole, userName) => {
  const config = ROLE_ONBOARDING_CONFIG[userRole] || DEFAULT_ONBOARDING_CONFIG;
  const firstName = userName?.split(' ')[0] || 'there';

  return [
    {
      id: 'welcome',
      type: 'modal',
      title: config.welcomeTitle.replace('!', `, ${firstName}!`),
      subtitle: config.welcomeSubtitle,
      description: config.welcomeDescription,
      icon: Rocket,
      features: config.welcomeFeatures
    },
    {
      id: 'sidebar',
      type: 'spotlight',
      target: '[data-tour="sidebar"]',
      position: 'right',
      title: 'Your Task Sidebar',
      description: 'This is your command center! All your tasks are organized in folders here. Click on any task to start working with Ava.',
      icon: FolderOpen,
      tip: 'Pro tip: Right-click on folders to create new tasks!'
    },
    {
      id: 'my-tasks',
      type: 'spotlight',
      target: '[data-tour="my-tasks"]',
      position: 'right',
      title: 'My Tasks Folder',
      description: config.taskFolderDescription,
      icon: FolderOpen,
      tip: 'Each task category has specialized AI responses!'
    },
    {
      id: 'chat',
      type: 'spotlight',
      target: '[data-tour="chat-area"]',
      position: 'left',
      title: 'Chat with Ava',
      description: 'This is where the magic happens! Ask Ava anything about your tasks. She understands context and provides intelligent responses.',
      icon: MessageSquare,
      tip: config.chatTip
    },
    {
      id: 'quick-actions',
      type: 'spotlight',
      target: '[data-tour="quick-actions"]',
      position: 'left',
      title: 'Quick Actions',
      description: config.quickActionsDescription,
      icon: Zap,
      tip: 'You can customize these in Settings'
    },
    {
      id: 'tools-panel',
      type: 'spotlight',
      target: '[data-tour="tools-panel"]',
      position: 'left',
      title: 'Tools & Actions',
      description: config.toolsPanelDescription,
      icon: Sparkles,
      tip: 'Watch this panel when Ava is thinking!'
    },
    {
      id: 'sharing',
      type: 'spotlight',
      target: '[data-tour="share-button"]',
      position: 'bottom',
      title: 'Share & Collaborate',
      description: config.sharingDescription,
      icon: Share2,
      tip: 'Shared tasks appear in the "Shared with Me" folder'
    },
    {
      id: 'dark-mode',
      type: 'spotlight',
      target: '[data-tour="dark-mode"]',
      position: 'bottom',
      title: 'Dark Mode',
      description: 'Easy on the eyes! Toggle dark mode for comfortable viewing any time of day.',
      icon: Moon,
      tip: 'Your preference is saved automatically'
    },
    {
      id: 'complete',
      type: 'modal',
      title: config.completeTitle,
      subtitle: 'Ready to boost your productivity',
      description: config.completeDescription,
      icon: PartyPopper,
      features: config.completeFeatures
    }
  ];
};

// Confetti particle component
const Confetti = ({ active }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (active) {
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
};

// Animated arrow component
const AnimatedArrow = ({ position, targetRect }) => {
  if (!targetRect) return null;

  const arrowStyles = {
    right: {
      left: targetRect.right + 20,
      top: targetRect.top + targetRect.height / 2 - 20,
      transform: 'rotate(180deg)',
    },
    left: {
      left: targetRect.left - 60,
      top: targetRect.top + targetRect.height / 2 - 20,
      transform: 'rotate(0deg)',
    },
    bottom: {
      left: targetRect.left + targetRect.width / 2 - 20,
      top: targetRect.bottom + 20,
      transform: 'rotate(-90deg)',
    },
    top: {
      left: targetRect.left + targetRect.width / 2 - 20,
      top: targetRect.top - 60,
      transform: 'rotate(90deg)',
    },
  };

  const style = arrowStyles[position] || arrowStyles.right;

  return (
    <div
      className="fixed z-[9998] animate-bounce-horizontal"
      style={style}
    >
      <div className="relative">
        <ArrowRight size={40} className="text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
        <div className="absolute inset-0 animate-ping">
          <ArrowRight size={40} className="text-green-400 opacity-50" />
        </div>
      </div>
    </div>
  );
};

// Spotlight overlay component
const SpotlightOverlay = ({ targetRect, onClick }) => {
  if (!targetRect) return null;

  const padding = 8;
  const borderRadius = 12;

  return (
    <div className="fixed inset-0 z-[9995]" onClick={onClick}>
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>
      {/* Glowing border around target */}
      <div
        className="absolute border-2 border-green-400 rounded-xl animate-pulse-glow pointer-events-none"
        style={{
          left: targetRect.left - padding,
          top: targetRect.top - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          boxShadow: '0 0 20px rgba(74, 222, 128, 0.6), 0 0 40px rgba(74, 222, 128, 0.3), inset 0 0 20px rgba(74, 222, 128, 0.1)',
        }}
      />
    </div>
  );
};

// Role badge component for the welcome screen
const RoleBadge = ({ role, darkMode }) => {
  const roleLabels = {
    consultant: 'Consultant',
    senior_consultant: 'Senior Consultant',
    principal_consultant: 'Principal Consultant',
    project_manager: 'Project Manager',
    solution_architect: 'Solution Architect',
    technical_consultant: 'Technical Consultant',
    functional_consultant: 'Functional Consultant',
    team_lead: 'Team Lead',
    practice_manager: 'Practice Manager',
    admin: 'Administrator'
  };

  const roleIcons = {
    consultant: Briefcase,
    senior_consultant: Star,
    principal_consultant: Target,
    project_manager: Calendar,
    solution_architect: Layers,
    technical_consultant: Code,
    functional_consultant: Workflow,
    team_lead: Users,
    practice_manager: Building,
    admin: Shield
  };

  const Icon = roleIcons[role] || Briefcase;
  const label = roleLabels[role] || 'User';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
      darkMode
        ? 'bg-green-900/50 text-green-300 border border-green-700'
        : 'bg-green-100 text-green-700 border border-green-200'
    }`}>
      <Icon size={14} />
      {label}
    </div>
  );
};

// Tooltip card component
const TooltipCard = ({ step, position, targetRect, onNext, onPrev, onSkip, currentStep, totalSteps, themeColor, userRole, darkMode, autoAdvanceProgress }) => {
  // When spotlight target isn't found, fall back to centered modal display
  const isFallbackModal = step.type === 'spotlight' && !targetRect;
  const showAsModal = step.type === 'modal' || isFallbackModal;

  const cardWidth = 380;
  const cardHeight = 260;
  const gap = 80;

  let cardStyle = {};

  if (step.type === 'spotlight' && targetRect) {
    switch (position) {
      case 'right':
        cardStyle = {
          left: Math.min(targetRect.right + gap, window.innerWidth - cardWidth - 20),
          top: Math.max(20, Math.min(targetRect.top, window.innerHeight - cardHeight - 20)),
        };
        break;
      case 'left':
        cardStyle = {
          left: Math.max(20, targetRect.left - cardWidth - gap),
          top: Math.max(20, Math.min(targetRect.top, window.innerHeight - cardHeight - 20)),
        };
        break;
      case 'bottom':
        cardStyle = {
          left: Math.max(20, Math.min(targetRect.left, window.innerWidth - cardWidth - 20)),
          top: Math.min(targetRect.bottom + gap, window.innerHeight - cardHeight - 20),
        };
        break;
      case 'top':
        cardStyle = {
          left: Math.max(20, Math.min(targetRect.left, window.innerWidth - cardWidth - 20)),
          top: Math.max(20, targetRect.top - cardHeight - gap),
        };
        break;
      default:
        cardStyle = {
          left: targetRect.right + gap,
          top: targetRect.top,
        };
    }
  }

  const Icon = step.icon;

  return (
    <div
      className={`fixed z-[9999] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in ${showAsModal ? 'inset-0 m-auto w-[500px] h-fit max-h-[90vh]' : ''}`}
      style={!showAsModal ? { ...cardStyle, width: cardWidth } : {}}
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r from-green-500 to-teal-500 p-4 text-white`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{step.title}</h3>
            {step.subtitle && <p className="text-green-100 text-sm">{step.subtitle}</p>}
          </div>
          {step.type === 'modal' && currentStep === 0 && userRole && (
            <RoleBadge role={userRole} darkMode={false} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-gray-600 dark:text-gray-300 mb-4">{step.description}</p>

        {step.features && (
          <div className="space-y-2 mb-4">
            {step.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <feature.icon size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature.text}</span>
              </div>
            ))}
          </div>
        )}

        {step.tip && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
            <Sparkles size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{step.tip}</p>
          </div>
        )}
      </div>

      {/* Footer with navigation */}
      <div className="px-5 pb-5">
        {/* Step progress dots */}
        <div className="flex gap-1 mb-2">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                idx < currentStep ? 'bg-green-500' :
                idx === currentStep ? 'bg-green-400' :
                'bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Auto-advance timer bar */}
        {autoAdvanceProgress !== undefined && currentStep < totalSteps - 1 && (
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${autoAdvanceProgress}%` }}
            />
          </div>
        )}

        {!autoAdvanceProgress && <div className="mb-2" />}

        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={onPrev}
                className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className={`flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40`}
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  Get Started
                  <Rocket size={18} />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Auto-advance interval in milliseconds per step
const AUTO_ADVANCE_MS = 5000;

// Main Onboarding component
const Onboarding = ({ isOpen, onComplete, onSkip, themeColor = 'green', darkMode = false, userRole = null, userName = '' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoAdvanceRef = useRef(null);
  const progressRef = useRef(null);

  // Generate role-specific steps
  const onboardingSteps = getOnboardingSteps(userRole, userName);
  const step = onboardingSteps[currentStep];

  // Determine if spotlight target is missing (fallback to modal)
  const isFallbackModal = step.type === 'spotlight' && !targetRect;

  // Find and measure target element
  const updateTargetRect = useCallback(() => {
    if (step.type === 'spotlight' && step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect);
      return () => {
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect);
      };
    }
  }, [isOpen, currentStep, updateTargetRect]);

  // Auto-advance timer — progresses through all steps automatically
  useEffect(() => {
    if (!isOpen || isPaused) return;

    // Don't auto-advance on the final step
    const isLastStep = currentStep === onboardingSteps.length - 1;
    if (isLastStep) {
      setAutoAdvanceProgress(0);
      return;
    }

    // Reset progress on step change
    setAutoAdvanceProgress(0);
    const startTime = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / AUTO_ADVANCE_MS) * 100, 100);
      setAutoAdvanceProgress(progress);
    }, 50);

    autoAdvanceRef.current = setTimeout(() => {
      setCurrentStep(prev => {
        if (prev < onboardingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, AUTO_ADVANCE_MS);

    return () => {
      clearTimeout(autoAdvanceRef.current);
      clearInterval(progressRef.current);
    };
  }, [isOpen, currentStep, isPaused, onboardingSteps.length]);

  // Show confetti on final step
  useEffect(() => {
    if (currentStep === onboardingSteps.length - 1) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onboardingSteps.length]);

  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsPaused(false);
      setAutoAdvanceProgress(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    // User clicked next — pause auto-advance so they control the pace
    setIsPaused(true);
    clearTimeout(autoAdvanceRef.current);
    clearInterval(progressRef.current);
    setAutoAdvanceProgress(0);

    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    // User clicked back — pause auto-advance
    setIsPaused(true);
    clearTimeout(autoAdvanceRef.current);
    clearInterval(progressRef.current);
    setAutoAdvanceProgress(0);

    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    clearTimeout(autoAdvanceRef.current);
    clearInterval(progressRef.current);
    onSkip();
  };

  if (!isOpen) return null;

  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* Confetti effect */}
      <Confetti active={showConfetti} />

      {/* Spotlight overlay for spotlight steps — only when target element exists */}
      {step.type === 'spotlight' && targetRect && (
        <>
          <SpotlightOverlay targetRect={targetRect} onClick={() => {}} />
          <AnimatedArrow position={step.position} targetRect={targetRect} />
        </>
      )}

      {/* Modal overlay — for modal steps AND spotlight steps falling back to modal */}
      {(step.type === 'modal' || isFallbackModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9996] animate-fade-in" />
      )}

      {/* Tooltip card */}
      <TooltipCard
        step={step}
        position={step.position}
        targetRect={targetRect}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        currentStep={currentStep}
        totalSteps={onboardingSteps.length}
        themeColor={themeColor}
        userRole={userRole}
        darkMode={darkMode}
        autoAdvanceProgress={isPaused ? undefined : autoAdvanceProgress}
      />

      {/* Custom styles */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes bounce-horizontal {
          0%, 100% {
            transform: translateX(0) rotate(180deg);
          }
          50% {
            transform: translateX(-10px) rotate(180deg);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.6), 0 0 40px rgba(74, 222, 128, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(74, 222, 128, 0.8), 0 0 60px rgba(74, 222, 128, 0.5);
          }
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-bounce-horizontal {
          animation: bounce-horizontal 1s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
