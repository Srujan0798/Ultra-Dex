'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  readState,
  readSentimentReport,
  readScraperResults,
  readSchedulerJobs,
  readDraftPost,
  readDraftDM,
  approvePost,
  approveDM,
  overrideDecision,
  toggleKillSwitch,
  type AutomationState,
  type SentimentReport,
  type ScraperResult,
  type SchedulerJob,
  type DraftPost,
  type DraftDM,
} from '@/lib/auto-ceo-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Activity,
  TrendingUp,
  Users,
  Target,
  Gauge,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Power,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  FileText,
  RefreshCw,
} from 'lucide-react';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatFutureTime(dateStr: string | null): string {
  if (!dateStr) return 'Not scheduled';
  const diff = new Date(dateStr).getTime() - Date.now();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `In ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `In ${hours}h`;
  return `In ${Math.floor(hours / 24)}d`;
}

// --- Gauge Component ---
function GaugeChart({ value, label, color }: { value: number; label: string; color: string }) {
  const angle = (value / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const radius = 40;
  const cx = 50;
  const cy = 50;
  const needleX = cx + radius * Math.cos(Math.PI - radians);
  const needleY = cy - radius * Math.sin(Math.PI - radians);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-32 h-20">
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#374151"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 126} 126`}
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3" fill={color} />
        {/* Label */}
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-current text-xs font-bold">
          {value}%
        </text>
      </svg>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

