// Resolve the lattice accumulation, bloom, and grade to screen.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const FULL_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export class Post {
  constructor(renderer, W, H, { bloom = .6, radius = .5, thresh = .82 } = {}) {
    this.resolve = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, tAcc: { value: null }, tPaint: { value: null }, uHasPaint: { value: 0 }, tLed: { value: null }, uHasLed: { value: 0 }, uPK: { value: 5 }, tType: { value: null }, uType: { value: 0 }, uPaint: { value: 0 }, uK: { value: 4 }, uExposure: { value: 1 }, uFade: { value: 1 } },
      vertexShader: FULL_VS,
      fragmentShader: `uniform sampler2D tAcc, tType, tPaint, tLed; uniform float uPaint, uK, uExposure, uType, uFade, uHasPaint, uPK, uHasLed; varying vec2 vUv;
        vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
        void main(){ vec4 a = texture2D(tAcc, vUv);
          vec3 light = a.rgb;
          vec3 paint = a.rgb / max(a.a, 1e-4) * (1. - exp(-a.a * uK));
          vec3 c = mix(light, paint, uPaint);
          if (uHasPaint > .5) { vec4 p = texture2D(tPaint, vUv); vec3 pc = p.rgb / max(p.a, 1e-4) * (1. - exp(-p.a * uPK));
            float cov = 1. - exp(-a.a * 1.2); c = pc * (1. - cov * .92) + c; }
          c *= uExposure * uFade;
          if (uHasLed > .5) { vec4 ld = texture2D(tLed, vUv); c = c * (1. - min(1., ld.a) * .6) + ld.rgb; }
          if (uType > .5) { vec4 ty = texture2D(tType, vUv); c = c * (1. - ty.a * .85) + toLin(ty.rgb) * ty.a * .92; }
          gl_FragColor = vec4(c, 1.); }`,
    });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), bloom, radius, thresh);
    this.grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: .6 }, uGrain: { value: .025 }, uRes: { value: new THREE.Vector2(W, H) },
        uLift: { value: new THREE.Color(0x020308) }, uWarm: { value: .15 } },
      vertexShader: FULL_VS,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain, uWarm; uniform vec2 uRes; uniform vec3 uLift; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
          float l = dot(c, vec3(.299,.587,.114));
          c = c / (1. + c * .12) * 1.12;                                            // soft shoulder
          l = dot(c, vec3(.299,.587,.114));
          c = max(vec3(0.), mix(vec3(l), c, 1.08));
          c = pow(c, vec3(1.06));                                                  // a touch more contrast
          c += uLift * (1. - smoothstep(0., .08, l));
          c = mix(c, c * vec3(1.06, 1., .9), uWarm * smoothstep(.3, 1., l));      // warm highlights
          c = mix(c, c * vec3(.92, .96, 1.1), uWarm * (1. - smoothstep(0., .3, l))); // cool shadows
          vec2 d = vUv - .5; c *= 1. - dot(d, d) * uVig;
          c += (h(vUv * uRes + fract(uTime * 7.13) * 91.) - .5) * uGrain;
          gl_FragColor = vec4(c, 1.); }`,
    });
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(this.resolve); this.composer.addPass(this.bloom); this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
  }
  render(accTex, t, typeTex = null, paintTex = null) {
    this.resolve.uniforms.tAcc.value = accTex;
    const ledTex = this.led ? this.led.render(t) : null; this.resolve.uniforms.tLed.value = ledTex; this.resolve.uniforms.uHasLed.value = ledTex ? 1 : 0;
    this.resolve.uniforms.tPaint.value = paintTex; this.resolve.uniforms.uHasPaint.value = paintTex ? 1 : 0;
    this.resolve.uniforms.tType.value = typeTex; this.resolve.uniforms.uType.value = typeTex ? 1 : 0; this.grade.uniforms.uTime.value = t;
    this.composer.render();
  }
}
