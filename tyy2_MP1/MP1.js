
/**
 * @file MP1 - dancing logo
 * @author Molly Yang <tyy2@eillinois.edu>  
 * Still need to figure out linear interpolating and delaying the colors on the cat
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

/** @global The ModelView matrix contains any modeling and viewing transformations */
var mvMatrix = glMatrix.mat4.create();

/** @global The Projection matrix contains the ortho or perspective matrix we use */
var pMatrix = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;

/** @global Displaying illinois animation */
var illinois = true;

/** @global Help reset animation when switching */
var changed = false;

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
    
  // Get the positions of the atytributes and uniforms in the shader program     
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor"); 
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMvMatrix"); 
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");

  //Enable the attribute variables we will send data to....     
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
}

/**
 * Populate vertex buffer with data
 */
function loadVertices() {
    vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
    //  top
         -0.5,  0.85,  0.0,
         -0.5,  0.5,  0.0,
         -0.25,  0.5,  0.0,
      
         -0.5,  0.85,  0.0,
         -0.25,  0.5,  0.0,
          0.5,  0.85,  0.0,
      
         -0.25,  0.5,  0.0,
          0.5,  0.85,  0.0,
          0.25,  0.5,  0.0,
      
          0.5,  0.85,  0.0,
          0.25,  0.5,  0.0,
          0.5,  0.5,  0.0,
    // mid
         -0.25,  0.5,  0.0,
          0.25,  0.5,  0.0,
         -0.25, -0.25,  0.0,
      
          0.25,  0.5,  0.0,
         -0.25, -0.25,  0.0,
          0.25, -0.25,  0.0,
    // bottom
         -0.25, -0.25,  0.0,
         -0.5,  -0.25,  0.0,
         -0.5,  -0.6,  0.0,
      
        -0.25, -0.25,  0.0,
          0.25, -0.25,  0.0,
         -0.5,  -0.6,  0.0,
        
          0.25, -0.25,  0.0,
         -0.5,  -0.6,  0.0,
          0.5,  -0.6,  0.0,
      
          0.25, -0.25,  0.0,
          0.5,  -0.6,  0.0, 
          0.5,  -0.25,  0.0,
      
      // boarder
        -0.5,  0.85,  0.0,
        -0.55,  0.9,  0.0,
        -0.55,  0.45,  0.0,
      
        -0.5,  0.85,  0.0,
        -0.5,  0.5,  0.0,
        -0.55,  0.45,  0.0,
      
        -0.5,  0.5,  0.0,
        -0.55,  0.45,  0.0,
        -0.25,  0.5,  0.0,
      
        -0.55,  0.45,  0.0,
        -0.25,  0.5,  0.0,
        -0.3,  0.5,  0.0,
      
        -0.55,  0.45,  0.0,
        -0.25,  0.5,  0.0,
        -0.3,  0.45,  0.0,
      
        -0.25,  0.5,  0.0,
        -0.3,  0.45,  0.0,
        -0.25, -0.25, 0.0,
        
        -0.3,  0.45,  0.0,
        -0.25, -0.25, 0.0,
        -0.3, -0.2,  0.0,
        
        -0.25, -0.25, 0.0,
        -0.3, -0.2,  0.0,
        -0.55,  -0.2,  0.0,
      
        -0.25, -0.25, 0.0,
        -0.5,  -0.25,  0.0,
        -0.55,  -0.2,  0.0,
      
        -0.5,  -0.25,  0.0,
        -0.55,  -0.2,  0.0,
        -0.5,  -0.6,  0.0,
      
        -0.55,  -0.2,  0.0,
        -0.5,  -0.6,  0.0,
        -0.55, -0.65, 0.0,
      
        -0.5,  -0.6,  0.0,
        -0.55, -0.65, 0.0,
         0.55, -0.65, 0.0,
        
        -0.5,  -0.6,  0.0,
         0.55, -0.65, 0.0,
         0.5,  -0.6,  0.0,
        
         0.55, -0.65, 0.0,
         0.5,  -0.6,  0.0,
         0.55,  -0.2, 0.0,
      
         0.5,  -0.6,  0.0,
         0.55,  -0.2, 0.0,
         0.5,  -0.25, 0.0,
      
         0.55,  -0.2, 0.0,
         0.5,  -0.25, 0.0,
         0.25, -0.25,  0.0,
      
         0.55,  -0.2, 0.0,
         0.25, -0.25,  0.0,
         0.3,  -0.2,  0.0,
      
         0.3,  -0.2,  0.0,
         0.25, -0.25,  0.0,
         0.3,  0.45,  0.0,
      
         0.25, -0.25,  0.0,
         0.3,  0.45,  0.0,
         0.25,  0.5,  0.0,
         
         0.3,  0.45,  0.0,
         0.25,  0.5,  0.0,
         0.5,  0.5,  0.0,
        
         0.3,  0.45,  0.0,   
         0.5,  0.5,  0.0,
         0.55,  0.45,  0.0,
      
         0.5,  0.5,  0.0,
         0.55,  0.45,  0.0,
         0.55,  0.9,  0.0,
      
         0.5,  0.5,  0.0,
         0.55,  0.9,  0.0,
         0.5,  0.85,  0.0,
         
         0.55,  0.9,  0.0,
         0.5,  0.85,  0.0,
         -0.5,  0.85,  0.0,
      
         -0.5,  0.85,  0.0,
         0.55,  0.9,  0.0,
         -0.55,  0.9,  0.0,
  ];
    
  var triangleVertices2 = [
    //  top
         -0.5,  0.85,  0.0,
         -0.5,  0.5,  0.0,
         -0.25,  0.5,  0.0,
      
         -0.5,  0.85,  0.0,
         -0.25,  0.5,  0.0,
          0.5,  0.85,  0.0,
      
         -0.25,  0.5,  0.0,
          0.5,  0.85,  0.0,
          0.25,  0.5,  0.0,
      
          0.5,  0.85,  0.0,
          0.25,  0.5,  0.0,
          0.5,  0.5,  0.0,
    // mid
         -0.25,  0.5,  0.0,
          0.25,  0.5,  0.0,
         -0.25, -0.25,  0.0,
      
          0.25,  0.5,  0.0,
         -0.25, -0.25,  0.0,
          0.25, -0.25,  0.0,
    // bottom
         -0.25, -0.25,  0.0,
         -0.5,  -0.25,  0.0,
         -0.5,  -0.6,  0.0,
      
        -0.25, -0.25,  0.0,
          0.25, -0.25,  0.0,
         -0.5,  -0.6,  0.0,
        
          0.25, -0.25,  0.0,
         -0.5,  -0.6,  0.0,
          0.5,  -0.6,  0.0,
      
          0.25, -0.25,  0.0,
          0.5,  -0.6,  0.0, 
          0.5,  -0.25,  0.0,
      
      // boarder
        -0.5,  0.85-0.5,  0.0,
        -0.55,  0.9-0.5,  0.0,
        -0.55,  0.45-0.5,  0.0,
      
        -0.5,  0.85-0.5,  0.0,
        -0.5,  0.5-0.5,  0.0,
        -0.55,  0.45-0.5,  0.0,
      
        -0.5,  0.5-0.5,  0.0,
        -0.55,  0.45-0.5,  0.0,
        -0.25,  0.5-0.5,  0.0,
      
        -0.55,  0.45-0.5,  0.0,
        -0.25,  0.5-0.5,  0.0,
        -0.3,  0.5-0.5,  0.0,
      
        -0.55,  0.45-0.5,  0.0,
        -0.25,  0.5-0.5,  0.0,
        -0.3,  0.45-0.5,  0.0,
      
        -0.25,  0.5-0.5,  0.0,
        -0.3,  0.45-0.5,  0.0,
        -0.25, -0.25-0.5, 0.0,
        
        -0.3,  0.45-0.5,  0.0,
        -0.25, -0.25-0.5, 0.0,
        -0.3, -0.2-0.5,  0.0,
        
        -0.25, -0.25-0.5, 0.0,
        -0.3, -0.2-0.5,  0.0,
        -0.55,  -0.2-0.5,  0.0,
      
        -0.25, -0.25-0.5, 0.0,
        -0.5,  -0.25-0.5,  0.0,
        -0.55,  -0.2-0.5,  0.0,
      
        -0.5,  -0.25-0.5,  0.0,
        -0.55,  -0.2-0.5,  0.0,
        -0.5,  -0.6-0.5,  0.0,
      
        -0.55,  -0.2-0.5,  0.0,
        -0.5,  -0.6-0.5,  0.0,
        -0.55, -0.65-0.5, 0.0,
      
        -0.5,  -0.6-0.5,  0.0,
        -0.55, -0.65-0.5, 0.0,
         0.55, -0.65-0.5, 0.0,
        
        -0.5,  -0.6-0.5,  0.0,
         0.55, -0.65-0.5, 0.0,
         0.5,  -0.6-0.5,  0.0,
        
         0.55, -0.65-0.5, 0.0,
         0.5,  -0.6-0.5,  0.0,
         0.55,  -0.2-0.5, 0.0,
      
         0.5,  -0.6-0.5,  0.0,
         0.55,  -0.2-0.5, 0.0,
         0.5,  -0.25-0.5, 0.0,
      
         0.55,  -0.2-0.5, 0.0,
         0.5,  -0.25-0.5, 0.0,
         0.25, -0.25-0.5,  0.0,
      
         0.55,  -0.2-0.5, 0.0,
         0.25, -0.25-0.5,  0.0,
         0.3,  -0.2-0.5,  0.0,
      
         0.3,  -0.2-0.5,  0.0,
         0.25, -0.25-0.5,  0.0,
         0.3,  0.45-0.5,  0.0,
      
         0.25, -0.25-0.5,  0.0,
         0.3,  0.45-0.5,  0.0,
         0.25,  0.5-0.5,  0.0,
         
         0.3,  0.45-0.5,  0.0,
         0.25,  0.5-0.5,  0.0,
         0.5,  0.5-0.5,  0.0,
        
         0.3,  0.45-0.5,  0.0,   
         0.5,  0.5-0.5,  0.0,
         0.55,  0.45-0.5,  0.0,
      
         0.5,  0.5-0.5,  0.0,
         0.55,  0.45-0.5,  0.0,
         0.55,  0.9-0.5,  0.0,
      
         0.5,  0.5-0.5,  0.0,
         0.55,  0.9-0.5,  0.0,
         0.5,  0.85-0.5,  0.0,
         
         0.55,  0.9-0.5,  0.0,
         0.5,  0.85-0.5,  0.0,
         -0.5,  0.85-0.5,  0.0,
      
         -0.5,  0.85-0.5,  0.0,
         0.55,  0.9-0.5,  0.0,
         -0.55,  0.9-0.5,  0.0,
  ];
    
    var time = Math.abs(Math.sin(degToRad(5*rotAngle)));
    for (var i = 0; i < triangleVertices.length; i++) {
    triangleVertices[i] = lerp(triangleVertices2[i], triangleVertices[i], time);
    }

    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = triangleVertices.length / vertexPositionBuffer.itemSize;
}

