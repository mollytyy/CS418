/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer <shaffer1@illinois.edu> 
 * @student Molly Yang <tyy2@illinois.edu> 
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");

        this.plane();
        console.log("Terrain: Generated Planes");

        this.normals();
        console.log("Terrain: Generated Normals");
        
        minmax = this.minmax();
        console.log("Got min and max")
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        var vIndex = 3 * (i * (this.div + 1) + j);
        this.vBuffer[vIndex] = v[0];
        this.vBuffer[vIndex+1] = v[1];
        this.vBuffer[vIndex+2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        var vIndex = 3 * (i * (this.div + 1) + j);
        v[0] = this.vBuffer[vIndex];
        v[1] = this.vBuffer[vIndex+1];
        v[2] = this.vBuffer[vIndex+2];
    }
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }

    /**
     * Fill the vertex and buffer arrays 
     */    
    generateTriangles()
    {
        var deltaX = (this.maxX - this.minX) / this.div;
        var deltaY = (this.maxY - this.minY) / this.div;

        // Your code here
        // Setting up vertex buffer
        for (var i = 0; i <= this.div; i++) {
            for (var j = 0; j <= this.div; j++) {
                this.vBuffer.push(this.minX+deltaX*j);
                this.vBuffer.push(this.minY+deltaY*i);
                this.vBuffer.push(0); // z = 0

                // Setting up normal vector
                this.nBuffer.push(0);
                this.nBuffer.push(0);
                this.nBuffer.push(0);
            }
        }
        
        // Setting up face buffer
        for (var i = 0; i < this.div; i++) {
            for (var j = 0; j < this.div; j++) {
                var vIndex = i * (this.div + 1) + j;
                // First triangle
                this.fBuffer.push(vIndex);
                this.fBuffer.push(vIndex+1);
                this.fBuffer.push(vIndex+this.div+1);

                // Secound triangle
                this.fBuffer.push(vIndex+1);
                this.fBuffer.push(vIndex+1+this.div+1);
                this.fBuffer.push(vIndex+this.div+1);
            }
        }
        
        //
        this.numVertices = this.vBuffer.length/3;
        this.numFaces = this.fBuffer.length/3;
    }

    /**
     * Print vertices and triangles to console for debugging
     */
    printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

    /**
     * Generates line values from faces in faceArray
     * to enable wireframe rendering
     */
    generateLines()
    {
        var numTris=this.fBuffer.length/3;
        for(var f=0;f<numTris;f++)
        {
            var fid=f*3;
            this.eBuffer.push(this.fBuffer[fid]);
            this.eBuffer.push(this.fBuffer[fid+1]);
            
            this.eBuffer.push(this.fBuffer[fid+1]);
            this.eBuffer.push(this.fBuffer[fid+2]);
            
            this.eBuffer.push(this.fBuffer[fid+2]);
            this.eBuffer.push(this.fBuffer[fid]);
        }
        
    }

    /**
     * Generate a random plane
     */
    plane() {
        // Using 200 iterations 
        for(var i=0; i<200; i++) {
            // a random point
            var p = [
                (this.maxX-this.minX)*Math.random()+this.minX,
                (this.maxY-this.minY)*Math.random()+this.minY, 0];

            // a random normal vector
            var n = [Math.cos(2*Math.PI*Math.random()),
                    Math.sin(2*Math.PI*Math.random()), 0];

            // test sides of the plane
            for (var j=0; j<=this.div; j++) {
                for (var k=0; k<=this.div; k++) {
                    var v = [0,0,0];
                    this.getVertex(v, j, k);
                    var d = glMatrix.vec3.create(); // distance between vertex and point
                    glMatrix.vec3.subtract(d, v, p);
                    if (glMatrix.vec3.dot(d, n) > 0) {
                        v[2] += 0.005;
                    } else {
                        v[2] -= 0.005;
                    }
                    this.setVertex(v, j, k);
                }
            }
        }
    }

    /**
     * Generate per-vertex normals
     */
    normals() {
        for (var i = 0; i < this.numFaces; i++) {
            
            // vertex ids
            var vid = [this.fBuffer[3*i], this.fBuffer[3*i+1], this.fBuffer[3*i+2]];
            
            // verticies indexes from vertex ids
            var v1 = [this.vBuffer[3*vid[0]], this.vBuffer[3*vid[0]+1], this.vBuffer[3*vid[0]+2]];
            var v2 = [this.vBuffer[3*vid[1]], this.vBuffer[3*vid[1]+1], this.vBuffer[3*vid[1]+2]];
            var v3 = [this.vBuffer[3*vid[2]], this.vBuffer[3*vid[2]+1], this.vBuffer[3*vid[2]+2]];
            
            // n = (v2-v1)X(v3-v1)
            var n = glMatrix.vec3.create();
            var d1 = glMatrix.vec3.create();
            var d2 = glMatrix.vec3.create();

            glMatrix.vec3.sub(d1, v2, v1);
            glMatrix.vec3.sub(d2, v3, v1);
            glMatrix.vec3.cross(n, d1, d2);
            
            for (var j=0; j<3; j++) {
                this.nBuffer[3*vid[j]] += n[0];
                this.nBuffer[3*vid[j]+1] += n[1];
                this.nBuffer[3*vid[j]+2] += n[2];
            }
        }

        // normalize
        for (var i = 0; i < this.numVertices; i++) {
            var n = [this.nBuffer[3*i], this.nBuffer[3*i+1], this.nBuffer[3*i+2]];
            glMatrix.vec3.normalize(n, n);
            this.nBuffer[3*i] = n[0];
            this.nBuffer[3*i+1] = n[1];
            this.nBuffer[3*i+2] = n[2];
        }
    }

    /**
     * Get minimum and maximum height
     */
    minmax()
    {
        var minh = Infinity;
        var maxh = -Infinity;
        for (var i = 0; i < this.numVertices; i++) {
            var h = this.vBuffer[3*i+2];
            if (h < minh) {
                minh = h;
            }
            if (h > maxh) {
                maxh = h;
            }
        }
        return [minh, maxh];
    }
}