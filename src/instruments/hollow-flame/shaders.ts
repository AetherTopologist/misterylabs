export const FLAME_VERT = /* glsl */ `
varying vec3 vObj;
varying vec3 vCam;
void main() {
  vObj = position;
  vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const FLAME_FRAG = /* glsl */ `
varying vec3 vObj;
varying vec3 vCam;
uniform float uTime;
uniform float uAmp;
uniform float uFuel;
uniform float uOxygen;
uniform float uAir;
uniform float uHeight;
uniform float uThick;
uniform float uMode;
uniform float uFlicker;

bool hitBox(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax, out float t0, out float t1) {
  vec3 dir = rd;
  if (abs(dir.x) < 1e-4) dir.x = dir.x < 0.0 ? -1e-4 : 1e-4;
  if (abs(dir.y) < 1e-4) dir.y = dir.y < 0.0 ? -1e-4 : 1e-4;
  if (abs(dir.z) < 1e-4) dir.z = dir.z < 0.0 ? -1e-4 : 1e-4;
  vec3 ird = 1.0 / dir;
  vec3 tA = (bmin - ro) * ird;
  vec3 tB = (bmax - ro) * ird;
  vec3 tsm = min(tA, tB);
  vec3 tlg = max(tA, tB);
  t0 = max(max(tsm.x, tsm.y), tsm.z);
  t1 = min(min(tlg.x, tlg.y), tlg.z);
  return t1 > max(t0, 0.0);
}

vec3 tempRamp(float x) {
  x = clamp(x, 0.0, 1.0);
  vec3 c = mix(vec3(0.08, 0.0, 0.0), vec3(0.75, 0.08, 0.02), smoothstep(0.0, 0.32, x));
  c = mix(c, vec3(1.0, 0.42, 0.05), smoothstep(0.28, 0.58, x));
  c = mix(c, vec3(1.0, 0.82, 0.32), smoothstep(0.52, 0.8, x));
  c = mix(c, vec3(1.0, 0.96, 0.88), smoothstep(0.75, 1.0, x));
  return c;
}

vec3 sampleFlame(vec3 p) {
  float y = p.y + 1.2;
  float H = max(uHeight, 0.08);
  if (y < 0.0 || y > H + 0.08) return vec3(0.0);
  float t = clamp(y / H, 0.0, 1.0);
  float flick = uFlicker * (0.045 * sin(uTime * 9.0 + y * 14.0) + 0.02 * sin(uTime * 21.0 - y * 8.0));
  float lean = min(uAir, 1.0) * 0.52 * y;
  float x = p.x - lean;
  float r = length(vec2(x, p.z));
  float belly = sin(pow(t, 0.55) * 3.14159265);
  float outer = (0.04 + 0.34 * uFuel) * belly * pow(1.0 - t, 0.18);
  outer *= (1.0 + flick);
  float ratio = uFuel / max(uOxygen, 0.15);
  float frac = clamp(0.46 + 0.24 * ratio, 0.40, 0.88);
  float shellC = outer * frac;
  float thick = max(uThick, 0.05);
  float env = smoothstep(0.0, 0.06, t) * smoothstep(1.08, 0.8, t);
  float shell = exp(-pow((r - shellC) / thick, 2.0));
  float base = exp(-pow(t / 0.22, 2.0)) * exp(-pow(r / max(outer * 0.72, 0.035), 2.0));
  float core = exp(-pow(r / max(shellC * 0.62, 0.02), 2.0)) * env;
  float outside = exp(-max(r - outer, 0.0) / 0.07) * env;

  float presence = env * uAmp;
  vec3 luminous = vec3(1.15, 0.46, 0.05) * shell * 8.0;
  luminous += vec3(1.35, 0.95, 0.55) * pow(shell, 3.0) * 5.0;
  luminous += vec3(0.28, 0.5, 1.45) * base * 7.5;
  luminous += vec3(0.85, 0.28, 0.04) * outside * 0.22;
  luminous *= presence;

  float Tn = clamp(shell * 1.0 + base * 0.45 + core * 0.32, 0.0, 1.0);
  float occ = smoothstep(outer + thick * 1.4, max(outer * 0.15, 0.02), r) * presence;
  vec3 heat = tempRamp(Tn) * occ * 1.7;
  heat += tempRamp(0.95) * pow(shell, 2.0) * presence * 1.4;

  vec3 rate = vec3(1.0, 0.72, 0.28) * pow(shell, 1.6) * presence * 10.0;
  rate += vec3(0.35, 0.5, 1.15) * base * presence * 2.2;

  if (uMode > 2.5) {
    if (p.x > 0.018) return vec3(0.0);
    vec3 cut = heat * 0.75 + rate * 0.45;
    if (abs(p.x) < 0.03) {
      cut += tempRamp(Tn) * occ * 1.3;
      cut += vec3(1.0, 0.9, 0.72) * shell * presence * 2.0;
      if (r > shellC) cut += vec3(0.35, 0.7, 0.78) * presence * 0.35;
    }
    return cut;
  }
  if (uMode > 1.5) return rate;
  if (uMode > 0.5) return heat;
  return luminous;
}

