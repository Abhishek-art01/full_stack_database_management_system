import { useState, useEffect } from 'react';
// 1. IMPORT useNavigate
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
    // 2. INITIALIZE the hook
    const navigate = useNavigate();

    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
    const [data, setData] = useState(null);

    // Fetch Data
    useEffect(() => {
        const [year, month] = filterDate.split('-');
        fetch(`http://127.0.0.1:8000/api/dashboard-data/?year=${year}&month=${month}`)
            .then(res => res.json())
            .then(json => setData(json))
            .catch(err => console.error("API Error:", err));
    }, [filterDate]);

    if (!data) return <div className="loading">Loading Dashboard...</div>;

    const renderStageNode = (title, subtitle, isCompleted) => (
        <div className={`stage-node ${isCompleted ? 'completed' : ''}`}>
            <div className="circle">{isCompleted ? "✓" : "●"}</div>
            <div className="label">{title}</div>
            <div className="sub-label">{subtitle}</div>
        </div>
    );

    const renderMonthSection = (sectionData, isCurrent) => {
        const { month, year, data: report } = sectionData;
        const opacity = isCurrent ? 1 : 0.6;

        return (
            <div className="month-section" style={{ opacity, marginBottom: '50px' }}>
                <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {month} {year}
                    {report.found ?
                        <span className="badge-progress"> | {report.progress}% Done</span> :
                        <span className="badge-missing"> | No Report Found</span>
                    }
                </h2>

                {report.found && (
                    <div className="progress-track">
                        <div className="progress-line"></div>

                        {/* 1st - 10th */}
                        {renderStageNode("1st - 10th", "Initial Phase", (report.stage1.locality && report.stage1.gps))}

                        {/* 11th - 20th */}
                        {renderStageNode("11th - 20th", "Mid Phase", (report.stage2.locality && report.stage2.gps))}

                        {/* 21st - End */}
                        {renderStageNode("21st - End", "Final Phase", (report.stage3.locality && report.stage3.gps))}

                        {/* Final MIS */}
                        {renderStageNode("Final MIS", "Submission", report.final.mis_status)}

                        {/* Bill Approval */}
                        {renderStageNode("Bill Approval", "Finance", report.final.bill_approval)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <div className="header-controls">
                <h1>📊 MIS Tracker</h1>
                <input
                    type="month"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                />
            </div>

            {renderMonthSection(data.current, true)}

            <div className="divider"><span>PREVIOUS MONTH</span></div>

            {renderMonthSection(data.previous, false)}
        </div>
    );
}