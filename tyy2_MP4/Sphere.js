/**
 * @fileoverview Sphere and its propertiesaaaaaa
 * @author tyy2
 */

/** Class implementing triangle surface mesh. */
class Sphere{   
    /**
     * Initialize members of a TriMesh object
     */
    constructor(){
        this.radius = Math.random();
        this.pos = glMatrix.vec3.create();
        glMatrix.vec3.random(this.pos, 11.0);
        this.v = glMatrix.vec3.create();
        glMatrix.vec3.random(this.v, 10.0);
        console.log(this.v);
        this.R = Math.random();
        this.G = Math.random();
        this.B = Math.random();
        this.a = [0, -7.5, 0];
    }
    
    /**
     * calculate pos
     */
    position() {
        var prev_x = this.pos;
        var dx = glMatrix.vec3.create();
        glMatrix.vec3.scale(dx, this.v, 0.05);
        glMatrix.vec3.add(this.pos, this.pos, dx);
        
        // collision??????
//        if (this.radius+this.pos >= 1 || this.pos-this.radius <= -1) {
//            var r = this.pos - prev_x;
//            var n = [-1,0,0];
//            r -= 2*n*dot(r, n);
//            this.pos[i] = -1;
//            this.v[i] = r*this.v[i];
//        }
        
    for (var i = 0; i < 3; i++) {
      if (this.pos[i] < -11) {
        this.pos[i] = -1;
        this.v[i] = -this.v[i]*0.9;
      }
      if (this.pos[i] > 11) {
        this.pos[i] = 1;
        this.v[i] = -this.v[i]*0.9;
      }
    }
        
    }

    /**
     * calculate velocity v' = vd^t + at
     */
    velocity() {
        glMatrix.vec3.scale(this.v, this.v, Math.pow(0.9, 0.05));
        console.log(this.v);
        var dv = glMatrix.vec3.create();
        glMatrix.vec3.scale(dv, this.a, 0.05);
        glMatrix.vec3.add(this.v, this.v, dv);
        
    }
    
}