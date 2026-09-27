# Neural face geometry

The local decorative face asset uses MediaPipe's generic canonical human face mesh. It is a static 3D template, not a scan or likeness of the client. The renderer may sample its triangles to produce a dense particle scan without loading MediaPipe, requesting camera access, or making external runtime requests.

## Source and attribution

- [Original OBJ](https://raw.githubusercontent.com/google-ai-edge/mediapipe/a908d668c730da128dfa8d9f6bd25d519d006692/mediapipe/modules/face_geometry/data/canonical_face_model.obj)
- Source revision: `a908d668c730da128dfa8d9f6bd25d519d006692` (latest commit affecting this OBJ, dated 2020-09-17).
- [MediaPipe documentation](https://chuoling.github.io/mediapipe/solutions/face_mesh.html#canonical-face-model) describes the canonical model's 468-landmark topology.
- [Source license](https://raw.githubusercontent.com/google-ai-edge/mediapipe/a908d668c730da128dfa8d9f6bd25d519d006692/LICENSE): Apache License 2.0. The full license and modification notice ship in `public/media/neural-face-LICENSE.txt`.
- [Source data BUILD file](https://raw.githubusercontent.com/google-ai-edge/mediapipe/a908d668c730da128dfa8d9f6bd25d519d006692/mediapipe/modules/face_geometry/data/BUILD) attributes copyright to The MediaPipe Authors, 2020. The OBJ itself has no inline copyright notice; no root NOTICE file was present at the pinned revision.
- Source OBJ SHA-256: `8bac80443397e113f41a8b565ea72c59390bc031d9defab289dba7bc0c54e618`.
- Converted JSON SHA-256: `2c659c91ba3e6ff19945e6186fc7051e215e04bebacb1fee4c0f7e82b554e9c8`.

## Runtime schema

`public/media/neural-face.json` contains `positions` (flat XYZ numbers), `indices` (flat zero-based triangle vertex indices), and string metadata `source`, `license`, and `modifications`. There are 468 vertices, 898 triangles, 1404 position values, and 2694 indices. The compact file is 22057 bytes (7708 bytes with gzip).

Original landmark order and face winding are unchanged. UVs are omitted because the particles require only geometry. No texture, normals, iris geometry, or full rear skull is included.

## Coordinate convention

- Right-handed XYZ; +Y points upward, and the nose points toward +Z. A camera on positive Z looking toward the origin sees the face front.
- Source bounding-box minimum: `[-7.743095,-9.403378,-2.435867]`; maximum: `[7.743095,8.261778,7.58658]`.
- Conversion: `normalizedPosition = (sourcePosition - center) * scale`, with center `[0,-0.5708000000000002,2.5753565]` and scale `0.22643445662183792`.
- Final bounds: minimum `[-1.7533,-2,-1.13471]`; maximum `[1.7533,2,1.13471]`. Height is 4 world units. Width/depth proportions are retained. Positions are rounded to 5 decimal places.
- Landmark 4 (nose tip) is `[0,0.02437,1.13471]`; landmark 10 is the upper forehead; landmark 152 is the chin.

## Validation

The import validates finite XYZ values, exactly 468 vertices, triangle-only faces, index bounds, and nonzero triangle areas after rounding. All 468 vertices are referenced. Topology has 1365 unique edges and 36 boundary edges, with 0 non-manifold edges. Geometry retains the face surface boundaries of the source.

## Static fallback

`public/media/neural-face.webp` is a 420 x 480 pixel, 26454-byte WebP rendered locally from this same geometry with Pillow. It has a near-black RGB background (3, 6, 10), a -0.20 radian yaw, a perspective camera at positive Z, 4,445 visible particles from 4,700 deterministic area-weighted samples (random seed 20260927), subdued source-triangle lines, and fine eye/lip/nose landmark contours. Particle light responds to interpolated surface normals; the eye-height band has a faint champagne tint. Eye and mouth interiors are darkened using their original landmark polygons. Two-times supersampling is reduced with Lanczos before quality-85 WebP encoding. This is a mesh-derived visualization, not an AI-generated portrait or an individual person's photograph.

The image derives from the same Apache-2.0-licensed source, so retain the accompanying license when distributing it. The asset is opaque; CSS `mix-blend-mode: screen` can integrate it with a differing dark panel. SHA-256: `030e267602bb37c722190ba4c2d8f50837625e8e6b06f139d979db8f34e4d092`.
