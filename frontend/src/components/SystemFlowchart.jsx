import React, { useState } from 'react';

// Simple icons using emoji/unicode
const ICONS = {
  DATA: '🗄️',
  JOB: '⚙️',
  API: '🔌',
  EXT: '🌐',
  UI: '🖥️',
};

const NODE_COLORS = {
  DATA: "#8B5CF6",
  JOB: "#8B5CF6",
  API: "#8B5CF6",
  EXT: "#10B981",
  UI: "#1F2937",
  SAFETY: "#EF4444",
};

const NODE_BORDER_COLORS = {
  DATA: "#8B5CF6",
  JOB: "#8B5CF6",
  API: "#8B5CF6",
  EXT: "#10B981",
  UI: "#374151",
  SAFETY: "#EF4444",
};

const FLOW_DATA = {
  nodes: [
    {
      id: "job_scrape",
      type: "JOB",
      title: "Weekly scraper cron",
      summary: "Fetches/updates weekly data into the DB.",
      tags: ["cron", "etl"],
      links: [{ label: "Cron file", href: "https://github.com/manovay/sp500_platform/blob/master/ingestion/run_all.py" }],
    },
    {
      id: "db_history",
      type: "DATA",
      title: "Postgres DB — 3y stock data",
      summary: "Historical & weekly-updated stock dataset.",
      tags: ["postgres", "historical"],
      links: [{ label: "DB file", href: "DB_FILE_URL" }],
      meta: { metrics: "Price, volume, market cap, P/E ratio, dividend yield" },
    },
    {
      id: "job_prompt",
      type: "JOB",
      title: "Prompt builder",
      summary: "Builds LLM prompt from metrics.",
      links: [{ label: "Prompt code", href: "https://github.com/manovay/sp500_platform/blob/master/ingestion/fetch_weekly_llm.py" }],
      meta: { prompt: "Given stock metrics, allocate portfolio weights..." },
    },
    {
      id: "ext_llm",
      type: "EXT",
      title: "Fine-tuned LLM (Runpod)",
      summary: "Receives the prompt and returns JSON allocation output.",
      links: [{ label: "LLM link", href: "https://huggingface.co/mdot77/llama2-7b-forecaster-merged" }],
    },
    {
      id: "db_llm_json",
      type: "DATA",
      title: "LLM output storage",
      summary: "Stores the JSON (or attempted JSON) response.",
      meta: { sample: '{"AAPL": 0.15, "MSFT": 0.20, "GOOGL": 0.10}' },
    },
    {
      id: "job_trades",
      type: "JOB",
      title: "Trade executor",
      summary: "Executes fractional notional orders per allocation via Alpaca.",
      links: [{ label: "Trades file", href: "https://github.com/manovay/sp500_platform/blob/master/ingestion/run_trades.py" }],
    },
    {
      id: "ext_alpaca",
      type: "EXT",
      title: "Alpaca Trading API",
      summary: "/v2/account, /v2/positions, /v2/orders.",
    },
    {
      id: "api_backend",
      type: "API",
      title: "Backend API",
      summary: "Serves account/positions/history/orders to the UI.",
    },
    {
      id: "ui_frontend",
      type: "UI",
      title: "Frontend app",
      summary: "Overview, History, Analysis, Test pages.",
      links: [{ label: "Frontend entry", href: "https://github.com/manovay/sp500_platform/tree/master/frontend" }],
    },
  ],
  flows: [
    { from: "job_scrape", to: "db_history", label: "writes weekly data" },
    { from: "db_history", to: "job_prompt", label: "selects metrics" },
    { from: "job_prompt", to: "ext_llm", label: "sends prompt" },
    { from: "ext_llm", to: "db_llm_json", label: "stores JSON" },
    { from: "db_llm_json", to: "job_trades", label: "reads allocation" },
    { from: "job_trades", to: "ext_alpaca", label: "executes orders" },
    { from: "ext_alpaca", to: "api_backend", label: "provides data" },
    { from: "api_backend", to: "ui_frontend", label: "serves UI" },
  ],
};

