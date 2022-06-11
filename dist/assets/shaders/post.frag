#include <common>

uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float ztime;
uniform float flip;
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



float randomNoise(vec2 p) {
return fract(16791.414*sin(7.*p.x+p.y*73.41));
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                        vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float noise3 (in vec2 _st, in float t) {
    vec2 i = floor(_st+t);
    vec2 f = fract(_st+t);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float fbm3 ( in vec2 _st, in float t) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise3(_st, t);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}


// gaussian blur filter modified from Filip S. at intel 
// https://software.intel.com/en-us/blogs/2014/07/15/an-investigation-of-fast-real-time-gpu-based-image-blur-algorithms
// this function takes three parameters, the texture we want to blur, the uvs, and the texelSize
vec3 gaussianBlur( sampler2D t, vec2 texUV, vec2 stepSize ){   
    // a variable for our output                                                                                                                                                                 
    vec3 colOut = vec3( 0.0 );                                                                                                                                   

    // stepCount is 9 because we have 9 items in our array , const means that 9 will never change and is required loops in glsl                                                                                                                                     
    const int stepCount = 9;

    // these weights were pulled from the link above
    float gWeights[stepCount];
        gWeights[0] = 0.10855;
        gWeights[1] = 0.13135;
        gWeights[2] = 0.10406;
        gWeights[3] = 0.07216;
        gWeights[4] = 0.04380;
        gWeights[5] = 0.02328;
        gWeights[6] = 0.01083;
        gWeights[7] = 0.00441;
        gWeights[8] = 0.00157;

    // these offsets were also pulled from the link above
    float gOffsets[stepCount];
        gOffsets[0] = 0.66293;
        gOffsets[1] = 2.47904;
        gOffsets[2] = 4.46232;
        gOffsets[3] = 6.44568;
        gOffsets[4] = 8.42917;
        gOffsets[5] = 10.41281;
        gOffsets[6] = 12.39664;
        gOffsets[7] = 14.38070;
        gOffsets[8] = 16.36501;
    
    // lets loop nine times
    for( int i = 0; i < stepCount; i++ ){  

        // multiply the texel size by the by the offset value                                                                                                                                                               
        vec2 texCoordOffset = gOffsets[i] * stepSize;

        // sample to the left and to the right of the texture and add them together                                                                                                           
        vec3 col = texture2D( t, texUV + texCoordOffset ).xyz + texture2D( t, texUV - texCoordOffset ).xyz; 

        // multiply col by the gaussian weight value from the array
        col *= gWeights[i];

        // add it all up
        colOut +=  col;                                                                                                                               
    }

    // our final value is returned as col out
    return colOut;                                                                                                                                                   
} 

float fff(vec2 st, float seed){

    vec2 q = vec2(0.);
    q.x = fbm3( st + 0.1, seed*.11);
    q.y = fbm3( st + vec2(1.0), seed*.11);
    vec2 r = vec2(0.);
    r.x = fbm3( st + 1.0*q + vec2(1.7,9.2)+ 0.15*seed*0.11, seed*.11);
    r.y = fbm3( st + 1.0*q + vec2(8.3,2.8)+ 0.126*seed*0.11, seed*.11);
    float f = fbm3(st+r, seed*.11);
    float ff = (f*f*f+0.120*f*f+.5*f);

    return ff;
}

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

float power(float p, float g) {
    if (p < 0.5)
        return 0.5 * pow(2.*p, g);
    else
        return 1. - 0.5 * pow(2.*(1. - p), g);
}

void main() {

    vec2 xy = gl_FragCoord.xy;
    vec2 uv = xy / resolution;

    if(flip < 0.1){
        //uv = vec2(uv.x, uv.y);
    }
    if(flip < 1.1){
        //uv = vec2(uv.x, 1.-uv.y);
    }
    if(flip < 2.1){
        //uv = vec2(1.-uv.x, 1.-uv.y);
    }
    if(flip < 3.1){
        //uv = vec2(1.-uv.x, uv.y);
    }
    //uv = vec2(1.-uv.x, 1.-uv.y);
    
    float qq = pow(2.*abs(uv.x-.5), 2.)*.84;

    qq = pow(length((uv - .5)*vec2(.72,1.))/length(vec2(.5)), 2.) * .94;

    vec2 dir = uv - .5;
    dir = vec2(dir.y, -dir.x);
    dir = dir / length(dir);
    dir = vec2(1., 0.);


    float ff = fff(uv*vec2(3., 1.)*3.+seed1*14., seed1);
    ff = ff + .2;
    ff = smoothstep(.6, .9, ff);
    vec4 texelB = blur(uv, ff*.5*1./resolution.x, dir);
    //vec4 texelB2 = blur(uv+vec2(2., 0.)/resolution, ff*5.3*1./resolution.x, dir);

    //float sh1 = power((texelB.r+texelB.g+texelB.b)/3., 5.);
    //float sh2 = power((texelB2.r+texelB2.g+texelB2.b)/3., 5.);
    //float sh = (clamp(sh2-sh1, -1.0, 1.)*3.);
    //vec4 texelB = texture2D(tDiffuse, uv);

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
    vec4 res = texelB + .07*(-.5+rand(xy*.1+mod(ztime*.031, 2.0)));

    gl_FragColor = vec4( res.rgb, 1.0 );

}