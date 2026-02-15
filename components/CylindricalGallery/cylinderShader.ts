export const vertexShader = /* glsl */ `
  uniform float uRadius;
  uniform float uScrollOffset;
  uniform float uTotalHeight;
  uniform float uTime;
  uniform float uScale;
  uniform float uCurvature;
  uniform float uRotation;

  // Effects
  uniform float uSqueezeAmount;
  uniform float uSqueezeWidth;

  // Instance attributes
  attribute float aAngleOffset;
  attribute float aPositionY;
  attribute float aTextureIndex;

  varying vec2 vUv;
  varying float vTextureIndex;
  varying float vDepthFade;
  varying float vWorldY;

  void main() {
    vUv = uv;
    vTextureIndex = aTextureIndex;

    vec3 scaled = position * uScale;

    float scrolledY = aPositionY + uScrollOffset;
    scrolledY = mod(scrolledY + uTotalHeight * 0.5, uTotalHeight) - uTotalHeight * 0.5;

    float y = scrolledY + scaled.y;

    // Center squeeze (hourglass)
    float squeezeGauss = exp(-(y * y) / (uSqueezeWidth * uSqueezeWidth));
    float squeezedRadius = uRadius * (1.0 - uSqueezeAmount * squeezeGauss);

    float angle = aAngleOffset + uRotation;

    float theta = scaled.x / (squeezedRadius * uCurvature);
    float finalAngle = angle + theta;

    float x = sin(finalAngle) * squeezedRadius;
    float z = cos(finalAngle) * squeezedRadius;

    vDepthFade = smoothstep(-squeezedRadius, squeezedRadius * 0.5, z);
    vWorldY = y;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, z, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uAtlasCols;
  uniform float uAtlasRows;
  uniform float uUniqueCount;
  uniform float uTime;

  // Effects
  uniform float uChromaticAberration;
  uniform float uOpacity;
  uniform float uSaturation;
  uniform float uBrightness;
  uniform float uEmission;
  uniform float uScanLines;
  uniform float uScanLineSpeed;
  uniform float uScanLineDensity;

  // Distance fade
  uniform float uDistanceFadeStart;
  uniform float uDistanceFadeEnd;

  // Hologram flicker
  uniform float uFlickerIntensity;
  uniform float uFlickerSpeed;

  // Border
  uniform float uBorderWidth;
  uniform vec3 uBorderColor;
  uniform float uBorderEmission;
  uniform float uBorderRadius;
  uniform float uBorderOffset;

  // Corners
  uniform float uCornerSize;
  uniform float uCornerWidth;
  uniform float uCornerOffset;

  // Dither
  uniform int uDitherEnabled;
  uniform float uDitherCellSize;
  uniform float uDitherGap;
  uniform float uDitherContrast;
  uniform int uDitherMode;
  uniform int uDitherShape;
  uniform float uDitherBaseScale;
  uniform float uDitherIntensity;
  uniform vec3 uDitherBgColor;
  uniform vec3 uDitherFgColor;
  uniform int uDitherUseColor;
  uniform float uDitherAspect;

  varying vec2 vUv;
  varying float vTextureIndex;
  varying float vDepthFade;
  varying float vWorldY;

  #define PI 3.14159265359

  vec2 getTileUV(vec2 localUV) {
    float idx = floor(vTextureIndex + 0.5);
    float col = mod(idx, uAtlasCols);
    float row = floor(idx / uAtlasCols);
    float tileU = (col + localUV.x) / uAtlasCols;
    float tileV = 1.0 - (row + 1.0 - localUV.y) / uAtlasRows;
    return vec2(tileU, tileV);
  }

  // Rounded rectangle SDF in centered coords (p from -0.5 to 0.5)
  // b = half-size, r = corner radius
  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  // --- Dither SDF shapes ---
  float sdCircle(vec2 p, float r) { return length(p) - r; }
  float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
  float sdDiamond(vec2 p, float r) {
    vec2 q = abs(p) / r;
    return (q.x + q.y - 1.0) * r * 0.7071;
  }
  float sdHex(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p.yx);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
  }
  float sdOctagon(vec2 p, float r) {
    const vec3 k = vec3(-0.9238795325, 0.3826834323, 0.4142135623);
    p = abs(p);
    p -= 2.0 * min(dot(vec2(k.x, k.y), p), 0.0) * vec2(k.x, k.y);
    p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
    return length(p) - r;
  }
  float sdStar5(vec2 p, float r, float ratio) {
    vec2 q = p / r;
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-0.809016994375, -0.587785252292);
    q.x = abs(q.x);
    q -= 2.0 * max(dot(k1, q), 0.0) * k1;
    q -= 2.0 * max(dot(k2, q), 0.0) * k2;
    q.x = abs(q.x);
    q.y -= 1.0;
    vec2 ba = ratio * vec2(0.587785252292, 0.809016994375) - vec2(0, 1);
    float h = clamp(dot(q, ba) / dot(ba, ba), 0.0, 1.0);
    return length(q - ba * h) * sign(q.y * ba.x - q.x * ba.y) * r;
  }

  float getLuma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  mat2 rotate2d(float angle) { return mat2(cos(angle), -sin(angle), sin(angle), cos(angle)); }

  // Sample average color for a dither cell center
  vec3 ditherSampleColor(vec2 cellCenterUV, float cellSize) {
    vec2 d = vec2(1.0 / 64.0) * cellSize * 0.25;
    vec3 c1 = texture2D(uAtlas, getTileUV(cellCenterUV)).rgb;
    vec3 c2 = texture2D(uAtlas, getTileUV(cellCenterUV + vec2(d.x, d.y))).rgb;
    vec3 c3 = texture2D(uAtlas, getTileUV(cellCenterUV + vec2(-d.x, d.y))).rgb;
    vec3 c4 = texture2D(uAtlas, getTileUV(cellCenterUV + vec2(d.x, -d.y))).rgb;
    vec3 c5 = texture2D(uAtlas, getTileUV(cellCenterUV + vec2(-d.x, -d.y))).rgb;
    return (c1 + c2 + c3 + c4 + c5) / 5.0;
  }

  // Apply dither effect to local UV
  vec4 applyDither(vec2 localUV) {
    float aspect = uDitherAspect;
    vec2 pixelUV = localUV;
    pixelUV.x *= aspect;

    float cellsCountY = 1.0 / (uDitherCellSize / 100.0);
    vec2 currentCellIndex = floor(pixelUV * cellsCountY);

    float globalMinDist = 100.0;
    float maxPriority = -1.0;
    vec3 finalShapeColor = vec3(0.0);
    float aa = 2.0 / (uDitherCellSize / 100.0 * 100.0);

    for (float y = -2.0; y <= 2.0; y++) {
      for (float x = -2.0; x <= 2.0; x++) {
        vec2 neighborIndex = currentCellIndex + vec2(x, y);
        vec2 neighborCenterUV = (neighborIndex + 0.5) / cellsCountY;
        neighborCenterUV.x /= aspect;

        if (neighborCenterUV.x < 0.0 || neighborCenterUV.x > 1.0 ||
            neighborCenterUV.y < 0.0 || neighborCenterUV.y > 1.0) continue;

        vec3 col = ditherSampleColor(neighborCenterUV, uDitherCellSize / 100.0);

        float contrastFactor = (1.015 * (uDitherContrast + 1.0)) / (1.0 * (1.015 - uDitherContrast));
        col = clamp(contrastFactor * (col - 0.5) + 0.5, 0.0, 1.0);

        float luma = getLuma(col);

        float scaleX = uDitherBaseScale;
        float scaleY = uDitherBaseScale;
        float rot = 0.0;
        vec2 offset = vec2(0.0);

        if (uDitherMode == 1) { scaleX = scaleY = luma * uDitherBaseScale * 1.5; }
        else if (uDitherMode == 2) { scaleX = scaleY = (1.0 - luma) * uDitherBaseScale * 1.5; }
        else if (uDitherMode == 3) { rot = luma * PI * uDitherIntensity; }
        else if (uDitherMode == 4) { scaleY = luma * uDitherBaseScale * 3.0; scaleX = uDitherBaseScale * 0.4; }
        else if (uDitherMode == 5) { scaleX = luma * uDitherBaseScale * 3.0; scaleY = uDitherBaseScale * 0.4; }
        else if (uDitherMode == 6) {
          if (mod(neighborIndex.x + neighborIndex.y, 2.0) < 0.5)
            scaleX = scaleY = luma * uDitherBaseScale * 1.5;
          else
            scaleX = scaleY = (1.0 - luma) * uDitherBaseScale * 1.5;
        }
        else if (uDitherMode == 8) { offset.x = (luma - 0.5) * uDitherIntensity; }
        else if (uDitherMode == 9) { offset.y = luma * uDitherIntensity; }
        else if (uDitherMode == 10) { scaleX = scaleY = abs(luma - 0.5) * 2.0 * uDitherBaseScale; }
        else if (uDitherMode == 12) {
          float q = floor(luma * 4.0) / 4.0;
          scaleX = scaleY = q * uDitherBaseScale * 1.5;
        }
        else if (uDitherMode == 13) {
          float n = fract(sin(dot(neighborIndex, vec2(12.9898, 78.233))) * 43758.5453);
          scaleX = scaleY = (luma + n * 0.5) * uDitherBaseScale;
        }
        else if (uDitherMode == 15) {
          if (luma < 0.5) { scaleX = scaleY = 0.0; }
          else { scaleX = scaleY = uDitherBaseScale; }
        }

        vec2 cellCenter = (neighborIndex + 0.5 + offset) / cellsCountY;
        vec2 p = pixelUV - cellCenter;
        if (rot != 0.0) p = rotate2d(rot) * p;
        p *= cellsCountY;

        float gapFactor = 1.0 - (uDitherGap / uDitherCellSize);
        if (scaleX < 0.001 || scaleY < 0.001) continue;
        float effSize = 0.5 * gapFactor;

        float d = 1.0;
        if (uDitherShape == 0) d = sdCircle(p, effSize * scaleX);
        else if (uDitherShape == 1) d = sdBox(p, vec2(effSize * scaleX, effSize * scaleY));
        else if (uDitherShape == 2) d = sdDiamond(p, effSize * scaleX);
        else if (uDitherShape == 3) d = sdHex(p, effSize * scaleX);
        else if (uDitherShape == 4) d = sdBox(p, vec2(effSize * scaleX * 0.2, effSize * scaleY));
        else if (uDitherShape == 5) d = sdBox(p, vec2(effSize * scaleX, effSize * scaleY * 0.2));
        else if (uDitherShape == 6) d = sdBox(rotate2d(0.785) * p, vec2(effSize * scaleX * 0.2, effSize * scaleY * 1.5));
        else if (uDitherShape == 7) d = sdOctagon(p, effSize * scaleX);
        else if (uDitherShape == 8) d = sdStar5(vec2(p.x, -p.y), effSize * scaleX, 0.5);
        else if (uDitherShape == 9) d = max(sdBox(p, vec2(effSize * scaleX)), -sdBox(p, vec2(effSize * scaleX * 0.8)));
        else if (uDitherShape == 10) d = min(sdBox(p, vec2(effSize * scaleX * 0.2, effSize * scaleY)), sdBox(p, vec2(effSize * scaleX, effSize * scaleY * 0.2)));

        globalMinDist = min(globalMinDist, d);

        if (d < aa) {
          if (luma > maxPriority) {
            maxPriority = luma;
            finalShapeColor = (uDitherUseColor == 1) ? col : uDitherFgColor;
          }
        }
      }
    }

    float mask = 1.0 - smoothstep(0.0, aa, globalMinDist);
    vec3 result = mix(uDitherBgColor, finalShapeColor, mask);
    return vec4(result, mask);
  }

  // Corner bracket mask with offset from edge
  float cornerMask(vec2 uv, float cornerLen, float lineW, float offset) {
    float mask = 0.0;
    float o = offset;

    // Bottom-left
    if (uv.x >= o && uv.x < o + cornerLen && uv.y >= o && uv.y < o + lineW) mask = 1.0;
    if (uv.x >= o && uv.x < o + lineW && uv.y >= o && uv.y < o + cornerLen) mask = 1.0;
    // Bottom-right
    if (uv.x > 1.0 - o - cornerLen && uv.x <= 1.0 - o && uv.y >= o && uv.y < o + lineW) mask = 1.0;
    if (uv.x > 1.0 - o - lineW && uv.x <= 1.0 - o && uv.y >= o && uv.y < o + cornerLen) mask = 1.0;
    // Top-left
    if (uv.x >= o && uv.x < o + cornerLen && uv.y > 1.0 - o - lineW && uv.y <= 1.0 - o) mask = 1.0;
    if (uv.x >= o && uv.x < o + lineW && uv.y > 1.0 - o - cornerLen && uv.y <= 1.0 - o) mask = 1.0;
    // Top-right
    if (uv.x > 1.0 - o - cornerLen && uv.x <= 1.0 - o && uv.y > 1.0 - o - lineW && uv.y <= 1.0 - o) mask = 1.0;
    if (uv.x > 1.0 - o - lineW && uv.x <= 1.0 - o && uv.y > 1.0 - o - cornerLen && uv.y <= 1.0 - o) mask = 1.0;

    return mask;
  }

  void main() {
    // Centered UV: from (0,0)-(1,1) to (-0.5,-0.5)-(0.5,0.5)
    vec2 centered = vUv - 0.5;
    vec2 halfSize = vec2(0.5);
    float aa = 0.005; // anti-aliasing width

    // --- Image mask (rounded rect) ---
    float imgDist = sdRoundedBox(centered, halfSize, uBorderRadius);
    float imageMask = 1.0 - smoothstep(-aa, aa, imgDist);

    // --- Border stroke (rounded rect at offset, full continuous border) ---
    vec2 borderHalfSize = halfSize - uBorderOffset;
    float borderDist = sdRoundedBox(centered, borderHalfSize, uBorderRadius);
    float outerEdge = 1.0 - smoothstep(-aa, aa, borderDist);
    float innerEdge = 1.0 - smoothstep(-aa, aa, borderDist + uBorderWidth);
    float borderMask = outerEdge - innerEdge;
    borderMask = clamp(borderMask, 0.0, 1.0);

    // --- Sample image color (full resolution) ---
    float caStrength = uChromaticAberration * (0.3 + 0.7 * (1.0 - vDepthFade));
    vec2 caOffset = vec2(caStrength, 0.0);

    vec2 uvCenter = getTileUV(vUv);
    vec2 uvR = getTileUV(vUv + caOffset);
    vec2 uvB = getTileUV(vUv - caOffset);

    float r = texture2D(uAtlas, uvR).r;
    float g = texture2D(uAtlas, uvCenter).g;
    float b = texture2D(uAtlas, uvB).b;

    vec3 color = vec3(r, g, b);

    // --- Dither (only on image content) ---
    float ditherAlpha = 1.0;
    if (uDitherEnabled == 1) {
      vec4 dithered = applyDither(vUv);
      color = dithered.rgb;
      ditherAlpha = dithered.a;
    }

    // --- Image effects (only applied to image, not border/corners) ---
    // Saturation
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(lum), color, uSaturation);

    // Brightness
    color *= uBrightness;

    // Scan lines
    if (uScanLines > 0.0) {
      float scanLine = sin((vWorldY * uScanLineDensity + uTime * uScanLineSpeed) * 3.14159) * 0.5 + 0.5;
      color *= 1.0 - uScanLines * (1.0 - scanLine) * 0.3;
    }

    // Edge darkening
    float darkening = smoothstep(0.0, 0.5, vDepthFade);
    color *= mix(0.15, 1.0, darkening);

    // Emission
    color += color * uEmission;

    // Combine image alpha: rounded rect mask * dither alpha (if dither on)
    float imageAlpha = imageMask;
    if (uDitherEnabled == 1) {
      imageAlpha *= ditherAlpha;
    }

    // --- Border + corners (separate layer, not affected by dither) ---
    vec3 borderGlow = uBorderColor * (1.0 + uBorderEmission);

    // Border: draw on top of image
    color = mix(color, borderGlow, borderMask);

    // Corner brackets (independent element)
    float corners = cornerMask(vUv, uCornerSize, uCornerWidth, uCornerOffset);
    color = mix(color, borderGlow, corners);

    // --- Distance fade: smooth opacity near scroll edges ---
    float distFade = 1.0 - smoothstep(uDistanceFadeStart, uDistanceFadeEnd, abs(vWorldY));

    // --- Hologram flicker ---
    // Multiple layered sine waves at different frequencies for organic flicker
    float flicker = 1.0;
    if (uFlickerIntensity > 0.0) {
      float t = uTime * uFlickerSpeed;
      float f1 = sin(t * 13.0) * 0.5 + 0.5;
      float f2 = sin(t * 37.0 + 1.7) * 0.5 + 0.5;
      float f3 = sin(t * 59.0 + 4.1) * 0.5 + 0.5;
      // Combine: mostly stable with occasional dips
      float combined = f1 * f2 + f3 * 0.3;
      // Random glitch frames (brief full-dim moments)
      float glitchSeed = fract(sin(floor(t * 8.0)) * 43758.5453);
      float glitch = step(0.92, glitchSeed); // ~8% chance of glitch frame
      combined = mix(combined, 0.1, glitch);
      flicker = 1.0 - uFlickerIntensity * (1.0 - clamp(combined, 0.3, 1.0));
    }

    // Final alpha: image content OR border OR corners visible
    float finalAlpha = max(imageAlpha, max(borderMask, corners));

    gl_FragColor = vec4(color * flicker, finalAlpha * uOpacity * distFade);
  }
`;
