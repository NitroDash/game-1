class Floor {
    constructor(geom,shape,top) {
        this.geom=geom;
        if (this.geom) {
            this.geom.matrixAutoUpdate=false;
            this.geom.updateMatrix();
            scene.add(this.geom);
        }
        this.children=[];
        this.shape=shape;
        this.yMax=top;
    }
        
    
    getHeight(c) {
        return this._getHeight(c);
    }
    
    _getHeight(c) {
        return c.intersectsShape(this.shape)?this.yMax:-Infinity;
    }
    
    getNormal(pt) {
        return new THREE.Vector3(0,1,0);
    }
}

class RectFloor extends Floor {
    constructor(x,y,z,w,d,texID) {
        let g=new THREE.Geometry();
        g.vertices.push(new THREE.Vector3(x+w/2,y,z+d/2));
        g.vertices.push(new THREE.Vector3(x+w/2,y,z-d/2));
        g.vertices.push(new THREE.Vector3(x-w/2,y,z-d/2));
        g.vertices.push(new THREE.Vector3(x-w/2,y,z+d/2));
        g.faces.push(new THREE.Face3(0,1,2));
        g.faces.push(new THREE.Face3(0,2,3));
        g.faceVertexUvs[0].push([new THREE.Vector2(0,0),new THREE.Vector2(0,d/4),new THREE.Vector2(w/4,d/4)]);
        g.faceVertexUvs[0].push([new THREE.Vector2(0,0),new THREE.Vector2(w/4,d/4),new THREE.Vector2(w/4,0)]);
        g.computeVertexNormals();
        let geom=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map: getTexture(texID)}));
        super(geom,new Rectangle(x-w/2,z-d/2,w,d),y);
    }
}

class RampFloor extends Floor {
    constructor(p1,p2,w,texID) {
        let geom=new THREE.Geometry();
        let widthVec=new THREE.Vector2(p1.z-p2.z,p2.x-p1.x);
        widthVec.setLength(w/2);
        geom.vertices.push(new THREE.Vector3(p1.x+widthVec.x,p1.y,p1.z+widthVec.y));
        geom.vertices.push(new THREE.Vector3(p2.x+widthVec.x,p2.y,p2.z+widthVec.y));
        geom.vertices.push(new THREE.Vector3(p1.x-widthVec.x,p1.y,p1.z-widthVec.y));
        geom.vertices.push(new THREE.Vector3(p2.x-widthVec.x,p2.y,p2.z-widthVec.y));
        geom.faces.push(new THREE.Face3(0,1,2));
        geom.faceVertexUvs[0].push([new THREE.Vector2(w/4,0),new THREE.Vector2(w/4,Math.hypot(p2.x-p1.x,p2.y-p1.y,p2.z-p1.z)/4),new THREE.Vector2(0,0)]);
        geom.faces.push(new THREE.Face3(2,1,3));
        geom.faceVertexUvs[0].push([new THREE.Vector2(0,0),new THREE.Vector2(w/4,Math.hypot(p2.x-p1.x,p2.y-p1.y,p2.z-p1.z)/4),new THREE.Vector2(0,Math.hypot(p2.x-p1.x,p2.y-p1.y,p2.z-p1.z)/4)]);
        geom.computeFaceNormals();
        let buffer=new THREE.BufferGeometry();
        buffer.fromGeometry(geom);
        super(new THREE.Mesh(buffer,new THREE.MeshLambertMaterial({map: getTexture(texID)})),new Polygon([p1.x+widthVec.x,p2.x+widthVec.x,p2.x-widthVec.x,p1.x-widthVec.x],[p1.z+widthVec.y,p2.z+widthVec.y,p2.z-widthVec.y,p1.z-widthVec.y]),Math.max(p1.y,p2.y));
        this.p1=p1;
        this.p2=p2;
        this.vec=new THREE.Vector2(p2.x-p1.x,p2.z-p1.z);
        this.normal=new THREE.Vector3(widthVec.y*(p1.y-p2.y),widthVec.y*(p2.x-p1.x)-widthVec.x*(p2.z-p1.z),widthVec.x*(p2.y-p1.y));
        this.normal.setLength(1);
    }
    
    _getHeight(c) {
        if (!c.intersectsShape(this.shape)) return -Infinity;
        let r=this.vec.dot(new THREE.Vector2(c.x-this.p1.x,c.z-this.p1.z))/this.vec.lengthSq();
        r=Math.min(Math.max(0,r),1);
        return this.p1.y+r*(this.p2.y-this.p1.y);
    }
    
    getNormal(pt) {
        return this.normal;
    }
}

