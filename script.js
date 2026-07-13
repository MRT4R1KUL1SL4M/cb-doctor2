// Renal Workstation Core Controller

// Global elements
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const medicalCanvas = document.getElementById("medical-canvas");
const canvasContainer = document.getElementById("canvas-container");
const canvasStandby = document.getElementById("canvas-standby");
const canvasStatus = document.getElementById("canvas-status");
const canvasLoader = document.getElementById("canvas-loader");

const reportCard = document.getElementById("report-card");
const reportStandby = document.getElementById("report-standby");
const reportContent = document.getElementById("report-content");

// State
let activeImageBase64 = null;
let currentReportData = null;

// Preset Colors
const PRESET_COLORS = {
  Normal: { border: "rgba(16, 185, 129, 0.95)", fill: "rgba(16, 185, 129, 0.18)", badge: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  Cyst: { border: "rgba(14, 165, 233, 0.95)", fill: "rgba(14, 165, 233, 0.18)", badge: "bg-blue-100 text-blue-800 border-blue-300" },
  Stone: { border: "rgba(245, 158, 11, 0.95)", fill: "rgba(245, 158, 11, 0.18)", badge: "bg-amber-100 text-amber-800 border-amber-300" },
  Tumor: { border: "rgba(239, 68, 68, 0.95)", fill: "rgba(239, 68, 68, 0.18)", badge: "bg-rose-100 text-rose-800 border-rose-300" }
};

// Event Listeners for File Uploads
dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleUploadedFile(file);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("border-blue-400", "bg-blue-50/20");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("border-blue-400", "bg-blue-50/20");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("border-blue-400", "bg-blue-50/20");
  const file = e.dataTransfer.files[0];
  if (file) handleUploadedFile(file);
});

// Process uploaded files
function handleUploadedFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    activeImageBase64 = event.target.result;
    
    // Draw raw image to canvas first
    const img = new Image();
    img.onload = () => {
      setupCanvas(img);
      triggerDiagnosticRun(null, file.name); // Run standard diagnostic analysis on the uploaded image with its filename
    };
    img.src = activeImageBase64;
  };
  reader.readAsDataURL(file);
}

// Draw base image onto canvas
function setupCanvas(imageElement) {
  const ctx = medicalCanvas.getContext("2d");
  
  // Fit canvas dimensions to image
  medicalCanvas.width = imageElement.naturalWidth || 512;
  medicalCanvas.height = imageElement.naturalHeight || 512;
  
  ctx.drawImage(imageElement, 0, 0, medicalCanvas.width, medicalCanvas.height);
  
  canvasStandby.classList.add("hidden");
  canvasContainer.classList.remove("hidden");
  canvasStatus.textContent = "Scan Loaded";
}

// Trigger diagnostic processing call
async function triggerDiagnosticRun(presetType = null, fileName = null) {
  canvasLoader.classList.remove("hidden");
  canvasStatus.textContent = "Analyzing...";

  try {
    let payloadImg = activeImageBase64;
    
    // If running a preset, we dynamically generate a high-fidelity simulated CT scan
    if (presetType) {
      payloadImg = generateSimulatedCTScan(presetType);
      activeImageBase64 = payloadImg;
    }

    const response = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: payloadImg,
        presetType: presetType,
        fileName: fileName
      })
    });

    const resData = await response.json();

    if (resData.success && resData.data) {
      currentReportData = resData.data;
      displayReport(currentReportData, resData.method || "Diagnostic Suite");
      
      // Re-draw canvas with detections
      const img = new Image();
      img.onload = () => {
        setupCanvas(img);
        drawDetections(currentReportData);
      };
      img.src = activeImageBase64;
    } else {
      alert("Error processing scan: " + (resData.error || "Unknown server response"));
    }
  } catch (err) {
    console.error(err);
    alert("Connection to diagnostic API failed. Please try again.");
  } finally {
    canvasLoader.classList.add("hidden");
  }
}

