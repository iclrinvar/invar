# INVAR project page

Anonymous project page for **INVAR: Randomization-Invariant Visual Representations for Zero-Shot Sim-to-Real**, under review at ICLR 2027.

Published at https://iclrinvar.github.io/invar/ using GitHub Pages from the root of `main`.

## Local preview

This is a buildless static site, with no package dependencies:

```sh
python3 -m http.server 8765
```

Open http://localhost:8765. `index.html` contains the research narrative, `style.css` contains the responsive styles, and `script.js` implements the selectors and charts.

## Content and media

The narrative follows the INVAR section of the research talk: prior approach, invariant representations, self-distillation, data diversity, transfer results, robustness, representation analysis, and scaling. Figures and videos in `assets/story/` are extracted from the supplied research materials and optimized for the web. Videos are H.264 MP4 with poster images; playback is user-controlled.

Quantitative results follow the supplied paper. Main task results correspond to Figure 4, convergence to Table 1, and scaling to Table 2. The strongest baseline per task differs from the strongest baseline averaged over an entire suite. Scaling uses separate dexterous-hand and parallel-gripper values rather than mixing the two platform averages. Ablation values come from a separate evaluation suite and are not main-benchmark scores.

The page preserves anonymous-review presentation. No author details, credentials, or unpublished source documents are included.
