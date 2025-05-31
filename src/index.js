import express from 'express';
import cors from 'cors';
import { DOMCapture } from './dom/DOMCapture.js';
import { CSSExtractor } from './css/CSSExtractor.js';
import { HeuristicsEngine } from './heuristics/HeuristicsEngine.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize components
const domCapture = new DOMCapture();
const cssExtractor = new CSSExtractor();
const heuristicsEngine = new HeuristicsEngine();

// Routes
app.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Analyzing URL: ${url}`);

    // Step 1: Capture DOM
    const domData = await domCapture.capture(url);
    
    // Step 2: Extract CSS styles
    const cssData = await cssExtractor.extract(domData);
    
    // Step 3: Run heuristics analysis
    const analysisResults = await heuristicsEngine.analyze(domData, cssData);

    res.json({
      success: true,
      data: {
        dom: domData,
        css: cssData,
        analysis: analysisResults
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`PixelPolish agent running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Analysis endpoint: POST http://localhost:${PORT}/analyze`);
}); 