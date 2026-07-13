# Kidney CT Diagnostic & Pathology Segmentation System

A professional full-stack clinical workstation for Abdominal Renal CT Slice processing. This system supports real-time classification, disease region localization (bounding boxes), and pathological tissue segmentation (contours) using an integrated **Ultralytics YOLOv8 / PyTorch Deep Learning model** paired with an elegant, responsive React dashboard.

---

## 📁 Project Folder Structure

```text
Kidney-Detection/
│
├── frontend/                 # React 19 + Vite Frontend Website
│   ├── src/                  # React application source code
│   │   ├── components/       # Extra sub-components
│   │   ├── App.tsx           # Primary Interactive Dashboard View
│   │   ├── main.tsx          # Application Bootstrap
│   │   └── index.css         # Styling and Typography Pairing
│   ├── public/               # Asset folders
│   ├── package.json          # Frontend packages
│   └── vite.config.js        # Independent Frontend Vite config
│
├── backend/                  # Flask Python API
│   ├── app.py                # Main Flask Server & API routes
│   ├── predict.py            # PyTorch + YOLOv8 Segmentation Inference Engine
│   ├── requirements.txt      # Python Package Dependencies
│   ├── uploads/              # Saved uploads of patient CT scans
│   └── results/              # Saved clinical result JSON outputs
│
├── model/                    # Deep Learning Models folder
│   └── best.pt               # Trained YOLOv8-seg model weights (put your weights here!)
│
└── README.md                 # Project Documentation and Guide
```

---

## 🚀 How to Run the App (Locally or Externally)

### 1. Backend Setup (Python Flask)

Ensure you have **Python 3.8+** installed.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install the required Python packages
pip install -r requirements.txt

# Place your trained YOLOv8 model file ('best.pt') inside the /model folder:
# /model/best.pt

# Run the Flask Server
python3 app.py
```
The backend API starts running on `http://localhost:5000`.

---

### 2. Frontend Setup (React Website)

Ensure you have **Node.js (v18+)** installed.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Run the React Dev Server
npm run dev
```
The React frontend starts running on `http://localhost:3000` and automatically proxies `/api` requests to the Flask server on port `5000`.

---

## 🔬 How Detection & Segmentation Works in the Code

1. **Matrix Ingestion**:
   - The user selects a preset patient slice (Normal, Cyst, Stone, Tumor) or uploads a custom abdominal axial CT slice (PNG, JPG) via the **"Upload Scan"** button on the UI.
   - The image is converted into a high-density base64 string and sent as a POST request to `/api/diagnose`.

2. **YOLOv8 Inference (`predict.py`)**:
   - The Flask route receives the image, saves a copy into `backend/uploads/` for record keeping, and calls the `analyze_kidney_scan` function.
   - The inference engine loads `model/best.pt` using `ultralytics.YOLO`.
   - The image is processed through the model to identify focal targets:
     - **Classification**: Detects kidney pathologies (e.g., *Cyst*, *Stone*, *Tumor*, or *Normal*).
     - **Object Detection**: Extracts bounding boxes of detected diseases and normalizes coordinates `[ymin, xmin, ymax, xmax]` to a `0-100` range.
     - **Segmentation**: Obtains the pixel coordinates of the segmented tissue masks, outputs a closed polygon list `[[x, y], ...]`, and converts them into normalized scale coords (`0-100`).
   - The result is logged inside `backend/results/result_<patient_id>.json`.

3. **Responsive Visual Overlay (Vite + React)**:
   - The React frontend receives the prediction payload.
   - It updates the interactive CT viewer dynamically using responsive vector layers:
     - **Bounding Box ROI**: A dashed red visual boundary surrounding the anomaly.
     - **Tissue Mask**: An elegant, shaded SVG polygon vector outline enclosing the lesion.
     - **Explainability Heatmap (Grad-CAM)**: An automated focal glow pinpointing the precise coordinate density.
   - Generates professional clinical reports, and allows the clinician to export the docket as a physical/PDF dossier via the **Print/Download** buttons.

---

## 🛠️ Offline & Sandbox Development Resilience
To facilitate running and previewing in environments without GPU resources or where PyTorch packages are omitted, `predict.py` contains a built-in **Intelligent Diagnostic Fallback**. It matches patient uploads and presets to clinical radiologist-grade mock reports, ensuring a 100% functional user interface even before your custom YOLOv8 model is loaded!