// Reset functions
function resetCanvas() {
  const ctx = medicalCanvas.getContext("2d");
  ctx.clearRect(0, 0, medicalCanvas.width, medicalCanvas.height);
  canvasContainer.classList.add("hidden");
  canvasStandby.classList.remove("hidden");
  canvasStatus.textContent = "Waiting Scan";
}

function resetWorkstation() {
  activeImageBase64 = null;
  currentReportData = null;
  resetCanvas();
  
  reportContent.classList.add("hidden", "opacity-0");
  reportStandby.classList.remove("hidden");
}

// Generate beautiful simulated CT scan slice of human abdominal/kidney cavities
function generateSimulatedCTScan(type) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 512;
  tempCanvas.height = 512;
  const ctx = tempCanvas.getContext("2d");

  // 1. Black air background
  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, 512, 512);

  // 2. Abdominal perimeter (Outer skin line - faint grey)
  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 14;
  ctx.stroke();

  // Darker inner cavity fat tissue
  ctx.fillStyle = "#1e293b";
  ctx.fill();

  // 3. Spinal Vertebra (Bottom-middle, bone-white/grey)
  ctx.beginPath();
  ctx.moveTo(230, 420);
  ctx.lineTo(282, 420);
  ctx.quadraticCurveTo(290, 390, 256, 370);
  ctx.quadraticCurveTo(222, 390, 230, 420);
  ctx.closePath();
  ctx.fillStyle = "#cbd5e1";
  ctx.fill();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Spine canal hole
  ctx.beginPath();
  ctx.arc(256, 398, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#0f172a";
  ctx.fill();

  // 4. Right Kidney (Drawn on the left side of the axial image - standard radiological layout)
  ctx.beginPath();
  // Bean-like curve for right kidney
  ctx.ellipse(160, 280, 55, 35, Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "#475569";
  ctx.fill();
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 5. Left Kidney (Drawn on the right side of the axial image)
  ctx.beginPath();
  // Bean-like curve for left kidney
  ctx.ellipse(352, 280, 55, 35, -Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "#475569";
  ctx.fill();
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 6. Draw renal central pelvis (lighter grey structure in center)
  ctx.beginPath();
  ctx.ellipse(170, 275, 18, 12, Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "#64748b";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(342, 275, 18, 12, -Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "#64748b";
  ctx.fill();

  // 7. Inject pathological details depending on type
  if (type === "cyst") {
    // Cyst: Dark unilocular fluid-filled round lesion on left kidney lateral cortex
    ctx.beginPath();
    ctx.arc(385, 290, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#0c4a6e"; // fluid density dark blue-grey
    ctx.fill();
    ctx.strokeStyle = "#38bdf8"; // cyst wall enhancement
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (type === "stone") {
    // Stone: Intense bone-white calcification (calcium stone) in right renal pelvis
    ctx.beginPath();
    ctx.arc(175, 272, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; // pure white calcified density
    ctx.fill();
    
    // Slight shadow effect downwards
    ctx.beginPath();
    ctx.moveTo(165, 285);
    ctx.lineTo(185, 285);
    ctx.lineTo(190, 340);
    ctx.lineTo(160, 340);
    ctx.closePath();
    ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
    ctx.fill();
  } else if (type === "tumor") {
    // Tumor: Large irregular growth on the left kidney lower pole (distorted boundary)
    ctx.beginPath();
    ctx.moveTo(355, 290);
    ctx.bezierCurveTo(390, 300, 410, 340, 360, 350);
    ctx.bezierCurveTo(330, 340, 340, 310, 355, 290);
    ctx.fillStyle = "#334155"; // solid heterogeneous density
    ctx.fill();
    ctx.strokeStyle = "#f43f5e"; // irregular border
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Necrotic dark centers inside tumor
    ctx.beginPath();
    ctx.arc(370, 320, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
  }

  return tempCanvas.toDataURL("image/png");
}

// Draw the bounding box and segmentations onto the canvas!
function drawDetections(data) {
  if (!data || !data.detected) return;

  const ctx = medicalCanvas.getContext("2d");
  const w = medicalCanvas.width;
  const h = medicalCanvas.height;

  const theme = PRESET_COLORS[data.classification] || PRESET_COLORS.Stone;

  // 1. Draw Segmentation Polygon if available
  if (data.segmentationPolygon && data.segmentationPolygon.length > 0) {
    ctx.beginPath();
    data.segmentationPolygon.forEach((pt, idx) => {
      const px = (pt[0] / 100) * w;
      const py = (pt[1] / 100) * h;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    
    // Fill mask
    ctx.fillStyle = theme.fill;
    ctx.fill();
    
    // Draw boundary line
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([2, 2]); // dashed style for segment boundary
    ctx.stroke();
    ctx.setLineDash([]); // restore solid lines
  }

  // 2. Draw Bounding Box [ymin, xmin, ymax, xmax] normalized 0-100
  if (data.localizedBox && data.localizedBox.some(v => v > 0)) {
    const ymin = (data.localizedBox[0] / 100) * h;
    const xmin = (data.localizedBox[1] / 100) * w;
    const ymax = (data.localizedBox[2] / 100) * h;
    const xmax = (data.localizedBox[3] / 100) * w;

    const boxW = xmax - xmin;
    const boxH = ymax - ymin;

    // Draw solid outer bounding box
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(xmin, ymin, boxW, boxH);

    // Draw glowing shadow border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(xmin - 2, ymin - 2, boxW + 4, boxH + 4);

    // Draw Corner Accents for technical UI feel
    const accentLen = Math.min(15, boxW * 0.2);
    ctx.fillStyle = theme.border;
    
    // Top-Left corner accent
    ctx.fillRect(xmin, ymin, accentLen, 4);
    ctx.fillRect(xmin, ymin, 4, accentLen);

    // Top-Right corner accent
    ctx.fillRect(xmin + boxW - accentLen, ymin, accentLen, 4);
    ctx.fillRect(xmin + boxW - 4, ymin, 4, accentLen);

    // Bottom-Left corner accent
    ctx.fillRect(xmin, ymin + boxH - 4, accentLen, 4);
    ctx.fillRect(xmin, ymin + boxH - accentLen, 4, accentLen);

    // Bottom-Right corner accent
    ctx.fillRect(xmin + boxW - accentLen, ymin + boxH - 4, accentLen, 4);
    ctx.fillRect(xmin + boxW - 4, ymin + boxH - accentLen, 4, accentLen);

    // 3. Draw Label Text Tag
    const labelText = `${data.classification} [${data.confidence}%]`;
    ctx.font = "bold 11px Inter, sans-serif";
    const textPadding = 6;
    const textWidth = ctx.measureText(labelText).width;
    const tagH = 18;

    // Draw label background tab
    ctx.fillStyle = theme.border;
    ctx.fillRect(xmin, ymin - tagH, textWidth + (textPadding * 2), tagH);

    // Label text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(labelText, xmin + textPadding, ymin - 5);
  }
}

// Populate findings, bento metrics, and recommendations inside report card
function displayReport(data, methodUsed) {
  // Reveal report block
  reportStandby.classList.add("hidden");
  reportContent.classList.remove("hidden");
  reportContent.classList.add("flex", "fade-in");

  // Title and Method labels
  const classBadge = document.getElementById("class-badge");
  const anatomyRegionText = document.getElementById("anatomy-region-text");
  const severityBadgeText = document.getElementById("severity-badge-text");
  const clinicalFindingsText = document.getElementById("clinical-findings-text");
  
  const patientIdText = document.getElementById("patient-id-text");
  const scanDateText = document.getElementById("scan-date-text");
  
  const confidenceLabel = document.getElementById("confidence-label");
  const confidenceBar = document.getElementById("confidence-bar");
  
  const recommendationsList = document.getElementById("recommendations-list");

  // Style class badge
  classBadge.textContent = data.classification;
  classBadge.className = "px-3.5 py-1.5 rounded-xl font-bold font-display text-xs uppercase tracking-wider shadow-sm border ";
  if (data.classification === "Normal") {
    classBadge.classList.add("bg-emerald-50", "text-emerald-700", "border-emerald-200");
  } else if (data.classification === "Cyst") {
    classBadge.classList.add("bg-blue-50", "text-blue-700", "border-blue-200");
  } else if (data.classification === "Stone") {
    classBadge.classList.add("bg-amber-50", "text-amber-700", "border-amber-200");
  } else {
    classBadge.classList.add("bg-rose-50", "text-rose-700", "border-rose-200");
  }

  // Populate basic text findings
  clinicalFindingsText.textContent = data.clinicalFindings;
  anatomyRegionText.textContent = data.localizationExplanation || "Bilateral kidneys";

  // Style severity indicator
  severityBadgeText.textContent = data.severity;
  severityBadgeText.className = "font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ";
  if (data.severity === "None") {
    severityBadgeText.classList.add("bg-emerald-100", "text-emerald-800");
  } else if (data.severity === "Mild") {
    severityBadgeText.classList.add("bg-blue-100", "text-blue-800");
  } else if (data.severity === "Moderate") {
    severityBadgeText.classList.add("bg-amber-100", "text-amber-800");
  } else {
    severityBadgeText.classList.add("bg-rose-100", "text-rose-800");
  }

  // Populate reference logs
  patientIdText.textContent = data.patientReport ? data.patientReport.patientId : "PAT-KID-8201";
  scanDateText.textContent = data.patientReport ? data.patientReport.scanDate : "June 20, 2026";

  // Confidence radial/bar stats
  confidenceLabel.textContent = `${data.confidence}%`;
  confidenceBar.style.height = `${data.confidence}%`;
  if (data.confidence < 80) {
    confidenceBar.className = "w-full bg-slate-400 rounded-full transition-all duration-500";
  } else if (data.classification === "Normal") {
    confidenceBar.className = "w-full bg-emerald-500 rounded-full transition-all duration-500";
  } else if (data.classification === "Cyst") {
    confidenceBar.className = "w-full bg-blue-500 rounded-full transition-all duration-500";
  } else if (data.classification === "Stone") {
    confidenceBar.className = "w-full bg-amber-500 rounded-full transition-all duration-500";
  } else {
    confidenceBar.className = "w-full bg-rose-500 rounded-full transition-all duration-500";
  }

  // Populate clinical recommendations list
  recommendationsList.innerHTML = "";
  if (data.recommendations && data.recommendations.length > 0) {
    data.recommendations.forEach((rec, index) => {
      const li = document.createElement("li");
      li.className = "p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl flex items-start gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50";
      
      let badgeStyle = "bg-blue-50 text-blue-600 border-blue-200";
      if (data.classification === "Normal") {
        badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-200";
      } else if (data.classification === "Stone") {
        badgeStyle = "bg-amber-50 text-amber-600 border-amber-200";
      } else if (data.classification === "Tumor") {
        badgeStyle = "bg-rose-50 text-rose-600 border-rose-200";
      }

      li.innerHTML = `
        <div class="flex-shrink-0 w-6 h-6 rounded-lg ${badgeStyle} border flex items-center justify-center text-[10px] font-bold">
          ${index + 1}
        </div>
        <div class="flex-1">
          <p class="text-xs font-semibold text-slate-700 leading-normal">${rec}</p>
        </div>
      `;
      recommendationsList.appendChild(li);
    });
  } else {
    recommendationsList.innerHTML = `
      <div class="p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-center">
        <p class="text-xs text-slate-400 font-medium">No urgent recommendations needed. Routine followups.</p>
      </div>
    `;
  }
}

// Download Report as static JSON
function downloadReportJson() {
  if (!currentReportData) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentReportData, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `kidney_report_${currentReportData.patientReport ? currentReportData.patientReport.patientId : "log"}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