class PolygonFloor extends Floor {
    constructor(x,z,y,texID) {
        let geom=new THREE.Geometry();
        for (let i=0; i<x.length; i++) {
            geom.vertices.push(new THREE.Vector3(x[i],y,z[i]));
            if (i>1) {
                geom.faces.push(new THREE.Face3(0,i-1,i));
                geom.faceVertexUvs[0].push([new THREE.Vector2(x[0]/4,z[0]/4),new THREE.Vector2(x[i-1]/4,z[i-1]/4),new THREE.Vector2(x[i]/4,z[i]/4)]);
            }
        }
        geom.computeFaceNormals();
        let buffer=new THREE.BufferGeometry();
        buffer.fromGeometry(geom);
        super(new THREE.Mesh(buffer,new THREE.MeshLambertMaterial({map: getTexture(texID)})),new Polygon(x,z),y);
    }
}

class InvisiblePolygonFloor extends Floor {
    constructor(x,z,y) {
        super(null,new Polygon(x,z),y);
    }
}

class TriangleStripFloor extends Floor {
    constructor(points,texID) {
        let geom=new THREE.Geometry();
        let shapes=[];
        let planes=[];
        for (let i=0; i<points.length; i++) {
            geom.vertices.push(points[i]);
            if (i>1) {
                shapes.push(new Polygon([points[i-2].x,points[i-1].x,points[i].x],[points[i-2].z,points[i-1].z,points[i].z]));
                planes.push(new Plane(points[i-2],points[i-1+(i%2)],points[i-(i%2)]));
                geom.faces.push(new THREE.Face3(i-2,i-1+(i%2),i-(i%2)));
                geom.faceVertexUvs[0].push([new THREE.Vector2(points[i-2].x/4,points[i-2].z/4),new THREE.Vector2(points[i-1+(i%2)].x/4,points[i-1+(i%2)].z/4),new THREE.Vector2(points[i-(i%2)].x/4,points[i-(i%2)].z/4)]);
            }
        }
        geom.computeFaceNormals();
        let buffer=new THREE.BufferGeometry();
        buffer.fromGeometry(geom);
        super(new THREE.Mesh(buffer,new THREE.MeshLambertMaterial({map: getTexture(texID)})),null,0);
        this.shapes=shapes;
        this.planes=planes;
    }
    
    _getHeight(c) {
        let p=new THREE.Vector2(c.x,c.z);
        let h=-Infinity;
        for (let i=0; i<this.shapes.length; i++) {
            if (this.shapes[i].contains(p)) {
                return this.planes[i].getY(c.x,c.z);
            } else if (c.intersectsShape(this.shapes[i])) {
                h=this.planes[i].getY(c.x,c.z);
            }
        }
        return h;
    }
    
    getNormal(pt) {
        let closestShape=-1;
        let closestDist=Infinity;
        for (let i=0; i<this.shapes.length; i++) {
            if (this.shapes[i].contains(new THREE.Vector2(pt.x,pt.z))) {
                let n=this.planes[i].normal.clone();
                n.setLength(1);
                return n;
            } else {
                let p=this.shapes[i].getClosestPoint(pt.x,pt.z);
                if (Math.hypot(p.x-pt.x,p.y-pt.z)<closestDist) {
                    closestDist=Math.hypot(p.x-pt.x,p.y-pt.z);
                    closestShape=i;
                }
            }
        }
        let n=this.planes[closestShape].normal.clone();
        n.setLength(1);
        return n;
    }
}

class Shape {
    constructor() {}
    
    contains(p) {return false;}
    intersects(c) {return false;}
}

class Rectangle extends Shape {
    constructor(x,y,w,h) {
        super();
        this.x=x;
        this.y=y;
        this.w=w;
        this.h=h;
    }
    
    contains(p) {
        return p.x>=this.x&&p.y>=this.y&&p.x<=this.x+this.w&&p.y<=this.y+this.h;
    }
    
    intersects(c) {
        return c.x+c.r>=this.x&&c.x-c.r<=this.x+this.w&&c.z+c.r>=this.y&&c.z-c.r<=this.y+this.h;
    }
}

class Segment extends Shape {
    constructor(p1,p2) {
        super();
        this.p1=p1;
        this.p2=p2;
        this.vec=new THREE.Vector2();
        this.vec.subVectors(this.p2,this.p1);
        this.unitPerp=new THREE.Vector2(p1.y-p2.y,p2.x-p1.x);
    }
    
    intersects(c) {
        let ratio=this.getLengthRatio(c.x,c.z);
        if (ratio<=0) {
            return Math.hypot(c.x-this.p1.x,c.z-this.p1.y)<=c.r;
        } else if (ratio>=1) {
            return Math.hypot(c.x-this.p2.x,c.z-this.p2.y)<=c.r;
        } else {
            return Math.hypot(c.x-this.p1.x-ratio*(this.p2.x-this.p1.x),c.z-this.p1.y-ratio*(this.p2.y-this.p1.y))<=c.r;
        }
    }
    