void main() {
  vec3 ro = vCam;
  vec3 rd = normalize(vObj - vCam);
  float t0;
  float t1;
  if (!hitBox(ro, rd, vec3(-1.4, -1.2, -1.4), vec3(1.4, 1.2, 1.4), t0, t1)) {
    gl_FragColor = vec4(0.0);
    return;
  }
  t0 = max(t0, 0.0);
  float span = t1 - t0;
  if (span <= 0.001 || uAmp < 0.01) {
    gl_FragColor = vec4(0.0);
    return;
  }
  const int STEPS = 36;
  float dt = span / float(STEPS);
  float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(127.1, 311.7))) * 43758.5453);
  float t = t0 + dt * jitter;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < STEPS; i++) {
    acc += sampleFlame(ro + rd * t) * dt;
    t += dt;
  }
  acc *= 1.35;
  if (uMode < 0.5) acc = acc / (vec3(1.0) + acc * 0.42);
  else acc = acc / (vec3(1.0) + acc * 0.28);
  gl_FragColor = vec4(acc, clamp(length(acc), 0.0, 1.0));
}
`;

export const SHEATH_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
uniform float uTime;
uniform float uDisrupt;
void main() {
  float wobble = sin(uTime * 2.4 + position.y * 7.0) * uDisrupt * 0.06;
  vec3 p = position * (1.0 + wobble);
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  vLocal = position;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const SHEATH_FRAG = /* glsl */ `
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
uniform float uMode;
uniform float uAmp;
uniform float uCut;
uniform float uPower;
uniform vec3 uColor;
void main() {
  if (uCut > 0.5 && vLocal.x > 0.02) discard;
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(normalize(vN), viewDir), 0.0), uPower);
  float eq = pow(1.0 - abs(normalize(vLocal).y), 1.4);
  vec3 col = uColor * (0.25 + fres);
  float alpha = (0.04 + 0.9 * fres) * (0.22 + 0.78 * uAmp);
  if (uMode > 0.5 && uMode < 1.5) {
    col = mix(vec3(0.05, 0.16, 0.2), vec3(0.85, 0.95, 1.0), clamp(fres * 0.7 + eq * 0.45, 0.0, 1.0));
    alpha = (0.08 + 0.75 * fres) * (0.3 + 0.7 * uAmp);
  } else if (uMode > 1.5 && uMode < 2.5) {
    col = uColor;
    alpha = fres * fres * (0.2 + 0.8 * uAmp);
  }
  gl_FragColor = vec4(col, alpha);
}
`;

export const CELL_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vLocal = position;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const CELL_FRAG = /* glsl */ `
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
uniform float uTime;
uniform float uMode;
uniform float uAmp;
uniform float uCut;
uniform float uWound;
void main() {
  if (uCut > 0.5 && vLocal.x > 0.02) discard;
  vec3 lp = normalize(vLocal);
  float d1 = sin(3.2 * lp.x + uTime * 0.35) * sin(2.4 * lp.y - uTime * 0.22);
  float d2 = sin(3.6 * lp.z + 0.7);
  float v = d1 * d2;
  vec3 rest = vec3(0.45, 0.66, 0.7);
  vec3 depol = vec3(0.93, 0.58, 0.32);
  vec3 col = mix(rest, depol, smoothstep(-0.25, 0.55, v));
  float wound = uWound * smoothstep(0.15, 0.85, lp.x) * smoothstep(-0.2, 0.45, lp.y);
  col = mix(col, vec3(0.25, 0.16, 0.12), wound * 0.85);
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(normalize(vN), viewDir), 0.0), 1.8);
  if (uMode > 0.5 && uMode < 1.5) {
    col = mix(vec3(0.15, 0.28, 0.32), vec3(1.0, 0.78, 0.45), smoothstep(-0.4, 0.7, v));
  } else if (uMode > 1.5 && uMode < 2.5) {
    float meta = smoothstep(0.15, 0.9, fres) * (0.35 + 0.65 * uAmp);
    col = vec3(0.95, 0.72, 0.4) * meta;
  }
  col += vec3(0.9, 0.75, 0.55) * fres * 0.35;
  float alpha = (0.12 + 0.55 * fres) * (0.28 + 0.72 * uAmp);
  alpha = max(alpha, 0.08);
  gl_FragColor = vec4(col, alpha);
}
`;
