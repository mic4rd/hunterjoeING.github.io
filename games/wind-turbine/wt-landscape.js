import * as T from 'three';
import { LAND_SIZE, GRID, terrainHeight, SEA_Y } from './wt-terrain.js?v=0.2.0';
import { weatherAt, settle } from './wt-weather.js?v=0.2.0';

const noise = `
  float coastHash(vec2 p) { return fract(sin(mod(dot(p,vec2(127.1,311.7)), 6.2831853))*4375.5453); }
  float coastNoise(vec2 p) {
    vec2 f=fract(p); f=f*f*(3.0-2.0*f); vec2 i=floor(p);
    return mix(mix(coastHash(i),coastHash(i+vec2(1,0)),f.x),
               mix(coastHash(i+vec2(0,1)),coastHash(i+vec2(1)),f.x),f.y);
  }`;
const output = `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;
const weatherUniforms = 'uniform float uTime,uCloud,uStorm,uFoam,uWave,uInspect,uDark,uEyeOffset; uniform vec3 uHaze, uSky; const vec3 sunDir=vec3(-.924,.199,-.326);';
const skyVertex = `
  varying vec3 dir;
  void main(){
    dir=position;
    vec4 clip=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);
    gl_Position=clip.xyww;
  }`;
const skyFragment = weatherUniforms + noise + `
  varying vec3 dir;
  void main(){
    vec3 n=normalize(dir);
    float alt=max(0.,n.y);
    // Below the geometric horizon the distant sea fades into the same mist
    // as the far mesh. A narrow atmospheric band separates water from sky.
    vec3 horizon=uHaze*mix(.77,1.,smoothstep(-.015,.005,n.y));
    vec3 color=mix(horizon,uSky,smoothstep(.00,.37,alt));
    vec2 p=n.xz/(.26+alt)*3.+vec2(uTime*.019,0.);
    float clouds=coastNoise(p)*.65+coastNoise(p*2.15)*.35;
    float veil=smoothstep(.61-.23*uCloud,.83-.17*uCloud,clouds)*smoothstep(.01,.14,alt);
    color=mix(color,mix(uHaze*1.22,uSky*.78,uStorm),veil*(.47+.32*uCloud));
    float sun=max(dot(n,sunDir),0.);
    float glow=(.34*pow(sun,38.)+.50*pow(sun,770.))*(1.-uCloud)*(1.-.65*uDark);
    color+=vec3(1.,.83,.56)*glow*smoothstep(.01,.09,alt);
    gl_FragColor=vec4(mix(color,uHaze,.68*uInspect),1.);
  ` + output + '}';
const waveFns = `
  vec3 waves(vec2 p,float t) {
    vec3 k=vec3(.37,.66,.97);
    vec3 a=vec3(dot(p,vec2(.23,.29)),dot(p,vec2(-.51,.42)),dot(p,vec2(.90,.37))) - t*k;
    vec3 s=sin(a)*vec3(.62,.28,.10), c=cos(a)*vec3(.62,.28,.10);
    return vec3(s.x+s.y+s.z,dot(c,vec3(.23,-.51,.90)),dot(c,vec3(.29,.42,.37)));
  }`;
const seaVertex = weatherUniforms + waveFns + `
  varying vec3 vSea;
  void main(){
    vSea=(modelMatrix*vec4(position,1.)).xyz;
    vSea.y += uWave*waves(vSea.xz,uTime).x;
    gl_Position=projectionMatrix*viewMatrix*vec4(vSea,1.);
  }`;
const seaFragment = weatherUniforms + waveFns + `
  varying vec3 vSea;
  void main(){
    vec3 w=waves(vSea.xz,uTime);
    float ripple=0.;
    #ifndef COARSE_SEA
      ripple=.07*sin(dot(vSea.xz,vec2(1.6,.9))-uTime*1.25);
    #endif
    vec3 norm=normalize(vec3(-uWave*(w.y+ripple),1.,-uWave*w.z));
    vec3 color=mix(vec3(.055,.174,.235),vec3(.099,.145,.16),uCloud);
    color=mix(color,vec3(.029,.057,.074),max(uDark*.79,uStorm*.87));
    color*=.78+.32*dot(norm,normalize(vec3(-.35,.8,.5)));
    vec3 eye=normalize(cameraPosition-vSea);
    vec3 glitterNormal=normalize(norm+vec3(.024*sin(vSea.x*1.4+vSea.z+uTime),0.,.035*ripple));
    float glint=pow(max(dot(glitterNormal,normalize(eye+sunDir)),0.),110.);
    color+=vec3(.60,.60,.47)*glint*(1.-uCloud)*(1.-.70*uDark);
    float crest=smoothstep(.52,.86,w.x+ripple)*uFoam;
    #ifndef COARSE_SEA
      // Wind draws fine spray from the lee side of the highest crests.
      float streak=.5+.5*sin(vSea.x*3.3+vSea.z*.61-uTime*.8);
      float spray=smoothstep(.36,.70,w.x)*smoothstep(.10,.28,-w.z);
      crest+=uStorm*.22*spray*streak;
    #endif
    color=mix(color,uHaze*1.32,crest);
    float dist=length(vSea-cameraPosition);
    color=mix(color,uHaze*mix(.77,1.,uInspect*.6),max(smoothstep(50.,145.,dist-uEyeOffset),uInspect*.73));
    gl_FragColor=vec4(color,1.);
  ` + output + '}';

export function createTerrainGeometry(reduced) {
  const segments = LAND_SIZE / GRID * (reduced ? 1 : 2);
  const geo = new T.PlaneGeometry(LAND_SIZE, LAND_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, terrainHeight(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals();
  return geo;
}

export function createLandscape(scene, lights, reduced) {
  const group = new T.Group();
  group.name = 'Küstenlandschaft';
  const uniforms = {};
  for (const key of ['uTime', 'uCloud', 'uStorm', 'uFoam', 'uWave', 'uInspect', 'uDark', 'uEyeOffset']) uniforms[key] = { value: 0 };
  uniforms.uHaze = { value: new T.Color() };
  uniforms.uSky = { value: new T.Color() };
  const landMat = new T.MeshStandardMaterial({ color: 0x477244, roughness: 1, envMapIntensity: .26 });
  landMat.onBeforeCompile = shader => {
    shader.uniforms.uInspect = uniforms.uInspect;
    shader.vertexShader = 'varying vec3 vGrass;\n' + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vGrass=position;');
    shader.fragmentShader = 'varying vec3 vGrass; uniform float uInspect;\n' + noise + '\n' + shader.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>
       float meadowTone=coastNoise(vGrass.xz*.19)+.32*coastNoise(vGrass.xz*1.85)-.66;
       diffuseColor.rgb*=1.+vec3(.31,.39,.20)*meadowTone*(1.-uInspect*.75);
       float sand=1.-smoothstep(${(SEA_Y + .15).toFixed(2)},${(SEA_Y + 1.05).toFixed(2)},vGrass.y+.18*meadowTone);
       diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.22,.20,.132),sand*.90);`);
  };
  const land = new T.Mesh(createTerrainGeometry(reduced), landMat);
  land.name = 'Grashügel'; land.receiveShadow = true;
  const sky = new T.Mesh(new T.SphereGeometry(1, 24, 12), new T.ShaderMaterial({
    uniforms, vertexShader: skyVertex, fragmentShader: skyFragment, side: T.BackSide, depthWrite: false
  }));
  sky.frustumCulled = false; sky.renderOrder = -100;
  const seaMat = new T.ShaderMaterial({
    uniforms, vertexShader: seaVertex, fragmentShader: seaFragment,
    defines: reduced ? { COARSE_SEA: 1 } : {}
  });
  const waterGeometry = low => new T.PlaneGeometry(320, 320, low ? 56 : 128, low ? 56 : 128).rotateX(-Math.PI / 2);
  const sea = new T.Mesh(waterGeometry(reduced), seaMat);
  sea.position.y = SEA_Y; sea.renderOrder = -50; sea.userData.aoOverlay = true;
  group.add(land, sea, sky); scene.add(group);
  const haze = new T.Color(), grass = new T.Color(), warm = new T.Color(0xffe9c7), cold = new T.Color(0xb7cce1);
  // Linear-light interpolation between three sRGB swatches for each theme.
  const swatches = (...hex) => hex.map(value => new T.Color(value));
  const day = { sky: swatches(0x5395d2, 0x788592, 0x394957), haze: swatches(0xb4d9ec, 0xacb7ba, 0x78828c) };
  const night = { sky: swatches(0x426fa2, 0x4e5969, 0x283246), haze: swatches(0x7295af, 0x656e79, 0x394658) };
  const clearGrass = new T.Color(0x477244), wetGrass = new T.Color(0x395c41);
  scene.fog = new T.Fog(0xb6c4ca, 45, 130);
  scene.background = new T.Color();
  let smoothedWind = 10.5, focus = 0, dark = false;
  const w = {};
  function update(dt, speed, inspect, eyeDistance = 0) {
    smoothedWind = settle(smoothedWind, speed, dt); focus = settle(focus, inspect ? 1 : 0, dt);
    weatherAt(smoothedWind, w);
    uniforms.uTime.value += Math.min(dt, .1) * (.65 + .45 * w.cloud + .75 * w.storm);
    uniforms.uCloud.value = w.cloud; uniforms.uStorm.value = w.storm; uniforms.uFoam.value = w.foam;
    uniforms.uWave.value = w.wave * (1 - .70 * focus); uniforms.uInspect.value = focus; uniforms.uDark.value = +dark;
    const palette = dark ? night : day;
    haze.lerpColors(palette.haze[0], palette.haze[1], w.cloud).lerp(palette.haze[2], w.storm);
    uniforms.uSky.value.lerpColors(palette.sky[0], palette.sky[1], w.cloud).lerp(palette.sky[2], w.storm);
    scene.background.copy(haze); scene.fog.color.copy(haze); uniforms.uHaze.value.copy(haze);
    // Pull the start of atmospheric haze back with a distant portrait camera.
    const offset = Math.max(0, eyeDistance - 40);
    uniforms.uEyeOffset.value = offset;
    scene.fog.near = offset + 44 - 18 * focus; scene.fog.far = offset + 136 - 42 * focus - 14 * w.storm;
    grass.lerpColors(clearGrass, wetGrass, .45 * w.cloud + .55 * w.storm);
    landMat.color.copy(grass).lerp(haze, .24 * focus).multiplyScalar(dark ? .62 : 1);
    lights.key.color.lerpColors(warm, cold, .55 * w.cloud + .45 * w.storm);
    lights.key.intensity = (dark ? 2 : 2.2) * (w.light + (1 - w.light) * focus * .85);
    lights.fill.intensity = (dark ? .86 : 1.18) * (.91 + .09 * w.light);
  }
  function setReduced(low) {
    if (low === reduced) return;
    reduced = low; land.geometry.dispose(); sea.geometry.dispose();
    land.geometry = createTerrainGeometry(low); sea.geometry = waterGeometry(low);
    seaMat.defines = low ? { COARSE_SEA: 1 } : {}; seaMat.needsUpdate = true;
  }
  return { group, update, setReduced, setTheme(isDark) { dark = isDark; } };
}
