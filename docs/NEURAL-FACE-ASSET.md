# Neural head geometry

The decorative point-cloud artwork uses **“Infinite, 3D Head Scan” by Lee Perry-Smith**, a licensed sample scan distributed with three.js. It contains a complete cranial volume, ears, face, neck, and shoulder bust. It is not a scan or likeness of the AICANFEEL site owner. The local renderer samples this static geometry; it does not request camera access or analyze a visitor's face.

## Source and attribution

- [Original GLB](https://raw.githubusercontent.com/mrdoob/three.js/9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb), from three.js release `r186`.
- Pinned source commit: `9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8`.
- [Source asset license](https://raw.githubusercontent.com/mrdoob/three.js/9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8/examples/models/gltf/LeePerrySmith/LeePerrySmith_License.txt): **Creative Commons Attribution 3.0 Unported (CC BY 3.0)**. The notice identifies Lee Perry-Smith as creator and credits the original work at `www.triplegangers.com`.
- [License deed](https://creativecommons.org/licenses/by/3.0/) and [legal code](https://creativecommons.org/licenses/by/3.0/legalcode).
- Source GLB SHA-256: `402b8a8ac9f03232e6d64b5962929703a069daf99d3c49ac8eb0e48bedc9c576`.
- Retrieved and adapted on `2026-09-27`.

The source license permits redistribution and adaptation, including commercial use, with appropriate attribution. Retain the supplied title, creator, source, and license notice; provide a license link; indicate the adaptation; and do not imply the creator endorses this site. Do not impose legal terms or technological restrictions that prevent recipients from exercising the licensed rights. The asset's CC BY 3.0 license is distinct from the three.js library's MIT license.

The site provides visible attribution in the **About** dialog: “3D study adapted from ‘Infinite, 3D Head Scan’ by Lee Perry-Smith · CC BY 3.0”. Its link opens `/media/neural-head-LICENSE.txt`, which preserves the original license notice and provides the pinned source, license links, and modification details. Keep that credit and accompanying license file when distributing the geometry or its rendered derivatives. The artwork and attribution do not imply endorsement by the source creator.

## Runtime schema

`public/media/neural-head.json` contains flat `positions` (XYZ), `normals` (XYZ), and `indices` (zero-based triangles), plus `source`, `title`, `creator`, `license`, `modifications`, and `coordinateSystem` metadata.

| Property | Value |
| --- | --- |
| Vertices | 9,279 |
| Triangles | 17,684 |
| Position values | 27,837 |
| Normal values | 27,837 |
| Indices | 53,052 |
| JSON bytes | 725,253 |
| Gzip bytes | 236,471 |
| JSON SHA-256 | `a6b0b5372e9d98cb90d8e5e985d43a5159c4c75d72fad487ef780947b52c897c` |

The conversion preserves the original vertex order, triangle winding, complete bust, and smooth GLB vertex normals. It omits source materials, textures, UVs, cameras, and lights. Positions and normals are rounded to five decimal places. Using the supplied normals preserves the source's smoothing across vertices duplicated for texture seams.

## Coordinate convention and conversion

Right-handed XYZ uses **+Y upward and +Z toward the face front**. A camera on positive Z looking toward the origin sees the face. The original mesh already uses this orientation; conversion does not rotate or mirror it.

- Raw GLB position bounds: minimum `[-4.2763209343, -3.9725465775, -2.5903775692]`; maximum `[4.2763209343, 3.9725468159, 2.5903584957]`.
- The source node scale `[1, 1.0000001192092896, 1.0000001192092896]` is baked into the positions.
- Source-space crown Y after node scaling: `3.972547289436676`. The visually estimated chin plane is Y=`-0.9`. This is a presentation landmark, not a measured biometric landmark.
- Translation center: `[0, 1.536273644718338, 0]`.
- Uniform normalization scale: `0.8209258448187267`.
- Conversion: `normalizedPosition = (sourcePosition * nodeScale - center) * normalizationScale`, where the first multiplication is componentwise.
- The crown lands at Y=`2` and the approximate chin plane at Y=`-2`, giving a skull-to-chin height of four world units. The full neck and shoulder bust remain below the chin plane for the renderer to fade.
- Final full-bust bounds: minimum `[-3.51054, -4.52233, -2.12651]`; maximum `[3.51054, 2, 2.12649]`.
- Bounds of vertices on or above the approximate chin plane: minimum `[-1.55708, -1.99678, -1.63152]`; maximum `[1.41449, 2, 2.12649]`.

Normals receive the inverse-transpose source node-scale transform, followed by unit normalization. Translation and positive uniform scaling do not change their direction. The coordinate metadata in the JSON records the same transforms and bounds.

## Validation

The conversion verified finite positions and normals, matching position/normal counts, triangle indices within the vertex count, and no degenerate triangles after rounding. Rounded normal lengths differ from one by at most `0.00000789`. Inspection of front, back, side, and top projections confirmed the full head volume and anatomy. No fixed landmark topology or procedural facial features are used.

## Static fallback

`public/media/neural-head.webp` is a **520 × 620**, **37,324-byte**, transparent **RGBA WebP** encoded at quality **88**. It was captured from the actual WebGL renderer using this same geometry, point-cloud shading, lighting, and scan treatment, so the fallback matches the live artwork. Alpha ranges from zero to 255; its transparent background allows it to blend with the page without an opaque panel.

The fallback is a rendered derivative of the same CC BY 3.0 scan and carries the same attribution and license requirements. Its SHA-256 is `a14c5e8da21b31cf4b2c18938a58b5460013114d14e6a786ad1cf13478c7b58a`.