/**
 * Linear Interpolation 
 * @param {number} a Start position
 * @param {number} b End position
 * @param {number} t Time between 0 and 1
 * @returns {number} Linear interpolated position
 */
function lerp(a, b, t) {
  return a + t * (b - a);
}

/**
 * Populate color buffer with data
 */
function loadColors() {
    vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
    
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
        0.91, 0.285, 0.0, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
      
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
        0.075, 0.16, 0.295, 1.0,
    ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 105;  
}

/**
 * Populate buffers with data (Illinois)
 */
function setupBuffers() {
  //Generate the vertex positions    
  loadVertices();
    
  //Generate the vertex colors
  loadColors();
}

/**
 * Populate buffers with data (cat)
 */
function mysetupBuffers() {
  
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var mytriangleVertices = [
       // left ear
         0.25/3,  0.2/3,  0.0,
         0.45/3,  0.1/3,  0.0,
         0.3/3,  -0.1/3,  0.0,
      // right ear
         0.9/3,   0.1/3,  0.0,
         1.0/3,  -0.1/3,  0.0,
         1.1/3,   0.2/3,  0.0,
      // face
         0.45/3,  0.1/3,  0.0,
         0.3/3,  -0.1/3,  0.0,
         0.9/3,   0.1/3,  0.0,
      
         0.3/3,  -0.1/3,  0.0,
         0.9/3,   0.1/3,  0.0,
         1.0/3,  -0.1/3,  0.0,
      
         0.3/3,  -0.1/3,  0.0,
         1.0/3,  -0.1/3,  0.0,
         0.3/3,  -0.3/3,  0.0,
      
         1.0/3,  -0.1/3,  0.0,
         0.3/3,  -0.3/3,  0.0,
         1.05/3,  -0.3/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
         1.05/3,  -0.3/3,  0.0,
         0.7/3,  -0.5/3,  0.0,
      // body
         0.3/3,  -0.1/3,  0.0,
         0.3/3,  -0.3/3,  0.0,
        -0.1/3,   0.2/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
        -0.1/3,   0.2/3,  0.0,
        -0.7/3,   0.2/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
        -0.7/3,   0.2/3,  0.0,
        -1.1/3,  -0.2/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
        -1.1/3,  -0.2/3,  0.0,
        -1.2/3,  -0.7/3,  0.0,
         
         0.3/3,  -0.3/3,  0.0,
        -1.2/3,  -0.7/3,  0.0,
        -0.5/3,  -0.9/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
        -0.5/3,  -0.9/3,  0.0,
           0.0,  -0.9/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
           0.0,  -0.9/3,  0.0,
         0.7/3,  -0.5/3,  0.0,
      
           0.0,  -0.9/3,  0.0,
         0.7/3,  -0.5/3,  0.0,
         1.1/3,  -0.7/3,  0.0,
      
         1.05/3,  -0.3/3,  0.0,
         0.7/3,  -0.5/3,  0.0,
         1.1/3,  -0.7/3,  0.0,
      // tail
         -1.2/3,  -0.7/3,  0.0,
        -0.95/3,  -1.1/3,  0.0,
         -0.7/3, -1.05/3,  0.0,
      
        -0.95/3,  -1.1/3,  0.0,
         -0.7/3, -1.05/3,  0.0,
         -0.2/3,  -1.1/3,  0.0,
  ];
  var mytriangleVertices2 = [
       // left ear
         0.25/3,  0.2/3,  0.0,
         0.45/3,  0.1/3,  0.0,
         0.3/3,  -0.1/3,  0.0,
      // right ear
         0.9/3,   0.1/3,  0.0,
         1.0/3,  -0.1/3,  0.0,
         1.1/3,   0.2/3,  0.0,
      // face
         0.45/3,  0.1/3,  0.0,
         0.3/3,  -0.1/3,  0.0,
         0.9/3,   0.1/3,  0.0,
      
         0.3/3,  -0.1/3,  0.0,
         0.9/3,   0.1/3,  0.0,
         1.0/3,  -0.1/3,  0.0,
      
         0.3/3,  -0.1/3,  0.0,
         1.0/3,  -0.1/3,  0.0,
         0.3/3,  -0.3/3,  0.0,
      
         1.0/3,  -0.1/3,  0.0,
         0.3/3,  -0.3/3,  0.0,
         1.05/3,  -0.3/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
         1.05/3,  -0.3/3,  0.0,
         0.7/3,  -0.5/3,  0.0,
      // body
         0.3/3,  -0.1/3,  0.0,
         0.3/3,  -0.3/3,  0.0,
        -0.1/3,   0.2/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
        -0.1/3,   0.2/3,  0.0,
        -0.7/3,   0.2/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
        -0.7/3,   0.2/3,  0.0,
        -1.1/3,  -0.2/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
        -1.1/3,  -0.2/3,  0.0,
        -1.2/3,  -0.7/3,  0.0,
         
         0.3/3,  -0.3/3,  0.0,
        -1.2/3,  -0.7/3,  0.0,
        -0.5/3,  -0.9/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
        -0.5/3,  -0.9/3,  0.0,
           0.0,  -0.9/3,  0.0,
      
         0.3/3,  -0.3/3,  0.0,
           0.0,  -0.9/3,  0.0,
         0.7/3,  -0.5/3,  0.0,
      
           0.0,  -0.9/3,  0.0,
         0.7/3,  -0.5/3,  0.0,
         1.1/3,  -0.7/3,  0.0,
      
         1.05/3,  -0.3/3,  0.0,
         0.7/3,  -0.5/3,  0.0,
         1.1/3,  -0.7/3,  0.0,
      // tail
         -1.2/3,  -0.7/3,  0.0,
         -1.8/3,  -0.6/3,  0.0,
         -2.5/3,  -0.7/3,  0.0,
      
         -1.8/3,  -0.6/3,  0.0,
         -2.5/3,  -0.7/3,  0.0,
         -2.0/3,  -0.5/3,  0.0,
  ];
    
  var time = Math.abs(Math.sin(degToRad(rotAngle)));
  for (var i = 0; i < mytriangleVertices.length; i++) {
    mytriangleVertices[i] = lerp(mytriangleVertices2[i], mytriangleVertices[i], time);
  }
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mytriangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = mytriangleVertices.length / vertexPositionBuffer.itemSize;
    
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    var mycolors = [];
    var offset = 0.01;
    var c = [Math.random(), Math.random(), Math.random(), 1.0];
    for (var i = 0; i < vertexPositionBuffer.numberOfItems; i++) {
        mycolors.push(...[c[0]-offset, c[1]-offset, c[2]-offset, 1.0]);
        offset += 0.01;
    }
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mycolors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = mytriangleVertices.length / vertexPositionBuffer.itemSize; 
}

