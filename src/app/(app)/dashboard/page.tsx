"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";

interface AnalysisSummary {
  id: string;
  type: string;
  title: string;
  createdAt: string;
}

interface ActivitySummary {
  id: string;
  description: string;
  createdAt: string;
}

interface DaySummary {
  date: Date;
  label: string;
  count: number;
}

function MiniTrend({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  const points = values.map((value, index) =>
    `${index * (100 / (values.length - 1))},${27 - (value / max) * 21}`,
  ).join(" ");
  return (
    <svg className="metric-sparkline" viewBox="0 0 100 32" role="img" aria-label="Trend over the last seven days">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((value, index) => (
        <circle key={index} cx={index * (100 / (values.length - 1))} cy={27 - (value / max) * 21} r="1.5" fill={color} />
      ))}
    </svg>
  );
}

function ChartIcon({ type }: { type: "analysis" | "data" | "report" | "week" }) {
  const content = {
    analysis: <><path d="M4 18V6M4 18h16" /><path d="m7 14 3-4 3 2 5-6" /></>,
    data: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 10h16M10 4v16" /></>,
    report: <><path d="M7 3.5h7l4 4V20H7z" /><path d="M14 3.5V8h4M10 13h5M10 16h5" /></>,
    week: <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16M8 14h2M13 14h3" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{content[type]}</svg>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [datasets, setDatasets] = useState(0);
  const [reports, setReports] = useState(0);
  const [activity, setActivity] = useState<ActivitySummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      apiRequest<{ analyses: AnalysisSummary[] }>("/api/analyses"),
      apiRequest<{ datasets: { id: string }[] }>("/api/datasets"),
      apiRequest<{ reports: { id: string }[] }>("/api/reports"),
      apiRequest<{ activity: ActivitySummary[] }>("/api/activity"),
    ]).then(([analysisResult, datasetResult, reportResult, activityResult]) => {
      if (!active) return;
      setAnalyses(analysisResult.analyses);
      setDatasets(datasetResult.datasets.length);
      setReports(reportResult.reports.length);
      setActivity(activityResult.activity.slice(0, 5));
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load your analytics.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  const days = useMemo<DaySummary[]>(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const count = analyses.filter((analysis) => {
      const createdAt = new Date(analysis.createdAt);
      return createdAt >= date && createdAt < nextDate;
    }).length;
    return { date, count, label: date.toLocaleDateString(undefined, { weekday: "short" }) };
  }), [analyses]);
  const weeklyCount = days.reduce((sum, day) => sum + day.count, 0);
  const peak = Math.max(1, ...days.map((day) => day.count));
  const barWidth = 34;
  const chartX = (index: number) => 42 + index * 82;
  const chartY = (count: number) => 170 - (count / peak) * 132;
  const trendPoints = days.map((day, index) => `${chartX(index) + barWidth / 2},${chartY(day.count)}`).join(" ");
  const sparkValues = days.map((day) => day.count);

  return (
    <section className="analytics-dashboard">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR WORKSPACE</span>
          <h1>Analytics</h1>
          <p className="sub">Welcome back, {user?.name.split(" ")[0]}. Here&apos;s your statistical workspace at a glance.</p>
        </div>
        <div className="dashboard-date">
          <span className="date-icon"><ChartIcon type="week" /></span>
          <span><small>Today</small><b>{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</b></span>
        </div>
      </header>

      {error && <div className="dashboard-error" role="alert">{error}</div>}

      <div className="dashboard-metrics" aria-label="Your statistics">
        <article className="metric-card">
          <div className="metric-top"><span>Saved analyses</span><span className="metric-icon metric-blue"><ChartIcon type="analysis" /></span></div>
          <strong>{loading ? "—" : analyses.length.toLocaleString()}</strong>
          <div className="metric-foot"><span className="metric-caption">Across all methods</span><MiniTrend values={sparkValues} color="#3878f6" /></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Datasets</span><span className="metric-icon metric-violet"><ChartIcon type="data" /></span></div>
          <strong>{loading ? "—" : datasets.toLocaleString()}</strong>
          <div className="metric-foot"><span className="metric-caption">Your saved data</span><span className="metric-trend-pill">Personal</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Saved reports</span><span className="metric-icon metric-green"><ChartIcon type="report" /></span></div>
          <strong>{loading ? "—" : reports.toLocaleString()}</strong>
          <div className="metric-foot"><span className="metric-caption">Ready to revisit</span><span className="metric-trend-pill">Saved</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>This week</span><span className="metric-icon metric-orange"><ChartIcon type="week" /></span></div>
          <strong>{loading ? "—" : weeklyCount.toLocaleString()}</strong>
          <div className="metric-foot"><span className="metric-caption">Analyses created</span><MiniTrend values={sparkValues} color="#f29b52" /></div>
        </article>
      </div>

      <div className="dashboard-chart-grid">
        <article className="dashboard-panel activity-chart-panel">
          <div className="panel-heading">
            <div><h2>Analysis activity</h2><p>Saved analyses over the last seven days</p></div>
            <span className="chart-legend"><i /> Analyses</span>
          </div>
          {loading ? <div className="chart-loading" role="status">Loading your analytics…</div> : weeklyCount === 0 ? (
            <div className="chart-empty">
              <span className="empty-chart-icon"><ChartIcon type="analysis" /></span>
              <b>Your activity will appear here</b>
              <span>Save an analysis to start building your activity chart.</span>
            </div>
          ) : (
            <div className="dashboard-chart-scroll">
              <svg className="activity-chart" viewBox="0 0 590 220" role="img" aria-label="Bar chart of saved analyses over the past seven days">
                {[0, 1, 2, 3].map((line) => {
                  const y = 38 + line * 44;
                  return <g key={line}><line x1="36" x2="580" y1={y} y2={y} className="chart-grid-line" /><text x="24" y={y + 4} className="chart-axis-label" textAnchor="end">{Math.ceil(peak * (3 - line) / 3)}</text></g>;
                })}
                {days.map((day, index) => (
                  <g key={day.date.toISOString()}>
                    <rect className="activity-bar-track" x={chartX(index)} y="38" width={barWidth} height="132" rx="9" />
                    <rect className="activity-bar" x={chartX(index)} y={chartY(day.count)} width={barWidth} height={Math.max(day.count ? 8 : 0, day.count / peak * 132)} rx="9">
                      <title>{day.count} {day.count === 1 ? "analysis" : "analyses"} on {day.date.toLocaleDateString()}</title>
                    </rect>
                    <text x={chartX(index) + barWidth / 2} y="199" className="chart-axis-label" textAnchor="middle">{day.label}</text>
                  </g>
                ))}
                <polyline className="activity-trend-line" points={trendPoints} />
                {days.map((day, index) => <circle key={`point-${day.date.toISOString()}`} className="activity-trend-dot" cx={chartX(index) + barWidth / 2} cy={chartY(day.count)} r="3.5" />)}
              </svg>
            </div>
          )}
          <div className="chart-footer"><span>Showing your private analysis history</span><Link href="/history">View history <span aria-hidden="true">→</span></Link></div>
        </article>

        <article className="dashboard-panel latest-panel">
          <div className="panel-heading">
            <div><h2>Recent activity</h2><p>Your latest workspace updates</p></div>
            <span className="live-indicator"><i /> LIVE</span>
          </div>
          {loading ? <div className="activity-loading" role="status">Loading recent activity…</div> : activity.length === 0 ? (
            <div className="activity-empty">
              <span className="empty-chart-icon"><ChartIcon type="report" /></span>
              <b>Nothing here yet</b>
              <span>Run and save an analysis to see your activity.</span>
            </div>
          ) : (
            <div className="activity-list">
              {activity.map((item, index) => (
                <div className="dashboard-activity-item" key={item.id}>
                  <span className={`activity-dot activity-dot-${index % 4}`} />
                  <span className="activity-copy"><b>{item.description}</b><small>{new Date(item.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></span>
                </div>
              ))}
            </div>
          )}
          <Link href="/history" className="panel-text-link">See all activity <span aria-hidden="true">→</span></Link>
        </article>
      </div>

      <div className="dashboard-lower-grid">
        <article className="dashboard-panel quick-start-panel">
          <div className="panel-heading"><div><h2>Start an analysis</h2><p>Choose a method to explore your data.</p></div></div>
          <div className="analysis-shortcuts">
            <Link href="/regression" className="analysis-shortcut">
              <span className="shortcut-icon shortcut-blue"><ChartIcon type="analysis" /></span>
              <span className="shortcut-copy"><b>Simple Linear Regression</b><small>Model the relationship between two variables</small></span>
              <span className="shortcut-arrow" aria-hidden="true">↗</span>
            </Link>
            <Link href="/hypothesis" className="analysis-shortcut">
              <span className="shortcut-icon shortcut-violet"><ChartIcon type="week" /></span>
              <span className="shortcut-copy"><b>Hypothesis Testing</b><small>Test a claim with a one-sample Z-test</small></span>
              <span className="shortcut-arrow" aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
        <article className="dashboard-panel recent-analyses-panel">
          <div className="panel-heading">
            <div><h2>Recent analyses</h2><p>Your latest saved results</p></div>
            <Link href="/history" className="panel-text-link">View all <span aria-hidden="true">→</span></Link>
          </div>
          {loading ? <div className="activity-loading" role="status">Loading saved analyses…</div> : analyses.length === 0 ? (
            <div className="recent-empty"><span>No saved analyses yet. Your results will be listed here.</span><Link href="/regression">Create your first analysis →</Link></div>
          ) : (
            <div className="recent-analysis-list">
              {analyses.slice(0, 4).map((analysis) => (
                <div className="recent-analysis-item" key={analysis.id}>
                  <span className="recent-analysis-mark"><ChartIcon type={analysis.type === "Z-test" ? "week" : "analysis"} /></span>
                  <span className="activity-copy"><b>{analysis.title}</b><small>{analysis.type} · {new Date(analysis.createdAt).toLocaleDateString()}</small></span>
                  <Link href="/history" className="recent-open" aria-label={`Open history for ${analysis.title}`}>→</Link>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
