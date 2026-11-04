/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { useWind, DEFAULT_PLACE } from './LaunchConditions';

// ─── Pete's exact Elfouhaily shaders (verbatim from ocean-sim.js) ────────────

const FULLSCREEN_VS = `
attribute vec2 a_position;
varying vec2 v_coordinates;
void main(void) {
  v_coordinates = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// NOTE: horizontal version built by prepending '#define HORIZONTAL\n'
const SUBTRANSFORM_FS = `
precision highp float;
const float PI = 3.14159265359;
uniform sampler2D u_input;
uniform float u_transformSize;
uniform float u_subtransformSize;
varying vec2 v_coordinates;
vec2 multiplyComplex(vec2 a, vec2 b) {
  return vec2(a[0]*b[0]-a[1]*b[1], a[1]*b[0]+a[0]*b[1]);
}
void main(void) {
#ifdef HORIZONTAL
  float index = floor(gl_FragCoord.x);
#else
  float index = floor(gl_FragCoord.y);
#endif
  float evenIndex = floor(index/u_subtransformSize)*(u_subtransformSize*0.5) + mod(index, u_subtransformSize*0.5);
#ifdef HORIZONTAL
  vec4 even = texture2D(u_input, vec2(evenIndex+0.5, gl_FragCoord.y)/u_transformSize).rgba;
  vec4 odd  = texture2D(u_input, vec2(evenIndex+u_transformSize*0.5+0.5, gl_FragCoord.y)/u_transformSize).rgba;
#else
  vec4 even = texture2D(u_input, vec2(gl_FragCoord.x, evenIndex+0.5)/u_transformSize).rgba;
  vec4 odd  = texture2D(u_input, vec2(gl_FragCoord.x, evenIndex+u_transformSize*0.5+0.5)/u_transformSize).rgba;
#endif
  float twiddleArgument = -2.0*PI*(index/u_subtransformSize);
  vec2 twiddle = vec2(cos(twiddleArgument), sin(twiddleArgument));
  vec2 outputA = even.xy + multiplyComplex(twiddle, odd.xy);
  vec2 outputB = even.zw + multiplyComplex(twiddle, odd.zw);
  gl_FragColor = vec4(outputA, outputB);
}`;

const INITIAL_SPECTRUM_FS = `
precision highp float;
const float PI = 3.14159265359;
const float G = 9.81;
const float KM = 370.0;
const float CM = 0.23;
uniform vec2 u_wind;
uniform float u_resolution;
uniform float u_size;
uniform float u_amplitude;
float square(float x) { return x*x; }
float omega(float k) { return sqrt(G*k*(1.0+square(k/KM))); }
float tanh(float x) { return (1.0-exp(-2.0*x))/(1.0+exp(-2.0*x)); }
void main(void) {
  vec2 coordinates = gl_FragCoord.xy - 0.5;
  float n = (coordinates.x < u_resolution*0.5) ? coordinates.x : coordinates.x-u_resolution;
  float m = (coordinates.y < u_resolution*0.5) ? coordinates.y : coordinates.y-u_resolution;
  vec2 waveVector = (2.0*PI*vec2(n,m))/u_size;
  float k = length(waveVector);
  float U10 = length(u_wind);
  float Omega = 0.84;
  float kp = G*square(Omega/U10);
  float c = omega(k)/k;
  float cp = omega(kp)/kp;
  float Lpm = exp(-1.25*square(kp/k));
  float gamma = 1.7;
  float sigma = 0.08*(1.0+4.0*pow(Omega,-3.0));
  float Gamma = exp(-square(sqrt(k/kp)-1.0)/2.0*square(sigma));
  float Jp = pow(gamma, Gamma);
  float Fp = Lpm*Jp*exp(-Omega/sqrt(10.0)*(sqrt(k/kp)-1.0));
  float alphap = 0.006*sqrt(Omega);
  float Bl = 0.5*alphap*cp/c*Fp;
  float z0 = 0.000037*square(U10)/G*pow(U10/cp, 0.9);
  float uStar = 0.41*U10/log(10.0/z0);
  float alpham = 0.01*((uStar < CM) ? (1.0+log(uStar/CM)) : (1.0+3.0*log(uStar/CM)));
  float Fm = exp(-0.25*square(k/KM-1.0));
  float Bh = 0.5*alpham*CM/c*Fm*Lpm;
  float a0 = log(2.0)/4.0;
  float am = 0.13*uStar/CM;
  float Delta = tanh(a0+4.0*pow(c/cp,2.5)+am*pow(CM/c,2.5));
  float cosPhi = dot(normalize(u_wind), normalize(waveVector));
  float S = (1.0/(2.0*PI))*pow(k,-4.0)*(Bl+Bh)*(1.0+Delta*(2.0*cosPhi*cosPhi-1.0));
  float dk = 2.0*PI/u_size;
  float h = sqrt(S/2.0)*dk*u_amplitude;
  if (waveVector.x == 0.0 && waveVector.y == 0.0) h = 0.0;
  gl_FragColor = vec4(h, 0.0, 0.0, 0.0);
}`;

const PHASE_FS = `
precision highp float;
const float PI = 3.14159265359;
const float G = 9.81;
const float KM = 370.0;
varying vec2 v_coordinates;
uniform sampler2D u_phases;
uniform float u_deltaTime;
uniform float u_resolution;
uniform float u_size;
float omega(float k) { return sqrt(G*k*(1.0+k*k/KM*KM)); }
void main(void) {
  vec2 coordinates = gl_FragCoord.xy - 0.5;
  float n = (coordinates.x < u_resolution*0.5) ? coordinates.x : coordinates.x-u_resolution;
  float m = (coordinates.y < u_resolution*0.5) ? coordinates.y : coordinates.y-u_resolution;
  vec2 waveVector = (2.0*PI*vec2(n,m))/u_size;
  float phase = texture2D(u_phases, v_coordinates).r;
  float deltaPhase = omega(length(waveVector))*u_deltaTime;
  phase = mod(phase+deltaPhase, 2.0*PI);
  gl_FragColor = vec4(phase, 0.0, 0.0, 0.0);
}`;

const SPECTRUM_FS = `
precision highp float;
const float PI = 3.14159265359;
const float G = 9.81;
const float KM = 370.0;
varying vec2 v_coordinates;
uniform float u_size;
uniform float u_resolution;
uniform sampler2D u_phases;
uniform sampler2D u_initialSpectrum;
uniform float u_choppiness;
vec2 multiplyComplex(vec2 a, vec2 b) {
  return vec2(a[0]*b[0]-a[1]*b[1], a[1]*b[0]+a[0]*b[1]);
}
vec2 multiplyByI(vec2 z) { return vec2(-z[1], z[0]); }
float omega(float k) { return sqrt(G*k*(1.0+k*k/KM*KM)); }
void main(void) {
  vec2 coordinates = gl_FragCoord.xy - 0.5;
  float n = (coordinates.x < u_resolution*0.5) ? coordinates.x : coordinates.x-u_resolution;
  float m = (coordinates.y < u_resolution*0.5) ? coordinates.y : coordinates.y-u_resolution;
  vec2 waveVector = (2.0*PI*vec2(n,m))/u_size;
  float phase = texture2D(u_phases, v_coordinates).r;
  vec2 phaseVector = vec2(cos(phase), sin(phase));
  vec2 h0 = texture2D(u_initialSpectrum, v_coordinates).rg;
  vec2 h0Star = texture2D(u_initialSpectrum, vec2(1.0-v_coordinates+1.0/u_resolution)).rg;
  h0Star.y *= -1.0;
  vec2 h = multiplyComplex(h0, phaseVector) + multiplyComplex(h0Star, vec2(phaseVector.x, -phaseVector.y));
  vec2 hX = -multiplyByI(h*(waveVector.x/length(waveVector)))*u_choppiness;
  vec2 hZ = -multiplyByI(h*(waveVector.y/length(waveVector)))*u_choppiness;
  if (waveVector.x == 0.0 && waveVector.y == 0.0) { h = vec2(0.0); hX = vec2(0.0); hZ = vec2(0.0); }
  gl_FragColor = vec4(hX+multiplyByI(h), hZ);
}`;

const NORMAL_MAP_FS = `
precision highp float;
varying vec2 v_coordinates;
uniform sampler2D u_displacementMap;
uniform float u_resolution;
uniform float u_size;
void main(void) {
  float texel = 1.0/u_resolution;
  float texelSize = u_size/u_resolution;
  vec3 center = texture2D(u_displacementMap, v_coordinates).rgb;
  vec3 right  = vec3(texelSize,0.0,0.0)+texture2D(u_displacementMap, v_coordinates+vec2(texel,0.0)).rgb-center;
  vec3 left   = vec3(-texelSize,0.0,0.0)+texture2D(u_displacementMap, v_coordinates+vec2(-texel,0.0)).rgb-center;
  vec3 top    = vec3(0.0,0.0,-texelSize)+texture2D(u_displacementMap, v_coordinates+vec2(0.0,-texel)).rgb-center;
  vec3 bottom = vec3(0.0,0.0,texelSize)+texture2D(u_displacementMap, v_coordinates+vec2(0.0,texel)).rgb-center;
  gl_FragColor = vec4(normalize(cross(right,top)+cross(top,left)+cross(left,bottom)+cross(bottom,right)), 1.0);
}`;

const OCEAN_VS = `
#ifdef GL_ES
precision highp float;
#endif
attribute vec3 a_position;
attribute vec2 a_coordinates;
varying vec3 v_position;
varying vec2 v_coordinates;
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform float u_size;
uniform float u_geometrySize;
uniform sampler2D u_displacementMap;
void main(void) {
  vec3 position = a_position + texture2D(u_displacementMap, a_coordinates).rgb*(u_geometrySize/u_size);
  v_position = position;
  v_coordinates = a_coordinates;
  gl_Position = u_projectionMatrix*u_viewMatrix*vec4(position, 1.0);
}`;

const OCEAN_FS = `
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#endif
varying vec2 v_coordinates;
varying vec3 v_position;
uniform sampler2D u_displacementMap;
uniform sampler2D u_normalMap;
uniform vec3 u_cameraPosition;
uniform vec3 u_oceanColor;
uniform vec3 u_skyColor;
uniform float u_exposure;
uniform vec3 u_sunDirection;
vec3 hdr(vec3 color, float exposure) { return 1.0-exp(-color*exposure); }
void main(void) {
  vec3 normal = texture2D(u_normalMap, v_coordinates).rgb;
  vec3 view = normalize(u_cameraPosition-v_position);
  float fresnel = 0.02+0.98*pow(1.0-dot(normal,view), 5.0);
  vec3 sky = fresnel*u_skyColor;
  float diffuse = clamp(dot(normal, normalize(u_sunDirection)), 0.0, 1.0);
  vec3 water = (1.0-fresnel)*u_oceanColor*u_skyColor*diffuse;
  vec3 color = sky+water;
  float edgeDist = max(abs(v_position.x), abs(v_position.z));
  float edgeFade = 1.0-smoothstep(650.0, 1000.0, edgeDist);
  gl_FragColor = vec4(hdr(color, u_exposure), edgeFade);
}`;

const OVERLAY_VS = `
attribute vec3 a_position;
attribute vec4 a_color;
attribute vec3 a_extra;
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform float u_time;
uniform float u_streaks;
uniform vec2 u_flowDir;
uniform float u_flowSpeed;
uniform float u_range;
varying vec4 v_color;
void main(void) {
  vec3 p = a_position;
  float alpha = a_color.a;
  if (u_streaks > 0.5) {
    float d = mod(a_extra.x+u_time*u_flowSpeed, u_range);
    vec2 across = vec2(-u_flowDir.y, u_flowDir.x);
    float len = 24.0+u_flowSpeed*0.35;
    vec2 c = p.xz+u_flowDir*(d-0.5*u_range+a_extra.z*len)+across*a_extra.y*1.8;
    p = vec3(c.x, p.y, c.y);
    float t = d/u_range;
    alpha *= smoothstep(0.0,0.12,t)*(1.0-smoothstep(0.88,1.0,t))*mix(0.1,1.0,a_extra.z);
  } else {
    p.y += sin(u_time*1.4+a_extra.x)*a_extra.y;
  }
  v_color = vec4(a_color.rgb, alpha);
  gl_Position = u_projectionMatrix*u_viewMatrix*vec4(p, 1.0);
}`;

const OVERLAY_FS = `
precision mediump float;
varying vec4 v_color;
void main(void) { gl_FragColor = v_color; }`;

// ─── Constants (Pete's exact values) ─────────────────────────────────────────
const OCEAN_COLOR = [0.004, 0.016, 0.047];
const SKY_COLOR   = [3.2, 9.6, 12.8];
const EXPOSURE    = 0.35;
const SUN_DIR     = [-1.0, 1.0, 1.0];
const GEOM_ORIGIN = [-1000.0, -1000.0];
const GEOM_SIZE   = 2000;
const RESOLUTION  = 512;  // FFT must stay at 512 (256 produces diagonal bands)
const GEOM_RES    = 128;  // mesh density — lighter than Pete's 256 for embedded panel
const ORBIT_PT    = [-200.0, 0.0, 600.0];
const CAM_DIST    = 1000;
const INIT_AZ     = 0.4, INIT_EL = 0.5;
const MIN_AZ      = -0.2, MAX_AZ = 0.5;
const MIN_EL      = 0.4,  MAX_EL = 0.8;
const FOV         = (60 / 180) * Math.PI;
const NEAR = 1, FAR = 10000;
const SOF         = 4; // SIZE_OF_FLOAT
const STREAK_CNT  = 160;
const STREAK_RANGE = 1500;
// Texture units
const IS_UNIT = 0, SP_UNIT = 1, DM_UNIT = 2, NM_UNIT = 3;
const PP_UNIT = 4, POP_UNIT = 5, PT_UNIT = 6, POT_UNIT = 7;
const UV_ATTR = 1; // vertex attribute for UV coords
// SeaParams calibration (Pete's exact values)
const SEA_PATCH  = 250;
const HGT_EXAG   = 2.0;
const RIPPLE_MIN = 0.25;
const SWELL_AGE  = 1.3;
const MIN_U = 1.5, MAX_U = 25.0;
const CHOP_ANCHORS = [[5,0.3],[10,1.1],[13,1.6],[19,2.0]];

// ─── Pete's exact helper functions ───────────────────────────────────────────
function clamp(x: number, a: number, b: number) { return Math.min(Math.max(x, a), b); }
function log2n(n: number) { return Math.log(n) / Math.log(2); }

function choppinessForWind(u: number) {
  if (u <= CHOP_ANCHORS[0][0]) return CHOP_ANCHORS[0][1];
  for (let i = 1; i < CHOP_ANCHORS.length; i++) {
    const a = CHOP_ANCHORS[i-1], b = CHOP_ANCHORS[i];
    if (u <= b[0]) return a[1] + (u - a[0]) / (b[0] - a[0]) * (b[1] - a[1]);
  }
  return CHOP_ANCHORS[CHOP_ANCHORS.length-1][1];
}

function modelHs(wx: number, wy: number, size: number, N: number) {
  const G=9.81, KM=370, CM=0.23, PI=Math.PI, Omega=0.84;
  const omega = (k: number) => Math.sqrt(G*k*(1+(k/KM)**2));
  const U10 = Math.sqrt(wx*wx+wy*wy);
  const kp = G*(Omega/U10)**2, cp = omega(kp)/kp;
  const sigma = 0.08*(1+4*Omega**-3), alphap = 0.006*Math.sqrt(Omega);
  const z0 = 0.000037*U10*U10/G*(U10/cp)**0.9, uStar = 0.41*U10/Math.log(10/z0);
  const alpham = 0.01*(uStar<CM ? 1+Math.log(uStar/CM) : 1+3*Math.log(uStar/CM));
  const a0 = Math.log(2)/4, am = 0.13*uStar/CM, dk = 2*PI/size;
  let sum = 0;
  for (let n = -N/2; n < N/2; n++) {
    for (let m = -N/2; m < N/2; m++) {
      if (!n && !m) continue;
      const kx = 2*PI*n/size, ky = 2*PI*m/size, k = Math.sqrt(kx*kx+ky*ky);
      const c = omega(k)/k, r = Math.sqrt(k/kp)-1;
      const Lpm = Math.exp(-1.25*(kp/k)**2);
      const Jp = (1.7)**Math.exp(-r*r/2/(sigma*sigma));
      const Fp = Lpm*Jp*Math.exp(-Omega/Math.sqrt(10)*r);
      const Bl = 0.5*alphap*cp/c*Fp;
      const Fm = Math.exp(-0.25*(k/KM-1)**2);
      const Bh = 0.5*alpham*CM/c*Fm*Lpm;
      const Delta = Math.tanh(a0+4*(c/cp)**2.5+am*(CM/c)**2.5);
      const cosPhi = (wx*kx+wy*ky)/(U10*k);
      const S = (1/(2*PI))*k**-4*(Bl+Bh)*(1+Delta*(2*cosPhi**2-1));
      sum += (Math.sqrt(S/2)*dk)**2;
    }
  }
  return 4*Math.sqrt(sum);
}

function seaParams(windMs: number, fromDeg: number, waveM: number|null|undefined, waveFromDeg?: number) {
  const speed  = clamp(windMs, MIN_U, MAX_U);
  const hasWave = typeof waveM === 'number' && isFinite(waveM);
  const drawnM  = hasWave ? Math.max(waveM!, RIPPLE_MIN) : null;
  const swellU  = hasWave ? SWELL_AGE*Math.sqrt(drawnM!*9.81/0.21) : 0;
  const isSwell = swellU > speed;
  const shapeU  = clamp(isSwell ? swellU : speed, MIN_U, MAX_U);
  const heading = isSwell && typeof waveFromDeg==='number' ? waveFromDeg : fromDeg;
  const towards = ((heading+180)%360);
  const angle   = (((90-towards)+360)%360)*Math.PI/180;
  const windX = Math.cos(angle)*shapeU, windY = -Math.sin(angle)*shapeU;
  let amplitude = 1;
  if (hasWave) {
    const hs = modelHs(windX, windY, SEA_PATCH, 32); // 32-point estimate (fast)
    if (hs > 1e-6 && isFinite(hs)) amplitude = drawnM!*HGT_EXAG/hs;
  }
  return { windX, windY, size: SEA_PATCH, choppiness: choppinessForWind(speed)/HGT_EXAG, amplitude };
}

// ─── Matrix helpers (Pete's exact code) ──────────────────────────────────────
function makeId(m: Float32Array) { m[0]=m[5]=m[10]=m[15]=1; m[1]=m[2]=m[3]=m[4]=m[6]=m[7]=m[8]=m[9]=m[11]=m[12]=m[13]=m[14]=0; return m; }
function makeXRot(m: Float32Array, a: number) { m[0]=1;m[1]=0;m[2]=0;m[3]=0;m[4]=0;m[5]=Math.cos(a);m[6]=Math.sin(a);m[7]=0;m[8]=0;m[9]=-Math.sin(a);m[10]=Math.cos(a);m[11]=0;m[12]=0;m[13]=0;m[14]=0;m[15]=1;return m; }
function makeYRot(m: Float32Array, a: number) { m[0]=Math.cos(a);m[1]=0;m[2]=-Math.sin(a);m[3]=0;m[4]=0;m[5]=1;m[6]=0;m[7]=0;m[8]=Math.sin(a);m[9]=0;m[10]=Math.cos(a);m[11]=0;m[12]=0;m[13]=0;m[14]=0;m[15]=1;return m; }
function premul(out: Float32Array, A: Float32Array, B: Float32Array) {
  const b0=B[0],b4=B[4],b8=B[8],b12=B[12],b1=B[1],b5=B[5],b9=B[9],b13=B[13],b2=B[2],b6=B[6],b10=B[10],b14=B[14],b3=B[3],b7=B[7],b11=B[11],b15=B[15];
  let aX=A[0],aY=A[1],aZ=A[2],aW=A[3]; out[0]=b0*aX+b4*aY+b8*aZ+b12*aW; out[1]=b1*aX+b5*aY+b9*aZ+b13*aW; out[2]=b2*aX+b6*aY+b10*aZ+b14*aW; out[3]=b3*aX+b7*aY+b11*aZ+b15*aW;
  aX=A[4];aY=A[5];aZ=A[6];aW=A[7]; out[4]=b0*aX+b4*aY+b8*aZ+b12*aW; out[5]=b1*aX+b5*aY+b9*aZ+b13*aW; out[6]=b2*aX+b6*aY+b10*aZ+b14*aW; out[7]=b3*aX+b7*aY+b11*aZ+b15*aW;
  aX=A[8];aY=A[9];aZ=A[10];aW=A[11]; out[8]=b0*aX+b4*aY+b8*aZ+b12*aW; out[9]=b1*aX+b5*aY+b9*aZ+b13*aW; out[10]=b2*aX+b6*aY+b10*aZ+b14*aW; out[11]=b3*aX+b7*aY+b11*aZ+b15*aW;
  aX=A[12];aY=A[13];aZ=A[14];aW=A[15]; out[12]=b0*aX+b4*aY+b8*aZ+b12*aW; out[13]=b1*aX+b5*aY+b9*aZ+b13*aW; out[14]=b2*aX+b6*aY+b10*aZ+b14*aW; out[15]=b3*aX+b7*aY+b11*aZ+b15*aW;
  return out;
}
function makePerspective(m: Float32Array, fov: number, asp: number, near: number, far: number) {
  const f=Math.tan(0.5*(Math.PI-fov)), r=near-far;
  m[0]=f/asp;m[1]=0;m[2]=0;m[3]=0;m[4]=0;m[5]=f;m[6]=0;m[7]=0;m[8]=0;m[9]=0;m[10]=far/r;m[11]=-1;m[12]=0;m[13]=0;m[14]=(near*far)/r;m[15]=0;
  return m;
}

// ─── GL build helpers ─────────────────────────────────────────────────────────
function buildShader(gl: any, type: number, src: string) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader: '+gl.getShaderInfoLog(s));
  return s;
}
function buildProg(gl: any, vs: any, fs: any, attrs: Record<string,number>) {
  const p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs);
  for (const n in attrs) gl.bindAttribLocation(p, attrs[n], n);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Link: '+gl.getProgramInfoLog(p));
  const ul: Record<string,any> = {};
  const cnt = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i=0; i<cnt; i++) { const u=gl.getActiveUniform(p,i); ul[u.name]=gl.getUniformLocation(p,u.name); }
  return { program: p, ul };
}
function buildTex(gl: any, unit: number, fmt: number, type: number, w: number, h: number, data: any, wrapS: number, wrapT: number, minF: number, magF: number, texFmt: any) {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0+unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, texFmt||fmt, w, h, 0, fmt, type, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minF);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magF);
  return t;
}
function buildFBO(gl: any, tex: any) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('FBO incomplete');
  return fb;
}

// ─── Context detection (Pete's exact chooseContext pattern) ───────────────────
function tryGL1(canvas: HTMLCanvasElement) {
  const attrs = [{antialias:true,alpha:true,premultipliedAlpha:false},{}];
  for (const a of attrs) {
    try { const c = (canvas.getContext('webgl',a)||canvas.getContext('experimental-webgl',a)) as any; if(c) return c; } catch {}
  }
  return null;
}
function tryGL2(canvas: HTMLCanvasElement) {
  const attrs = [{antialias:true,alpha:true,premultipliedAlpha:false},{}];
  for (const a of attrs) {
    try { const c = canvas.getContext('webgl2',a) as any; if(c) return c; } catch {}
  }
  return null;
}
function canFloat1(gl: any) {
  if (!gl || !gl.getExtension('OES_texture_float')) return false;
  gl.getExtension('OES_texture_float_linear');
  gl.getExtension('WEBGL_color_buffer_float');
  gl.getExtension('EXT_color_buffer_half_float');
  gl.getExtension('EXT_color_buffer_float');
  try {
    const t=gl.createTexture(); if(!t) return false;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,16,16,0,gl.RGBA,gl.FLOAT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    const fb=gl.createFramebuffer(); if(!fb) return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
    const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(fb); gl.deleteTexture(t);
    return ok;
  } catch { return false; }
}
function canHalf2(gl: any) {
  if (!gl) return false;
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return false;
  try {
    const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,16,16,0,gl.RGBA,gl.FLOAT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    const fb=gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
    const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(fb); gl.deleteTexture(t);
    return ok;
  } catch { return false; }
}
// Pete's exact chooseContext: probe on scratch canvas, then enable on ACTUAL canvas
function chooseContext(canvas: HTMLCanvasElement): { gl: any; texFmt: any } | null {
  const paths: Record<string, (c: HTMLCanvasElement) => any> = {
    gl1: (c) => { const g = tryGL1(c); return canFloat1(g) ? g : null; },
    gl2: (c) => { const g = tryGL2(c); return canHalf2(g) ? g : null; },
  };
  const order = ['gl1', 'gl2'];
  for (const key of order) {
    if (!paths[key](document.createElement('canvas'))) continue;
    const gl = paths[key](canvas);
    if (!gl) continue;
    return { gl, texFmt: key === 'gl2' ? gl.RGBA16F : null };
  }
  return null;
}

// ─── Arrow geometry (Pete's SeaOverlay) ──────────────────────────────────────
function bearingToWorld(deg: number): [number, number] {
  const a = deg*Math.PI/180;
  return [Math.sin(a), -Math.cos(a)];
}
function windColor(ms: number): [number,number,number] {
  if (ms<5)  return [0.55,0.85,1.0];
  if (ms<10) return [0.85,0.97,1.0];
  if (ms<14) return [1.0,0.78,0.35];
  return [1.0,0.42,0.35];
}
function pushArrow(out: number[], cx: number, cy: number, cz: number, bearing: number, length: number, width: number, thick: number, color: [number,number,number], alpha: number, bob: number, phase: number) {
  const f = bearingToWorld(bearing), r: [number,number] = [-f[1], f[0]];
  const hl=Math.min(length*0.42, width*2.2), hw=width*2.2, half=length/2;
  const ol: [number,number][] = [[-half,-width/2],[half-hl,-width/2],[half-hl,-hw/2],[half,0],[half-hl,hw/2],[half-hl,width/2],[-half,width/2]];
  const vert = (pt: [number,number], y: number, sh: number) => { out.push(cx+f[0]*pt[0]+r[0]*pt[1], cy+y, cz+f[1]*pt[0]+r[1]*pt[1], color[0]*sh,color[1]*sh,color[2]*sh, alpha, phase, bob, 0); };
  const tri = (a: number, b: number, c: number, y: number, sh: number) => { vert(ol[a],y,sh); vert(ol[b],y,sh); vert(ol[c],y,sh); };
  const top=thick/2, bot=-thick/2;
  [[0,1,5],[0,5,6],[2,3,4]].forEach(t => { tri(t[0],t[1],t[2],top,1.0); tri(t[0],t[2],t[1],bot,0.45); });
  for (let i=0; i<ol.length; i++) {
    const p=ol[i], q=ol[(i+1)%ol.length];
    vert(p,top,0.7);vert(q,top,0.7);vert(q,bot,0.7);vert(p,top,0.7);vert(q,bot,0.7);vert(p,bot,0.7);
  }
}

// ─── Main engine init ─────────────────────────────────────────────────────────
interface SeaState { windX:number; windY:number; size:number; choppiness:number; amplitude:number; }
interface OverlayState { windMs:number; windFromDeg:number; waveM?:number|null; }

function initOceanEngine(canvas: HTMLCanvasElement) {
  const result = chooseContext(canvas);
  if (!result) return null;
  const { gl, texFmt } = result;

  const dpr = Math.min(window.devicePixelRatio||1, 1.5);
  const resize = () => {
    canvas.width  = Math.round(canvas.clientWidth*dpr);
    canvas.height = Math.round(canvas.clientHeight*dpr);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  gl.clearColor(0,0,0,0);
  gl.enable(gl.DEPTH_TEST);

  // ── Build shaders ──
  const fsVS = buildShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VS);
  const hSubFS = buildShader(gl, gl.FRAGMENT_SHADER, '#define HORIZONTAL\n'+SUBTRANSFORM_FS);
  const vSubFS = buildShader(gl, gl.FRAGMENT_SHADER, SUBTRANSFORM_FS);
  const hSub  = buildProg(gl, fsVS, hSubFS, {a_position:0});
  const vSub  = buildProg(gl, fsVS, vSubFS, {a_position:0});
  const iSpec = buildProg(gl, fsVS, buildShader(gl,gl.FRAGMENT_SHADER,INITIAL_SPECTRUM_FS), {a_position:0});
  const phase = buildProg(gl, fsVS, buildShader(gl,gl.FRAGMENT_SHADER,PHASE_FS), {a_position:0});
  const spec  = buildProg(gl, fsVS, buildShader(gl,gl.FRAGMENT_SHADER,SPECTRUM_FS), {a_position:0});
  const nMap  = buildProg(gl, fsVS, buildShader(gl,gl.FRAGMENT_SHADER,NORMAL_MAP_FS), {a_position:0});
  const ocean = buildProg(gl, buildShader(gl,gl.VERTEX_SHADER,OCEAN_VS), buildShader(gl,gl.FRAGMENT_SHADER,OCEAN_FS), {a_position:0, a_coordinates:UV_ATTR});
  const ovProg = buildProg(gl, buildShader(gl,gl.VERTEX_SHADER,OVERLAY_VS), buildShader(gl,gl.FRAGMENT_SHADER,OVERLAY_FS), {a_position:0,a_color:1,a_extra:2});

  // Set constant uniforms
  gl.useProgram(hSub.program);  gl.uniform1f(hSub.ul.u_transformSize, RESOLUTION);
  gl.useProgram(vSub.program);  gl.uniform1f(vSub.ul.u_transformSize, RESOLUTION);
  gl.useProgram(iSpec.program); gl.uniform1f(iSpec.ul.u_resolution, RESOLUTION);
  gl.useProgram(phase.program); gl.uniform1f(phase.ul.u_resolution, RESOLUTION);
  gl.useProgram(spec.program);  gl.uniform1i(spec.ul.u_initialSpectrum, IS_UNIT); gl.uniform1f(spec.ul.u_resolution, RESOLUTION);
  gl.useProgram(nMap.program);  gl.uniform1i(nMap.ul.u_displacementMap, DM_UNIT); gl.uniform1f(nMap.ul.u_resolution, RESOLUTION);
  gl.useProgram(ocean.program);
  gl.uniform1f(ocean.ul.u_geometrySize, GEOM_SIZE);
  gl.uniform1i(ocean.ul.u_displacementMap, DM_UNIT);
  gl.uniform1i(ocean.ul.u_normalMap, NM_UNIT);
  gl.uniform3f(ocean.ul.u_oceanColor, OCEAN_COLOR[0], OCEAN_COLOR[1], OCEAN_COLOR[2]);
  gl.uniform3f(ocean.ul.u_skyColor,   SKY_COLOR[0],   SKY_COLOR[1],   SKY_COLOR[2]);
  gl.uniform3f(ocean.ul.u_sunDirection, SUN_DIR[0], SUN_DIR[1], SUN_DIR[2]);
  gl.uniform1f(ocean.ul.u_exposure, EXPOSURE);

  // ── Fullscreen quad ──
  const fsBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fsBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);

  // ── Ocean mesh (position + UV interleaved) ──
  const oceanData: number[] = [];
  for (let z=0; z<GEOM_RES; z++) for (let x=0; x<GEOM_RES; x++) {
    oceanData.push(x*GEOM_SIZE/(GEOM_RES-1)+GEOM_ORIGIN[0], 0, z*GEOM_SIZE/(GEOM_RES-1)+GEOM_ORIGIN[1], x/(GEOM_RES-1), z/(GEOM_RES-1));
  }
  const oceanIdx: number[] = [];
  for (let z=0; z<GEOM_RES-1; z++) for (let x=0; x<GEOM_RES-1; x++) {
    const tl=z*GEOM_RES+x; oceanIdx.push(tl, tl+GEOM_RES, tl+GEOM_RES+1, tl+GEOM_RES+1, tl+1, tl);
  }
  const oceanBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, oceanBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(oceanData), gl.STATIC_DRAW);
  gl.vertexAttribPointer(UV_ATTR, 2, gl.FLOAT, false, 5*SOF, 3*SOF);
  const oceanIdxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oceanIdxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(oceanIdx), gl.STATIC_DRAW);
  const oceanIdxLen = oceanIdx.length;

  // ── FFT simulation textures ──
  const T = gl.FLOAT, R = gl.REPEAT, CE = gl.CLAMP_TO_EDGE, NR = gl.NEAREST, LN = gl.LINEAR;
  const iSpecTex  = buildTex(gl, IS_UNIT,  gl.RGBA, T, RESOLUTION, RESOLUTION, null, R,  R,  NR, NR, texFmt);
  const pongPhTex = buildTex(gl, POP_UNIT, gl.RGBA, T, RESOLUTION, RESOLUTION, null, CE, CE, NR, NR, texFmt);
  const specTex   = buildTex(gl, SP_UNIT,  gl.RGBA, T, RESOLUTION, RESOLUTION, null, CE, CE, NR, NR, texFmt);
  const dispTex   = buildTex(gl, DM_UNIT,  gl.RGBA, T, RESOLUTION, RESOLUTION, null, CE, CE, LN, LN, texFmt);
  const normTex   = buildTex(gl, NM_UNIT,  gl.RGBA, T, RESOLUTION, RESOLUTION, null, CE, CE, LN, LN, texFmt);
  const pingTTex  = buildTex(gl, PT_UNIT,  gl.RGBA, T, RESOLUTION, RESOLUTION, null, CE, CE, NR, NR, texFmt);
  const pongTTex  = buildTex(gl, POT_UNIT, gl.RGBA, T, RESOLUTION, RESOLUTION, null, CE, CE, NR, NR, texFmt);
  const phaseArr = new Float32Array(RESOLUTION*RESOLUTION*4);
  for (let i=0; i<RESOLUTION*RESOLUTION; i++) phaseArr[i*4] = Math.random()*2*Math.PI;
  const pingPhTex = buildTex(gl, PP_UNIT, gl.RGBA, T, RESOLUTION, RESOLUTION, phaseArr, CE, CE, NR, NR, texFmt);

  const iSpecFBO = buildFBO(gl, iSpecTex);
  const pingPhFBO = buildFBO(gl, pingPhTex);
  const pongPhFBO = buildFBO(gl, pongPhTex);
  const specFBO   = buildFBO(gl, specTex);
  const dispFBO   = buildFBO(gl, dispTex);
  const normFBO   = buildFBO(gl, normTex);
  const pingTFBO  = buildFBO(gl, pingTTex);
  const pongTFBO  = buildFBO(gl, pongTTex);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // ── Overlay buffers ──
  const streakData: number[] = [];
  for (let i=0; i<STREAK_CNT; i++) {
    const sx=ORBIT_PT[0]+(Math.random()-.5)*1400, sz=ORBIT_PT[2]+(Math.random()-.5)*1100-150;
    const sy=95+Math.random()*140, soff=Math.random()*STREAK_RANGE;
    [[0,-1],[1,-1],[1,1],[0,-1],[1,1],[0,1]].forEach(([lp,bp]) => {
      streakData.push(sx,sy,sz, 0.92,0.98,1.0,0.55, soff, bp*1.0, lp*1.0);
    });
  }
  const streakBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, streakBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(streakData), gl.STATIC_DRAW);
  const streakCount = streakData.length/10;
  const arrowBuf = gl.createBuffer();
  let arrowCount = 0;
  let flowDir: [number,number] = [1,0]; let flowSpeed = 200;

  // ── Camera ──
  let azimuth=INIT_AZ, elevation=INIT_EL, camChanged=true;
  const camPos    = new Float32Array(3);
  const viewMat   = makeId(new Float32Array(16));
  const projMat   = makePerspective(new Float32Array(16), FOV, canvas.clientWidth/Math.max(canvas.clientHeight,1), NEAR, FAR);
  const orbitT    = makeId(new Float32Array(16));
  const xRot      = new Float32Array(16);
  const yRot      = new Float32Array(16);
  const distT     = makeId(new Float32Array(16));
  function getViewMatrix() {
    if (camChanged) {
      makeId(viewMat);
      makeXRot(xRot, elevation); makeYRot(yRot, azimuth);
      distT[14] = -CAM_DIST;
      orbitT[12]=-ORBIT_PT[0]; orbitT[13]=-ORBIT_PT[1]; orbitT[14]=-ORBIT_PT[2];
      premul(viewMat,viewMat,orbitT); premul(viewMat,viewMat,yRot); premul(viewMat,viewMat,xRot); premul(viewMat,viewMat,distT);
      camPos[0]=CAM_DIST*Math.sin(Math.PI/2-elevation)*Math.sin(-azimuth)+ORBIT_PT[0];
      camPos[1]=CAM_DIST*Math.cos(Math.PI/2-elevation)+ORBIT_PT[1];
      camPos[2]=CAM_DIST*Math.sin(Math.PI/2-elevation)*Math.cos(-azimuth)+ORBIT_PT[2];
      camChanged=false;
    }
    return viewMat;
  }

  // Orbit on drag
  let orbiting=false, lastX=0, lastY=0;
  canvas.addEventListener('pointerdown', e => { orbiting=true; lastX=e.clientX; lastY=e.clientY; (canvas as any).setPointerCapture?.(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!orbiting) return;
    azimuth   = clamp(azimuth  +(e.clientX-lastX)/canvas.clientWidth,  MIN_AZ, MAX_AZ);
    elevation = clamp(elevation+(e.clientY-lastY)/canvas.clientHeight, MIN_EL, MAX_EL);
    lastX=e.clientX; lastY=e.clientY; camChanged=true;
  });
  canvas.addEventListener('pointerup',     () => { orbiting=false; });
  canvas.addEventListener('pointercancel', () => { orbiting=false; });

  // ── Sea state ──
  let simState: SeaState = { windX:10, windY:10, size:SEA_PATCH, choppiness:1.5, amplitude:1 };
  let seaChanged = true;
  let pingPhase  = true;

  gl.enableVertexAttribArray(0);

  // ── Render loop ──
  let destroyed=false, lastT=performance.now(), animId=0;
  function render(now: number) {
    if (destroyed) return;
    animId = requestAnimationFrame(render);
    const dt = Math.min((now-lastT)/1000, 0.1); lastT=now;
    const t  = now/1000;

    // ── FFT simulation passes ──
    gl.viewport(0,0,RESOLUTION,RESOLUTION);
    gl.disable(gl.DEPTH_TEST);
    gl.bindBuffer(gl.ARRAY_BUFFER, fsBuf);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    if (seaChanged) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, iSpecFBO);
      gl.useProgram(iSpec.program);
      gl.uniform2f(iSpec.ul.u_wind, simState.windX, simState.windY);
      gl.uniform1f(iSpec.ul.u_size, simState.size);
      gl.uniform1f(iSpec.ul.u_amplitude, simState.amplitude);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.useProgram(phase.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pingPhase ? pongPhFBO : pingPhFBO);
    gl.uniform1i(phase.ul.u_phases, pingPhase ? PP_UNIT : POP_UNIT);
    pingPhase = !pingPhase;
    gl.uniform1f(phase.ul.u_deltaTime, dt);
    gl.uniform1f(phase.ul.u_size, simState.size);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(spec.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, specFBO);
    gl.uniform1i(spec.ul.u_phases, pingPhase ? PP_UNIT : POP_UNIT);
    gl.uniform1f(spec.ul.u_size, simState.size);
    gl.uniform1f(spec.ul.u_choppiness, simState.choppiness);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const iters = log2n(RESOLUTION)*2;
    let subProg = hSub;
    gl.useProgram(hSub.program);
    for (let i=0; i<iters; i++) {
      if (i === iters/2) { subProg=vSub; gl.useProgram(vSub.program); }
      let srcUnit: number, dstFBO: any;
      if      (i===0)         { dstFBO=pingTFBO;  srcUnit=SP_UNIT; }
      else if (i===iters-1)   { dstFBO=dispFBO;   srcUnit=(iters%2===0)?PT_UNIT:POT_UNIT; }
      else if (i%2===1)       { dstFBO=pongTFBO;  srcUnit=PT_UNIT; }
      else                    { dstFBO=pingTFBO;  srcUnit=POT_UNIT; }
      gl.bindFramebuffer(gl.FRAMEBUFFER, dstFBO);
      gl.uniform1i(subProg.ul.u_input, srcUnit);
      gl.uniform1f(subProg.ul.u_subtransformSize, Math.pow(2,(i%(iters/2))+1));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, normFBO);
    gl.useProgram(nMap.program);
    if (seaChanged) gl.uniform1f(nMap.ul.u_size, simState.size);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    seaChanged = false;

    // ── Ocean render ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    makePerspective(projMat, FOV, canvas.clientWidth/Math.max(canvas.clientHeight,1), NEAR, FAR);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enableVertexAttribArray(UV_ATTR);
    gl.bindBuffer(gl.ARRAY_BUFFER, oceanBuf);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5*SOF, 0);
    gl.vertexAttribPointer(UV_ATTR, 2, gl.FLOAT, false, 5*SOF, 3*SOF);
    gl.useProgram(ocean.program);
    if (seaChanged) gl.uniform1f(ocean.ul.u_size, simState.size);
    gl.uniformMatrix4fv(ocean.ul.u_projectionMatrix, false, projMat);
    gl.uniformMatrix4fv(ocean.ul.u_viewMatrix, false, getViewMatrix());
    gl.uniform3fv(ocean.ul.u_cameraPosition, camPos);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oceanIdxBuf);
    gl.drawElements(gl.TRIANGLES, oceanIdxLen, gl.UNSIGNED_SHORT, 0);
    gl.disableVertexAttribArray(UV_ATTR);

    // ── Overlay ──
    if (arrowCount > 0) {
      gl.useProgram(ovProg.program);
      const ou = ovProg.ul;
      gl.uniformMatrix4fv(ou.u_projectionMatrix, false, projMat);
      gl.uniformMatrix4fv(ou.u_viewMatrix, false, viewMat);
      gl.uniform1f(ou.u_time, t);
      gl.uniform2f(ou.u_flowDir, flowDir[0], flowDir[1]);
      gl.uniform1f(ou.u_flowSpeed, flowSpeed);
      gl.uniform1f(ou.u_range, STREAK_RANGE);
      gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2);
      gl.depthMask(false);
      const bytes=10*SOF;
      function bindOv(buf: any) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(0,3,gl.FLOAT,false,bytes,0);
        gl.vertexAttribPointer(1,4,gl.FLOAT,false,bytes,3*SOF);
        gl.vertexAttribPointer(2,3,gl.FLOAT,false,bytes,7*SOF);
      }
      gl.uniform1f(ou.u_streaks, 1); bindOv(streakBuf); gl.drawArrays(gl.TRIANGLES, 0, streakCount);
      gl.uniform1f(ou.u_streaks, 0); bindOv(arrowBuf);  gl.drawArrays(gl.TRIANGLES, 0, arrowCount);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
      gl.depthMask(true);
    }
    gl.disableVertexAttribArray(0);
    gl.disable(gl.BLEND);
  }
  animId = requestAnimationFrame(render);

  return {
    setSea(sea: SeaState)    { simState=sea; seaChanged=true; },
    setOverlay(state: OverlayState) {
      const windTo = (state.windFromDeg+180)%360;
      const wc = windColor(state.windMs);
      const len = 70+Math.min(state.windMs,25)*5;
      const out: number[] = [];
      for (let gx=-2; gx<=2; gx++) for (let gz=-2; gz<=1; gz++) {
        pushArrow(out, ORBIT_PT[0]+gx*280, 150+(gx+gz)*6, ORBIT_PT[2]+gz*280, windTo, len, 10, 6, wc, 0.9, 4+state.windMs*0.4, gx*1.7+gz*2.3);
      }
      if (state.waveM) pushArrow(out, ORBIT_PT[0]+60, 78, ORBIT_PT[2]-80, (state.windFromDeg+180)%360, 420, 26, 4, [0.6,1.0,0.85], 0.45, 3, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, arrowBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.DYNAMIC_DRAW);
      arrowCount = out.length/10;
      flowDir  = bearingToWorld(windTo);
      flowSpeed = 20+state.windMs*9;
    },
    destroy() {
      destroyed=true;
      cancelAnimationFrame(animId);
      ro.disconnect();
    },
  };
}

// ─── Trailer suitability ──────────────────────────────────────────────────────
const TRAILERS = [
  { id:'roller',     name:'Roller Trailer',       calm:0.6,  rough:1.25, wMax:19 },
  { id:'bunk',       name:'Bunk Trailer',          calm:0.5,  rough:1.0,  wMax:19 },
  { id:'stainless',  name:'Stainless Steel',       calm:0.6,  rough:1.25, wMax:19 },
  { id:'launcher',   name:'Launching Trolley',     calm:0.3,  rough:0.75, wMax:13 },
  { id:'inflatable', name:'RIB / Inflatable',      calm:0.4,  rough:0.9,  wMax:13 },
  { id:'pwc',        name:'PWC / Jet Ski',         calm:0.5,  rough:1.0,  wMax:13 },
  { id:'fixedkeel',  name:'Fixed Keel Launcher',   calm:0.3,  rough:0.75, wMax:19 },
];
function trailerVerdict(t: typeof TRAILERS[0], windMs: number, waveM?: number|null) {
  if (!waveM) return { v:'mg', r:'No wave data' };
  if (windMs > t.wMax) return { v:'no', r:`Wind >${t.wMax} m/s` };
  if (waveM <= t.calm)  return { v:'go', r:'Good — calm sea' };
  if (waveM <= t.rough) return { v:'mg', r:'Manageable' };
  return { v:'no', r:'Sea too rough' };
}

// ─── Component ────────────────────────────────────────────────────────────────
export const OceanLaunchPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof initOceanEngine>>(null);
  const { wind, error } = useWind(DEFAULT_PLACE);
  const [trailerGo,    setTrailerGo]    = useState<number|null>(null);
  const [trailerCards, setTrailerCards] = useState<{ name:string; v:string; r:string }[]>([]);
  const [showCards,    setShowCards]    = useState(false);
  const [glFailed,     setGlFailed]     = useState(false);
  const [liveLabel,    setLiveLabel]    = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      engineRef.current = initOceanEngine(canvas);
      if (!engineRef.current) setGlFailed(true);
    } catch (e) {
      console.error('Ocean engine failed:', e);
      setGlFailed(true);
    }
    return () => { engineRef.current?.destroy(); engineRef.current = null; };
  }, []);

  useEffect(() => {
    if (!wind || !engineRef.current) return;
    const ms   = wind.windMph * 0.44704;
    const waveM = wind.waveM ?? null;
    const sea = seaParams(ms, wind.dirDeg, waveM, wind.dirDeg);
    engineRef.current.setSea(sea);
    engineRef.current.setOverlay({ windMs: ms, windFromDeg: wind.dirDeg, waveM });
    const cards = TRAILERS.map(t => { const r=trailerVerdict(t,ms,waveM); return { name:t.name, ...r }; });
    setTrailerCards(cards);
    setTrailerGo(cards.filter(c => c.v==='go').length);
    const dirs=['N','NE','E','SE','S','SW','W','NW'];
    const dir = dirs[Math.round(wind.dirDeg/45)%8];
    setLiveLabel(`${ms.toFixed(1)} m/s ${dir}${waveM ? ` · ${waveM.toFixed(1)}m waves` : ''}`);
  }, [wind]);

  if (glFailed) return null;

  const goCount  = trailerGo ?? 0;
  const totalCount = TRAILERS.length;
  const goColor  = goCount === 0 ? '#ef4444' : goCount < 4 ? '#f97316' : '#d8ae5c';

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '460px', background: 'linear-gradient(180deg, #020c18 0%, #071522 100%)' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top-left: live conditions pill */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none z-10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span
          className="text-xs font-mono text-white/60"
          style={{ background:'rgba(2,12,24,.65)', padding:'4px 10px', borderRadius:'20px', border:'1px solid rgba(255,255,255,.1)', backdropFilter:'blur(8px)' }}
        >
          {error ? 'Live data unavailable' : liveLabel || 'Syncing…'}
        </span>
      </div>

      {/* Top-right: location */}
      <div
        className="absolute top-4 right-4 text-xs text-white/40 font-mono pointer-events-none"
        style={{ background:'rgba(2,12,24,.5)', padding:'4px 10px', borderRadius:'20px', border:'1px solid rgba(255,255,255,.08)', backdropFilter:'blur(8px)' }}
      >
        {DEFAULT_PLACE.name}
      </div>

      {/* Bottom: trailer suitability bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{ background:'rgba(2,10,20,.82)', borderTop:'1px solid rgba(180,210,255,.1)', backdropFilter:'blur(14px)', padding:'12px 20px' }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Launch suitability · Lepe Slipway</div>
            {trailerGo !== null ? (
              <div className="text-sm font-semibold" style={{ color: goColor }}>
                {goCount} of {totalCount} trailer types can launch now
              </div>
            ) : (
              <div className="text-sm text-white/40">Loading conditions…</div>
            )}
          </div>
          {trailerGo !== null && (
            <button
              className="ml-auto text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all"
              style={{ background:'rgba(216,174,92,.18)', border:'1px solid rgba(216,174,92,.35)', color:'#d8ae5c' }}
              onClick={() => setShowCards(c => !c)}
            >
              {showCards ? 'Hide' : 'Details'}
            </button>
          )}
        </div>

        {showCards && (
          <div className="flex flex-wrap gap-2 mt-3">
            {trailerCards.map(c => (
              <div
                key={c.name}
                className="text-xs rounded-lg px-3 py-2 min-w-[130px]"
                style={{
                  background: c.v==='go' ? 'rgba(34,197,94,.12)' : c.v==='mg' ? 'rgba(234,179,8,.1)' : 'rgba(239,68,68,.08)',
                  border: `1px solid ${c.v==='go' ? 'rgba(34,197,94,.35)' : c.v==='mg' ? 'rgba(234,179,8,.3)' : 'rgba(239,68,68,.2)'}`,
                  opacity: c.v==='no' ? 0.55 : 1,
                }}
              >
                <div className="font-semibold text-white/90">{c.name}</div>
                <div className="text-white/50 mt-0.5">{c.r}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-14 right-4 text-[10px] text-white/20 pointer-events-none select-none">
        drag to orbit
      </div>
    </section>
  );
};
