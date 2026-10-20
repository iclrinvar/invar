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

## Interactive presentation

The opening uses the pouring and bimanual attention comparisons from the INVAR title slide. It has a shared motion control, and ambient playback respects reduced-motion preferences and pauses outside the viewport. The method has three animated schematic stages and an optional guided tour; the simulation-data gallery is part of that method section.

The five grasping examples match the five-object rollout set from slide 105 of the supplied talk. They are presented as task examples; the displayed INVAR/baseline comparison summarizes the entire benchmark rather than claiming a per-clip score. The separate hammer tool-use demo is omitted.

Additional attention and patch-PCA sequences come from the supplied September meeting deck. Embedded diagnostic headers were removed and source columns reordered consistently to RGB, INVAR, DINOv3, CAIP. The opening comparisons contain RGB, INVAR, and DINOv3. PCA colors are visualized principal components, not class labels. Playback controls are below the analysis footage, with speed, seek, and fullscreen controls.

The visual design takes inspiration from EigenDEXplore's light opening, dark studio sections, media stages, and translucent segmented controls.

The title uses nine individually looping H.264 task clips, each resized to 640×360 and played at 3×. It opens on pouring and zooms out once to the full grid. Each tile restarts independently when its clip ends, so the grid keeps moving without replaying the intro. Shared pause and replay controls apply to all tiles; reduced-motion preferences disable automatic playback and the zoom.

Task and representation videos default to 2× playback speed, including newly selected examples. The title grid uses 3× playback and loops continuously.

The method pairs eight synchronized randomized head/left-wrist/right-wrist renders with the same clean simulator state. The feature-alignment diagram separates projection, teacher centering, softmax, and the detached action probe. Across-task pretraining data is grouped into bimanual tasks and dexterous object grasping. The Sharpa hand is a static reference image from [EigenDEXplore’s hand gallery](https://eigendexplore.github.io/assets/s5/hands/sharpa.webp).

Results are organized by embodiment and task, followed by convergence and robustness within the same Results section.

The state-matching schematic branches from one simulator state to clean/randomized three-camera renders and links their similar features. Rollout players automatically start muted at 2× when visible, while respecting reduced-motion preferences. The scaling selector includes object/task diversity from paper Table 3 alongside embodiment diversity and data scale from Table 2.
