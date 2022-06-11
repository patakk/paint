import * as THREE from 'three';


import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import ClipperLib from 'js-clipper';

const PostProcShader = {
    uniforms: {
        'tDiffuse': {
            value: null
        },
        'resolution': {
            value: [500, 500]
        },
        'ztime': {
            value: fxrand()
        },
        'flip': {
            value: fxrandom(0, 4)
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
    vertexShader: null,
    fragmentShader: null,
};


function shuffle(array) {
    let currentIndex = array.length
    var randomIndex;

  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(fxrand() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }
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
var ress = 1400;
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

function drawLine(p1, p2, spread, pscale, color, distortion, individual=0){

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
        //var nzx = env*distortion*(-.5+power(noise(k*.005+frameCount*.0004, x1*.04+y1*.5522), 4));
        //var nzy = env*distortion*(-.5+power(noise(k*.005+frameCount*.0004, x1*.04+y1*.2855), 4));
        var xx = x1 + p*(x2 - x1);
        var yy = y1 + p*(y2 - y1);
        var nzx = 2*(1+0*(individual>0))*distortion*(-.5+power(noise(xx*.003+yy*.003, individual+113.31), 4));
        var nzy = 2*(1+0*(individual>0))*distortion*(-.5+power(noise(xx*.003+yy*.003, individual+225.66), 4));
        xx += nzx;
        yy += nzy;

        points.material.uniforms.u_time.value = frameCount*1.0;
        points.material.uniforms.u_spread.value = 1 + 20*spread + spread*10*power(noise(individual, yy*.0041), 4);
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

    var color;
    var satsca = 1;
    if(hue > .62){
        satsca *= .65;
    }
    var bri = fxrandom(.80, .92);
    color = HSVtoRGB((hue+fxrandom(-.05, .05)+1.)%1., fxrandom(.4, .74)*satsca, bri + fxrandom(-.1, .1)*.8);
    fillQuad(pm5, pm6, pm2, pm1, spread, pscale, color, distortion);

    color = HSVtoRGB((hue+fxrandom(-.05, .05)+1.)%1., fxrandom(.4, .74)*satsca, bri + fxrandom(-.1, .1)*.8);
    fillQuad(pm2, pm6, pm7, pm3, spread, pscale, color, distortion);
    
    //infill front
    color = HSVtoRGB((hue+fxrandom(-.05, .05)+1.)%1., fxrandom(.4, .74)*satsca, bri + fxrandom(-.1, .1)*.8);
    fillQuad(pm1, pm2, pm3, pm4, spread, pscale, color, distortion);

    
    color = HSVtoRGB((hue+fxrandom(-.05, .05)+1.)%1., fxrandom(.4, .74)*satsca, bri + fxrandom(-.1, .1)*.8);
    spread = spread*.3;

    if(fxrand() < 2){
        //color = HSVtoRGB((hue+fxrandom(-.05, .05)+1.)%1., fxrandom(.6, .94)*satsca, fxrandom(.46, .67));
    }
    // outline
    drawLine(p1, p2, spread, pscale, color, distortion);
    drawLine(p2, p3, spread, pscale, color, distortion);
    drawLine(p3, p4, spread, pscale, color, distortion);
    drawLine(p4, p1, spread, pscale, color, distortion);

    // kosi bridovi
    drawLine(p1, p5, spread, pscale, color, distortion);
    drawLine(p2, p6, spread, pscale, color, distortion);
    drawLine(p3, p7, spread, pscale, color, distortion);
    
    // zadnji bridovi
    drawLine(p5, p6, spread, pscale, color, distortion);
    drawLine(p6, p7, spread, pscale, color, distortion);
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
        var cubeall = getCubeVertices(cube, pad);

        drawLine(cubeall.p1, cubeall.p5, spread, pscale, color, distortion);
        drawLine(cubeall.p5, cubeall.p6, spread, pscale, color, distortion);
        drawLine(cubeall.p6, cubeall.p7, spread, pscale, color, distortion);
        drawLine(cubeall.p7, cubeall.p3, spread, pscale, color, distortion);
        drawLine(cubeall.p3, cubeall.p4, spread, pscale, color, distortion);
        drawLine(cubeall.p4, cubeall.p1, spread, pscale, color, distortion);
    }
}

function outlineblack(cube, spread, pscale, color, pad, distortion){
    points.material.uniforms.u_diffuse.value = [color[0], color[1], color[2], .002];

    var cubeall = getCubeVertices(cube, pad);

    if(fxrand() > -.5) drawLine(cubeall.p1, cubeall.p2, spread, pscale, color, distortion);
    if(fxrand() > -.5) drawLine(cubeall.p3, cubeall.p4, spread, pscale, color, distortion);
    if(fxrand() > -.5) drawLine(cubeall.p2, cubeall.p3, spread, pscale, color, distortion);
    if(fxrand() > -.5) drawLine(cubeall.p4, cubeall.p1, spread, pscale, color, distortion);

    // kosi bridovi
    if(fxrand() > -.5) drawLine(cubeall.p1, cubeall.p5, spread, pscale, color, distortion);
    if(fxrand() > -.5) drawLine(cubeall.p3, cubeall.p7, spread, pscale, color, distortion);
    if(fxrand() > -.5) drawLine(cubeall.p2, cubeall.p6, spread, pscale, color, distortion);
    
    // zadnji bridovi
    if(fxrand() > -.5) drawLine(cubeall.p6, cubeall.p7, spread, pscale, color, distortion);
    if(fxrand() > -.5) drawLine(cubeall.p5, cubeall.p6, spread, pscale, color, distortion);
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
    
    
    var bw = fxrand() < .5;
    var ncubes = Math.round(fxrandom(3, 7));
    var cubewidth = fxrandom(78, 400)*1.4;
    var cubeheight = fxrandom(78, 400)*2.4;
    if(cubeheight*cubewidth > 100000){
        cubewidth = 100000/cubeheight;
    }
    if(cubewidth * ncubes > canvasWidth*.66){
        //cubewidth = canvasWidth*.66 / ncubes;
    }
    var angle = radians(fxrandom(10, 50));
    angle = radians(fxrandom(5, 88));
    var shrt = fxrandom(.1, .5)*0+fxrandom(.4, 1.3)*1;
    //if(angle > radians(80) && ncubes < 4 && cubewidth < 150)
    //    shrt = fxrandom(1.7, 2.5);
    var cubesinfos = []
    var cubewidtht = cubewidth;
    var minx = 1000000;
    var miny = 1000000;
    var maxx = -1000000;
    var maxy = -1000000;
    var x = 0;
    for(var qq = 0; qq < ncubes; qq++){
        
        x = x + cubewidth;
        var y = fxrandom(-255,255);
        //x = fxrandom(-3, 3);
        //y = fxrandom(-3, 3);
        //cubewidth = fxrandom(55, 400);
        //cubeheight = fxrandom(55, 400);
        
        var x = x;
        var y = y;
        var w = cubewidtht-10;
        var h = cubeheight-10;
        var a = angle;
        var s = shrt;
        cubesinfos.push({
            'x': x,
            'y': y,
            'w': w,
            'h': h,
            'a': a,
            's': s,
        });
    }


    for(var k = 0; k < cubesinfos.length; k++){
        //cubesinfos[k].x -= cx/2;
        //cubesinfos[k].y -= 0*cy;
        var vs = getCubeVertices(cubesinfos[k], 1)
        var vvs = [vs.p1, vs.p2, vs.p3, vs.p4, vs.p5, vs.p6, vs.p7]
        for(var v = 0; v < vvs.length; v++){
            if(vvs[v].x > maxx) maxx = vvs[v].x;
            if(vvs[v].y > maxy) maxy = vvs[v].y;
            if(vvs[v].x < minx) minx = vvs[v].x;
            if(vvs[v].y < miny) miny = vvs[v].y;
        }
    }
    

    var cx = (minx+maxx)/2;
    var cy = (miny+maxy)/2;

    var wi = (maxx-minx);
    var hi = (maxy-miny);

    var scawx = 1.;
    if(wi > baseWidth*.8){
        scawx = 1./(wi/baseWidth)*.8;
    }
    var scawy = 1.;
    if(hi > baseHeight*.8){
        scawy = 1./(hi/baseHeight)*.8;
    }
    var scaw = min(scawx, scawy);
    for(var k = 0; k < cubesinfos.length; k++){
        cubesinfos[k].x -= cx;
        cubesinfos[k].y -= cy;
        cubesinfos[k].x *= scaw;
        cubesinfos[k].y *= scaw;
        cubesinfos[k].w *= scaw;
        cubesinfos[k].h *= scaw;
        var vs = getCubeVertices(cubesinfos[k], 0)

        for(var v = 0; v < vs.length; v++){
            if(vs[v].x > maxx) maxx = vs[v].x;
            if(vs[v].y > maxy) maxy = vs[v].y;
            if(vs[v].x < minx) minx = vs[v].x;
            if(vs[v].y < miny) miny = vs[v].y;
        }
    }

    var hue = fxrandom(.0, 1.);
        hue = fxrandom(.0, 1.);
    var color;
    var distortion = fxrandom(30, 60);
    //hue = .96;

    for(var pad = 18; pad >= 18; pad -= 18*2){
        var hue2 = fxrandom(.0, 1.);
        while(hue2 > .13 && hue2 < .45 || hue2 > .75 && hue2 < .99 || Math.abs(hue-hue2)<.27)
            hue2 = fxrandom(.0, 1.);
        color = HSVtoRGB(hue2, fxrandom(.4, .99), fxrandom(.4, .5)*1.5);
        if(hue2 > .13 && hue2 < .5)
            color = HSVtoRGB(hue2, fxrandom(.4, .55), fxrandom(.4, .5)*1.5);
        if(fxrandom(0, 100) > 95){
            if(fxrand() < .5)
                color = HSVtoRGB(0,0,fxrandom(0.14, 0.18));
            else
                color = HSVtoRGB(0,0,fxrandom(0.9, .99));
        }
        outlineold(cubesinfos, 1.5, 1.0, color, pad, distortion);
        color = HSVtoRGB((hue2+fxrandom(-.07,.07)+1.)%1., fxrandom(.4, .6)*1.5, fxrandom(.4, .5)*1.5);
        //outlineold(cubesinfos, .29, .06, color, pad, distortion);
    }


    
    var arr = [];
    var num = cubesinfos.length;
    for(var k = 0; k < num; k++){
      arr.push(k);
    }
    arr = shuffle(arr);

    var hue = fxrandom(.0, 1.);
        hue = fxrandom(.0, 1.);
    for(var k = 0; k < cubesinfos.length; k++){
        //let cube = cubesinfos[arr[k]];
        let cube = cubesinfos[k];
        var color;
        var distortion = fxrandom(30, 60);
        //hue = .96;
        drawCube(cube.x, cube.y, cube.w, cube.h, angle, shrt, hue, distortion);

        color = HSVtoRGB(0,0,0.08);
        if(bw){
            color = HSVtoRGB(0,0,.8);
        }
        //outlineblack(cube, .505, .018, color, pad, distortion);
        
        color = HSVtoRGB(0,0,0.08);
        if(bw){
            color = HSVtoRGB(0,0,.8);
        }

        hue = (hue + fxrandom(-.06, .06) + 1.)%1.;
        //outlineblack(cube, .05, .018, color, 18, 19);
    }
}


function Rect(x, y, w, h, n) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.n = n;

    this.left = this.x - this.w/2;
    this.right = this.x + this.w/2;
    this.up = this.y + this.h/2;
    this.down = this.y - this.h/2;
}

function stripes(){
    
    var D = baseWidth*.75;
    var color = [0., 0., 1., 1.];
    var spread = 1;
    var pscale = .6;
    var distortion = 6;
      
      // Used like so
    var arr = [];
    var num = 33;
    for(var k = 0; k < num; k++){
      arr.push(k);
    }
    shuffle(arr);

    for(var k = 0; k < num; k++){
        var x = -D/2 + arr[k]*D/num;
        var y = -D/2 + fxrandom(0, 250)*0;
        const p1 = new THREE.Vector2(x, D/2);
        const p2 = new THREE.Vector2(x, y);

        
        var hue = fxrandom(.05, .06);
        var color = HSVtoRGB((hue+fxrandom(-.1, .1)+1.)%1., fxrandom(.66, .74)*1.2, fxrandom(.56, .8));
        if(fxrand() < .5){
            hue = fxrandom(.5905, .590056);
            color = HSVtoRGB((hue+fxrandom(-.1, .1)+1.)%1., fxrandom(.66, .74)*.4, fxrandom(.22, .36));
        }

        drawLine(p1, p2, spread, pscale, color, distortion);

        for(var kk = 0; kk < 3; kk++){
            var yy = p1.y - D/num * Math.round(fxrandom(1, 30))
            const p3 = new THREE.Vector2(x, yy);
            const p4 = new THREE.Vector2(x + D-(arr[k]+2)*20, p3.y);
            var hue = fxrandom(.05, .06);
            var color = HSVtoRGB((hue+fxrandom(-.1, .1)+1.)%1., fxrandom(.66, .74)*1.2, fxrandom(.56, .8));
            if(fxrand() < .5){
                hue = fxrandom(.5905, .590056);
                color = HSVtoRGB((hue+fxrandom(-.1, .1)+1.)%1., fxrandom(.66, .74)*.4, fxrandom(.22, .36));
            }
            drawLine(p3, p4, spread, pscale, color, distortion);
        }
    }
}

function kdtree(){
    var D = baseWidth*.75;
    var squares = [];
    var numits = 4;

    var divi = Math.round(fxrand());

    squares.push(new Rect(0, 0, D, D, numits));

    var firstcut = null;
    for(var it = 0; it < numits; it++){
        var news = [];
        for(var s = 0; s < squares.length; s++){
          var x = squares[s].x;
          var y = squares[s].y;
          var w = squares[s].w;
          var h = squares[s].h;
          var n = squares[s].n;
          var chc = Math.round(fxrand());
          var cut;
          if(it%2 == divi){
          //if(random(100) < 50){
            var p = fxrandom(.3, .7);
            var hh = h*p;
            cut = y - h/2 + h*p;
            var yy = y+h/4;
            news.push(new Rect(x, cut-hh/2, w, hh, it));
            news.push(new Rect(x, cut+(h-hh)/2, w, h-hh, it));
          }
          else{
            var p = fxrandom(.3, .7);
            var ww = w*p;
            cut = x - w/2 + w*p;
            var xx = x+w/4;
            news.push(new Rect(cut-ww/2, y, ww, h, it));
            news.push(new Rect(cut+(w-ww)/2, y, w-ww, h, it));
          }
          if(!firstcut)
              firstcut = cut;
          
        }
        
        squares = [];
        news.forEach(function(e){
          squares.push(e)
        });
    }

    var k1;
    var k2;

    if(divi == 0){
        for(var k = 0; k < squares.length; k++){
            var square = squares[k];
            square.color = [0,0,1,1];
            if(Math.abs(square.down - firstcut) < 0.002 && Math.abs(square.left-(-D/2)) < 0.002 ){
                k1 = k;
            }
            if(Math.abs(square.up - firstcut) < 0.002 && Math.abs(square.left-(-D/2)) < 0.002 ){
                k2 = k;
            }
        }
    }
    if(divi == 1){
        for(var k = 0; k < squares.length; k++){
            var square = squares[k];
            square.color = [0,0,1,1];
            if(Math.abs(square.right - firstcut) < 0.002 && Math.abs(square.up-(+D/2)) < 0.002){
                k1 = k;
            }
            if(Math.abs(square.left - firstcut) < 0.002 && Math.abs(square.up-(+D/2)) < 0.002){
                k2 = k;
            }
        }
    }

    var sq1 = squares[k1];
    var sq2 = squares[k2];

    if(Math.abs(sq1.right-sq2.left) < 0.002){
        if(sq1.h < sq2.h){
            var w1 = sq1.w;
            var h1 = sq1.h;
            var x1 = sq1.x;
            var w2 = sq2.w;
            var h2 = sq2.h;
            var x2 = sq2.x;
            sq1.w = sq1.w + sq2.w;
            sq1.x = sq1.x-w1/2 + sq1.w/2;
            sq2.h = sq2.h - h1;
            sq2.y = sq1.y-h1/2 - sq2.h/2;
        }
        else{
            var w1 = sq1.w;
            var h1 = sq1.h;
            var x1 = sq1.x;
            var w2 = sq2.w;
            var h2 = sq2.h;
            var x2 = sq2.x;
            sq2.w = sq1.w + sq2.w;
            sq2.x = sq1.left + sq2.w/2;
            sq1.h = sq1.h - h2;
            sq1.y = sq2.y-h2/2 - sq1.h/2;
        }
    }
    
    if(Math.abs(sq1.down-sq2.up) < 0.002){
        if(sq1.w < sq2.w){
            var w1 = sq1.w;
            var h1 = sq1.h;
            var x1 = sq1.x;
            var w2 = sq2.w;
            var h2 = sq2.h;
            var x2 = sq2.x;
            sq1.y = sq1.y+sq1.h/2 - (h1+h2)/2;
            sq1.h = h1 + h2;
            sq2.w = sq2.w - sq1.w;
            sq2.x = x1+w1/2 + sq2.w/2;
        }
        else{
            var w1 = sq1.w;
            var h1 = sq1.h;
            var x1 = sq1.x;
            var w2 = sq2.w;
            var h2 = sq2.h;
            var x2 = sq2.x;
            sq2.h = sq1.h + sq2.h;
            sq2.y = sq1.y + sq1.h/2 - sq2.h/2;
            sq1.w = sq1.w - w2;
            sq1.x = x2 + w2/2 + sq1.w/2; 
        }
    }

    //drawLine(new THREE.Vector2(-D/2-inset/2, -D/2-inset/2), new THREE.Vector2(+D/2+inset/2, -D/2-inset/2), spread, pscale, color, distortion);
    //drawLine(new THREE.Vector2(+D/2+inset/2, -D/2-inset/2), new THREE.Vector2(+D/2+inset/2, +D/2+inset/2), spread, pscale, color, distortion);
    //drawLine(new THREE.Vector2(+D/2+inset/2, +D/2+inset/2), new THREE.Vector2(-D/2-inset/2, +D/2+inset/2), spread, pscale, color, distortion);
    //drawLine(new THREE.Vector2(-D/2-inset/2, +D/2+inset/2), new THREE.Vector2(-D/2-inset/2, -D/2-inset/2), spread, pscale, color, distortion);

    var pscale = 1;
    var spread = .5;
    var distortion = 33;
    var hue = fxrandom(.55, .56);
    var color;
    var bw = Math.floor(2*fxrand())*.9;
    var inset = 1;

    squares.forEach(function(square){
        var x = square.x;
        var y = square.y;
        var w = square.w-inset;
        var h = square.h-inset;

        color = [0., 0., 1., 1.];
        color = square.color;
            
        const p1 = new THREE.Vector2(x-w/2, y+h/2);
        const p2 = new THREE.Vector2(x+w/2, y+h/2);
        const p3 = new THREE.Vector2(x+w/2, y-h/2);
        const p4 = new THREE.Vector2(x-w/2, y-h/2);
        
        hue = fxrandom(.05, .06);
        color = HSVtoRGB((hue+fxrandom(-.1, .1)+1.)%1., fxrandom(.66, .74)*1.2, fxrandom(.56, .8));
        if(fxrand() < .5){
            hue = fxrandom(.5905, .590056);
            color = HSVtoRGB((hue+fxrandom(-.1, .1)+1.)%1., fxrandom(.66, .74)*.4, fxrandom(.22, .36));
        }

        var vv = Math.round(fxrand());
        var hue = .57*vv + fxrandom(-.04, .04);
        var sat = .8 - .4*vv;
        var bri = fxrandom(.4, .8)
        color = HSVtoRGB((hue+fxrandom(-.04, .04)+1.)%1., sat, bri);
        fillQuad(p1, p2, p3, p4, spread, pscale, color, 22);

        color = HSVtoRGB(fxrand(), fxrandom(0, .3), 0.);
        //drawLine(p1, p2, .505, .2, color, distortion*.82);
        //drawLine(p2, p3, .505, .2, color, distortion*.82);
        //drawLine(p3, p4, .505, .2, color, distortion*.82);
        //drawLine(p4, p1, .505, .2, color, distortion*.82);

        color = HSVtoRGB(fxrand(), fxrandom(0, .3), .86);
        //drawLine(p1, p2, .051, .09, color, distortion*.5);
        //drawLine(p2, p3, .051, .09, color, distortion*.5);
        //drawLine(p3, p4, .051, .09, color, distortion*.5);
        //drawLine(p4, p1, .051, .09, color, distortion*.5);
        
    });

    
    var color = [0., 0., 1., 1.];
    var spread = 1;
    var pscale = 1;
    var distortion = 16;
    for(var k = 0; k < squares.length; k++){
        var sqq = squares[squares.length-1-k];
        var x = sqq.x;
        var y = sqq.y;
        var w = sqq.w-inset;
        var h = sqq.h-inset;

        color = sqq.color;
        color = [1., .96, 1., 1.];
            
        const p1 = new THREE.Vector2(x-w/2, y+h/2);
        const p2 = new THREE.Vector2(x+w/2, y+h/2);
        const p3 = new THREE.Vector2(x+w/2, y-h/2);
        const p4 = new THREE.Vector2(x-w/2, y-h/2);
        drawLine(p1, p2, spread, pscale, color, distortion);
        drawLine(p2, p3, spread, pscale, color, distortion);
        drawLine(p3, p4, spread, pscale, color, distortion);
        drawLine(p4, p1, spread, pscale, color, distortion);
    }

    hue = fxrandom(.005, .00056);
    color = HSVtoRGB((hue+fxrandom(-.1, .1)+1.)%1., fxrandom(.66, .74)*1.2, fxrandom(.56, .8));
    if(fxrand() < .5){
        hue = fxrandom(.5905, .590056);
        color = HSVtoRGB((hue+fxrandom(-.1, .1)+1.)%1., fxrandom(.66, .74)*.4, fxrandom(.22, .6));
    }
    //drawLine(new THREE.Vector2(-D/2-inset/2, -D/2-inset/2), new THREE.Vector2(+D/2+inset/2, -D/2-inset/2), spread, pscale, color, distortion);
    //drawLine(new THREE.Vector2(+D/2+inset/2, -D/2-inset/2), new THREE.Vector2(+D/2+inset/2, +D/2+inset/2), spread, pscale, color, distortion);
    //drawLine(new THREE.Vector2(+D/2+inset/2, +D/2+inset/2), new THREE.Vector2(-D/2-inset/2, +D/2+inset/2), spread, pscale, color, distortion);
    //drawLine(new THREE.Vector2(-D/2-inset/2, +D/2+inset/2), new THREE.Vector2(-D/2-inset/2, -D/2-inset/2), spread, pscale, color, distortion);
   
}

function createHatch(path){
    if(!path)
        return [];

    var tilt = fxrandom(-100, 100);
    var hatchFromEdge = 13;
    var spaced = new ClipperLib.Paths();
    var co = new ClipperLib.ClipperOffset(2.0, 0.25);
    co.AddPath(path, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
    co.Execute(spaced, -hatchFromEdge);
    
    let spacedPath = [];
    if(!spaced[0])
        return [];
    for(var k = 0; k < spaced[0].length; k++){
        spacedPath.push({"X": spaced[0][k].X, "Y": spaced[0][k].Y})
    }
    path = spacedPath;

    var hatchSpacing = 14;
    var bounds = ClipperLib.JS.BoundsOfPath(path, 1);

    var ccx = (bounds.left + bounds.right)/2;
    var ccy = (bounds.top + bounds.bottom)/2;
    var bwi = Math.abs(bounds.right - bounds.left)*1.4;
    var bhi = Math.abs(bounds.bottom - bounds.top)*1.4;
    var bbb = bwi>bhi ? bwi : bhi;
    var angle = fxrandom(0, 2*3.14159);
    var dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
    var pos0 = new THREE.Vector2(ccx - dir.x*bbb, ccy - dir.y*bbb);
    var pos = new THREE.Vector2(ccx - dir.x*bbb, ccy - dir.y*bbb);
    var steps = Math.round(bbb/hatchSpacing*2);
    var linePath = [];
    var pdir = new THREE.Vector2(dir.y, -dir.x).normalize().multiplyScalar(bbb/2);
    for(var s = 0; s < steps; s++){
        var left = pos.clone().add(pdir).add(pdir).clone();
        var right = pos.clone().sub(pdir).sub(pdir).clone();
        linePath.push({"X":left.x, "Y":left.y});
        linePath.push({"X":right.x, "Y":right.y});
        pos.add(dir.clone().multiplyScalar(hatchSpacing));
    }
    var l1 = pos.clone().sub(pdir).sub(pdir).clone();
    linePath.push({"X":l1.x, "Y":l1.y});
    var l2 = pos0.clone().sub(pdir).sub(pdir).clone();
    linePath.push({"X":l2.x, "Y":l2.y});

    var clippedLines = new ClipperLib.Paths();
    var cpr = new ClipperLib.Clipper();
    cpr.AddPath(linePath, ClipperLib.PolyType.ptSubject, true);
    cpr.AddPath(path, ClipperLib.PolyType.ptClip, true)
    cpr.Execute(ClipperLib.ClipType.ctIntersection, clippedLines);

    var clippedLinePaths = [];
    for(var q = 0; q < clippedLines.length; q++){
        let clippedLinePath = [];
        for(var k = 0; k < clippedLines[q].length; k++){
            clippedLinePath.push({"X": clippedLines[q][k].X, "Y": clippedLines[q][k].Y})
        }
        clippedLinePaths.push(clippedLinePath);
    }

    return clippedLinePaths;
    //return [linePath];
}



function waves(){
    
    var D = baseWidth*.75;
    var pad = 18;
    var pscale = 1;
    var distortion = 12;
    var spread = .6;
    var overshoot = 16;
    var color;
    var num = 100;

    var wii = fxrandom(1.2, 2);
    var depth = fxrandom(300, 300);
    var offs = fxrandom(0, 100);
    var frqs = fxrandom(2, 4);

    for(var k = 0; k < num; k++){
        var y = D/2 - k*D/num;
        //var y = -D/2 + k*D/num;
        

        var segs = 64;
        var pts = [];

        var eyek = 50;
        var eyer = 36;
        var eyel = 28;

        var noseq = segs/2;
        var nosek1 = 52;
        var nosek2 = 52 + Math.round(8, 8);
        var nosew = 4;

        var pts = [];
        for(var q = 0; q < segs; q++){
            var x1 = -D/2 + q*D/segs;

            var v1 = new THREE.Vector2(x1*2, y*4-50);
            var fxy = Math.sqrt(v1.x*v1.x+v1.y*v1.y);
            fxy = 1. - fxy/D*wii;
            fxy = power(fxy, 2);
            if(Math.sqrt(v1.x*v1.x+v1.y*v1.y) >= D/wii) fxy = 0;
            var fxy1 = fxy*depth;

            var dl = Math.sqrt((eyel-q)*(eyel-q) + (eyek-k)*(eyek-k));
            var dr = Math.sqrt((eyer-q)*(eyer-q) + (eyek-k)*(eyek-k));

            var eyeslope;
            eyeslope = fxrandom(2, 4);
            var el = power(1-dl/4, eyeslope);
            if(dl > 4) el = 0;
            el = 33*el;

            eyeslope = fxrandom(2, 4);
            var er = power(1-dr/4, eyeslope);
            if(dr > 4) er = 0;
            er = 33*er;

            var nu = 0;
            var noseslope = fxrandom(2, 4);
            if(k >= nosek1 && k <= nosek2){
                var p1 = map(k, nosek1, nosek2, 0, 1);
                var p2 = power(1-Math.abs(q - noseq)/(p1 * nosew), noseslope);
                if(Math.abs(q-noseq) > (p1 * nosew)) p2 = 0;
                nu = 44*p2*p1;
            }

            var mu = 0;
            if(k == nosek2 + 5 && q > segs/2-5 && q < segs/2+5){
                mu = 8;
            }

            //var yy = y + fxy1 - el - er + nu + mu;
            var dd =  Math.sqrt(v1.x*v1.x+v1.y*v1.y)*.005*frqs+.5;
            var yy = y + fxy1 + 300*0*Math.sin(dd+offs)/dd;

            pts.push([new THREE.Vector2(x1, yy), fxy]);
        }

        color = palette[Math.floor(fxrandom(0, palette.length))];
        color = [color[0]+fxrandom(-.1,.1), color[1]+fxrandom(-.1,.1), color[2]+fxrandom(-.1,.1)]
        for(var p = 0; p < pts.length-1; p++){
            const p1 = pts[p][0];
            const p2 = pts[p+1][0];
            const fxy = pts[p+1][1];
            drawLine(p1, p2, spread+.3*(fxy>.01), pscale, color, distortion, k, true);
        }

    }
}

function polygons(){
    
    var givespace = 13;
    var paths = [];
    for(var k = 0; k < 3; k++){
        var x = fxrandom(-baseWidth/2*.1, baseWidth/2*.1);
        var y = fxrandom(-baseWidth/2*.1, baseWidth/2*.1);
        var radius = fxrandom(300, 380)*1.4;

        let path = [];
        var qs = Math.round(fxrandom(4, 4));
        if(k >= 0){
            //qs *= 18;
        }
        for(var q = 0; q < qs; q++){
            var p = map(q, 0, qs, 0, 1);
            var angle = radians(p*360);
            var r = radius + radius*(-.5 + power(noise((Math.cos(angle)+0.)*1, (Math.sin(angle)+1.)*1, 31.3*k), 3));
            var raa = radians(fxrandom(-360/qs/2, 360/qs/2))*.1;
            var xx = x + r * Math.cos(angle+raa+3.14159/4);
            var yy = y + r * Math.sin(angle+raa+3.14159/4);

            if(k > 0){
                x = fxrandom(-baseWidth/2*.3, baseWidth/2*.3);
                y = fxrandom(-baseWidth/2*.3, baseWidth/2*.3);
                r = radius*.85 + radius*.7*(-.5 + power(noise((Math.cos(angle)+0.)*1, (Math.sin(angle)+1.)*1, 31.3*k), 3));
                raa = radians(fxrandom(-360/qs/2, 360/qs/2))*.1;
                xx = x + 1*r * Math.cos(angle+raa+3.14159/4);
                yy = y + 1*r * Math.sin(angle+raa+3.14159/4);
            }
            path.push({"X":xx, "Y":yy});
        }
        path.push(path[0]);
        paths.push(path);
    }



    var clipped = new ClipperLib.Paths();
    var spaced = new ClipperLib.Paths();
    var cpr = new ClipperLib.Clipper();
    var co = new ClipperLib.ClipperOffset(2.0, 0.25);

    paths.forEach((e, i)=>{if(i>0)co.AddPath(e, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);})
    
    co.Execute(spaced, +givespace);

    var spacedPaths = [];
    for(var q = 0; q < spaced.length; q++){
        let spacedPath = [];
        for(var k = 0; k < spaced[q].length; k++){
            spacedPath.push({"X": spaced[q][k].X, "Y": spaced[q][k].Y})
        }
        spacedPaths.push(spacedPath);
    }

    cpr.AddPath(paths[0], ClipperLib.PolyType.ptSubject, true);
    spacedPaths.forEach((e)=>{cpr.AddPath(e, ClipperLib.PolyType.ptClip, true);})
    cpr.Execute(ClipperLib.ClipType.ctXor, clipped);

    var clippedPaths = [];
    for(var q = 0; q < clipped.length; q++){
        let clippedPath = [];
        for(var k = 0; k < clipped[q].length; k++){
            clippedPath.push({"X": clipped[q][k].X, "Y": clipped[q][k].Y})
        }
        clippedPaths.push(clippedPath);
    }

    var pad = 18;
    var pscale = 1;
    var distortion = 25;
    var spread = .6;
    var overshoot = 16;
    var hue, color;

    var minx = +10000;
    var miny = +10000;
    var maxx = -10000;
    var maxy = -10000;
    for(var k = 0; k < paths.length; k++){
        var bounds = ClipperLib.JS.BoundsOfPath(paths[k], 1);
        if(bounds.left < minx) minx = bounds.left;
        if(bounds.top < miny) miny = bounds.top;
        if(bounds.right > maxx) maxx = bounds.right;
        if(bounds.bottom > maxy) maxy = bounds.bottom;
    }
    var ccx = (minx + maxx)/2;
    var ccy = (miny + maxy)/2;
    var centershift = new THREE.Vector2(-ccx, -ccy);
    var scawx = 1.;
    var wi = (maxx-minx);
    var hi = (maxy-miny);
    if(wi > baseWidth*.8){
        scawx = 1./(wi/baseWidth)*.8;
    }
    var scawy = 1.;
    if(hi > baseHeight*.8){
        scawy = 1./(hi/baseHeight)*.8;
    }
    var scaw = min(scawx, scawy);

    
    var allLines = new ClipperLib.Paths();
    var cpru = new ClipperLib.Clipper();
    cpru.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
    cpru.Execute(ClipperLib.ClipType.ctUnion, allLines);

    var allLinePaths = [];
    for(var q = 0; q < allLines.length; q++){
        let allLinePath = [];
        for(var k = 0; k < allLines[q].length; k++){
            allLinePath.push({"X": allLines[q][k].X, "Y": allLines[q][k].Y})
        }
        allLinePaths.push(allLinePath);
    }

    
    
    for(var s = 0; s < paths.length; s++){
        let path = paths[s];
        hue = fxrandom(0, .77);
        color = HSVtoRGB(hue, 0.1, .3);
        color = palette[0];
        for(var k = 0; k < path.length; k++){
            const p1 = new THREE.Vector2(path[k].X, path[k].Y);
            const p2 = new THREE.Vector2(path[(k+1)%path.length].X, path[(k+1)%path.length].Y);
            const v = p1.clone().sub(p2).normalize();
            p1.add(v.clone().multiplyScalar(fxrandom(overshoot*44,overshoot*44))).add(centershift).multiplyScalar(scaw);
            p2.add(v.clone().multiplyScalar(-fxrandom(overshoot*44,overshoot*44))).add(centershift).multiplyScalar(scaw);
            //if(fxrandom(0, 100) > 90)
            //    drawLine(p1, p2, .08, .027, color, distortion*1);
        }
    }

    
    color = palette[Math.floor(fxrandom(0, palette.length))];
    color = [color[0]+fxrandom(-.1,.1), color[1]+fxrandom(-.1,.1), color[2]+fxrandom(-.1,.1)]
    for(var s = 0; s < allLinePaths.length; s++){
        let path = allLinePaths[s];
        for(var k = 0; k < path.length; k++){
            const p1 = new THREE.Vector2(path[k].X, path[k].Y);
            const p2 = new THREE.Vector2(path[(k+1)%path.length].X, path[(k+1)%path.length].Y);
            const v = p1.clone().sub(p2).normalize();
            p1.add(v.clone().multiplyScalar(fxrandom(0,overshoot))).add(centershift).multiplyScalar(scaw);
            p2.add(v.clone().multiplyScalar(-fxrandom(0,overshoot))).add(centershift).multiplyScalar(scaw);
            //drawLine(p1, p2, 1, 1, color, distortion);
        }
    }

    for(var u = 1; u < paths.length; u++){
        var hatches = createHatch(paths[u]);
        var hue = fxrandom(.0, .7);
        var sat = fxrandom(.4, .97);
        var bri = fxrandom(.4, .97);
        if(hue > 0.1 && hue < .45){
            hue = fxrandom(0.45, 1.05)%1.;
        }
        if(fxrand() < .3){
            hue = fxrandom(0, 0.03);
            sat = fxrandom(.8, .99)
            bri = fxrandom(.5, .99);
        }
        color = HSVtoRGB(hue, sat, bri);
        color = [color[0]+fxrandom(-.1,.1), color[1]+fxrandom(-.1,.1), color[2]+fxrandom(-.1,.1)]
        var xoloff = Math.floor(fxrandom(0, palette.length));
        var colparts = 1 + Math.floor(fxrandom(0, 3));
        var colorful = false;
        if(fxrand() < 1.5){
            colorful = true;
        }
        color = palette[Math.floor(fxrandom(0, palette.length/colparts) + xoloff)%palette.length];
        for(var h = 0; h < hatches.length; h++){
            let path = hatches[h];
            //color = HSVtoRGB(hue, sat+fxrandom(-.3, .0), bri+fxrandom(-.3, .0));
            if(colorful){
                color = palette[Math.floor(fxrandom(0, palette.length/colparts) + xoloff)%palette.length];
            }
            var ccolor = [color[0]+fxrandom(-.1,.1), color[1]+fxrandom(-.1,.1), color[2]+fxrandom(-.1,.1)]
            for(var k = 0; k < path.length; k++){
                const p1 = new THREE.Vector2(path[k].X, path[k].Y);
                const p2 = new THREE.Vector2(path[(k+1)%path.length].X, path[(k+1)%path.length].Y);
                const v = p1.clone().sub(p2).normalize();
                p1.add(v.clone().multiplyScalar(fxrandom(0,0))).add(centershift).multiplyScalar(scaw);
                p2.add(v.clone().multiplyScalar(-fxrandom(0,0))).add(centershift).multiplyScalar(scaw);
                drawLine(p1, p2, spread, pscale, ccolor, distortion*.5, h+k);
            }
        }
    }

    hue = fxrandom(0, .77);
    var hue = fxrandom(.0, .7);
    var sat = fxrandom(.4, .5);
    var bri = fxrandom(.6, .97);
    if(hue > 0.1 && hue < .45){
        sat *= .5;
    }
    for(var s = 0; s < paths.length; s++){
        let path = paths[s];
        color = HSVtoRGB((hue + fxrandom(-.1, .1)+1.)%1, sat, bri);
        if(fxrandom(0, 100) > 90){
            var hue = fxrandom(.0, .7);
            var sat = fxrandom(.4, .5);
            var bri = fxrandom(.6, .97);
            if(hue > 0.1 && hue < .45){
                sat *= .5;
            }
        }
        color = palette[Math.floor(fxrandom(0, palette.length))];
        for(var k = 0; k < path.length; k++){
            const p1 = new THREE.Vector2(path[k].X, path[k].Y);
            const p2 = new THREE.Vector2(path[(k+1)%path.length].X, path[(k+1)%path.length].Y);
            const v = p1.clone().sub(p2).normalize();
            p1.add(v.clone().multiplyScalar(fxrandom(0,overshoot))).add(centershift).multiplyScalar(scaw);
            p2.add(v.clone().multiplyScalar(-fxrandom(0,overshoot))).add(centershift).multiplyScalar(scaw);
            drawLine(p1, p2, spread, pscale, color, distortion);
        }
    }

    for(var k = 0; k < clippedPaths.length; k++){
        let clippedPath = clippedPaths[k];

        /*var hatches = createHatch(clippedPath);
        for(var h = 0; h < hatches.length; h++){
            let path = hatches[h];
            //color = HSVtoRGB(hue, sat+fxrandom(-.3, .0), bri+fxrandom(-.3, .0));
            color = palette[Math.floor(fxrandom(0, palette.length))];
            //color = palette[Math.floor(palette.length*h/hatches.length)];
            var ccolor = [color[0]+fxrandom(-.1,.1), color[1]+fxrandom(-.1,.1), color[2]+fxrandom(-.1,.1)]
            for(var rr = 0; rr < path.length; rr++){
                const p1 = new THREE.Vector2(path[rr].X, path[rr].Y);
                const p2 = new THREE.Vector2(path[(rr+1)%path.length].X, path[(rr+1)%path.length].Y);
                const v = p1.clone().sub(p2).normalize();
                p1.add(v.clone().multiplyScalar(fxrandom(0,0))).add(centershift).multiplyScalar(scaw);
                p2.add(v.clone().multiplyScalar(-fxrandom(0,0))).add(centershift).multiplyScalar(scaw);
                //drawLine(p1, p2, spread, pscale, ccolor, distortion*.5, h+k);
            }
        }*/

        color = palette[Math.floor(fxrandom(0, palette.length))];
        color = [color[0]+fxrandom(-.1,.1), color[1]+fxrandom(-.1,.1), color[2]+fxrandom(-.1,.1)]
        for(var q = 0; q < clippedPath.length; q++){
            const p1 = new THREE.Vector2(clippedPath[q].X, clippedPath[q].Y);
            const p2 = new THREE.Vector2(clippedPath[(q+1)%clippedPath.length].X, clippedPath[(q+1)%clippedPath.length].Y);
            const v = p1.clone().sub(p2).normalize();
            p1.add(v.clone().multiplyScalar(fxrandom(0,overshoot))).add(centershift).multiplyScalar(scaw);
            p2.add(v.clone().multiplyScalar(-fxrandom(0,overshoot))).add(centershift).multiplyScalar(scaw);
            drawLine(p1, p2, spread, pscale, color, distortion);
        }
    }


    
    
}

function midcube(){
    
    
    var angle = radians(fxrandom(10, 50));
    angle = radians(fxrandom(5, 88));
    var shrt = fxrandom(.1, .5)*0+fxrandom(.4, 1.3)*1;
    var cubesinfos = []
        
    var x = fxrandom(-3, 3);
    var y = fxrandom(-3, 3);
    var cubewidth = fxrandom(155, 500);
    var cubeheight = fxrandom(333, 700);
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
        //outlineblack(cube, .505, .018, color, pad, distortion);
        
        color = HSVtoRGB(0,0,0);
        if(fxrand() < .5){
            color = HSVtoRGB(0,0,.8);
        }
        //outlineblack(cube, .05, .018, color, pad, 19);
    })

}