/**
 * Initialize modelview and projection matrices
 */
function setupUniforms(){
    glMatrix.mat4.ortho(pMatrix,-1,1,-1,1,-1,1);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix); 
    
    // Send the current  ModelView matrix to the vertex shader
    glMatrix.mat4.identity(mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix); 
}

/**
 * Draw model...render a frame (illinois)
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); 
  gl.clear(gl.COLOR_BUFFER_BIT);

  // If these buffers don't change, you can set the atribute pointer just once at 
  //  rather than each frame      
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  
  // Send the current  ModelView matrix to the vertex shader
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    
  // Render the triangle    
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Function updates geometry and repeatedly renders frames. (illinois)
 */
 function animate(now) {
     
  draw();
     
  // Convert the time to seconds
  now *= 0.001;
  // Subtract the previous time from the current time
  var deltaTime = now - previousTime;
     
  // Remember the current time for the next frame.
  previousTime = now;
     
//  elapsedTime += deltaTime;
     
  //Update geometry to rotate speed degrees per second
  rotAngle += 60*deltaTime;
  if (rotAngle > 45)
      rotAngle = -45;
  
  
  glMatrix.mat4.identity(mvMatrix);
  glMatrix.mat4.fromYRotation(mvMatrix, degToRad(rotAngle));
  glMatrix.mat4.scale(mvMatrix, mvMatrix, [rotAngle/40,0.5,0.5]);
  glMatrix.mat4.translate(mvMatrix, mvMatrix, [0,rotAngle/50,0]);
  
  loadVertices();
        
  // ....next frame
   if (changed) {
       changed = false;
       cancelAnimationFrame(requestAnimationId);
   }
   requestAnimationFrame(animate);
   check();
}

