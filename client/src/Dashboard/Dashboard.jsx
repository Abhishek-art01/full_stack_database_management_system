import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// --- Icons Components (Inline SVGs for portability) ---
const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const IconClock = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const IconArrowLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

export default function Dashboard() {
    const navigate = useNavigate();
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const [year, month] = filterDate.split('-');

        // Simulating API delay for transition effect (Remove timeout in production)
        setTimeout(() => {
            fetch(`http://127.0.0.1:8000/api/dashboard-data/?year=${year}&month=${month}`)
                .then(res => res.json())
                .then(json => {
                    setData(json);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("API Error:", err);
                    setLoading(false);
                });
        }, 500);
    }, [filterDate]);

    // --- Sub-Components ---

    const ProgressBar = ({ percentage }) => (
        <div className="progress-container">
            <div className="progress-info">
                <span>Completion Status</span>
                <strong>{percentage}%</strong>
            </div>
            <div className="progress-bar-bg">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );

    const StageStep = ({ title, subtitle, isCompleted, isLast }) => (
        <div className={`step-item ${isCompleted ? 'completed' : 'pending'}`}>
            <div className="step-icon">
                {isCompleted ? <IconCheck /> : <div className="dot" />}
            </div>
            <div className="step-content">
                <h4>{title}</h4>
                <p>{subtitle}</p>
            </div>
            {!isLast && <div className={`step-line ${isCompleted ? 'active' : ''}`} />}
        </div>
    );

    const MonthCard = ({ sectionData, isCurrent }) => {
        const { month, year, data: report } = sectionData;

        if (!report.found) {
            return (
                <div className={`card missing-report ${isCurrent ? 'current' : ''}`}>
                    <div className="card-header">
                        <h2>{month} {year}</h2>
                        <span className="badge badge-error">Not Started</span>
                    </div>
                    <div className="empty-state">
                        <IconClock />
                        <p>No reporting data available for this period.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className={`card report-card ${isCurrent ? 'current' : 'previous'}`}>
                <div className="card-header">
                    <div className="header-left">
                        <h2>{month} {year}</h2>
                        {isCurrent && <span className="badge badge-live">Live Tracking</span>}
                    </div>
                    {report.found && <ProgressBar percentage={report.progress} />}
                </div>

                <div className="timeline-wrapper">
                    <StageStep
                        title="1st - 10th"
                        subtitle="Initial Phase"
                        isCompleted={report.stage1.locality && report.stage1.gps}
                    />
                    <StageStep
                        title="11th - 20th"
                        subtitle="Mid Phase"
                        isCompleted={report.stage2.locality && report.stage2.gps}
                    />
                    <StageStep
                        title="21st - End"
                        subtitle="Final Phase"
                        isCompleted={report.stage3.locality && report.stage3.gps}
                    />
                    <StageStep
                        title="MIS Submission"
                        subtitle="Report Gen"
                        isCompleted={report.final.mis_status}
                    />
                    <StageStep
                        title="Bill Approval"
                        subtitle="Finance"
                        isCompleted={report.final.bill_approval}
                        isLast={true}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            {/* Top Navigation Bar */}
            <nav className="top-nav">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <IconArrowLeft />
                </button>
                <h1>MIS Control Center</h1>
                <div className="date-picker-wrapper">
                    <IconCalendar />
                    <input
                        type="month"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="content-area">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Synchronizing Data...</p>
                    </div>
                ) : data ? (
                    <>
                        <div className="section-title">Current Period</div>
                        <MonthCard sectionData={data.current} isCurrent={true} />

                        <div className="divider">
                            <span>History</span>
                        </div>

                        <div className="previous-wrapper">
                            <MonthCard sectionData={data.previous} isCurrent={false} />
                        </div>
                    </>
                ) : (
                    <div className="error-state">Failed to load data.</div>
                )}
            </div>
        </div>
    );
}