function animate() {
    renderer.setClearColor( 0x929292, 1 );
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

var loader = new THREE.FileLoader();
loader.load('assets/shaders/post.vert',function ( data ) {
    PostProcShader.vertexShader = data;
    
    loader.load('assets/shaders/post.frag',function ( data ) {
        PostProcShader.fragmentShader = data;
        reset();
    });
});

var palettes = [
    'f46036-5b85aa-414770-372248-171123',
    'cfdbd5-e8eddf-f5cb5c-242423-333533',
    '084c61-db504a-e3b505-4f6d7a-56a3a6',
    '177e89-084c61-db3a34-ffc857-323031',
    '32373b-4a5859-f4d6cc-f4b860-c83e4d',
    'c0caad-9da9a0-654c4f-b26e63-cec075',
    'ac80a0-89aae6-3685b5-0471a6-061826',
    'fbf5f3-e28413-000022-de3c4b-c42847',
    'dceed1-aac0aa-736372-a18276-7a918d',
    '12355b-420039-d72638-ffffff-ff570a',
    'e8e1ef-d9fff8-c7ffda-c4f4c7-9bb291',
    '555b6e-89b0ae-bee3db-faf9f9-ffd6ba',
    'de6b48-e5b181-f4b9b2-daedbd-7dbbc3',
    'f55d3e-878e88-f7cb15-ffffff-76bed0',
    'fe5f55-f0b67f-d6d1b1-c7efcf-eef5db',
    'e59f71-ba5a31-0c0c0c-69dc9e-ffffff',
    'bfb48f-564e58-904e55-f2efe9-252627',
    'ba1200-031927-9dd1f1-508aa8-c8e0f4',
]

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16)/255.,
      parseInt(result[2], 16)/255.,
      parseInt(result[3], 16)/255.
    ] : null;
}

