WOMAN / THREE.JS VIEWER — repaired face, retained hair

Live viewer: https://fangde.github.io/woman-mesh-viewer/

For local development run: python3 -m http.server 8000
Open http://127.0.0.1:8000/ in your browser. Opening index.html directly as a file does not allow the browser to fetch the GLB.

Controls: drag to orbit; scroll/pinch to zoom; right-drag to pan. Play/pause, scrub and speed control the actual skeletal animation. Texture, Studio, Clay and Wireframe are four materials on the same mesh. Show skeleton exposes the six-bone rig; Slow turntable rotates the camera.

The GLB contains one 180,000-triangle skinned mesh, one shared 4096x4096 color texture, six joints and one eight-second animation. All camera angles and animation frames share the same UV image. No camera-specific image switching or pre-rendered image sequence is used.

V3 uses a clean MediaPipe face template fitted to eye, nose, mouth and jaw landmarks from 26 original calibrated views. The two cheek/temple cavities were replaced by the fitted facial surface. V2 hair shape and color are retained, with small surface resampling changes. Shoulders retain the earlier filled repair, which seals part of the original mechanical openings. Unobserved back views remain approximate. The texture includes baked lighting, not separated albedo. The template is an inferred anatomical prior, not newly observed geometry.

The viewer and all Three.js modules are bundled locally; no CDN is required. The GLB has its texture embedded; the PNG download provides the same shared atlas separately. Third-party notices are in dist/licenses/ and dist/vendor/THREE_LICENSE.txt.
