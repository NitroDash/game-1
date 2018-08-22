class Wall {
    constructor(texID,points,yMin,yMax) {
        let geom=new THREE.Geometry();
        let l=0;
        for (let i=0; i<points.length; i++) {
            geom.vertices.push(new THREE.Vector3(points[i].x,yMin,points[i].y));
            geom.vertices.push(new THREE.Vector3(points[i].x,yMax,points[i].y));
            if (i>0) {
                let L=Math.hypot(points[i].y-points[i-1].y,points[i].x-points[i-1].x);
                geom.faces.push(new THREE.Face3(i*2-2,i*2,i*2+1));
                geom.faceVertexUvs[0].push([new THREE.Vector2(l/4,0),new THREE.Vector2((l+L)/4,0),new THREE.Vector2((l+L)/4,(yMax-yMin)/4)]);
                geom.faces.push(new THREE.Face3(i*2-2,i*2+1,i*2-1));
                geom.faceVertexUvs[0].push([new THREE.Vector2(l/4,0),new THREE.Vector2((l+L)/4,(yMax-yMin)/4),new THREE.Vector2(l/4,(yMax-yMin)/4)]);
                l+=L;
            }
        }
        geom.computeFaceNormals();
        let buffer=new THREE.BufferGeometry();
        buffer.fromGeometry(geom);
        this.geom=new THREE.Mesh(buffer,new THREE.MeshLambertMaterial({map: getTexture(texID)}));
        scene.add(this.geom);
        this.segs=[];
        for (let i=0; i<points.length-1; i++) {
            this.segs.push(new Segment(new THREE.Vector2(points[i].x,points[i].y),new THREE.Vector2(points[i+1].x,points[i+1].y)));
        }
        this.yMax=yMax;
        this.yMin=yMin;
    }
    
    ejectVector(c) {
        if (c.getBottom()>=this.yMax||c.getTop()<=this.yMin) return null;
        let v=new THREE.Vector2(0,0);
        for (let i=0; i<this.segs.length; i++) {
            let w=this.segs[i].ejectVector(c);
            if (w) v.add(w);
        }
        if (v.lengthSq()>0) return v;
        return null;
    }
    
    getNormal(pt) {
        let testBox=new Cylinder(pt.x,pt.y,pt.z,0.01,0.01);
        for (let i=0; i<this.segs.length; i++) {
            if (this.segs[i].intersects(testBox)) {
                let v=this.segs[i].getNormal();
                return new THREE.Vector3(v.x,0,v.y);
            }
        }
    }
}

class InvisibleWall {
    constructor(points,yMin,yMax) {
        this.segs=[];
        for (let i=0; i<points.length-1; i++) {
            this.segs.push(new Segment(new THREE.Vector2(points[i].x,points[i].y),new THREE.Vector2(points[i+1].x,points[i+1].y)));
        }
        this.yMax=yMax;
        this.yMin=yMin;
    }
    
    ejectVector(c) {
        if (c.getBottom()>=this.yMax||c.getTop()<=this.yMin) return null;
        let v=new THREE.Vector2(0,0);
        for (let i=0; i<this.segs.length; i++) {
            let w=this.segs[i].ejectVector(c);
            if (w) v.add(w);
        }
        if (v.lengthSq()>0) return v;
        return null;
    }
    
    getNormal(pt) {
        let testBox=new Cylinder(pt.x,pt.y,pt.z,0.01,0.01);
        for (let i=0; i<this.segs.length; i++) {
            if (this.segs[i].intersects(testBox)) {
                let v=this.segs[i].getNormal();
                return new THREE.Vector3(v.x,0,v.y);
            }
        }
    }
    
    setFirstVertex(x,z) {
        let v=new THREE.Vector2(x-this.segs[0].p1.x,z-this.segs[0].p1.y);
        for (let i=0; i<this.segs.length; i++) {
            this.segs[i].p1.x+=v.x;
            this.segs[i].p1.y+=v.y;
            this.segs[i].p2.x+=v.x;
            this.segs[i].p2.y+=v.y;
        }
    }
}

class SlopeWall {
    constructor(texID,points,mins,maxs) {
        let geom=new THREE.Geometry();
        let l=0;
        for (let i=0; i<points.length; i++) {
            geom.vertices.push(new THREE.Vector3(points[i].x,mins[i],points[i].y));
            geom.vertices.push(new THREE.Vector3(points[i].x,maxs[i],points[i].y));
            if (i>0) {
                let L=Math.hypot(points[i].y-points[i-1].y,points[i].x-points[i-1].x);
                geom.faces.push(new THREE.Face3(i*2-2,i*2,i*2+1));
                geom.faceVertexUvs[0].push([new THREE.Vector2(l/4,mins[i-1]/4),new THREE.Vector2((l+L)/4,mins[i]/4),new THREE.Vector2((l+L)/4,maxs[i]/4)]);
                geom.faces.push(new THREE.Face3(i*2-2,i*2+1,i*2-1));
                geom.faceVertexUvs[0].push([new THREE.Vector2(l/4,mins[i-1]/4),new THREE.Vector2((l+L)/4,maxs[i]/4),new THREE.Vector2(l/4,maxs[i-1]/4)]);
                l+=L;
            }
        }
        geom.computeFaceNormals();
        let buffer=new THREE.BufferGeometry();
        buffer.fromGeometry(geom);
        this.geom=new THREE.Mesh(buffer,new THREE.MeshLambertMaterial({map: getTexture(texID)}));
        scene.add(this.geom);
        this.segs=[];
        for (let i=0; i<points.length-1; i++) {
            this.segs.push(new Segment(new THREE.Vector2(points[i].x,points[i].y),new THREE.Vector2(points[i+1].x,points[i+1].y)));
        }
        this.mins=mins;
        this.maxs=maxs;
    }
    
    ejectVector(c) {
        let v=new THREE.Vector2(0,0);
        for (let i=0; i<this.segs.length; i++) {
            let r=this.segs[i].getLengthRatio(c.x,c.z);
            if (c.getBottom()<this.maxs[i]+r*(this.maxs[i+1]-this.maxs[i])-0.1&&c.getTop()>this.mins[i]+r*(this.mins[i+1]-this.mins[i])) {
                let w=this.segs[i].ejectVector(c);
                if (w) v.add(w);
            }
        }
        if (v.lengthSq()>0) return v;
        return null;
    }
    
    getNormal(pt) {
        let testBox=new Cylinder(pt.x,pt.y,pt.z,0.01,0.01);
        for (let i=0; i<this.segs.length; i++) {
            if (this.segs[i].intersects(testBox)) {
                let v=this.segs[i].getNormal();
                return new THREE.Vector3(v.x,0,v.y);
            }
        }
    }
}