import React, { useState } from 'react';

// Simple icons using emoji/unicode
const ICONS = {
  DATA: '🗄️',
  JOB: '⚙️',
  API: '🔌',
  EXT: '🌐',
  UI: '🖥️',
  MODEL: '🤖',
  TEST: '🧪',
  DEPLOY: '🚀',
};

const NODE_COLORS = {
  DATA: "#0EA5E9",
  JOB: "#7C3AED",
  API: "#4F46E5",
  EXT: "#059669",
  UI: "#FFFFFF",
  MODEL: "#F59E0B",
  TEST: "#DC2626",
  DEPLOY: "#10B981",
};

const NODE_BORDER_COLORS = {
  DATA: "#0EA5E9",
  JOB: "#7C3AED",
  API: "#4F46E5",
  EXT: "#059669",
  UI: "#111827",
  MODEL: "#F59E0B",
  TEST: "#DC2626",
  DEPLOY: "#10B981",
};

const TIMELINE_DATA = {
  nodes: [
    {
      id: "data_scraping",
      type: "JOB",
      title: "Financial Modeling Prep API Scraper",
      summary: "Extracted 3 years of historical S&P 500 data via REST API calls.",
      tags: ["python", "api", "etl"],
      links: [{ label: "Scraper Script", href: "SCRAPER_FILE_URL" }],
      meta: { 
        metrics: "Price, volume, market cap, P/E ratio, dividend yield, analyst estimates",
        timeframe: "3 years historical data"
      },
    },
    {
      id: "postgres_db",
      type: "DATA",
      title: "Render PostgreSQL Database",
      summary: "Cloud-hosted relational database storing structured financial datasets.",
      tags: ["postgres", "cloud", "structured"],
      meta: { 
        storage: "Historical stock data, analyst estimates, market metrics",
        hosting: "Render cloud platform"
      },
    },
    {
      id: "llm_discovery",
      type: "EXT",
      title: "HuggingFace Fine-tuned Finance LLM",
      summary: "Identified and selected domain-specific language model for financial analysis.",
      links: [{ label: "HF Model Link", href: "HF_MODEL_URL" }],
      meta: { 
        domain: "Finance-specific fine-tuning",
        platform: "HuggingFace model hub"
      },
    },
    {
      id: "prompt_engineering",
      type: "JOB",
      title: "S&P 500 Prompt Generation Engine",
      summary: "Generated 1500+ structured prompts for comprehensive model evaluation.",
      tags: ["prompting", "automation", "validation"],
      links: [{ label: "Prompt Script", href: "PROMPT_FILE_URL" }],
      meta: { 
        volume: "1500+ prompts",
        scope: "Full S&P 500 coverage"
      },
    },
    {
      id: "llm_responses",
      type: "DATA",
      title: "LLM Response Storage",
      summary: "Persistent storage of model outputs for analysis and validation.",
      tags: ["json", "storage", "responses"],
      meta: { 
        format: "JSON allocation decisions",
        volume: "1500+ responses"
      },
    },
    {
      id: "model_validation",
      type: "TEST",
      title: "S&P 500 Domain Validation",
      summary: "Comprehensive testing and fine-tuning to ensure domain expertise.",
      tags: ["testing", "validation", "fine-tuning"],
      links: [{ label: "Validation Script", href: "VALIDATION_FILE_URL" }],
      meta: { 
        focus: "Domain knowledge verification",
        method: "Spot testing and fine-tuning"
      },
    },
    {
      id: "llm_endpoint",
      type: "DEPLOY",
      title: "Render LLM API Endpoint",
      summary: "Production deployment of fine-tuned model as REST API service.",
      tags: ["deployment", "api", "production"],
      meta: { 
        hosting: "Render cloud platform",
        frequency: "Weekly execution via cron"
      },
    },
    {
      id: "cron_scheduler",
      type: "JOB",
      title: "Weekly Cron Job Scheduler",
      summary: "Automated weekly execution of LLM inference with updated market data.",
      tags: ["cron", "automation", "scheduling"],
      meta: { 
        frequency: "Weekly execution",
        trigger: "Updated market data prompts"
      },
    },
    {
      id: "alpaca_integration",
      type: "API",
      title: "Alpaca Paper Trading API",
      summary: "Paper trading account integration for risk-free strategy execution.",
      tags: ["trading", "paper", "api"],
      links: [{ label: "Trading Script", href: "TRADING_FILE_URL" }],
      meta: { 
        account: "Paper trading environment",
        execution: "Weekly automated trades"
      },
    },
    {
      id: "frontend_app",
      type: "UI",
      title: "React + Node.js Frontend",
      summary: "Interactive web application for portfolio monitoring and strategy testing.",
      tags: ["react", "node.js", "frontend"],
      meta: { 
        features: "Portfolio stats, strategy testing, real-time monitoring",
        stack: "React frontend, Node.js backend"
      },
    },
  ],
  flows: [
    { from: "data_scraping", to: "postgres_db", label: "ETL pipeline" },
    { from: "llm_discovery", to: "prompt_engineering", label: "model selection" },
    { from: "prompt_engineering", to: "llm_responses", label: "generates prompts" },
    { from: "llm_responses", to: "model_validation", label: "validation dataset" },
    { from: "model_validation", to: "llm_endpoint", label: "deployment ready" },
    { from: "llm_endpoint", to: "cron_scheduler", label: "production API" },
    { from: "cron_scheduler", to: "alpaca_integration", label: "executes trades" },
    { from: "alpaca_integration", to: "frontend_app", label: "displays results" },
  ],
};