// --- KPI Card ---
function KPICard({
  icon: Icon,
  label,
  value,
  subtext,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-green-500/50 bg-green-500/5' : ''}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${highlight ? 'bg-green-500/20' : 'bg-primary/10'}`}>
          <Icon className={`w-5 h-5 ${highlight ? 'text-green-500' : 'text-primary'}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {subtext && <p className="text-xs text-muted-foreground/70">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Modal ---
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

// --- Main Page ---
export default function AutoCEOPage() {
  const [state, setState] = useState<AutomationState | null>(null);
  const [sentiment, setSentiment] = useState<SentimentReport | null>(null);
  const [scraper, setScraper] = useState<ScraperResult | null>(null);
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [draftPost, setDraftPost] = useState<DraftPost | null>(null);
  const [draftDM, setDraftDM] = useState<DraftDM | null>(null);
  const [loading, setLoading] = useState(true);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'responses' | 'users' | 'features' | 'scheduler'
  >('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [s, sent, scr, j, dp, ddm] = await Promise.all([
      readState(),
      readSentimentReport(),
      readScraperResults(),
      readSchedulerJobs(),
      readDraftPost(),
      readDraftDM(),
    ]);
    setState(s);
    setSentiment(sent);
    setScraper(scr);
    setJobs(j);
    setDraftPost(dp);
    setDraftDM(ddm);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApprovePost = async () => {
    if (!draftPost) return;
    const res = await approvePost(draftPost.id);
    showNotification(res.message);
    setPostModalOpen(false);
  };

  const handleApproveDM = async () => {
    if (!draftDM) return;
    const res = await approveDM(draftDM.userId, draftDM.message);
    showNotification(res.message);
    setDmModalOpen(false);
  };

  const handleOverride = async (decision: 'continue' | 'pivot' | 'stop') => {
    const res = await overrideDecision(decision);
    showNotification(res.message);
    fetchData();
  };

  const handleKillSwitch = async () => {
    if (!state) return;
    const res = await toggleKillSwitch(!state.killSwitch);
    showNotification(res.message);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading AUTO-CEO metrics...</span>
      </div>
    );
  }

  const pieData = scraper
    ? [
        { name: 'Buying', value: scraper.signalDistribution.buying },
        { name: 'Interest', value: scraper.signalDistribution.interest },
        { name: 'Feature Req', value: scraper.signalDistribution.featureRequest },
        { name: 'Pain Point', value: scraper.signalDistribution.painPoint },
      ]
    : [];

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: Activity },
    { key: 'responses' as const, label: 'Responses', icon: MessageSquare },
    { key: 'users' as const, label: 'Interested Users', icon: Users },
    { key: 'features' as const, label: 'Feature Requests', icon: Target },
    { key: 'scheduler' as const, label: 'Scheduler', icon: Clock },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AUTO-CEO Control Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated growth engine — monitoring Reddit signals & outreach
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button
            variant={state?.killSwitch ? 'default' : 'destructive'}
            size="sm"
            onClick={handleKillSwitch}
          >
            <Power className="w-4 h-4 mr-1" />
            {state?.killSwitch ? 'Resume Automation' : 'Kill Switch'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={MessageSquare}
          label="Total Reddit Responses"
          value={state?.totalResponses ?? 0}
          subtext="Across all subreddits"
        />
        <KPICard
          icon={TrendingUp}
          label="Positive Sentiment"
          value={`${state?.positiveSentiment ?? 0}%`}
          subtext="Of all responses"
        />
        <KPICard
          icon={Users}
          label="Interested Users"
          value={state?.interestedUsers.length ?? 0}
          subtext={`${state?.interestedUsers.filter((u) => u.status === 'contacted').length} contacted`}
        />
        <KPICard
          icon={Target}
          label="Buying Signals"
          value={state?.buyingSignals ?? 0}
          subtext="High-intent users"
          highlight
        />
        <div className="border rounded-lg bg-card p-4 flex flex-col items-center justify-center">
          <GaugeChart
            value={state?.decisionConfidence ?? 0}
            label="Decision Confidence"
            color={(state?.decisionConfidence ?? 0) > 70 ? '#22c55e' : '#f59e0b'}
          />
        </div>
      </div>

      {/* Decision Override */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Decision Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">
              Current:{' '}
              <strong className="text-foreground capitalize">{state?.decision ?? 'unknown'}</strong>
            </span>
            <Button
              variant={state?.decision === 'continue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleOverride('continue')}
            >
              <Play className="w-3 h-3 mr-1" /> Continue
            </Button>
            <Button
              variant={state?.decision === 'pivot' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleOverride('pivot')}
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Pivot
            </Button>
            <Button
              variant={state?.decision === 'stop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleOverride('stop')}
            >
              <Square className="w-3 h-3 mr-1" /> Stop
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${state?.killSwitch ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}
              />
              <span className="text-xs text-muted-foreground">
                {state?.killSwitch ? 'Automation STOPPED' : 'Automation RUNNING'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pending Post Approval
            </CardTitle>
            <CardDescription>
              {draftPost?.subreddit} — scheduled {formatFutureTime(draftPost?.scheduledAt || null)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium mb-1">{draftPost?.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{draftPost?.content}</p>
            <Button size="sm" onClick={() => setPostModalOpen(true)}>
              <CheckCircle className="w-3 h-3 mr-1" /> Review & Approve Post
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Pending DM Approval
            </CardTitle>
            <CardDescription>
              To: {draftDM?.username} — scheduled {formatFutureTime(draftDM?.scheduledAt || null)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{draftDM?.message}</p>
            <Button size="sm" onClick={() => setDmModalOpen(true)}>
              <CheckCircle className="w-3 h-3 mr-1" /> Review & Approve DM
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Sentiment Trend + Subreddit Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sentiment Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentiment?.data ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="positive"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot
                      />
                      <Line
                        type="monotone"
                        dataKey="neutral"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot
                      />
                      <Line
                        type="monotone"
                        dataKey="negative"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Responses by Subreddit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scraper?.responsesBySubreddit ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="subreddit" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signal Distribution Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Signal Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'responses' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Responses</CardTitle>
            <CardDescription>
              Latest Reddit responses with sentiment and signal analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Author
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Subreddit
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Comment
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Sentiment
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Signals
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {scraper?.recentResponses.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-2 px-3 font-mono text-xs">{r.author}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{r.subreddit}</td>
                      <td className="py-2 px-3 text-xs max-w-xs truncate">{r.commentPreview}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                            r.sentiment === 'positive'
                              ? 'bg-green-500/10 text-green-500'
                              : r.sentiment === 'negative'
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                          }`}
                        >
                          {r.sentiment === 'positive' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : r.sentiment === 'negative' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : null}
                          {r.sentiment}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {r.signals.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {formatRelativeTime(r.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interested Users</CardTitle>
            <CardDescription>Users who showed interest or buying intent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Username
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Signal Type
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Comment
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state?.interestedUsers.map((u, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-2 px-3 font-mono text-xs">{u.username}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                            u.signalType === 'buying'
                              ? 'bg-green-500/10 text-green-500'
                              : u.signalType === 'interest'
                                ? 'bg-blue-500/10 text-blue-500'
                                : u.signalType === 'feature-request'
                                  ? 'bg-yellow-500/10 text-yellow-500'
                                  : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {u.signalType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs max-w-xs truncate">{u.comment}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                            u.status === 'contacted'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {u.status === 'contacted' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Requests</CardTitle>
            <CardDescription>Most requested features from Reddit responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Feature
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Count</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Example Comment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scraper?.featureRequests.map((f, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-2 px-3 font-medium text-xs">{f.feature}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                          {f.count}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground max-w-md truncate">
                        {f.exampleComment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'scheduler' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheduler Status</CardTitle>
            <CardDescription>Automation job health and schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Job</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Last Run
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Next Run
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Errors
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-2 px-3 font-medium text-xs">{job.name}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {formatRelativeTime(job.lastRun)}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {formatFutureTime(job.nextRun)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                            job.status === 'success'
                              ? 'bg-green-500/10 text-green-500'
                              : job.status === 'error'
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                          }`}
                        >
                          {job.status === 'success' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : job.status === 'error' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {job.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {job.errorCount > 0 ? (
                          <span className="text-red-500 font-bold text-xs">{job.errorCount}</span>
                        ) : (
                          <span className="text-green-500 text-xs">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Approval Modal */}
      <Modal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        title="Approve Reddit Post"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Title</p>
            <p className="text-sm text-muted-foreground">{draftPost?.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Subreddit</p>
            <p className="text-sm text-muted-foreground">{draftPost?.subreddit}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Content</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {draftPost?.content}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPostModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprovePost}>
              <CheckCircle className="w-4 h-4 mr-1" /> Approve & Publish
            </Button>
          </div>
        </div>
      </Modal>

      {/* DM Approval Modal */}
      <Modal
        open={dmModalOpen}
        onClose={() => setDmModalOpen(false)}
        title="Approve Direct Message"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">To</p>
            <p className="text-sm text-muted-foreground">{draftDM?.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Message</p>
            <p className="text-sm text-muted-foreground">{draftDM?.message}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDmModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveDM}>
              <CheckCircle className="w-4 h-4 mr-1" /> Approve & Send
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
