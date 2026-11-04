# Wine-pouring simulation replay

Videos in the parent directory:

- [Smoothed simulation, 60 fps](../wine-pour-sim-smooth.mp4): 1440×810, 690 frames, 11.5 s. Suitable for the website and ordinary displays.
- [Smoothed simulation, 120 fps](../wine-pour-sim-smooth-120fps.mp4): 1,380 frames, same dimensions and duration.
- [Smoothed simulation, 240 fps master](../wine-pour-sim-smooth-240fps.mp4): 2,760 frames, same dimensions and duration.
- [Real → simulation → real wipe](../wine-pour-wipe-smooth-preview.mp4): 1440×810, 60 fps, 690 frames, 11.5 s. The robot action always advances forward; only a vertical divider sweeps back and forth. No crossfade.

## Motion and rendering

Isaac Sim 5.1 RTX kinematic replay using the existing Tianji arm, Sharpa hand, wine-bottle and bowl meshes. The active right arm uses the original 135° hand-mount geometry. The static left side uses the original bimanual asset geometry.

The source is evaluation trial 100, corresponding to the opening real-world wine-pouring clip. The rollout log contains 215 nominal 20 Hz rows, but only **11 distinct measured arm/hand poses**: each observation repeats for one action chunk. The smoothed version collapses those repeated readings and interpolates continuously across the original observation times using shape-preserving PCHIP. It retains every distinct measured pose and the observed per-joint ranges. Intermediate motion is a reconstruction; it is not additional measured trajectory data.

Bottle translations and relative rotation vectors also use continuous PCHIP through image-derived pose estimates. The camera stays fixed. Native action duration is retained; no website playback-speed multiplier is baked in. The 240 fps master is rendered at each new pose timestamp. The 120 and 60 fps versions select exactly every second and fourth master frame respectively.

## Alignment limitations

Third-person camera parameters, bottle/bowl poses and the stationary left-arm pose are estimated from the images. Precise control-step/video timestamps were not logged; the initial alignment uses an estimated 0.35 s offset. The available body mesh has a different head/camera housing from the real rig. Liquid flow is not simulated. The supplied real clip ends while pouring and has no return phase; no return has been fabricated.

## Settings and checks

- [Fixed camera settings](camera-settings.json)
- [Trajectory smoothing and measured-pose preservation](motion-smoothing-validation.json)
- [Video dimensions, frame counts, exact timestamps and hashes](smooth-video-validation.json)
- [Real/simulation/wipe synchronization](video-validation-smooth.json)
- [Rendered-motion comparison against the earlier replay](rendered-motion-comparison.json)