export default function BuildTimeline() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerPosition, setDrawerPosition] = useState({ top: 0, left: 0 });

  const handleNodeClick = (node, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = event.currentTarget.closest('[style*="position: relative"]').getBoundingClientRect();
    
    // Calculate position relative to the flowchart container
    const relativeTop = rect.top - containerRect.top;
    const relativeLeft = rect.left - containerRect.left;
    
    // Try to position to the right first, fallback to left if not enough space
    const drawerWidth = 320;
    const spaceOnRight = containerRect.width - (relativeLeft + rect.width + drawerWidth);
    
    let left = relativeLeft + rect.width + 16; // 16px gap
    if (spaceOnRight < 0) {
      left = relativeLeft - drawerWidth - 16; // Position to the left
    }
    
    setDrawerPosition({ top: relativeTop, left: Math.max(0, left) });
    setSelectedNode(node);
  };

  const handleContainerClick = (event) => {
    // Close drawer if clicking on the container but not on a node or the drawer itself
    if (selectedNode && !event.target.closest('[data-node]') && !event.target.closest('[data-drawer]')) {
      setSelectedNode(null);
    }
  };

  return (
    <div style={{ padding: "24px", backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: "#FFFFFF", 
        padding: "24px", 
        borderRadius: "8px",
        marginBottom: "24px",
        border: "1px solid #E5E7EB",
      }}>
        <h1 style={{ margin: 0, color: "#111827", fontSize: "24px", fontWeight: "600" }}>
          How I Built It
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "#6B7280", fontSize: "14px" }}>
          Development timeline showing the technical build process
        </p>
        
        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
          {Object.entries(ICONS).map(([type, icon]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span style={{ 
                padding: "2px 6px", 
                backgroundColor: NODE_COLORS[type], 
                color: type === "UI" ? "#111827" : "#FFFFFF",
                borderRadius: "4px",
                fontWeight: "500",
              }}>
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: "relative" }} onClick={handleContainerClick}>
        {/* Main timeline */}
        <div style={{ 
          backgroundColor: "#FFFFFF", 
          padding: "24px", 
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
        }}>
          {/* Timeline layout with 5 phases */}
          <div style={{ display: "grid", gap: "40px" }}>
            {/* Phase 1: Data Infrastructure */}
            <div style={{ 
              border: "2px solid #E5E7EB", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#F9FAFB",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#0EA5E9",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "600",
                }}>
                  1
                </div>
                Data Infrastructure Setup
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "data_scraping").map(node => (
                  <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#111827" : "#FFFFFF",
                        border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        minWidth: "200px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                      {node.title}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: "12px", color: "#6B7280" }}>→ ETL pipeline</div>
                {TIMELINE_DATA.nodes.filter(n => n.id === "postgres_db").map(node => (
                  <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#111827" : "#FFFFFF",
                        border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        minWidth: "200px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                      {node.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 2: Model Development & Validation (Combined) */}
            <div style={{ 
              border: "2px solid #E5E7EB", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#F9FAFB",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#7C3AED",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "600",
                }}>
                  2
                </div>
                Model Development & Validation
              </div>
                             <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "nowrap", overflowX: "auto" }}>
                 {TIMELINE_DATA.nodes.filter(n => n.id === "llm_discovery").map(node => (
                   <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                     <div
                       data-node
                       onClick={(e) => handleNodeClick(node, e)}
                       style={{
                         display: "flex",
                         alignItems: "center",
                         gap: "8px",
                         padding: "12px 16px",
                         backgroundColor: NODE_COLORS[node.type],
                         color: node.type === "UI" ? "#111827" : "#FFFFFF",
                         border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                         borderRadius: "8px",
                         cursor: "pointer",
                         fontSize: "14px",
                         fontWeight: "500",
                         minWidth: "200px",
                       }}
                     >
                       <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                       {node.title}
                     </div>
                   </div>
                 ))}
                 <div style={{ fontSize: "12px", color: "#6B7280" }}>→ model selection</div>
                 {TIMELINE_DATA.nodes.filter(n => n.id === "prompt_engineering").map(node => (
                   <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                     <div
                       data-node
                       onClick={(e) => handleNodeClick(node, e)}
                       style={{
                         display: "flex",
                         alignItems: "center",
                         gap: "8px",
                         padding: "12px 16px",
                         backgroundColor: NODE_COLORS[node.type],
                         color: node.type === "UI" ? "#111827" : "#FFFFFF",
                         border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                         borderRadius: "8px",
                         cursor: "pointer",
                         fontSize: "14px",
                         fontWeight: "500",
                         minWidth: "200px",
                       }}
                     >
                       <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                       {node.title}
                     </div>
                   </div>
                 ))}
                 <div style={{ fontSize: "12px", color: "#6B7280" }}>→ validation</div>
                 {TIMELINE_DATA.nodes.filter(n => n.id === "model_validation").map(node => (
                   <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                     <div
                       data-node
                       onClick={(e) => handleNodeClick(node, e)}
                       style={{
                         display: "flex",
                         alignItems: "center",
                         gap: "8px",
                         padding: "12px 16px",
                         backgroundColor: NODE_COLORS[node.type],
                         color: node.type === "UI" ? "#111827" : "#FFFFFF",
                         border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                         borderRadius: "8px",
                         cursor: "pointer",
                         fontSize: "14px",
                         fontWeight: "500",
                         minWidth: "200px",
                       }}
                     >
                       <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                       {node.title}
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Phase 3: Production Deployment */}
            <div style={{ 
              border: "2px solid #E5E7EB", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#F9FAFB",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#10B981",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "600",
                }}>
                  3
                </div>
                Production Deployment
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "llm_endpoint").map(node => (
                  <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#111827" : "#FFFFFF",
                        border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        minWidth: "200px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                      {node.title}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: "12px", color: "#6B7280" }}>→ production API</div>
                {TIMELINE_DATA.nodes.filter(n => n.id === "cron_scheduler").map(node => (
                  <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#111827" : "#FFFFFF",
                        border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        minWidth: "200px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                      {node.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 4: Trading Integration */}
            <div style={{ 
              border: "2px solid #E5E7EB", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#F9FAFB",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#4F46E5",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "600",
                }}>
                  4
                </div>
                Trading Integration
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "alpaca_integration").map(node => (
                  <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#111827" : "#FFFFFF",
                        border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        minWidth: "200px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                      {node.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 5: Frontend Development */}
            <div style={{ 
              border: "2px solid #E5E7EB", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#F9FAFB",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#059669",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "600",
                }}>
                  5
                </div>
                Frontend Development
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "frontend_app").map(node => (
                  <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#111827" : "#FFFFFF",
                        border: `2px solid ${NODE_BORDER_COLORS[node.type]}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        minWidth: "200px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{ICONS[node.type]}</span>
                      {node.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Details drawer - positioned near clicked node */}
        {selectedNode && (
          <div 
            data-drawer
            style={{
              position: "absolute",
              top: `${drawerPosition.top}px`,
              left: `${drawerPosition.left}px`,
              width: "320px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              padding: "24px",
              height: "fit-content",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              zIndex: 10,
            }}>
            <div style={{ marginBottom: "20px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                backgroundColor: NODE_COLORS[selectedNode.type],
                color: selectedNode.type === "UI" ? "#111827" : "#FFFFFF",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "500",
                marginBottom: "12px",
              }}>
                <span style={{ fontSize: "14px" }}>{ICONS[selectedNode.type]}</span>
                {selectedNode.type}
              </div>
              <h3 style={{ margin: "0 0 12px 0", color: "#111827", fontSize: "18px" }}>
                {selectedNode.title}
              </h3>
              <p style={{ margin: "0 0 16px 0", color: "#6B7280", fontSize: "14px", lineHeight: "1.5" }}>
                {selectedNode.summary}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                Technical Details
              </h4>
              <ul style={{ margin: 0, paddingLeft: "16px", color: "#6B7280", fontSize: "14px" }}>
                {selectedNode.id === "data_scraping" && (
                  <>
                    <li>REST API integration with Financial Modeling Prep</li>
                    <li>Automated data extraction for 3-year historical period</li>
                    <li>ETL pipeline for data transformation and validation</li>
                  </>
                )}
                {selectedNode.id === "postgres_db" && (
                  <>
                    <li>Cloud-hosted PostgreSQL on Render platform</li>
                    <li>Structured schema for financial data storage</li>
                    <li>Optimized for time-series data queries</li>
                  </>
                )}
                {selectedNode.id === "llm_discovery" && (
                  <>
                    <li>HuggingFace model hub exploration</li>
                    <li>Finance-specific fine-tuned model selection</li>
                    <li>Domain expertise validation criteria</li>
                  </>
                )}
                {selectedNode.id === "prompt_engineering" && (
                  <>
                    <li>Automated prompt generation for S&P 500 stocks</li>
                    <li>1500+ structured prompts for comprehensive testing</li>
                    <li>Consistent formatting and validation</li>
                  </>
                )}
                {selectedNode.id === "llm_responses" && (
                  <>
                    <li>JSON response storage and validation</li>
                    <li>Historical decision tracking</li>
                    <li>Response quality assessment</li>
                  </>
                )}
                {selectedNode.id === "model_validation" && (
                  <>
                    <li>Spot testing methodology for domain verification</li>
                    <li>Fine-tuning based on S&P 500 performance</li>
                    <li>Model accuracy and consistency validation</li>
                  </>
                )}
                {selectedNode.id === "llm_endpoint" && (
                  <>
                    <li>Render cloud deployment configuration</li>
                    <li>REST API service architecture</li>
                    <li>Production-ready model serving</li>
                  </>
                )}
                {selectedNode.id === "cron_scheduler" && (
                  <>
                    <li>Automated weekly execution scheduling</li>
                    <li>Updated market data integration</li>
                    <li>Error handling and monitoring</li>
                  </>
                )}
                {selectedNode.id === "alpaca_integration" && (
                  <>
                    <li>Paper trading account setup</li>
                    <li>Automated order execution via API</li>
                    <li>Risk-free strategy testing environment</li>
                  </>
                )}
                {selectedNode.id === "frontend_app" && (
                  <>
                    <li>React.js frontend with modern UI/UX</li>
                    <li>Node.js backend API integration</li>
                    <li>Real-time portfolio monitoring and testing</li>
                  </>
                )}
              </ul>
            </div>

            {selectedNode.meta?.metrics && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                  Data Metrics
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#F9FAFB", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#6B7280",
                }}>
                  {selectedNode.meta.metrics}
                </div>
              </div>
            )}

            {selectedNode.meta?.timeframe && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                  Timeframe
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#F9FAFB", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#6B7280",
                }}>
                  {selectedNode.meta.timeframe}
                </div>
              </div>
            )}

            {selectedNode.meta?.volume && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                  Volume
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#F9FAFB", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#6B7280",
                }}>
                  {selectedNode.meta.volume}
                </div>
              </div>
            )}

            {selectedNode.meta?.frequency && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                  Frequency
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#F9FAFB", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#6B7280",
                }}>
                  {selectedNode.meta.frequency}
                </div>
              </div>
            )}

            {selectedNode.links && selectedNode.links.length > 0 && (
              <div>
                <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                  Links
                </h4>
                {selectedNode.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      padding: "8px 12px",
                      backgroundColor: "#F3F4F6",
                      color: "#4F46E5",
                      textDecoration: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      marginBottom: "8px",
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