for(var k = 0; k < palettes.length; k++){
    let text = palettes[k];
    let cols = text.split('-')
    let caca = [];
    cols.forEach((e)=>{caca.push(hexToRgb(e))});
    shuffle(caca)
    var coco = [];
    caca.forEach((e, i)=>{coco.push([(caca[i][0]+fxrandom(-.2, .2)), (caca[i][1]+fxrandom(-.2, .2)), (caca[i][2]+fxrandom(-.2, .2))])});
    palettes[k] = coco;
}

var palette;

function reset(){

    palette = palettes[Math.floor(fxrandom(0, palettes.length))]

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
    var wh = window.innerHeight || canvas.clientHeight|| body.clientHeight;

    baseWidth = ress-0;
    baseHeight = ress-0;

    var mm = min(ww, wh);
    winScale = mm / baseWidth;
    
    if(ww < ress+16 || wh < ress+16 || true){
        canvasWidth = mm-33*mm/ress;
        canvasHeight = mm-33*mm/ress;
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
    var strands = 333;
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

    renderTarget = new THREE.WebGLRenderTarget(canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio);

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

    //renderer.domElement.style.border = "10px solid black";

        
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
    renderer.setClearColor( 0x929292, 1 );
    renderer.render(scene, camera);
    renderer.setClearColor( 0x929292, 1 );
    renderer.clear();
    //requestAnimationFrame(animate);
    //animate();
    
    renderer.setRenderTarget(null);
    ffmesh.material.uniforms.tDiffuse.value = renderTarget.texture;
    ffmesh.material.uniforms.resolution.value = [canvasWidth*window.devicePixelRatio, canvasHeight*window.devicePixelRatio];
    renderer.render(finalscene, camera);

    //scratch(.4*fxrandom(-baseWidth/2, baseWidth/2), .4*fxrandom(-baseHeight/2, baseHeight/2));
    //cubes();
    //midcube();
    //kdtree();
    //stripes();

    polygons();
    //waves();
    
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
    canvas.style.left = (ww - canvasWidth)/2 + 'px';
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
        var wh = window.innerHeight || canvas.clientHeight|| body.clientHeight;

        baseWidth = ress-0;
        baseHeight = ress-0;

        var mm = min(ww, wh);
        winScale = mm / baseWidth;
        
        if(ww < ress+16 || wh < ress+16 || true){
            canvasWidth = mm-33*mm/ress;
            canvasHeight = mm-33*mm/ress;
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
    
        //renderer.setClearColor( 0x929292, 1 );
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
    //reset();
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

