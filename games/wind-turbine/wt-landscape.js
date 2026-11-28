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
const weatherUniforms = 'uniform float uTime,uCloud,uStorm,uFoam,uWave,uInspect,uDark,uEyeOffset; uniform vec3 uHaze;';
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
    vec3 clear=mix(vec3(.36,.57,.70),vec3(.043,.081,.13),uDark);
    vec3 overcast=mix(vec3(.25,.31,.36),vec3(.044,.059,.08),uDark);
    vec3 top=mix(clear,overcast,uCloud); top*=1.-.60*uStorm;
    vec3 color=mix(uHaze,top,smoothstep(-.03,.67,alt));
    vec2 p=n.xz/(.36+alt)*3.+vec2(uTime*.019,0.);
    float clouds=coastNoise(p)*.68+coastNoise(p*2.15)*.32;
    float veil=smoothstep(.58-.23*uCloud,.78-.16*uCloud,clouds)*smoothstep(.00,.19,alt);
    color=mix(color,mix(uHaze*1.23,top*.72,uStorm),veil*(.40+.24*uCloud));
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
    vec3 color=mix(vec3(.095,.23,.24),vec3(.040,.084,.100),max(uDark*.82,uStorm*.84));
    color*=.78+.32*dot(norm,normalize(vec3(-.35,.8,.5)));
    float crest=smoothstep(.52,.86,w.x+ripple)*uFoam;
    #ifndef COARSE_SEA
      // Wind draws fine spray from the lee side of the highest crests.
      float streak=.5+.5*sin(vSea.x*3.3+vSea.z*.61-uTime*.8);
      float spray=smoothstep(.36,.70,w.x)*smoothstep(.10,.28,-w.z);
      crest+=uStorm*.22*spray*streak;
    #endif
    color=mix(color,uHaze*1.32,crest);
    float dist=length(vSea-cameraPosition);
    color=mix(color,uHaze,max(smoothstep(44.,124.,dist-uEyeOffset),uInspect*.73));
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
  const landMat = new T.MeshStandardMaterial({ color: 0x829465, roughness: .96 });
  landMat.onBeforeCompile = shader => {
    shader.uniforms.uInspect = uniforms.uInspect;
    shader.vertexShader = 'varying vec2 vGrass;\n' + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vGrass=position.xz;');
    shader.fragmentShader = 'varying vec2 vGrass; uniform float uInspect;\n' + noise + '\n' + shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n diffuseColor.rgb *= .92 + (.13*coastNoise(vGrass*.24)+.055*coastNoise(vGrass*2.3))*(1.-uInspect);');
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
  const lightHaze = new T.Color(0xc6d2d4), stormHaze = new T.Color(0x767f8a);
  const nightHaze = new T.Color(0x566572), nightStorm = new T.Color(0x343e4e);
  const clearGrass = new T.Color(0x88996e), wetGrass = new T.Color(0x62745c);
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
    haze.lerpColors(dark ? nightHaze : lightHaze, dark ? nightStorm : stormHaze, .35 * w.cloud + .65 * w.storm);
    scene.background.copy(haze); scene.fog.color.copy(haze); uniforms.uHaze.value.copy(haze);
    // Pull the start of atmospheric haze back with a distant portrait camera.
    const offset = Math.max(0, eyeDistance - 40);
    uniforms.uEyeOffset.value = offset;
    scene.fog.near = offset + 44 - 18 * focus; scene.fog.far = offset + 136 - 42 * focus - 14 * w.storm;
    grass.lerpColors(clearGrass, wetGrass, .45 * w.cloud + .55 * w.storm);
    landMat.color.copy(grass).lerp(haze, .46 * focus).multiplyScalar(dark ? .62 : 1);
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
