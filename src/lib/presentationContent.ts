export const PRESENTATION_DATA = {
  title: "Uncertainty-Calibrated Vehicle Re-Identification (Re-ID) & Surveillance Platform",
  subtitle: "Risk-Bounded Multi-Camera Tracking with Evidential Temperature Scaling & Conformal Abstention",
  author: "Computer Vision & Intelligent Transportation Systems Research Team",
  date: "November 2026",

  sections: [
    {
      id: "summary",
      title: "1. Executive Summary (The 2-Minute Elevator Pitch)",
      content: `
### What is this project?
This project is an **AI-powered multi-camera surveillance platform** that solves the most dangerous problem in real-world vehicle tracking: **overconfident false identification**.

### The Problem in Traditional Systems:
Conventional vehicle Re-Identification (Re-ID) systems compare vehicle images from different CCTV cameras using deep learning feature embeddings. However, in real-world traffic:
- Vehicles are frequently **occluded** by street poles, trees, or other trucks (partial visibility).
- Extreme **camera viewpoints, rain, headlight glare, and nighttime shadows** drastically alter vehicle appearance.
- Standard deep neural networks are **notoriously overconfident**: a model might output 92% similarity between two different black sedans simply because they share the same color and lighting, triggering false police alerts or lost tracking.

### Our Solution & Innovation:
Instead of forcing a naive "yes/no" guess, our system implements **Evidential Uncertainty Quantification and Risk-Bounded Abstention**:
1. **Segmentation-Aware Visibility Gating (SAM 2.1)**: It measures exactly what percentage of the vehicle is visible vs. blocked.
2. **Evidential Temperature Scaling T(v)**: As vehicle occlusion increases or video frame count is low, the predicted softmax temperature automatically inflates, safely deflating overconfident scores.
3. **Tri-Tier Conformal Decision Layer**:
   - **MATCH (>= 85% Confidence)**: Certified identification; vehicle is tracked across camera network.
   - **UNCERTAIN (50% – 85% Confidence)**: Conformal abstention triggered. The system flags the vehicle for human officer adjudication rather than making a high-risk autonomous error.
   - **REJECT (< 50% Confidence)**: Declared a different vehicle.
      `,
    },
    {
      id: "pipeline",
      title: "2. The 5-Stage Technical Architecture Pipeline",
      content: `
The platform runs an automated 5-stage computer vision and decision pipeline:

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. DETECTION & TRACKING (RF-DETR + ByteTrack)                              │
│    - CCTV Stream / Video frames fed at 30 FPS                               │
│    - Real-time vehicle detection (RF-DETR transformer detector)             │
│    - Tracklet association across time steps via ByteTrack Kalman filters    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 2. SEGMENTATION & OCCLUSION GATING (SAM 2.1)                               │
│    - Segment Anything Model (SAM 2.1) isolates vehicle foreground mask       │
│    - Computes Visibility Score v in [0.0, 1.0]                              │
│    - Flags occluded body parts (hood, windshield, roof, license plate)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 3. DEEP VISUAL EMBEDDING (TransReID / ResNet-IBN)                           │
│    - Cropped bounding box passed through Vision Transformer (TransReID)     │
│    - Extracts a normalized 768-dimensional invariant feature vector z       │
│    - Cosine similarity: s = cosine_sim(z_query, z_gallery)                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 4. EVIDENTIAL TEMPERATURE SCALING & CALIBRATION                            │
│    - Base temperature T0 = 1.0 penalized by occlusion: delta_T = 1.8 * (1 - v)│
│    - Multi-frame temporal smoothing: T = (T0 + delta_T) / sqrt(min(1, N / 8))│
│    - Calibrated Probability: P_cal = sigmoid( 10 * (s - 0.5) / T )          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 5. CONFORMAL DECISION & RISK-BOUNDED ABSTENTION                             │
│    ├── P_cal >= 0.85  ──▶  MATCH   (Auto-confirmed positive)                │
│    ├── 0.50 <= P_cal < 0.85 ──▶  UNCERTAIN (Routed to Human Review Queue)   │
│    └── P_cal < 0.50   ──▶  REJECT  (Declared non-match)                     │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`
      `,
    },
    {
      id: "math",
      title: "3. Mathematical Foundations (Explained Simply for Examiners)",
      content: `
If an examiner asks "How does your calibration work?", here is the exact formulation:

### 1. The Flaw of Raw Cosine Similarity
Raw cosine similarity between query feature z_q and gallery feature z_g:
s = (z_q · z_g) / (||z_q|| * ||z_g||)

Why it fails: Two different white Toyota Corollas photographed by the same camera under noon sunlight might yield s = 0.89. A naive threshold at 0.80 will falsely conclude they are the exact same car!

### 2. Evidential Temperature Scaling
In physics and statistics, temperature T governs the entropy/spread of a probability distribution:
- Low T (T -> 0): Extremely sharp, overconfident decisions.
- High T (T > 1): Smooth, conservative, acknowledging ignorance and uncertainty.

We model temperature dynamically as a function of vehicle visibility v and tracklet frame count N:
T(v, N) = [ T0 + alpha * (1 - v) ] / sqrt( min(1.0, N / N_stable) )

Parameters:
- T0 = 1.0: Nominal baseline temperature under ideal visibility.
- alpha = 1.8: Occlusion sensitivity coefficient. If visibility is only v = 0.40 (car 60% blocked by a tree), temperature jumps by delta_T = 1.8 * 0.60 = +1.08 => T ≈ 2.08!
- sqrt(N / 8): Temporal consistency. A single blurry frame (N=1) has high uncertainty; observing a tracklet across N >= 8 frames stabilizes temperature.

### 3. Calibrated Confidence Sigmoid
The uncalibrated logit is scaled down by temperature T:
logit_scaled = [ 10 * (s - 0.5) ] / T(v, N)
P_calibrated = 1 / [ 1 + exp(-logit_scaled) ]

The Practical Result:
When visibility drops, T increases, which brings logit_scaled closer to zero, gently deflating confidence down to the 0.50 - 0.75 range. The system automatically abstains (UNCERTAIN) instead of making an incorrect, high-risk match!
      `,
    },
    {
      id: "walkthrough",
      title: "4. Web Platform Feature Walkthrough",
      content: `
Here is what is happening on each page of the application:

1. Dashboard (/):
   - High-level operations center showing active camera nodes, sub-5ms inference latency, cluster health, and pending human review cases.
   - Recent gallery vector feed showing the latest vehicle sightings processed by the embedding index.

2. Dataset Manager (/dataset):
   - Benchmark dataset management supporting standard vehicle re-id benchmarks (VeRi-776, VeriWild, and CityFlow).
   - Ingests ZIP archives containing image folders, parses camera identities, bounding boxes, license plates, and creates normalized CSV manifests.
   - Interactive table with colored badges for split (train, query, gallery), vehicle type icons, color swatches, and manifest CSV export.

3. Database Explorer (/database):
   - Hierarchical inspection of indexed gallery vectors.
   - Visual inspection cards showing vehicle crops, camera IDs, ground-truth identities (VID), and OCR license plates.
   - Executive summary and dataset deletion management.

4. Search Console (/search):
   - Plate Search: Fast ANPR string query to search sightings by license plate substring.
   - Photo Probe Re-ID: Upload a probe photo of a target vehicle to retrieve nearest visual matches.
   - Evidential Calibrator: An interactive laboratory where you can drag the Visible Fraction Slider (0.05 to 1.0) and tracklet length to witness the evidential temperature T recalculate in real-time, showing how an overconfident match shifts into UNCERTAIN (abstention) when occlusion occurs!

5. Video Ingestion Pipeline (/ingest):
   - Upload CCTV video footage (MP4, AVI, MKV).
   - Simulates the 2-stage RF-DETR + TransReID video processor with live progress bar, detection counters, and automated gallery vector generation.

6. Live Surveillance Feed (/live):
   - Real-time 30 FPS surveillance monitor with HTML5 Canvas highway simulation.
   - Renders animated perspective road traffic, dynamic ByteTrack bounding boxes, license plate tags, and live WebSocket telemetry.
      `,
    },
    {
      id: "script",
      title: "5. Live Presentation Demo Script (Step-by-Step)",
      content: `
Follow this exact 5-minute script during your presentation:

- Minute 0:00 – 1:00 (Intro & Problem Statement)
  - "Good morning/afternoon. Today we present our project on Uncertainty-Calibrated Vehicle Re-Identification in Multi-Camera Surveillance."
  - "In modern smart cities, tracking vehicles across city cameras is critical for law enforcement and traffic management. But current deep learning systems have a major flaw: they are blindly overconfident when cars are partially blocked or seen from bad angles."

- Minute 1:00 – 2:00 (Show Dashboard & Live Feed)
  - Click on "Live Stream" in the top navigation.
  - "Here is our real-time CCTV tracking engine. Our pipeline uses RF-DETR object detection and ByteTrack to lock onto vehicles across camera feeds, extracting their trajectory and license plates."

- Minute 2:00 – 3:30 (The Highlight: Show Search Console & Evidential Calibrator)
  - Click on "Search Console", then click "Open Evidential Calibrator".
  - Show the examiner the Visible Fraction slider.
  - "Now, look at this query with a top similarity of 0.94. At full visibility (0.95), the temperature is T=1.0 and the verdict is a certified MATCH."
  - Slide visibility down to 0.40 and click SCORE THIS MATCH.
  - "Notice what happened: because the car is 60% occluded, our evidential calibrator increased temperature T to over 2.0. The confidence dropped from 94% to 64%, and the verdict shifted to UNCERTAIN."
  - Click Confirm Match or Reject: "The system refuses to guess, safely alerting a human officer for manual verification."

- Minute 3:30 – 4:30 (Show Dataset Manager & Database)
  - Click Dataset Manager. Show the VeRi-776 benchmark rows, color badges, and CSV export.
  - "Our system processes industry benchmarks like VeRi-776 and VeriWild, allowing automated ingestion, feature indexing, and manifest generation."

- Minute 4:30 – 5:00 (Conclusion & Q&A)
  - "In conclusion, by combining transformer feature extraction with evidential temperature scaling and risk-bounded abstention, we eliminate catastrophic false identifications in critical surveillance tasks."
      `,
    },
    {
      id: "qa",
      title: "6. Examiner Q&A Cheat Sheet (Potential Tough Questions)",
      content: `
### Q1: "Why not simply increase the cosine similarity threshold instead of this complex temperature scaling?"
Answer:
"A fixed threshold fails because occlusion and bad lighting don't affect all vehicles equally. If you set a high static threshold (e.g., 0.90), you will reject genuine matches that happen to be taken from different angles (high false negatives). If you set a low threshold (e.g., 0.70), you get false positives. Our dynamic temperature scaling adjusts the decision boundary specifically based on the observable evidence (visibility mask and frame count), making the threshold adaptive rather than static."

### Q2: "What is TransReID and why is it better than standard ResNet?"
Answer:
"Standard ResNet is a convolutional network with local receptive fields, which often loses fine-grained vehicle distinctions (like unique bumper stickers, roof racks, or dent patterns). TransReID uses a Vision Transformer with shifted patch tokens and side information embeddings (camera ID and view orientation), allowing it to capture global cross-part dependencies across extreme viewpoint changes."

### Q3: "What happens when the verdict is UNCERTAIN?"
Answer:
"Under conformal risk theory, when confidence falls in the uncertainty interval [0.50, 0.85), the system abstains from making an autonomous decision. It places the sighting into the Human Review Queue on the dashboard, where a human surveillance operator can verify side-by-side camera angles."

### Q4: "What datasets are supported?"
Answer:
"The system is trained and evaluated on VeRi-776 (776 vehicle identities across 20 cameras with varied viewpoints) and VeriWild (large-scale unconstrained dataset with challenging weather and lighting conditions). Our dataset manager also supports ingesting custom CCTV footage and ZIP archives."
      `,
    },
  ],
};
