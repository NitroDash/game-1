class Hitbox {
    constructor() {}
    intersects(other) {return false;}
    ejectVector(other) {return null;}
    translate(x,y,z) {}
    setX(x) {}
    setY(y) {}
    setZ(z) {}
    intersectsShape(shp) {return false;}
}

class Cylinder extends Hitbox {
    constructor(x,y,z,h,r) {
        super();
        this.x=x;
        this.y=y;
        this.z=z;
        this.h=h;
        this.r=r;
    }
    
    translate(x,y,z) {
        this.x+=x;
        this.y+=y;
        this.z+=z;
    }
    
    setX(x) {
        this.x=x;
    }
    
    setY(y) {
        this.y=y;
    }
    
    setZ(z) {
        this.z=z;
    }
    
    getBottom() {
        return this.y-this.h/2;
    }
    
    getTop() {
        return this.y+this.h/2;
    }
    
    intersectsShape(shp) {
        return shp.intersects(this);
    }
    
    intersects(other) {
        return other.intersectsCylinder(this);
    }
    
    intersectsCylinder(other) {
        return other.getTop()>=this.getBottom()&&other.getBottom()<=this.getTop()&&Math.hypot(other.x-this.x,other.z-this.z)<=(this.r+other.r);
    }
    
    ejectVector(other) {
        return other.ejectedVectorCylinder(this);
    }
    
    ejectedVectorCylinder(other) {
        if (!this.intersectsCylinder(other)) return null;
        let v=new THREE.Vector3(this.x-other.x,0,this.z-other.z);
        v.setLength(this.r+other.r-v.length());
        return v;
    }
    
    distTo(x,y,z) {
        return Math.hypot(this.x-x,this.y-y,this.z-z);
    }
}