

// WebGL context, canvas and shaderprogram objects
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

// View parameters
var eyePt = glMatrix.vec3.fromValues(0.0,0.0,20.0);
var viewDir = glMatrix.vec3.fromValues(0.0,0.0,-1.0);
var up = glMatrix.vec3.fromValues(0.0,1.0,0.0);
var viewPt = glMatrix.vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = glMatrix.mat3.create();

// Create ModelView matrix
var mvMatrix = glMatrix.mat4.create();

//Create Projection matrix
var pMatrix = glMatrix.mat4.create();

var mvMatrixStack = [];

// Light parameters

//light position
var lightx=0.0;
var lighty=0.0;
var lightz=100.0;

//light intensity
var alight =0.0;
var dlight =1.0;
var slight =1.0;

// array of particles 
var particles = [];

add();
// particle positions
var pos = [];
// particle velocities
var v = [];

//-----------------------------------------------------------------
//Color conversion  helper functions
//function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
//function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
//function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
//function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

//-------------------------------------------------------------------------
function planeFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray)
{
    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(maxY-deltaY*i);
           vertexArray.push(0);
       }

    for(var i=0;i<n;i++)
       for(var j=0;j<n;j++)
       {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+(n+1));
           faceArray.push(vid+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+(n+1));
           faceArray.push((vid+1) +(n+1));
       }
    //console.log(vertexArray);
    //console.log(faceArray);
}

//-------------------------------------------------------------------------
/**
 * push a vertex into an array
 * @param {Object} vertex
 * @param {Object} vertex array
 */
function pushVertex(v, vArray)
{
 for(i=0;i<3;i++)
 {
     vArray.push(v[i]);
 }  
}

//-------------------------------------------------------------------------
/**
 * Divide tiangles by lerping to make sphere
 * @param {Object} a point
 * @param {Object} b point
 * @param {Object} c point
 * @param {Object} numSubDivs
 * @param {Object} vertexArray
 * @return {Object} numT or add vertices
 */
function divideTriangle(a,b,c,numSubDivs, vertexArray)
{
    if (numSubDivs>0)
    {
        var numT=0;
        var ab =  vec4.create();
        glMatrix.vec4.lerp(ab,a,b,0.5);
        var ac =  vec4.create();
        glMatrix.vec4.lerp(ac,a,c,0.5);
        var bc =  vec4.create();
        glMatrix.vec4.lerp(bc,b,c,0.5);
        
        numT+=divideTriangle(a,ab,ac,numSubDivs-1, vertexArray);
        numT+=divideTriangle(ab,b,bc,numSubDivs-1, vertexArray);
        numT+=divideTriangle(bc,c,ac,numSubDivs-1, vertexArray);
        numT+=divideTriangle(ab,bc,ac,numSubDivs-1, vertexArray);
        return numT;
    }
    else
    {
        // Add 3 vertices to the array
        
        pushVertex(a,vertexArray);
        pushVertex(b,vertexArray);
        pushVertex(c,vertexArray);
        return 1;
        
    }   
}

//-------------------------------------------------------------------------
/**
 * Divide planes 
 * @param {Object} n
 * @param {Object} minX
 * @param {Object} maxX
 * @param {Object} minY
 * @param {Object} maxY
 * @param {Object} vertexArray
 * @return {Object} numT
 */
function planeFromSubdivision(n, minX,maxX,minY,maxY, vertexArray)
{
    var numT=0;
    var va = glMatrix.vec4.fromValues(minX,minY,0,0);
    var vb = glMatrix.vec4.fromValues(maxX,minY,0,0);
    var vc = glMatrix.vec4.fromValues(maxX,maxY,0,0);
    var vd = glMatrix.vec4.fromValues(minX,maxY,0,0);
    
    numT+=divideTriangle(va,vb,vd,n, vertexArray);
    numT+=divideTriangle(vb,vc,vd,n, vertexArray);
    return numT;
    
}

//-----------------------------------------------------------
/**
 * Divide triangle for spheres 
 * @param {Object} a point
 * @param {Object} b point
 * @param {Object} c point
 * @param {Object} numSubDivs
 * @param {Object} vertexArray
 * @param {Object} normalArray
 * @return {Object} numT or add vertices
 */
function sphDivideTriangle(a,b,c,numSubDivs, vertexArray,normalArray)
{
    if (numSubDivs>0)
    {
        var numT=0;
        
        var ab =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(ab,a,b,0.5);
        glMatrix.vec4.normalize(ab,ab);
        
        var ac =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(ac,a,c,0.5);
        glMatrix.vec4.normalize(ac,ac);
        
        var bc =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(bc,b,c,0.5);
        glMatrix.vec4.normalize(bc,bc);
        
        numT+=sphDivideTriangle(a,ab,ac,numSubDivs-1, vertexArray, normalArray);
        numT+=sphDivideTriangle(ab,b,bc,numSubDivs-1, vertexArray, normalArray);
        numT+=sphDivideTriangle(bc,c,ac,numSubDivs-1, vertexArray, normalArray);
        numT+=sphDivideTriangle(ab,bc,ac,numSubDivs-1, vertexArray, normalArray);
        return numT;
    }
    else
    {
        // Add 3 vertices to the array
        
        pushVertex(a,vertexArray);
        pushVertex(b,vertexArray);
        pushVertex(c,vertexArray);
        
        //normals are the same as the vertices for a sphere
        
        pushVertex(a,normalArray);
        pushVertex(b,normalArray);
        pushVertex(c,normalArray);
        
        return 1;
        
    }   
}

