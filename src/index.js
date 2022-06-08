import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const PostProcShader = {
    uniforms: {
        'tDiffuse': {
            value: null
        },
        'resolution': {
            value: [500, 500]
        },
        'ztime': {
            value: 0.0
        },
        'seed1': {
            value: fxrandom(.9, 1.1)
        },
        'seed2': {
            value: fxrandom(.5, 1.5)
        },
        'seed3': {
            value: fxrandom(.5, 1.5)
        },
    },
    vertexShader:
/* glsl */
`

    varying vec2 vUv;

    void main() {

        vUv = uv;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,
    fragmentShader:
/* glsl */
`

    #include <common>

    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float ztime;
    uniform float seed1;
    uniform float seed2;
    uniform float seed3;

    varying vec2 vUv;

    //uniform float sigma;     // The sigma value for the gaussian function: higher value means more blur
                         // A good value for 9x9 is around 3 to 5
                         // A good value for 7x7 is around 2.5 to 4
                         // A good value for 5x5 is around 2 to 3.5
                         // ... play around with this based on what you need :)

    //uniform float blurSize;  // This should usually be equal to
                            // 1.0f / texture_pixel_width for a horizontal blur, and
                            // 1.0f / texture_pixel_height for a vertical blur.

    const float pi = 3.14159265f;

    const float numBlurPixelsPerSide = 4.0f;
 

    vec4 blur(vec2 coor, float blurSize, vec2 direction){
        float sigma = 3.0;
        // Incremental Gaussian Coefficent Calculation (See GPU Gems 3 pp. 877 - 889)
        vec3 incrementalGaussian;
        incrementalGaussian.x = 1.0f / (sqrt(2.0f * pi) * sigma);
        incrementalGaussian.y = exp(-0.5f / (sigma * sigma));
        incrementalGaussian.z = incrementalGaussian.y * incrementalGaussian.y;
      
        vec4 avgValue = vec4(0.0f, 0.0f, 0.0f, 0.0f);
        float coefficientSum = 0.0f;
      
        // Take the central sample first...
        avgValue += texture2D(tDiffuse, coor.xy) * incrementalGaussian.x;
        coefficientSum += incrementalGaussian.x;
        incrementalGaussian.xy *= incrementalGaussian.yz;
      
        // Go through the remaining 8 vertical samples (4 on each side of the center)
        for (float i = 1.0f; i <= numBlurPixelsPerSide; i++) { 
          avgValue += texture2D(tDiffuse, coor.xy - i * blurSize * 
                                direction) * incrementalGaussian.x;         
          avgValue += texture2D(tDiffuse, coor.xy + i * blurSize * 
                                direction) * incrementalGaussian.x;         
          coefficientSum += 2. * incrementalGaussian.x;
          incrementalGaussian.xy *= incrementalGaussian.yz;
        }
      
        return avgValue / coefficientSum;
    }

    void main() {

        vec2 xy = gl_FragCoord.xy;
        vec2 uv = xy / resolution;
        
        float qq = pow(2.*abs(uv.x-.5), 2.)*.84;

        qq = pow(length((uv - .5)*vec2(.72,1.))/length(vec2(.5)), 2.) * .94;

        vec2 dir = uv - .5;
        dir = vec2(dir.y, -dir.x);
        dir = dir / length(dir);

        vec4 texelB = blur(uv, qq*3.3*1./resolution.x, dir);

        //float lum = texelB.r * 0.3 + texelB.g * 0.59 + texelB.b * 0.11;
        //lum = pow(lum, 0.15);
        //vec4 texelGray = vec4(vec3( lum ), 1.0);
        //texelGray = texelGray*0.5 + texelB*0.5;

        //vec4 texel = texture2D( tDiffuse, (xy+vec2(+0.0, +0.0)) / resolution );
        //vec4 texel0 = texture2D( tDiffuse, vec2(.5) );

        //vec4 res = texelB*(1.-qq) + texelGray*qq + .0*(-.5+rand(xy*.1));
        //texelB.r = pow(texelB.r, seed1);
        //texelB.g = pow(texelB.g, seed2);
        //texelB.b = pow(texelB.b, seed3);
        //float pp = (texelB.x+texelB.y+texelB.z)/3.;
        //texelB.x = texel.x + .2*(pp-texel.x);
        //texelB.y = texel.y + .2*(pp-texel.y);
        //texelB.z = texel.z + .2*(pp-texel.z);
        vec4 res = texelB + .059*(-.5+rand(xy*.1+mod(ztime*.031, 2.0)));

        gl_FragColor = vec4( res.rgb, 1.0 );

    }`
};
// note about the fxrand() function 
// when the "fxhash" is always the same, it will generate the same sequence of
// pseudo random numbers, always

//----------------------
// defining features
//----------------------
// You can define some token features by populating the $fxhashFeatures property
// of the window object.
// More about it in the guide, section features:
// [https://fxhash.xyz/articles/guide-mint-generative-token#features]
//
// window.$fxhashFeatures = {
//   "Background": "Black",
//   "Number of lines": 10,
//   "Inverted": true
// }

let camera, scene, renderer, renderTarget, composer;
var vShader, fShader;
var loaded = false;

var points;
var ress = 1000;
var baseWidth = 1;
var baseHeight = 1;
var canvasWidth = 1;
var canvasHeight = 1;
var winScale = 1.;
var pg;
var canvas;
var paletteCanvas;

var isdown = false;

var seed = fxrand()*10000;


function fxrandom(a, b){
    return a + fxrand()*(b-a);
}

var wind = 0.0;
var scrollscale = 1.3;
var globalIndex = 0;
var frameCount = 0;
var particlePositions = [];
var particleColors = [];
var particleSizes = [];
var particleAngles = [];
var particleIndices = [];

var horizon = fxrandom(0.7, 0.93);

var treeGroundSpread;

var sunPos;
var sunColor;
var sunSpread;
var isDark;
var hasSun;

var backgroundColor;

var offcl = [fxrandom(-42, 14), fxrandom(-37, 34), fxrandom(-37, 37)]

var skyclr = {
    a: [155, 121, 122, 255],
    ad: [88, 22, 22, 0],
    b: [88, 77, 83, 88],
    bd: [11, 55, 17, 88],
    c: [130, 85, 62, 255],
    cd: [39, 25, 22, 0],
}


var treeclr = {
    a: [154, 82, 70, 255],
    ad: [39, 25, 22, 0],
    b: [191, 95, 80, 255],
    bd: [39, 25, 22, 0],
    c: [183, 82, 70, 188],
    cd: [39, 25, 22, 33],
    d: [88, 77, 83, 118],
    dd: [11, 28, 17, 55],
    e: [88, 77, 83, 140],
    ed: [39, 25, 22, 30],
}

var groundclr = {
    c: [166, 134, 69, 255],
    cd: [49, 25, 22, 0],
    b: [88, 77, 99, 188],
    bd: [11, 28, 17, 55],
    a: [200, 125, 62, 255],
    ad: [44, 25, 22, 0],
}

var orange = {
    a: [216, 85, 22, 255],
    ad: [39, 25, 22, 0],
    b: [88, 77, 83, 127],
    bd: [11, 28, 17, 127],
}

var indigo = { // old sky
    a: [102, 153, 220, 255],
    ad: [2, 5, 25, 0],
    b: [227, 233, 111, 16],
    bd: [5, 11, 111, 16],
}

var luminosityPass;

function isMobile() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2*p, g);
    else
        return 1 - 0.5 * Math.pow(2*(1 - p), g);
}


function dist(x1, y1, x2, y2){
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}

var mouse = {
    'x': 0,
    'y': 0,
};

var mouseprev = {
    'x': 0,
    'y': 0,
};


var finalscene;

var ffgeometry;
var ffmaterial;
var ffmesh;


function onDocumentMouseMove(event) {
    event.preventDefault();
    mouseprev.x = mouse.x;
    mouseprev.y = mouse.y;
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    if(!isdown)
        return;

    var mx = event.clientX - (window.innerWidth - canvasWidth)/2;
    var my = event.clientY - (window.innerHeight - canvasHeight)/2;
    var rx, ry;
    var pixelData;
    rx = mx*winScale;
    ry = my*winScale;
    //console.log((mx)/baseWidth/winScale*1000)
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    //points.material.uniforms.u_diffuse.value = [pixelData[0]/255., pixelData[1]/255., pixelData[2]/255., 1.];

    //points.material.uniforms.u_diffuse.value = [mmm[0], mmm[1], mmm[2], 1.0];
    //luminosityPass.uniforms.ztime.value = frameCount*1.0;
    var x1 = mouseprev.x;
    var y1 = mouseprev.y;
    var x2 = mouse.x;
    var y2 = mouse.y;
    var ddd = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    var parts = Math.round(ddd/1.25);
    renderer.setRenderTarget(renderTarget);
    for(var k = 0; k < parts; k++){
        var p = map(k, 0, parts, 0, 1);
        var x = x1 + p*(x2 - x1);
        var y = y1 + p*(y2 - y1);

        //pixelData = paletteCanvas.getContext('2d').getImageData(((x-300)/baseWidth/winScale*1000), ((y)/baseHeight/winScale*1000), 1, 1).data;
        //points.material.uniforms.u_diffuse.value = [pixelData[0]/255., pixelData[1]/255., pixelData[2]/255., 1.];

        points.material.uniforms.u_time.value = frameCount*1.0;
        points.material.uniforms.u_spread.value = 15;
        points.material.uniforms.u_mouse.value = [(x-window.innerWidth/2)/winScale, (y-window.innerHeight/2)/winScale];
        renderer.render(scene, camera);
        //composer.render();
        frameCount++
    }

    renderer.setRenderTarget(null);
    
    //composer.addPass( renderPass );
    //composer.addPass( luminosityPass );
    
    ffmesh.material.uniforms.tDiffuse.value = renderTarget.texture;
    ffmesh.material.uniforms.resolution.value = [canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio];
    renderer.render(finalscene, camera);
}

function drawLine(p1, p2, spread, pscale, color, distortion){

    var x1 = p1.x;
    var y1 = p1.y;
    var x2 = p2.x;
    var y2 = p2.y;
    
    if(color)
        points.material.uniforms.u_diffuse.value = [color[0], color[1], color[2], 1.0];

    renderer.setRenderTarget(renderTarget);
    var ddd = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    var parts = Math.round(ddd/1.25);
    for(var k = 0; k < parts; k++){
        var p = map(k, 0, parts, 0, 1);
        var env = Math.pow(1-2*Math.abs(p-.5), 1./6);
        var nzx = env*distortion*(-.5+power(noise(k*.005+frameCount*.0004, x1*.04+y1*.5522), 4));
        var nzy = env*distortion*(-.5+power(noise(k*.005+frameCount*.0004, x1*.04+y1*.2855), 4));
        var xx = x1 + p*(x2 - x1) + nzx;
        var yy = y1 + p*(y2 - y1) + nzy;

        points.material.uniforms.u_time.value = frameCount*1.0;
        points.material.uniforms.u_spread.value = 1 + 15*spread + spread*22*power(noise(k*.003, y1*31.31), 4);
        points.material.uniforms.u_scrollscale.value = pscale;
        points.material.uniforms.u_mouse.value = [xx, -yy];
        renderer.render(scene, camera);
        //composer.render();
        frameCount++
    }
    renderer.setRenderTarget(null);
    ffmesh.material.uniforms.tDiffuse.value = renderTarget.texture;
    ffmesh.material.uniforms.resolution.value = [canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio];
    renderer.render(finalscene, camera);
}

function lerp(v1, v2, p){
    return v1 + p*(v2-v1);
}

function fillQuad(p01, p02, p03, p04, spread, pscale, color, distortion){


    var width = Math.abs(p01.x - p02.x);
    var height = Math.abs(p01.y - p04.y);

    var p1 = p01;
    var p2 = p02;
    var p3 = p03;
    var p4 = p04;

    if(p01.distanceTo(p02) > p01.distanceTo(p04)){
        p1 = p02;
        p2 = p03;
        p3 = p04;
        p4 = p01;
    }

    var dd = p1.distanceTo(p4);
    var parts = Math.round(dd/10.);
    for(var k = 0; k < parts; k++){
        var p = map(k, 0, parts, 0, 1);
        var pn = map(k+.5, 0, parts, 0, 1);
        var pnn = map(k+1, 0, parts, 0, 1);
        
        var x1 = lerp(p1.x, p4.x, p);
        var y1 = lerp(p1.y, p4.y, p);
        
        var x2 = lerp(p2.x, p3.x, pn);
        var y2 = lerp(p2.y, p3.y, pn);
        
        var x3 = lerp(p1.x, p4.x, pnn);
        var y3 = lerp(p1.y, p4.y, pnn);
        
        var colorc = [color[0]*(.88+.12*p), color[1]*(.88+.12*p), color[2]*(.88+.12*p)]
        
        const pp1 = new THREE.Vector2(x1, y1);
        const pp2 = new THREE.Vector2(x2, y2);
        const pp3 = new THREE.Vector2(x3, y3);
        drawLine(pp1, pp2, spread, pscale, colorc, distortion);
        drawLine(pp2, pp3, spread, pscale, colorc, distortion);
    }
}

function drawCube(x, y, w, h, angle, shrt, hue, distortion){

    const p1 = new THREE.Vector2(x-w/2, y+h/2);
    const p2 = new THREE.Vector2(x+w/2, y+h/2);
    const p3 = new THREE.Vector2(x+w/2, y-h/2);
    const p4 = new THREE.Vector2(x-w/2, y-h/2);
    var shw = w*shrt;
    const p5 = new THREE.Vector2(x-w/2 + shw*Math.cos(angle), y+h/2 + shw*Math.sin(angle));
    const p6 = new THREE.Vector2(x+w/2 + shw*Math.cos(angle), y+h/2 + shw*Math.sin(angle));
    const p7 = new THREE.Vector2(x+w/2 + shw*Math.cos(angle), y-h/2 + shw*Math.sin(angle));

    var mar = 5;
    const pm1 = new THREE.Vector2(x-(w/2-mar), y+(h/2-mar));
    const pm2 = new THREE.Vector2(x+(w/2-mar), y+(h/2-mar));
    const pm3 = new THREE.Vector2(x+(w/2-mar), y-(h/2-mar));
    const pm4 = new THREE.Vector2(x-(w/2-mar), y-(h/2-mar));
    var shw = w*shrt;
    const pm5 = new THREE.Vector2(x-(w/2-mar) + shw*Math.cos(angle), y+(h/2-mar) + shw*Math.sin(angle));
    const pm6 = new THREE.Vector2(x+(w/2-mar) + shw*Math.cos(angle), y+(h/2-mar) + shw*Math.sin(angle));
    const pm7 = new THREE.Vector2(x+(w/2-mar) + shw*Math.cos(angle), y-(h/2-mar) + shw*Math.sin(angle));

    var pscale = fxrandom(.4, .99);
    var spread = fxrandom(.4, .99);

    var mmm;
    console.log(hue)
    mmm = HSVtoRGB((hue+fxrandom(.01, .02))%1., fxrandom(.66, .74), fxrandom(.56, .6));
    fillQuad(pm5, pm6, pm2, pm1, spread, pscale, mmm, distortion);

    mmm = HSVtoRGB((hue+fxrandom(.01, .02))%1., fxrandom(.66, .74), fxrandom(.56, .6));
    fillQuad(pm2, pm6, pm7, pm3, spread, pscale, mmm, distortion);
    
    //infill front
    mmm = HSVtoRGB((hue+fxrandom(.01, .02))%1., fxrandom(.66, .74), fxrandom(.56, .6));
    fillQuad(pm1, pm2, pm3, pm4, spread, pscale, mmm, distortion);

    mmm[1] = (mmm[1]*1.4)%1.;
    mmm[2] = mmm[2]*.5;
    spread = spread*.3;
    // outline
    drawLine(p1, p2, spread, pscale, mmm, distortion);
    drawLine(p2, p3, spread, pscale, mmm, distortion);
    drawLine(p3, p4, spread, pscale, mmm, distortion);
    drawLine(p4, p1, spread, pscale, mmm, distortion);

    // kosi bridovi
    drawLine(p1, p5, spread, pscale, mmm, distortion);
    drawLine(p2, p6, spread, pscale, mmm, distortion);
    drawLine(p3, p7, spread, pscale, mmm, distortion);
    
    // zadnji bridovi
    drawLine(p5, p6, spread, pscale, mmm, distortion);
    drawLine(p6, p7, spread, pscale, mmm, distortion);
}


function getCubeVertices(cube, padding){
    const x = cube.x;
    const y = cube.y;
    const w = cube.w+padding;
    const h = cube.h+padding;
    const angle = cube.a;
    const shrt = cube.s;
    const p1 = new THREE.Vector2(x-w/2, y+h/2);
    const p2 = new THREE.Vector2(x+w/2, y+h/2);
    const p3 = new THREE.Vector2(x+w/2, y-h/2);
    const p4 = new THREE.Vector2(x-w/2, y-h/2);
    var shw = w*shrt;
    const p5 = new THREE.Vector2(x-w/2 + shw*Math.cos(angle), y+h/2 + shw*Math.sin(angle));
    const p6 = new THREE.Vector2(x+w/2 + shw*Math.cos(angle), y+h/2 + shw*Math.sin(angle));
    const p7 = new THREE.Vector2(x+w/2 + shw*Math.cos(angle), y-h/2 + shw*Math.sin(angle));

    return {
        'p1': p1,
        'p2': p2,
        'p3': p3,
        'p4': p4,
        'p5': p5,
        'p6': p6,
        'p7': p7,
    }
}

function outlineold(cubesinfos, spread, pscale, color, pad, distortion){
    points.material.uniforms.u_diffuse.value = [color[0], color[1], color[2], 1.0];

    for(var k = 0; k < cubesinfos.length; k++){
        
        var cube = cubesinfos[k];
        var cubeall = getCubeVertices(cube, 18);

        drawLine(cubeall.p1, cubeall.p5, spread, pscale, color, distortion);
        drawLine(cubeall.p5, cubeall.p6, spread, pscale, color, distortion);
        drawLine(cubeall.p6, cubeall.p7, spread, pscale, color, distortion);
        drawLine(cubeall.p7, cubeall.p3, spread, pscale, color, distortion);
        drawLine(cubeall.p3, cubeall.p4, spread, pscale, color, distortion);
        drawLine(cubeall.p4, cubeall.p1, spread, pscale, color, distortion);
    }
}

function outlineblack(cube, spread, pscale, color, pad, distortion){
    points.material.uniforms.u_diffuse.value = [color[0], color[1], color[2], 1.0];

    var cubeall = getCubeVertices(cube, pad);

    drawLine(cubeall.p1, cubeall.p2, spread, pscale, color, distortion);
    drawLine(cubeall.p3, cubeall.p4, spread, pscale, color, distortion);
    drawLine(cubeall.p2, cubeall.p3, spread, pscale, color, distortion);
    drawLine(cubeall.p4, cubeall.p1, spread, pscale, color, distortion);

    // kosi bridovi
    drawLine(cubeall.p1, cubeall.p5, spread, pscale, color, distortion);
    drawLine(cubeall.p3, cubeall.p7, spread, pscale, color, distortion);
    drawLine(cubeall.p2, cubeall.p6, spread, pscale, color, distortion);
    
    // zadnji bridovi
    drawLine(cubeall.p6, cubeall.p7, spread, pscale, color, distortion);
    drawLine(cubeall.p5, cubeall.p6, spread, pscale, color, distortion);
}


function outline(cubesinfos, spread, pscale, color, pad, distortion){
    points.material.uniforms.u_diffuse.value = [color[0], color[1], color[2], 1.0];

    var linepts = [];

    for(var k = 0; k < cubesinfos.length; k++){
        var cube = cubesinfos[k];
        var cubeall = getCubeVertices(cube, pad);

        if(k == 0){
            //linepts.push(cubeall.p3);
            linepts.push(cubeall.p4);
            linepts.push(cubeall.p1);
        }
        if(k > 0){
            var cubep = cubesinfos[k-1];
            var cubeallp = getCubeVertices(cube, pad);
            if(cubeall.p1.y > cubeallp.p1.y){
                linepts.push(cubeall.p1);
            }
        }

        if(k < cubesinfos.length-1){
            var cuben = cubesinfos[k+1];
            var cubealln = getCubeVertices(cube, pad);
            if(cubeall.p1.y > cubealln.p1.y){
                linepts.push(cubeall.p5);
                linepts.push(cubeall.p6);
                linepts.push(cubealln.p5);
            }
            else{
                linepts.push(cubeall.p5);
                linepts.push(new THREE.Vector2(cubealln.p1.x, cubeall.p5.y));
            }
        }

        if(k == cubesinfos.length-1){
            linepts.push(cubeall.p5);
            linepts.push(cubeall.p6);
            linepts.push(cubeall.p7);
            linepts.push(cubeall.p3);
        }
    }
    for(var k = cubesinfos.length-1; k >= 0; k--){
        var cube = cubesinfos[k];
        var cubeall = getCubeVertices(cube, pad);
        linepts.push(cubeall.p3);
        linepts.push(cubeall.p4);
        
    }
    for(var k = 0; k < linepts.length-1; k++){
        drawLine(linepts[k], linepts[k+1], spread, pscale, color, distortion);
    }
}

function cubes(){
    
    
    var ncubes = Math.round(fxrandom(1, 5));
    var cubewidth = fxrandom(55, 200);
    var cubeheight = fxrandom(55, 400);
    if(cubeheight*cubewidth > 40000){
        cubewidth = 40000/cubeheight;
    }
    if(cubewidth * ncubes > canvasWidth*.66){
        cubewidth = canvasWidth*.66 / ncubes;
    }
    var angle = radians(fxrandom(10, 50));
    angle = radians(fxrandom(5, 88));
    var shrt = fxrandom(.1, .5)*0+fxrandom(.4, 1.3)*1;
    var cubesinfos = []
    var cubewidtht = cubewidth;
    for(var x = -(ncubes-1)/2*cubewidth; x <= (ncubes-1)/2*cubewidth; x += cubewidtht){
        
        cubewidtht = fxrandom(55, 130);
        var y = fxrandom(-100,100);
        //x = fxrandom(-3, 3);
        //y = fxrandom(-3, 3);
        //cubewidth = fxrandom(55, 400);
        //cubeheight = fxrandom(55, 400);
        cubesinfos.push({
            'x': x-cubewidtht*shrt*Math.cos(angle)/2,
            'y': y-cubewidtht*shrt*Math.sin(angle)/2,
            'w': cubewidtht-10,
            'h': cubeheight-10,
            'a': angle,
            's': shrt,
        });
    }

    var hue = 0.5;
    var color = HSVtoRGB((hue+fxrandom(.55, .61))%1.0, fxrandom(.1, .6), fxrandom(.2, .5));
    var pad = 0;
    var distortion = 22;

    outline(cubesinfos, 2, 2, color, pad, distortion);

    cubesinfos.forEach(function(cube){
        drawCube(cube.x, cube.y, cube.w, cube.h, angle, shrt, hue, distortion);

        mmm = HSVtoRGB(0,0,0);
        if(fxrand() < .5){
            mmm = HSVtoRGB(0,0,.8);
        }
        outlineblack(cube, .505, .018, mmm, pad, distortion);
        
        mmm = HSVtoRGB(0,0,0);
        if(fxrand() < .5){
            mmm = HSVtoRGB(0,0,.8);
        }
        outlineblack(cube, .35, .018, mmm, pad, distortion);
    })

}


function midcube(){
    
    
    var angle = radians(fxrandom(10, 50));
    angle = radians(fxrandom(5, 88));
    var shrt = fxrandom(.1, .5)*0+fxrandom(.4, 1.3)*1;
    var cubesinfos = []
        
    var x = fxrandom(-3, 3);
    var y = fxrandom(-3, 3);
    var cubewidth = fxrandom(55, 400);
    var cubeheight = fxrandom(55, 400);
    cubesinfos.push({
        'x': x-cubewidth*shrt*Math.cos(angle)/2,
        'y': y-cubewidth*shrt*Math.sin(angle)/2,
        'w': cubewidth-10,
        'h': cubeheight-10,
        'a': angle,
        's': shrt,
    });

    var hue = fxrandom(.55, .56)*0;
    var color = HSVtoRGB((hue+fxrandom(.45, .61))%1.0, fxrandom(.4, .6), fxrandom(.2, .5)*1);
    var pad = 18;
    var distortion = 55;

    outline(cubesinfos, 2, 3, color, pad, distortion);

    cubesinfos.forEach(function(cube){
        drawCube(cube.x, cube.y, cube.w, cube.h, angle, shrt, hue, distortion);

        color = HSVtoRGB(0,0,0);
        if(fxrand() < .5){
            color = HSVtoRGB(0,0,.8);
        }
        outlineblack(cube, .505, .018, color, pad, distortion);
        
        color = HSVtoRGB(0,0,0);
        if(fxrand() < .5){
            color = HSVtoRGB(0,0,.8);
        }
        outlineblack(cube, .05, .018, color, pad, 19);
    })

}

function animate() {
    renderer.setClearColor( 0x121212, 1 );
    renderer.clear();
    //requestAnimationFrame(animate);
    if(renderer && false){
        var x1 = -200;
        var y1 = 0;
        var x2 = 200;
        var y2 = 0;
        var dd = Math.sqrt((x2-x1)**2, (y2-y1)**2);
        var parts = dd/1.;
        var radius = 160;
        parts = radius*8;
        var diff = [.01, fxrandom(.1, .3), fxrandom(.1, .3), 1.0];
        for(var k = 0; k < parts; k++){
            var p = map(k, 0, parts-1, 0, 1);
            //var x = x1 + p*(x2 - x1);
            //var y = y1 + p*(y2 - y1);
            var ang = map(k , 0, parts-1, 0, 2*3.14159+.1);
            var radiusn = radius * (1 + -.0 + .4*power(noise(k*.002), 3) );
            var x = radiusn*Math.cos(ang);
            var y = radiusn*Math.sin(ang);
            points.material.uniforms.u_time.value = frameCount*1.0;
            points.material.uniforms.u_spread.value = map(k, 0, parts, 20, 79);

            if(k > parts-22){
                let vv = map(k, parts-22+1, parts, 1, 0);
                points.material.uniforms.u_spread.value = map(Math.pow(vv, 1./5.), 0, 1, 33, 79)
            }

            
            if(k < 22){
                let vv = map(k, 0, 22-1, 0, 1);
                points.material.uniforms.u_spread.value = map(Math.pow(vv, 1./5.), 0, 1, 0, 20)
            }
            //var res = [(mouse.x-window.innerWidth/2)/winScale, (mouse.y-window.innerHeight/2)/winScale]
            var res = [x/winScale, y/winScale]
            points.material.uniforms.u_mouse.value = res;
            points.material.uniforms.u_diffuse.value = diff;
            //luminosityPass.uniforms.ztime.value = frameCount*1.0;
            //points.material.uniforms.u_scrollscale.value = scrollscale;
            //composer.render();
            frameCount++
        }
    }
    
    mouseprev.x = mouse.x;
    mouseprev.y = mouse.y;
    //requestAnimationFrame(animate);
}



function draw(){
    //image(pg, 0, 0, canvas.width, canvas.height);
}

function getHorizon(x){
    var dispr = .5*baseHeight*(-.5*power(noise(x*0.003+3133.41), 3))
    return baseHeight*horizon + (1. - horizon*.8)*.6*baseHeight*(-.5*power(noise(x*0.003), 2)) + .0*dispr*fxrand();
}

function map(x, v1, v2, v3, v4){
    return (x-v1)/(v2-v1)*(v4-v3)+v3;
}

function max(x, y){
    if(x >= y)
        return x;
    return y;
}

function min(x, y){
    if(x <= y)
        return x;
    return y;
}

function constrain(x, a, b){
    return max(a, min(x, b));
}

function radians(angle){
    return angle/360.*2*3.14159;
}

function reset(){
	
    var ns = fxrandom(0, 100000);
    noiseSeed(ns);
    globalIndex = 0;
    scrollscale = 1.3;
    frameCount = 0;
    offcl = [fxrandom(-18, 18), fxrandom(-18, 18), fxrandom(-18, 18)]
    offcl = [0,0,0]
    seed = fxrand()*10000;
    horizon = fxrandom(0.24, 0.93);

    isDark = fxrand() < .08;

    hasSun = fxrand() < .5;

    wind = fxrandom(-.4, +.4);
    if(fxrand() < .5)
        wind = 3.14 + wind;

    canvasWidth = ress;
    canvasHeight = ress;

    var ww = window.innerWidth || canvas.clientWidth || body.clientWidth;
    var wh = window.innerHeight|| canvas.clientHeight|| body.clientHeight;

    baseWidth = ress-60;
    baseHeight = ress-60;

    var mm = min(ww, wh);
    winScale = mm / baseWidth;
    
    if(ww < ress+16 || wh < ress+16 || true){
        canvasWidth = mm-60*mm/ress;
        canvasHeight = mm-60*mm/ress;
        //baseWidth = mm-16-16;
        //baseHeight = mm-16-16;
    }

    ww = canvasWidth
    wh = canvasHeight

    let sxx = fxrandom(0.05, 0.95);
    sunPos = [sxx, getHorizon(sxx*baseWidth)/baseHeight+fxrandom(-.0, .1)];
    sunSpread = fxrandom(1.85, 1.85);


    var hsv = [Math.pow(fxrandom(0.0, 0.9), 2), fxrandom(0.2, 0.56), fxrandom(0.3, 0.76)]
    if(hsv[0] > 0.05){
        hsv[1] = fxrandom(0.14, 0.315)
        //hsv[2] = fxrandom(0.2, 0.8)
    }
    if(sunPos[1] > horizon){
        //hsv[2] = fxrandom(0.4, 0.7)
    }

    if(isDark){
        hsv[2] *= .5;
    }

    backgroundColor = HSLtoRGB(hsv[0], hsv[1], hsv[2])

    //while(myDot(backgroundColor, [0,1,0]) > 0.5){
    //    hsv = [Math.pow(fxrand()*.5, 2), fxrandom(0.2, 0.36), fxrandom(0.5, 0.7)]
    //    backgroundColor = HSVtoRGB(hsv[0], hsv[1], hsv[2])
    //}
    //backgroundColor[2] = Math.pow(backgroundColor[2], .6)
    
    sunColor = [fxrandom(0.992, 1.036)%1.0, fxrandom(0.9, .96), fxrandom(.8, 1.0)]
    if(sunColor[0] > .13 && sunColor[0] < .98){
        //sunColor[1] *= .7;
        //sunColor[2] *= .7;
    }
    sunColor = HSVtoRGB(sunColor[0], sunColor[1], sunColor[2]);
    sunColor = [255.*sunColor[0], 255.*sunColor[1], 255.*sunColor[2]]
    if(isDark){
        sunColor = HSLtoRGB(fxrandom(0.5, .7), fxrandom(0.1, .2), fxrandom(.4, .6));
        sunColor = [255.*sunColor[0], 255.*sunColor[1], 255.*sunColor[2]]
        sunPos[1] = fxrandom(-.4, -.3);
        sunSpread = fxrandom(1.1, 1.1);
    }
    //sunColor = [255.*Math.pow(backgroundColor[0], .35), 255.*Math.pow(backgroundColor[1], 2.3), 255.*Math.pow(backgroundColor[2], 2.3)]
    if((backgroundColor[0]+backgroundColor[1]+backgroundColor[2])/3 < .35){
        //sunColor = HSVtoRGB(fxrandom(0.4, .61), fxrandom(0.2, .34), fxrandom(.6, 1.0));
        //sunColor = [255.*sunColor[0], 255.*sunColor[1], 255.*sunColor[2]]
    }

    /*if(ww/wh > 1){
        baseWidth = Math.round(ress * ww/wh)
        baseHeight = ress
    }
    else{
        baseWidth = ress
        baseHeight = Math.round(ress * wh/ww)
    }*/

    //groundclr.a[3] = 0;
    var rx, ry;
    var pixelData;
    rx = fxrand()*33+128;
    ry = fxrand()*33+128;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) groundclr.a = [pixelData[0], pixelData[1], pixelData[2], 255];
    rx += fxrand()*88-44;
    ry += fxrand()*88-44;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) groundclr.b = [pixelData[0], pixelData[1], pixelData[2], 255*(fxrand()<2.5)];
    rx += fxrand()*88-44;
    ry += fxrand()*88-44;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) groundclr.c = [pixelData[0], pixelData[1], pixelData[2], 255*(fxrand()<2.5)];

    rx += fxrand()*33-16;
    ry += fxrand()*33-16;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) skyclr.a = [pixelData[0], pixelData[1], pixelData[2], 255];
    rx += fxrand()*33-16;
    ry += fxrand()*33-16;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) skyclr.b = [pixelData[0], pixelData[1], pixelData[2], 188];
    rx += fxrand()*33-16;
    ry += fxrand()*33-16;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) skyclr.c = [pixelData[0], pixelData[1], pixelData[2], 188];
    
    rx += fxrand()*66-36;
    ry += fxrand()*66-36;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) treeclr.a = [pixelData[0], pixelData[1], pixelData[2], 255];
    rx += fxrand()*66-36;
    ry += fxrand()*66-36;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) treeclr.b = [pixelData[0], pixelData[1], pixelData[2], 188];
    rx += fxrand()*66-36;
    ry += fxrand()*66-36;
    pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    if(fxrand()<-1.5) treeclr.c = [pixelData[0], pixelData[1], pixelData[2], 255];

    //resizeCanvas(ww, wh, true);
    //pg = createGraphics(ww, wh);

    particlePositions = [];
    particleColors = [];
    particleSizes = [];
    particleAngles = [];
    particleIndices = [];

    generateBrush();

    
    loadShadersAndData();

    

}

function generateBrush(){
    
    var radi = .24;
    var strands = 433;
    for(var k = 0; k < strands; k++){
        var ang = fxrandom(0, 2*3.14159);
        var rad = map(Math.sqrt(fxrand()), 0, 1, 0, radi);
        var x = rad*Math.cos(ang);
        var y = rad*Math.sin(ang);

        var col = [
            groundclr.a[0] + 4*fxrandom(-groundclr.ad[0], +groundclr.ad[0]),
            groundclr.a[1] + 4*fxrandom(-groundclr.ad[1], +groundclr.ad[1]),
            groundclr.a[2] + 4*fxrandom(-groundclr.ad[2], +groundclr.ad[2]),
            255.
        ]


        col = [
            treeclr.a[0] + 2*fxrandom(-treeclr.ad[0], +treeclr.ad[0]),
            treeclr.a[1] + 2*fxrandom(-treeclr.ad[1], +treeclr.ad[1]),
            treeclr.a[2] + 2*fxrandom(-treeclr.ad[2], +treeclr.ad[2]),
            fxrandom(0, 255)
        ]

        var bb = fxrandom(1, 255);
        col = [
            bb,
            bb,
            bb,
            fxrandom(33, 44)
        ]

        var rrr = fxrandom(1, 4);
        particlePositions.push(x, y, 0);
        particleColors.push(col[0]/255., col[1]/255., col[2]/255., col[3]/255.);
        particleSizes.push(rrr, rrr);
        particleAngles.push(fxrandom(0, 2*3.14159));
        particleIndices.push(k);
    }
}

function loadShadersAndData(){
    
    //const material = new THREE.PointsMaterial( { size: 15, vertexColors: true } );
    var loader = new THREE.FileLoader();
    var numFilesLeft = 2;
    function runMoreIfDone() {
        --numFilesLeft;
        if (numFilesLeft === 0) {
            loadData();
        }
    }
    loader.load('./assets/shaders/particle.frag',function ( data ) {fShader =  data; runMoreIfDone(); },);
    loader.load('./assets/shaders/particle.vert',function ( data ) {vShader =  data; runMoreIfDone(); },);
}

function loadData(){
    /*
    canvas2 = document.createElement("canvas");
    canvas2.id = "hello"
    canvas2.width = ww;
    canvas2.height = wh;
    canvas2.style.position = 'absolute';
    canvas2.style.left = '0px';
    canvas2.style.top = '0px';
    canvas2.style.z_index = '1111';
    console.log(canvas2)
    document.body.append(canvas2)
    */
    winScale = canvasWidth / ress;
    camera = new THREE.OrthographicCamera(-canvasWidth/2/winScale, canvasWidth/2/winScale, canvasHeight/2/winScale, -canvasHeight/2/winScale, 1, 2000);
    //camera = new THREE.OrthographicCamera( 1000 * 1. / - 2, 1000 * 1. / 2, 1000 / 2, 1000 / - 2, 1, 4000 );
    //camera = new THREE.PerspectiveCamera( 27, canvasWidth / canvasHeight, 5, 3500 );
    camera.position.z = 1000;

    var ff = true;
    if(scene)
        ff = false;
    scene = new THREE.Scene();


    var rx = fxrand()*256;
    var ry = fxrand()*256;
    var pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
    //backgroundColor = [pixelData[0]/255., pixelData[1]/255., pixelData[2]/255.];

    //scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );

    //

    const particles = 33133;


    const pointsGeo = new THREE.BufferGeometry();

    pointsGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( particlePositions, 3 ) );
    pointsGeo.setAttribute( 'color', new THREE.Float32BufferAttribute( particleColors, 4 ) );
    pointsGeo.setAttribute( 'size', new THREE.Float32BufferAttribute( particleSizes, 2 ) );
    pointsGeo.setAttribute( 'angle', new THREE.Float32BufferAttribute( particleAngles, 1 ) );
    pointsGeo.setAttribute( 'index', new THREE.Float32BufferAttribute( particleIndices, 1 ) );

    var customUniforms = {
        u_time: { value: frameCount },
        u_spread: { value: 33 },
        u_mouse: { value: [0, 0] },
        u_diffuse: { value: [0, 0, 0, 1] },
        u_scrollscale: { value: scrollscale },
        u_winscale: { value: 4. },
        u_seed: fxrandom(1000.),
    };


    const material = new THREE.ShaderMaterial( {
        uniforms: customUniforms,
        vertexShader: vShader,
        fragmentShader: fShader,
        transparent:  true
      });

      //console.log(vShader);

    points = new THREE.Points( pointsGeo, material );
    scene.add( points );
    const sphereGeo = new THREE.BoxGeometry( 133,133,133);
    const sphereMat = new THREE.MeshBasicMaterial( { color: 0xbbbbbb } );
    const sphere = new THREE.Mesh( sphereGeo, sphereMat );
    sphere.rotation.x = fxrand();
    sphere.rotation.y = fxrand();
    sphere.rotation.z = fxrand();
    //scene.add( sphere );
    //

    
    if(ff)
        renderer = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true});

    renderTarget = new THREE.WebGLRenderTarget(1.*canvasWidth*window.devicePixelRatio, 1.*canvasHeight*window.devicePixelRatio);

    finalscene = new THREE.Scene();

    ffgeometry = new THREE.PlaneGeometry(canvasWidth/winScale, canvasHeight/winScale);
    
    ffmaterial = new THREE.ShaderMaterial({
        uniforms: PostProcShader.uniforms,
        vertexShader: PostProcShader.vertexShader,
        fragmentShader: PostProcShader.fragmentShader,
        transparent:  true
    });
    ffmesh = new THREE.Mesh(ffgeometry, ffmaterial);
    //ffmesh.material.uniforms.tDiffuse = renderTarget.texture;
    finalscene.add(ffmesh);


    renderer.autoClearColor = false;
    //renderer.setPixelRatio( 1.0 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( canvasWidth, canvasHeight );

    renderer.domElement.id = "cnvs"
    //renderer.domElement.style.position = "absolute";
    //renderer.domElement.style.left = "0px";
    //renderer.domElement.style.top = "0px";
    if(ff)
        document.body.appendChild( renderer.domElement );

    repositionCanvas(renderer.domElement);

    renderer.domElement.style.border = "10px solid black";

        
    scene.background = new THREE.Color( .9, .9, .9);

    points.material.uniforms.u_time.value = 0;
    points.material.uniforms.u_scrollscale.value = scrollscale;
    points.material.uniforms.u_winscale.value = winScale*window.devicePixelRatio;
    //composer = new EffectComposer( renderer);
    const renderPass = new RenderPass( scene, camera );
    //PostProcShader.uniforms.resolution.ztime = 0.0;
    //PostProcShader.uniforms.resolution.value = [canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio];
    //luminosityPass = new ShaderPass( PostProcShader );
    //composer.render();
    renderer.setRenderTarget(renderTarget);
    renderer.setClearColor( 0x121212, 1 );
    renderer.render(scene, camera);
    renderer.setClearColor( 0x121212, 1 );
    renderer.clear();
    //requestAnimationFrame(animate);
    //animate();
    
    renderer.setRenderTarget(null);
    ffmesh.material.uniforms.tDiffuse.value = renderTarget.texture;
    ffmesh.material.uniforms.resolution.value = [canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio];
    renderer.render(finalscene, camera);

    //scratch(.4*fxrandom(-baseWidth/2, baseWidth/2), .4*fxrandom(-baseHeight/2, baseHeight/2));
    //cubes();
    midcube();
    
    //renderer.setRenderTarget(null);
    //renderer.render(finalscene, camera);
    //renderer.render( scene, camera );
    if(isFxpreview)
        fxpreview();
    //console.log('hash:', fxhash);
    //window.addEventListener( 'resize', onWindowResize );
    
    //window.onmousemove = onDocumentMouseMove;
    window.onmousedown = function(event){
        event.preventDefault();
        //mx = (mx-window.innerWidth/2)/winScale
        //my = (my-window.innerHeight/2)/winScale;

        isdown = true; 
        mouseprev.x = mouse.x; 
        mouseprev.y = mouse.y; 
        var mmm = HSVtoRGB(fxrandom(.0004, .05), fxrandom(.4, .8), fxrandom(.7, .7));
        var mmm = HSVtoRGB(fxrandom(.0004, .05), fxrandom(.1, .6), fxrandom(.1, .6));
        if(fxrand()>-.5)
            mmm = HSVtoRGB(fxrandom(.006, .991), fxrandom(.1, .6), fxrandom(.1, .8));

        var mx = event.clientX - (window.innerWidth - canvasWidth)/2;
        var my = event.clientY - (window.innerHeight - canvasHeight)/2;
        var rx, ry;
        var pixelData;
        rx = mx;
        ry = my;
        pixelData = paletteCanvas.getContext('2d').getImageData(rx, ry, 1, 1).data;
        
        points.material.uniforms.u_diffuse.value = [mmm[0], mmm[1], mmm[2], 1.0];
        //points.material.uniforms.u_diffuse.value = [pixelData[0]/255., pixelData[1]/255., pixelData[2]/255., 1.];
    };
    window.onmouseup = function(){isdown = false; mouseprev.x = mouse.x; mouseprev.y = mouse.y;};
}


function repositionCanvas(canvas){
    var win = window;
    var doc = document;
    var body = doc.getElementsByTagName('body')[0];
    var ww = win.innerWidth;
    var wh = win.innerHeight;
    
    if(isMobile()){
      //canvas.width = ww;
      //canvas.height = wh;
      //canvas.style.borderWidth = "6px";
    }
    else{
      //canvas.width = Math.min(ww, wh) - 130;
      //canvas.height = Math.min(ww, wh) - 130;
    }

    canvas.style.position = 'absolute';
    canvas.style.left = (ww - canvasWidth)/2 - 10*min(ww, wh)/ress + 'px';
    canvas.style.top = (wh - canvasHeight)/2 + 'px'; // ovih 6 je border
    
}

var cnt = 0

var shft = fxrandom(0.6, 1.05)%1.0;
var shft2 = fxrandom(0.0, 1.0)%1.0;
var hasAtt = fxrand() < .5;


function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [r, g, b]
}

const HSLtoRGB = (h, s, l) => {
    //s /= 100;
    //l /= 100;
    h = h*360;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [1 * f(0), 1 * f(8), 1 * f(4)];
  };

function myDot(col1, col2){
    let dd = Math.sqrt(col1[0]*col1[0]+col1[1]*col1[1]+col1[2]*col1[2]);
    let r = col1[0]/dd;
    let g = col1[1]/dd;
    let b = col1[2]/dd;
    let dd2 = Math.sqrt(col2[0]*col2[0]+col2[1]*col2[1]+col2[2]*col2[2]);
    let r2 = col2[0]/dd2;
    let g2 = col2[1]/dd2;
    let b2 = col2[2]/dd2;
    return r*r2 + g*g2 + b*b2;
}


function windowResized() {
    if(renderer){
        
        var ww = window.innerWidth || canvas.clientWidth || body.clientWidth;
        var wh = window.innerHeight|| canvas.clientHeight|| body.clientHeight;

        baseWidth = ress-60;
        baseHeight = ress-60;

        var mm = min(ww, wh);
        winScale = mm / baseWidth;
        
        if(ww < ress+16 || wh < ress+16 || true){
            canvasWidth = mm-60*mm/ress;
            canvasHeight = mm-60*mm/ress;
            //baseWidth = mm-16-16;
            //baseHeight = mm-16-16;
        }

        ww = canvasWidth
        wh = canvasHeight

        //winScale = canvasWidth / ress;
        //camera.left = -canvasWidth/2 / winScale;
        //camera.right = +canvasWidth/2 / winScale;
        //camera.top = +canvasHeight/2 / winScale;
        //camera.bottom = -canvasHeight/2 / winScale;
        //camera.updateProjectionMatrix();

        renderer.setPixelRatio( window.devicePixelRatio );
        //renderer.setPixelRatio( 1.0000 );
        renderer.setSize( canvasWidth, canvasHeight );
    
        //renderer.setClearColor( 0x121212, 1 );
        //renderer.clear();
        //renderer.domElement.id = "cnvs";
        //renderer.domElement.style.position = "absolute";
        //renderer.domElement.style.left = "0px";
        //renderer.domElement.style.top = "0px";
        repositionCanvas(renderer.domElement);

    
        //points.material.uniforms.u_time.value = 0;
        //points.material.uniforms.u_scrollscale.value = scrollscale;
        //console.log(winScale);
        //points.material.uniforms.u_winscale.value = winScale*window.devicePixelRatio;

        //const composer = new EffectComposer( renderer );
        //const renderPass = new RenderPass( scene, camera );
        //PostProcShader.uniforms.resolution.value = [canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio];
        //const luminosityPass = new ShaderPass( PostProcShader );
        //composer.addPass( renderPass );
        //composer.addPass( luminosityPass );
        //composer.render();
        //renderer.render( scene, camera );
    }
    else{
        reset();
    }
}  

function mouseClicked(){
    reset();
}

function scroll(event) {
    //event.preventDefault();
    //scrollscale = scrollscale + event.deltaY * -0.002;
    //scrollscale = Math.min(Math.max(.125, scrollscale), 6);
  }
  
  
window.onresize = windowResized;
window.onresize = windowResized;
window.onclick = mouseClicked;
window.onwheel = scroll;

/*var paletteImg = new Image();
paletteImg.src = './assets/nyc.png';
paletteImg.onload = function () {
    paletteCanvas = document.createElement('canvas');
    paletteCanvas.width = paletteImg.width;
    paletteCanvas.height = paletteImg.height;
    paletteCanvas.getContext('2d').drawImage(paletteImg, 0, 0, paletteImg.width, paletteImg.height);
    reset();
}*/

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4; 
let perlin_amp_falloff = 0.5; 

const scaled_cosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI));
let perlin;


var noise = function(x, y = 0, z = 0) {
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = fxrand();
    }
  }

  if (x < 0) {
    x = -x;
  }
  if (y < 0) {
    y = -y;
  }
  if (z < 0) {
    z = -z;
  }

  let xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  let xf = x - xi;
  let yf = y - yi;
  let zf = z - zi;
  let rxf, ryf;

  let r = 0;
  let ampl = 0.5;

  let n1, n2, n3;

  for (let o = 0; o < perlin_octaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

    rxf = scaled_cosine(xf);
    ryf = scaled_cosine(yf);

    n1 = perlin[of & PERLIN_SIZE];
    n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
    n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
    n1 += ryf * (n2 - n1);

    of += PERLIN_ZWRAP;
    n2 = perlin[of & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
    n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
    n2 += ryf * (n3 - n2);

    n1 += scaled_cosine(zf) * (n2 - n1);

    r += n1 * ampl;
    ampl *= perlin_amp_falloff;
    xi <<= 1;
    xf *= 2;
    yi <<= 1;
    yf *= 2;
    zi <<= 1;
    zf *= 2;

    if (xf >= 1.0) {
      xi++;
      xf--;
    }
    if (yf >= 1.0) {
      yi++;
      yf--;
    }
    if (zf >= 1.0) {
      zi++;
      zf--;
    }
  }
  return r;
};

var noiseDetail = function(lod, falloff) {
  if (lod > 0) {
    perlin_octaves = lod;
  }
  if (falloff > 0) {
    perlin_amp_falloff = falloff;
  }
};

var noiseSeed = function(seed) {
  const lcg = (() => {
    const m = 4294967296;
    const a = 1664525;
    const c = 1013904223;
    let seed, z;
    return {
      setSeed(val) {
        z = seed = (val == null ? fxrand() * m : val) >>> 0;
      },
      getSeed() {
        return seed;
      },
      rand() {
        z = (a * z + c) % m;
        return z / m;
      }
    };
  })();

  lcg.setSeed(seed);
  perlin = new Array(PERLIN_SIZE + 1);
  for (let i = 0; i < PERLIN_SIZE + 1; i++) {
    perlin[i] = lcg.rand();
  }
};