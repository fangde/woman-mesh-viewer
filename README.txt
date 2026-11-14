WOMAN / THREE.JS VIEWER — smooth jaw, speech and eye rig (V4)

Live viewer: https://fangde.github.io/woman-mesh-viewer/

The latest Blender smooth-mouth model is synchronized here: one mesh with 209,591 triangles, one shared 4096x5120texture, 14 bones, 16 morph targets and an 8-second sampled animation. The continuous jaw now moves the chin and lower face; lip correctives preserve mouth shapes. Eye movement and blinks remain active. The texture is fixedUV for all views.

Click “播放中文说话” to start the synthetic Mandarin voice and synchronized demo. Audio starts only after a click. Speech timing is approximate; this is not automatic lip sync for arbitrary new audio. Play/pause, timeline and speed also control the demo. Face/Full/Side/Back change framing. Drag to orbit, scroll/pinch to zoom, right-drag to pan.

Expand “手动调整嘴部与眨眼” to set Open,A,E,O,U,FV,MBP,Smile or left/right blink sliders. Manual controls pause the demo and use one mouth shape at a time; blinks can be added. the Jaw bone is updated with the lip morphs to retain the Blender corrective deformation. Click “回到动画” or “播放中文说话” to resume. Texture/Studio/Clay/Wireframe inspect the same live geometry. The GLB download includes skinning, morphs and animation, with the shared texture embedded. Audio is a separate speech.mp3 asset.

For local use, serve this directory with python3 -m http.server 8000, then open http://127.0.0.1:8000/. The companion local viewer package has a double-click launcher. All Three.js modules are bundled; no CDN is required.

The original face template was fitted to 26 calibrated source views, preserving hair and the earlier shoulder repair. Eyes, mouth and jaw were refined later. Teeth, tongue and mouth internals are inferred generic structure because the source mouth is closed. Fine scan marks, baked lighting and unobserved back geometry remain approximate. This update smooths the mouth/chin transition and matches shared-texture seam colors.

Licenses: licenses/ and vendor/THREE_LICENSE.txt.