    ejectVector(c) {
        let ratio=this.getLengthRatio(c.x,c.z);
        if (ratio>=0&&ratio<=1) {
            let v=new THREE.Vector2(c.x-this.p1.x-ratio*(this.p2.x-this.p1.x),c.z-this.p1.y-ratio*(this.p2.y-this.p1.y));
            if (v.lengthSq()>=c.r*c.r) return null;
            if (v.dot(this.unitPerp)<0) {
                v.setLength(-c.r-v.length());
                return v;
            } else {
                v.setLength(c.r-v.length());
                return v;
            }
        } else if (ratio<0) {
            let v=new THREE.Vector2(c.x-this.p1.x,c.z-this.p1.y);
            if (v.lengthSq()>=c.r*c.r) return null;
            v.setLength(c.r-v.length());
            return v;
        } else if (ratio>1) {
            let v=new THREE.Vector2(c.x-this.p2.x,c.z-this.p2.y);
            if (v.lengthSq()>=c.r*c.r) return null;
            v.setLength(c.r-v.length());
            return v;
        }
        return null;
    }
    
    getLengthRatio(x,y) {
        return (new THREE.Vector2(x-this.p1.x,y-this.p1.y)).dot(this.vec)/this.vec.lengthSq()
    }
    
    getNormal() {
        return this.unitPerp.clone();
    }
    
    getClosestPoint(x,y) {
        let r=this.getLengthRatio(x,y);
        if (r<=0) return this.p1.clone();
        if (r>=1) return this.p2.clone();
        return new THREE.Vector2(this.p1.x+r*this.vec.x,this.p1.y+r*this.vec.y);
    }
    
    setP1(x,y) {
        this.p1.set(x,y);
        this.update();
    }
    
    setP2(x,y) {
        this.p2.set(x,y);
        this.update();
    }
    
    update() {
        this.vec=new THREE.Vector2(this.p2.x-this.p1.x,this.p2.y-this.p1.y);
        this.unitPerp=new THREE.Vector2(-this.vec.y,this.vec.x);
    }
}

class Polygon extends Shape {
    constructor(x,y) {
        super();
        this.segs=[];
        for (let i=0; i<x.length; i++) {
            this.segs.push(new Segment(new THREE.Vector2(x[i],y[i]),new THREE.Vector2(x[(i+1)%x.length],y[(i+1)%y.length])));
        }
    }
    
    setPoint(index,x,y) {
        this.segs[index].setP1(x,y);
        this.segs[(index+this.segs.length-1)%this.segs.length].setP2(x,y);
    }
    
    contains(p) {
        let crossings=0;
        for (let i=0; i<this.segs.length; i++) {
            if ((this.segs[i].p1.y>p.y)!=(this.segs[i].p2.y>p.y)) {
                let r=(p.y-this.segs[i].p1.y)/(this.segs[i].p2.y-this.segs[i].p1.y);
                if (this.segs[i].p1.x+r*(this.segs[i].p2.x-this.segs[i].p1.x)>p.x) crossings++;
            }
        }
        return crossings%2==1;
    }
    
    intersects(c) {
        if (this.contains(new THREE.Vector2(c.x,c.z))) return true;
        for (let i=0; i<this.segs.length; i++) {
            if (this.segs[i].intersects(c)) return true;
        }
        return false;
    }
    
    getClosestPoint(x,y) {
        let minDist=Infinity;
        let minPt=null;
        for (let i=0; i<this.segs.length; i++) {
            let p=this.segs[i].getClosestPoint(x,y);
            if (Math.hypot(x-p.x,y-p.y)<minDist) {
                minDist=Math.hypot(x-p.x,y-p.y);
                minPt=p;
            }
        }
        return minPt;
    }
}

class Plane {
    constructor(p1,p2,p3) {
        this.normal=new THREE.Vector3(p2.x-p1.x,p2.y-p1.y,p2.z-p1.z);
        let v2=new THREE.Vector3(p3.x-p1.x,p3.y-p1.y,p3.z-p1.z);
        this.normal.cross(v2);
        this.sum=this.normal.dot(p1);
    }
    
    fromNormal(normal, point) {
        this.normal=normal;
        this.sum=this.normal.dot(point);
    }
    
    getY(x,z) {
        if (this.normal.y==0) return 0;
        return (this.sum-x*this.normal.x-z*this.normal.z)/this.normal.y;
    }
}

function planeFromNormal(normal,point) {
    let p=new Plane(new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3());
    p.normal=normal;
    p.sum=p.normal.dot(point);
    return p;
}