//-------------------------------------------------------------------------
function sphereFromSubdivision(numSubDivs, vertexArray, normalArray)
{
    var numT=0;
    var a = glMatrix.vec4.fromValues(0.0,0.0,-1.0,0);
    var b = glMatrix.vec4.fromValues(0.0,0.942809,0.333333,0);
    var c = glMatrix.vec4.fromValues(-0.816497,-0.471405,0.333333,0);
    var d = glMatrix.vec4.fromValues(0.816497,-0.471405,0.333333,0);
    
    numT+=sphDivideTriangle(a,b,c,numSubDivs, vertexArray, normalArray);
    numT+=sphDivideTriangle(d,c,b,numSubDivs, vertexArray, normalArray);
    numT+=sphDivideTriangle(a,d,b,numSubDivs, vertexArray, normalArray);
    numT+=sphDivideTriangle(a,c,d,numSubDivs, vertexArray, normalArray);
    return numT;
}


    
    


//-------------------------------------------------------------------------
/**
 * Populates buffers with data for spheres
 */
function setupSphereBuffers() {
    
    var sphereSoup=[];
    var sphereNormals=[];
    var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
    console.log("Generated ", numT, " triangles"); 
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                  gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);     
}

//-------------------------------------------------------------------------
/**
 * Draws a sphere from the sphere buffer
 */
function drawSphere(){
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  glMatrix.mat3.fromMat4(nMatrix,mvMatrix);
  glMatrix.mat3.transpose(nMatrix,nMatrix);
  glMatrix.mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = glMatrix.mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
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
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
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

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders(vshader,fshader) {
  vertexShader = loadShaderFromDOM(vshader);
  fragmentShader = loadShaderFromDOM(fshader);
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformDiffuseMaterialColor = gl.getUniformLocation(shaderProgram, "uDiffuseMaterialColor");
  shaderProgram.uniformAmbientMaterialColor = gl.getUniformLocation(shaderProgram, "uAmbientMaterialColor");
  shaderProgram.uniformSpecularMaterialColor = gl.getUniformLocation(shaderProgram, "uSpecularMaterialColor");

  shaderProgram.uniformShininess = gl.getUniformLocation(shaderProgram, "uShininess");    
}


//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32Array} a diffuse material color
 * @param {Float32Array} a ambient material color
 * @param {Float32Array} a specular material color 
 * @param {Float32} the shininess exponent for Phong illumination
 */
function uploadMaterialToShader(dcolor, acolor, scolor,shiny) {
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColor, dcolor);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColor, acolor);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColor, scolor);
    
  gl.uniform1f(shaderProgram.uniformShininess, shiny);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s); 
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    setupSphereBuffers();     
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    var transformVec = glMatrix.vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    glMatrix.mat4.perspective(pMatrix,degToRad(90), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    glMatrix.vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    glMatrix.mat4.lookAt(mvMatrix,eyePt,viewPt,up); 
    // Put light position into VIEW COORDINATES
    //var lightPos = glMatrix.vec4.fromValues(lightx,lighty,lightz,1.0);
    //glMatrix.vec4.transformMat4(lightPos,lightPos,mvMatrix);
    //lightx=lightPos[0];
    //lighty=lightPos[1];
    //lightz=lightPos[2];
 
//    glMatrix.vec3.set(transformVec,20,20,20);
//    glMatrix.mat4.scale(mvMatrix, mvMatrix,transformVec);
//    glMatrix.mat4.translate(mvMatrix, mvMatrix, []);
    
    //Get material color
//    colorVal = Math.floor(Math.random()*255.0);
//    R = colorVal/255.0;
//    G = colorVal/255.0;
//    B = colorVal/255.0;
    
//    R = 1.0;
//    G = 1.0;
//    B = 1.0;
    
    //Get shiny
    shiny = 20;
    
//    uploadLightsToShader([lightx,lighty,lightz],[alight,alight,alight],[dlight,dlight,dlight],[slight,slight,slight]);
//    uploadMaterialToShader([R,G,B],[R,G,B],[1.0,1.0,1.0],shiny);
//    setMatrixUniforms();
//    drawSphere();
    
    for (var i = 0; i < particles.length; i++) {
        mvPushMatrix();
        var p = particles[i];
        glMatrix.mat4.translate(mvMatrix, mvMatrix, p.pos);
//        glMatrix.mat4.scale(mvMatrix, mvMatrix, p.radius);
        
        R = p.R;
        G = p.G;
        B = p.B;
        
        
        uploadLightsToShader([lightx,lighty,lightz],[alight,alight,alight],[dlight,dlight,dlight],[slight,slight,slight]);
        uploadMaterialToShader([R,G,B],[R,G,B],[1.0,1.0,1.0],shiny);
        setMatrixUniforms();
        drawSphere();
        mvPopMatrix();
    }
}

//----------------------------------------------------------------------------------
/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() {
//    lightx= 10.0;
//    lighty= 2.0;
//    lightz= 1.0;
//    alight= 1.0;
//    dlight =40.0;
//    slight =60.0;
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
//  add();
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders("shader-vs","shader-fs");
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    for (var i = 0; i < particles.length; i++) {
        particles[i].velocity();
        particles[i].position();
    }
    draw();
    animate();
}

/**
 * add 7 particles
 */
function add() {
    for (var i = 0; i < 7; i++) {
        particles.push(new Sphere());
    }
}

/**
 * clear
 */
function empty() {
  particles.length = 0;
  console.log("hi");
}