const SystemFlowchart = () => {
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
            .flow-phase {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 16px !important;
            }
            
            .flow-node {
              min-width: auto !important;
              width: 100% !important;
            }
            
            .flow-arrow {
              transform: none !important;
              margin: 8px 0 !important;
              text-align: center !important;
            }
            
            .flow-container {
              padding: 16px !important;
            }
            
            .flow-title {
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
          How the app works
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "#9CA3AF", fontSize: "14px" }}>
          Simple system flowchart showing data flow and components
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

      {/* Flowchart */}
      <div style={{ position: "relative" }} onClick={handleContainerClick}>
        {/* Main flowchart */}
        <div className="flow-container" style={{ 
          backgroundColor: "#1F2937", 
          padding: "24px", 
          borderRadius: "8px",
          border: "1px solid #374151",
        }}>
         {/* Flow layout with 4 phases */}
         <div style={{ display: "grid", gap: "40px" }}>
           {/* Phase 1: Data Collection */}
           <div style={{ 
             border: "2px solid #374151", 
             borderRadius: "12px", 
             padding: "24px",
             backgroundColor: "#000000",
           }}>
             <div className="flow-title" style={{ 
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
               Data Collection
             </div>
             <div className="flow-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               {FLOW_DATA.nodes.filter(n => n.id === "job_scrape").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
               <div className="flow-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ writes weekly data</div>
               {FLOW_DATA.nodes.filter(n => n.id === "db_history").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

           {/* Phase 2: AI Decision */}
           <div style={{ 
             border: "2px solid #374151", 
             borderRadius: "12px", 
             padding: "24px",
             backgroundColor: "#000000",
           }}>
             <div className="flow-title" style={{ 
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
               AI Decision
             </div>
             <div className="flow-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               {FLOW_DATA.nodes.filter(n => n.id === "job_prompt").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
               <div className="flow-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ sends prompt</div>
               {FLOW_DATA.nodes.filter(n => n.id === "ext_llm").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
               <div className="flow-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ stores JSON</div>
               {FLOW_DATA.nodes.filter(n => n.id === "db_llm_json").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

           {/* Phase 3: Trade Execution */}
           <div style={{ 
             border: "2px solid #374151", 
             borderRadius: "12px", 
             padding: "24px",
             backgroundColor: "#000000",
           }}>
             <div className="flow-title" style={{ 
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
                 3
               </div>
               Trade Execution
             </div>
             <div className="flow-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               {FLOW_DATA.nodes.filter(n => n.id === "job_trades").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
               <div className="flow-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ executes orders</div>
               {FLOW_DATA.nodes.filter(n => n.id === "ext_alpaca").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

           {/* Phase 4: UI Display */}
           <div style={{ 
             border: "2px solid #374151", 
             borderRadius: "12px", 
             padding: "24px",
             backgroundColor: "#000000",
           }}>
             <div className="flow-title" style={{ 
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
                 4
               </div>
               UI Display
             </div>
             <div className="flow-phase" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               {FLOW_DATA.nodes.filter(n => n.id === "api_backend").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
               <div className="flow-arrow" style={{ fontSize: "12px", color: "#9CA3AF" }}>→ serves UI</div>
               {FLOW_DATA.nodes.filter(n => n.id === "ui_frontend").map(node => (
                 <div key={node.id} className="flow-node" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

           {selectedNode.id === "job_scrape" && (
             <div style={{ marginBottom: "16px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 What it does
               </h4>
               <ul style={{ margin: 0, paddingLeft: "16px", color: "#9CA3AF", fontSize: "14px" }}>
                 <li>Fetches S&P 500 ticker list</li>
                 <li>Downloads historical price data</li>
                 <li>Collects analyst estimates and ratings</li>
                 <li>Updates financial metrics and ratios</li>
                 <li>Stores everything in PostgreSQL</li>
               </ul>
             </div>
           )}

           {selectedNode.id === "db_history" && (
             <div style={{ marginBottom: "16px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 Data stored
               </h4>
               <ul style={{ margin: 0, paddingLeft: "16px", color: "#9CA3AF", fontSize: "14px" }}>
                 <li>3+ years of daily price data</li>
                 <li>Market cap and volume metrics</li>
                 <li>P/E ratios and dividend yields</li>
                 <li>Analyst ratings and price targets</li>
                 <li>Company profiles and sector info</li>
               </ul>
             </div>
           )}

           {selectedNode.id === "job_prompt" && (
             <div style={{ marginBottom: "16px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 Prompt building
               </h4>
               <ul style={{ margin: 0, paddingLeft: "16px", color: "#9CA3AF", fontSize: "14px" }}>
                 <li>Selects latest financial metrics</li>
                 <li>Includes analyst consensus data</li>
                 <li>Adds market context and trends</li>
                 <li>Formats structured prompt for LLM</li>
               </ul>
             </div>
           )}

           {selectedNode.id === "ext_llm" && (
             <div style={{ marginBottom: "16px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 LLM capabilities
               </h4>
               <ul style={{ margin: 0, paddingLeft: "16px", color: "#9CA3AF", fontSize: "14px" }}>
                 <li>Fine-tuned on financial data</li>
                 <li>Analyzes 500+ stocks simultaneously</li>
                 <li>Returns JSON allocation weights</li>
                 <li>Considers risk and diversification</li>
               </ul>
             </div>
           )}

           {selectedNode.id === "job_trades" && (
             <div style={{ marginBottom: "16px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 Trade execution
               </h4>
               <ul style={{ margin: 0, paddingLeft: "16px", color: "#9CA3AF", fontSize: "14px" }}>
                 <li>Calculates target allocations</li>
                 <li>Determines buy/sell orders</li>
                 <li>Executes fractional shares</li>
                 <li>Manages cash and position limits</li>
               </ul>
             </div>
           )}

           {selectedNode.id === "ext_alpaca" && (
             <div style={{ marginBottom: "16px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 Trading features
               </h4>
               <ul style={{ margin: 0, paddingLeft: "16px", color: "#9CA3AF", fontSize: "14px" }}>
                 <li>Paper trading environment</li>
                 <li>Fractional share support</li>
                 <li>Real-time market data</li>
                 <li>Order management and tracking</li>
               </ul>
             </div>
           )}

           {selectedNode.id === "api_backend" && (
             <div style={{ marginBottom: "16px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 API endpoints
               </h4>
               <ul style={{ margin: 0, paddingLeft: "16px", color: "#9CA3AF", fontSize: "14px" }}>
                 <li>/api/account - Portfolio overview</li>
                 <li>/api/positions - Current holdings</li>
                 <li>/api/history - Performance data</li>
                 <li>/api/orders - Trade history</li>
               </ul>
             </div>
           )}

           {selectedNode.id === "ui_frontend" && (
             <div style={{ marginBottom: "16px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 UI features
               </h4>
               <ul style={{ margin: 0, paddingLeft: "16px", color: "#9CA3AF", fontSize: "14px" }}>
                 <li>Portfolio overview and analysis</li>
                 <li>Trading history and performance</li>
                 <li>Interactive testing and monitoring</li>
               </ul>
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

           {selectedNode.meta?.prompt && (
             <div style={{ marginBottom: "20px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 Prompt Template
               </h4>
               <pre style={{ 
                 padding: "12px", 
                 backgroundColor: "#000000", 
                 borderRadius: "6px",
                 fontSize: "12px",
                 color: "#9CA3AF",
                 overflow: "auto",
                 margin: 0,
               }}>
                 {selectedNode.meta.prompt}
               </pre>
             </div>
           )}

           {selectedNode.meta?.sample && (
             <div style={{ marginBottom: "20px" }}>
               <h4 style={{ margin: "0 0 8px 0", color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>
                 Sample JSON
               </h4>
               <pre style={{ 
                 padding: "12px", 
                 backgroundColor: "#000000", 
                 borderRadius: "6px",
                 fontSize: "12px",
                 color: "#9CA3AF",
                 overflow: "auto",
                 margin: 0,
               }}>
                 {selectedNode.meta.sample}
               </pre>
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

export default SystemFlowchart;