/**
 * Draw model...render a frame (cat)
 */
function mydraw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); 
  gl.clear(gl.COLOR_BUFFER_BIT);

  // If these buffers don't change, you can set the atribute pointer just once at 
  //  rather than each frame      
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  
  // Send the current  ModelView matrix to the vertex shader
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    
  // Render the triangle    
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Function updates geometry and repeatedly renders frames. (cat)
 */
 function myanimate(now) {
  draw();
  // Convert the time to seconds
  now *= 0.001;
  // Subtract the previous time from the current time
  deltaTime = now - previousTime;
     
  delay += deltaTime;
     
  // Remember the current time for the next frame.
  previousTime = now;
     
  //Update geometry to rotate speed degrees per second
  rotAngle += deltaTime;
  if (rotAngle > 360.0)
      rotAngle = 0.0;
  
  // ....next frame
   if (changed) {
       changed = false;
       cancelAnimationFrame(requestAnimationId);
   }
   requestAnimationFrame(myanimate);
   check();
}

/**
 * Check the status of the radio button
 */
function check() {
    var pick = document.getElementsByName("choice");
    var tmp = illinois;
    if (pick[0].checked) {
        illinois = true;
        setupShaders();
        setupBuffers();
        animate(now);
    } else if (pick[1].checked) {
        illinois = false;
        setupShaders();
        mysetupBuffers();
        glMatrix.mat4.identity(mvMatrix);
        myanimate(now);

    }
    if (tmp != illinois) changed = true;
}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  console.log("No bugs so far...");
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);   
  requestAnimationFrame(animate); 
}
