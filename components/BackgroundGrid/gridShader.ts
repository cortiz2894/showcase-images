export const gridVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const gridFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uGridSize;
  uniform float uSubdivisions;
  uniform float uMajorLineWidth;
  uniform float uMinorLineWidth;
  uniform float uDotSize;
  uniform vec3 uMajorLineColor;
  uniform vec3 uMinorLineColor;
  uniform vec3 uDotColor;
  uniform float uMajorLineOpacity;
  uniform float uMinorLineOpacity;
  uniform float uDotOpacity;
  uniform vec3 uBgColor;
  uniform float uBgOpacity;
  uniform float uTileX;
  uniform float uTileY;

  // Horizontal fade: show sides, hide center around cylinder circumference
  uniform float uHorizontalFade;
  uniform float uHorizontalFadeSoftness;

  varying vec2 vUv;

  void main() {
    // Tile UVs to control grid density on the cylinder surface
    vec2 uv = vec2(vUv.x * uTileX, vUv.y * uTileY);

    // Major grid
    float cellSize = uGridSize;
    vec2 majorGrid = mod(uv, cellSize);
    vec2 majorDist = min(majorGrid, cellSize - majorGrid);
    float majorLine = min(majorDist.x, majorDist.y);
    float majorMask = 1.0 - smoothstep(0.0, uMajorLineWidth, majorLine);

    // Minor grid (subdivisions inside each major cell)
    float subCellSize = cellSize / uSubdivisions;
    vec2 minorGrid = mod(uv, subCellSize);
    vec2 minorDist = min(minorGrid, subCellSize - minorGrid);
    float minorLine = min(minorDist.x, minorDist.y);
    float minorMask = 1.0 - smoothstep(0.0, uMinorLineWidth, minorLine);
    minorMask *= (1.0 - majorMask);

    // Dots at major intersections
    vec2 nearestMajor = floor(uv / cellSize + 0.5) * cellSize;
    float distToDot = length(uv - nearestMajor);
    float dotMask = 1.0 - smoothstep(0.0, uDotSize, distToDot);

    // Horizontal fade: show sides, hide center
    // vUv.x = 0..1 wrapping around the cylinder
    // distance from 0.5 = how far around the sides (0 at front, 1 at back)
    float horzDist = abs(vUv.x - 0.5) * 2.0;
    float horzMask = smoothstep(uHorizontalFade, uHorizontalFade + uHorizontalFadeSoftness, horzDist);

    float visibility = horzMask;

    // Compose
    vec3 color = uBgColor;
    float alpha = uBgOpacity;

    // Minor lines
    color = mix(color, uMinorLineColor, minorMask * uMinorLineOpacity);
    alpha = max(alpha, minorMask * uMinorLineOpacity);

    // Major lines
    color = mix(color, uMajorLineColor, majorMask * uMajorLineOpacity);
    alpha = max(alpha, majorMask * uMajorLineOpacity);

    // Dots on top
    color = mix(color, uDotColor, dotMask * uDotOpacity);
    alpha = max(alpha, dotMask * uDotOpacity);

    // Apply visibility gradient
    alpha *= visibility;

    gl_FragColor = vec4(color, alpha);
  }
`;
