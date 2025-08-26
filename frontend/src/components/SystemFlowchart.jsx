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
  DATA: "#0EA5E9",
  JOB: "#7C3AED",
  API: "#4F46E5",
  EXT: "#059669",
  UI: "#FFFFFF",
  SAFETY: "#DC2626",
};

const NODE_BORDER_COLORS = {
  DATA: "#0EA5E9",
  JOB: "#7C3AED",
  API: "#4F46E5",
  EXT: "#059669",
  UI: "#111827",
  SAFETY: "#DC2626",
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
    { from: "ext_llm", to: "db_llm_json", label: "returns JSON" },
    { from: "db_llm_json", to: "job_trades", label: "allocations in" },
    { from: "job_trades", to: "ext_alpaca", label: "executes orders" },
    { from: "ext_alpaca", to: "api_backend", label: "positions/account/orders" },
    { from: "api_backend", to: "ui_frontend", label: "renders pages" },
  ],
};



export default function SystemFlowchart() {
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
          How the app works
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "#6B7280", fontSize: "14px" }}>
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

      

                           {/* Flowchart */}
        <div style={{ position: "relative" }} onClick={handleContainerClick}>
          {/* Main flowchart */}
          <div style={{ 
            backgroundColor: "#FFFFFF", 
            padding: "24px", 
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
          }}>
           {/* Flow layout with 4 phases */}
           <div style={{ display: "grid", gap: "40px" }}>
             {/* Phase 1: Data Collection */}
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
                 Data Collection
               </div>
                               <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                   {FLOW_DATA.nodes.filter(n => n.id === "job_scrape").map(node => (
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
                                   <div style={{ fontSize: "12px", color: "#6B7280" }}>→ writes weekly data</div>
                                     {FLOW_DATA.nodes.filter(n => n.id === "db_history").map(node => (
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

             {/* Phase 2: AI Decision */}
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
                 LLM QUERY
               </div>
                               <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  {FLOW_DATA.nodes.filter(n => n.id === "job_prompt").map(node => (
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
                 <div style={{ fontSize: "12px", color: "#6B7280" }}>→ sends prompt</div>
                                   {FLOW_DATA.nodes.filter(n => n.id === "ext_llm").map(node => (
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
                 <div style={{ fontSize: "12px", color: "#6B7280" }}>→ returns JSON</div>
                                   {FLOW_DATA.nodes.filter(n => n.id === "db_llm_json").map(node => (
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

             {/* Phase 3: Trade Execution */}
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
                   3
                 </div>
                 Trade Execution
               </div>
                               <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {FLOW_DATA.nodes.filter(n => n.id === "job_trades").map(node => (
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
                 <div style={{ fontSize: "12px", color: "#6B7280" }}>→ executes orders</div>
                                   {FLOW_DATA.nodes.filter(n => n.id === "ext_alpaca").map(node => (
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

             {/* Phase 4: UI Display */}
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
                 UI Display
               </div>
                                                               <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                       {FLOW_DATA.nodes.filter(n => n.id === "api_backend").map(node => (
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
                                    <div style={{ fontSize: "12px", color: "#6B7280" }}>→ renders pages</div>
                                   {FLOW_DATA.nodes.filter(n => n.id === "ui_frontend").map(node => (
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
                  How it fits
                </h4>
                <ul style={{ margin: 0, paddingLeft: "16px", color: "#6B7280", fontSize: "14px" }}>
                  {selectedNode.id === "job_scrape" && (
                    <>
                      <li>Runs weekly via cron to fetch fresh market data</li>
                      <li>Updates the Postgres database with latest stock metrics</li>
                      <li>Triggers the data collection phase of the workflow</li>
                    </>
                  )}
                  {selectedNode.id === "db_history" && (
                    <>
                      <li>Stores 3+ years of historical stock data</li>
                      <li>Provides metrics to the prompt builder for LLM analysis</li>
                      <li>Updated weekly by the scraper cron job</li>
                    </>
                  )}
                  {selectedNode.id === "job_prompt" && (
                    <>
                      <li>Reads metrics from the Postgres database</li>
                      <li>Constructs prompts for the fine-tuned LLM</li>
                      <li>Handles prompt formatting and validation</li>
                    </>
                  )}
                  {selectedNode.id === "ext_llm" && (
                    <>
                      <li>Receives formatted prompts from the prompt builder</li>
                      <li>Returns JSON allocation decisions</li>
                      <li>Fine-tuned specifically for portfolio optimization</li>
                    </>
                  )}
                  {selectedNode.id === "db_llm_json" && (
                    <>
                      <li>Stores LLM allocation decisions as JSON</li>
                      <li>Provides allocation data to the trade executor</li>
                      <li>Maintains historical decision records</li>
                    </>
                  )}
                  {selectedNode.id === "job_trades" && (
                    <>
                      <li>Reads allocation data from LLM storage</li>
                      <li>Executes fractional orders via Alpaca API</li>
                      <li>Handles order validation and error handling</li>
                    </>
                  )}
                  {selectedNode.id === "ext_alpaca" && (
                    <>
                      <li>Executes actual stock trades and orders</li>
                      <li>Provides account and position data</li>
                      <li>Handles market execution and settlement</li>
                    </>
                  )}
                  {selectedNode.id === "api_backend" && (
                    <>
                      <li>Serves account data to the frontend UI</li>
                      <li>Provides portfolio history and performance</li>
                      <li>Handles API requests from the React frontend</li>
                    </>
                  )}
                  {selectedNode.id === "ui_frontend" && (
                    <>
                      <li>Displays portfolio overview and analysis</li>
                      <li>Shows trading history and performance</li>
                      <li>Provides interactive testing and monitoring</li>
                    </>
                  )}
                </ul>
              </div>

             {selectedNode.meta?.metrics && (
               <div style={{ marginBottom: "20px" }}>
                 <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                   Metrics
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

             {selectedNode.meta?.prompt && (
               <div style={{ marginBottom: "20px" }}>
                 <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                   Prompt Template
                 </h4>
                 <pre style={{ 
                   padding: "12px", 
                   backgroundColor: "#F9FAFB", 
                   borderRadius: "6px",
                   fontSize: "12px",
                   color: "#6B7280",
                   overflow: "auto",
                   margin: 0,
                 }}>
                   {selectedNode.meta.prompt}
                 </pre>
               </div>
             )}

             {selectedNode.meta?.sample && (
               <div style={{ marginBottom: "20px" }}>
                 <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "14px", fontWeight: "600" }}>
                   Sample JSON
                 </h4>
                 <pre style={{ 
                   padding: "12px", 
                   backgroundColor: "#F9FAFB", 
                   borderRadius: "6px",
                   fontSize: "12px",
                   color: "#6B7280",
                   overflow: "auto",
                   margin: 0,
                 }}>
                   {selectedNode.meta.sample}
                 </pre>
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
