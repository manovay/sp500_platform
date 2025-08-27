import React, { useState } from 'react';

// Simple icons using emoji/unicode
const ICONS = {
  DATA: '🗄️',
  JOB: '⚙️',
  API: '🔌',
  EXT: '🌐',
  UI: '🖥️',
  DEPLOY: '🚀',
};

const NODE_COLORS = {
  DATA: "#8B5CF6",
  JOB: "#8B5CF6",
  API: "#8B5CF6",
  EXT: "#10B981",
  UI: "#1F2937",
  MODEL: "#8B5CF6",
  TEST: "#EF4444",
  DEPLOY: "#10B981",
};

const NODE_BORDER_COLORS = {
  DATA: "#8B5CF6",
  JOB: "#8B5CF6",
  API: "#8B5CF6",
  EXT: "#10B981",
  UI: "#374151",
  MODEL: "#8B5CF6",
  TEST: "#EF4444",
  DEPLOY: "#10B981",
};

const TIMELINE_DATA = {
  nodes: [
    {
      id: "data_scraping",
      type: "JOB",
      title: "Financial Modeling Prep API Scraper",
      summary: "Extracted 3 years of historical S&P 500 data via REST API calls from FMP.",
      tags: ["python", "api", "etl"],
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
      links: [{ label: "HF Model Link", href: "https://huggingface.co/FinGPT" }],
      meta: { 
        domain: "Finance-specific fine-tuning",
        platform: "HuggingFace model hub"
      },
    },
    {
      id: "prompt_engineering",
      type: "JOB",
      title: "S&P 500 Prompt Generation Engine",
      summary: "Generated 1500+ prompt-response pairs for comprehensive model evaluation and finetuning data.",
      tags: ["prompting", "automation", "validation"],
      links: [{ label: "Prompt Script", href: "https://github.com/manovay/sp500_platform/blob/master/prompting-training/FInal-Data-Gen.ipynb" }],
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
      links: [{ label: "Validation Script", href: "https://github.com/manovay/sp500_platform/blob/master/prompting-training/fine-tuning-updated.ipynb" }],
      meta: { 
        validation: "Domain-specific testing",
        fine_tuning: "Model optimization"
      },
    },
    {
      id: "llm_endpoint",
      type: "API",
      title: "RunPod LLM API Endpoint",
      summary: "Production-ready API endpoint for real-time LLM inference.",
      tags: ["api", "inference", "production"],
      meta: { 
        platform: "RunPod cloud GPU",
        latency: "Real-time inference"
      },
    },
    {
      id: "cron_scheduler",
      type: "JOB",
      title: "Weekly Cron Job Scheduler",
      summary: "Automated weekly execution of data ingestion and portfolio rebalancing.",
      tags: ["automation", "cron", "scheduling"],
      meta: { 
        frequency: "Weekly execution",
        automation: "Fully automated pipeline"
      },
    },
    {
      id: "alpaca_integration",
      type: "EXT",
      title: "Alpaca Trading API Integration",
      summary: "Paper trading integration for automated portfolio execution.",
      tags: ["trading", "api", "execution"],
      meta: { 
        environment: "Paper trading",
        features: "Fractional shares, real-time data"
      },
    },
    {
      id: "frontend_app",
      type: "UI",
      title: "React Frontend Application",
      summary: "Modern web interface for portfolio monitoring and analysis.",
      tags: ["react", "ui", "monitoring"],
      links: [{ label: "Frontend Code", href: "https://github.com/manovay/sp500_platform/tree/master/frontend" }],
      meta: { 
        framework: "React + Vite",
        features: "Portfolio overview, analysis, history"
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

const BuildTimeline = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerPosition, setDrawerPosition] = useState({ top: 0, left: 0 });

  const handleNodeClick = (node, event) => {
    event.stopPropagation();
    
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
    <div style={{ 
      padding: "24px", 
      backgroundColor: "#000000", 
      minHeight: "100vh",
      color: "#FFFFFF",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <style>
        {`
          @media (max-width: 768px) {
            .timeline-phase {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 16px !important;
            }
            
            .timeline-node {
              min-width: auto !important;
              width: 100% !important;
            }
            
            .timeline-arrow {
              transform: none !important;
              margin: 8px 0 !important;
              text-align: center !important;
            }
            
            .timeline-container {
              padding: 16px !important;
            }
            
            .timeline-title {
              font-size: 16px !important;
            }
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{ 
        backgroundColor: "#1F2937", 
        padding: "24px", 
        borderRadius: "8px",
        marginBottom: "24px",
        border: "1px solid #374151",
      }}>
        <h1 style={{ margin: 0, color: "#FFFFFF", fontSize: "24px", fontWeight: "600" }}>
          How I Built It
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "#9CA3AF", fontSize: "14px" }}>
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
                color: type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
        <div className="timeline-container" style={{ 
          backgroundColor: "#1F2937", 
          padding: "24px", 
          borderRadius: "8px",
          border: "1px solid #374151",
        }}>
          {/* Timeline layout with 5 phases */}
          <div style={{ display: "grid", gap: "40px" }}>
            {/* Phase 1: Data Infrastructure */}
            <div style={{ 
              border: "2px solid #374151", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#000000",
            }}>
              <div className="timeline-title" style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#FFFFFF",
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
                Data Infrastructure
              </div>
              <div className="timeline-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "data_scraping").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
                <div className="timeline-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ ETL pipeline</div>
                {TIMELINE_DATA.nodes.filter(n => n.id === "postgres_db").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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

            {/* Phase 2: LLM Development */}
            <div style={{ 
              border: "2px solid #374151", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#000000",
            }}>
              <div className="timeline-title" style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#FFFFFF",
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
                  2
                </div>
                LLM Development
              </div>
              <div className="timeline-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "llm_discovery").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
                <div className="timeline-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ model selection</div>
                {TIMELINE_DATA.nodes.filter(n => n.id === "prompt_engineering").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
                <div className="timeline-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ generates prompts</div>
                {TIMELINE_DATA.nodes.filter(n => n.id === "llm_responses").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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

            {/* Phase 3: Model Validation */}
            <div style={{ 
              border: "2px solid #374151", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#000000",
            }}>
              <div className="timeline-title" style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#FFFFFF",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#EF4444",
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
                Model Validation
              </div>
              <div className="timeline-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "model_validation").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
                <div className="timeline-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ validation dataset</div>
                {TIMELINE_DATA.nodes.filter(n => n.id === "llm_endpoint").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
                <div className="timeline-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ deployment ready</div>
              </div>
            </div>

            {/* Phase 4: Production Deployment */}
            <div style={{ 
              border: "2px solid #374151", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#000000",
            }}>
              <div className="timeline-title" style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#FFFFFF",
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
                  4
                </div>
                Production Deployment
              </div>
              <div className="timeline-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "cron_scheduler").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
                <div className="timeline-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ production API</div>
                {TIMELINE_DATA.nodes.filter(n => n.id === "alpaca_integration").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
                <div className="timeline-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ executes trades</div>
              </div>
            </div>

            {/* Phase 5: Frontend Development */}
            <div style={{ 
              border: "2px solid #374151", 
              borderRadius: "12px", 
              padding: "24px",
              backgroundColor: "#000000",
            }}>
              <div className="timeline-title" style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#FFFFFF",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#8B5CF6",
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
              <div className="timeline-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {TIMELINE_DATA.nodes.filter(n => n.id === "frontend_app").map(node => (
                  <div key={node.id} className="timeline-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      data-node
                      onClick={(e) => handleNodeClick(node, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        backgroundColor: NODE_COLORS[node.type],
                        color: node.type === "UI" ? "#FFFFFF" : "#FFFFFF",
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
                <div className="timeline-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ displays results</div>
              </div>
            </div>
          </div>
        </div>

        {/* Node Details Drawer */}
        {selectedNode && (
          <div
            data-drawer
            style={{
              position: "absolute",
              top: drawerPosition.top,
              left: drawerPosition.left,
              width: "320px",
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              padding: "20px",
              zIndex: 1000,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#FFFFFF", fontSize: "16px", fontWeight: "600" }}>
                {selectedNode.title}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "0",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: 0, color: "#9CA3AF", fontSize: "14px", lineHeight: "1.5" }}>
                {selectedNode.summary}
              </p>
            </div>

            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Tags
                </h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {selectedNode.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#374151",
                        color: "#9CA3AF",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.meta?.metrics && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Metrics
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.metrics}
                </div>
              </div>
            )}

            {selectedNode.meta?.timeframe && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Timeframe
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.timeframe}
                </div>
              </div>
            )}

            {selectedNode.meta?.storage && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Storage
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.storage}
                </div>
              </div>
            )}

            {selectedNode.meta?.hosting && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Hosting
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.hosting}
                </div>
              </div>
            )}

            {selectedNode.meta?.domain && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Domain
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.domain}
                </div>
              </div>
            )}

            {selectedNode.meta?.platform && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Platform
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.platform}
                </div>
              </div>
            )}

            {selectedNode.meta?.volume && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Volume
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.volume}
                </div>
              </div>
            )}

            {selectedNode.meta?.scope && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Scope
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.scope}
                </div>
              </div>
            )}

            {selectedNode.meta?.format && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Format
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.format}
                </div>
              </div>
            )}

            {selectedNode.meta?.validation && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Validation
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.validation}
                </div>
              </div>
            )}

            {selectedNode.meta?.fine_tuning && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Fine-tuning
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.fine_tuning}
                </div>
              </div>
            )}

            {selectedNode.meta?.latency && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Latency
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.latency}
                </div>
              </div>
            )}

            {selectedNode.meta?.frequency && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Frequency
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.frequency}
                </div>
              </div>
            )}

            {selectedNode.meta?.automation && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Automation
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.automation}
                </div>
              </div>
            )}

            {selectedNode.meta?.environment && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Environment
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.environment}
                </div>
              </div>
            )}

            {selectedNode.meta?.features && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Features
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.features}
                </div>
              </div>
            )}

            {selectedNode.meta?.framework && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                  Framework
                </h4>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#000000", 
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}>
                  {selectedNode.meta.framework}
                </div>
              </div>
            )}

            {selectedNode.links && selectedNode.links.length > 0 && (
              <div>
                <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
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
                      backgroundColor: "#374151",
                      color: "#8B5CF6",
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
};

export default BuildTimeline;
