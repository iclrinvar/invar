# Chess patch-feature PCA maps

The 27 `chess-{clean,v1,...,v8}-{top,left,right}-pca.webp` files in the parent directory contain INVAR patch-feature PCA maps of the corresponding RGB images. Each lossless WebP preserves the original 640×480 dimensions.

[Contact sheet](chess-pca-contact-sheet.png) · [Head camera](chess-pca-contact-top.png) · [Left wrist](chess-pca-contact-left.png) · [Right wrist](chess-pca-contact-right.png)

## Extraction

- Checkpoint: `uni_dino_abc_dex_humanoid_heads/distilled_step20000.pth` (`uni_abcdexhum`, INVAR), SHA-256 `8c2e40e469cc6fbe07778afa8480fb75501fbaed12c5479fe7716903144f7dc1`.
- Architecture: `vit_small_plus_patch16_dinov3`, ViT-S+/16, 12 blocks, 384-dimensional features. Strict backbone loading verified zero missing or unexpected keys.
- Layer: final transformer block (`blocks.11`), followed by `model.norm`, via `forward_features()`. Exclude the CLS token and four register tokens; L2-normalize each spatial patch feature. The same checkpoint and layer are used for every input.
- Preprocessing: decode RGB at native 640×480; no resizing, cropping, augmentation or masking. Divide by 255; normalize with ImageNet mean `(0.485, 0.456, 0.406)` and standard deviation `(0.229, 0.224, 0.225)`. Float32 inference in eval mode; autocast and TF32 disabled. Each image yields a 30×40 patch grid.

## Shared PCA and colors

Fit exactly **one PCA basis** to all **32,400 patches pooled across all 27 images**, including all cameras and clean/randomized appearances. Center features using the pooled mean and eigendecompose the sample covariance in float64. Keep the top three components, without whitening or feature-channel standardization. Fix each component’s sign globally so its largest-absolute loading is positive.

Map PC1/PC2/PC3 to red/green/blue. Compute each component’s 2nd and 98th percentiles over all pooled scores, then use those **same bounds for every image**: `RGB = clip((scores - low) / (high - low), 0, 1)`. Round to uint8 and upscale the 40×30 color grid to 640×480 using nearest neighbor. No per-image or per-camera PCA or contrast adjustments are applied.

The components explain 18.9495%, 11.3688% and 8.2214% of variance (38.5397% total). [settings.json](settings.json) records full numerical settings and hashes; [shared_pca.npz](shared_pca.npz) contains the shared mean, components, color bounds and unscaled score maps. [source_manifest.json](source_manifest.json) pins the source RGB images to commit `07663859eedd2b95512991a794d25aa094f2b43e`. [validation.json](validation.json) records validation of all 27 output hashes and every exported pixel against the shared projection and color normalization.

Runtime: Python 3.11.15, PyTorch 2.14.1+cu130, torchvision 0.29.0, timm 1.0.28, NumPy 2.2.6, Pillow 12.3.0, NVIDIA L40S.

## Interpretation and integration

PCA colors are continuous projections, not semantic labels. Broad color structure persists across appearances, but the wrist maps are coarse. The first three components retain 38.5% of total variance. This single-state comparison alone cannot distinguish semantic invariance from positional structure or establish manipulation relevance.

For the existing appearance index `v1`–`v8`, select `chess-vN-{camera}-pca.webp`, keeping `chess-clean-{camera}-pca.webp` fixed. `top` is the head camera; `left` and `right` are the wrist cameras.

Suggested caption: “INVAR patch features for the same chess state. One shared PCA basis and shared color scale across all 27 clean/randomized camera views.”
