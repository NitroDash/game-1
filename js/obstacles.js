class WorkPlane {
    constructor(p1,p2,yMin,yMax) {
        this.seg=new Segment(p1,p2);
        this.yMin=yMin;
        this.yMax=yMax;
    }
    
    intersectsCylinder(c) {
        if (c.getBottom()>this.yMax||c.getTop()<this.yMin) return false;
        return this.seg.intersects(c);
    }
    
    vectorTo(c) {
        if (c.getBottom()>this.yMax||c.getTop()<this.yMin) return null;
        let p=this.seg.getClosestPoint(c.x,c.z);
        return new THREE.Vector3(p.x-c.x,0,p.y-c.z);
    }
    
    setFirstVertex(x,z) {
        let v=new THREE.Vector2(x-this.seg.p1.x,z-this.seg.p1.y);
        this.seg.p1.x=x;
        this.seg.p1.y=z;
        this.seg.p2.x+=v.x;
        this.seg.p2.y+=v.y;
    }
}

class ChangeableTerrain{
    constructor(geom, Floors, Walls) {
        this.geom=geom;
        scene.add(this.geom);
        this.floors=Floors;
        this.walls=Walls;
        for (let i=0; i<this.floors.length; i++) {
            floors.push(this.floors[i]);
        }
        for (let i=0; i<this.walls.length; i++) {
            walls.push(this.walls[i]);
        }
        terrainObjs.push(this.geom);
        this.progress=0;
        this.difficulty=1;
        this.finished=false;
        this.workable=true;
        this.pikmin=[];
    }
    
    update(deltaTime) {}
    
    addPikmin(pikmin) {
        if (!this.pikmin.includes(pikmin)) {
            this.pikmin.push(pikmin);
        }
    }
    
    removePikmin(pikmin) {
        if (this.pikmin.includes(pikmin)) {
            this.pikmin.splice(this.pikmin.indexOf(pikmin),1);
        }
    }
}

class Bridge extends ChangeableTerrain {
    constructor(p1,p2,y) {
        let alongVec=new THREE.Vector3(p2.x-p1.x,0,p2.y-p1.y);
        let rightVec=new THREE.Vector3(p1.y-p2.y,0,p2.x-p1.x);
        let unitAlong=new THREE.Vector3(alongVec.x,0,alongVec.z);
        unitAlong.setLength(1);
        rightVec.setLength(6);
        let floorGeom=new THREE.Geometry();
        floorGeom.vertices.push(new THREE.Vector3(rightVec.x,0.001,rightVec.z));
        floorGeom.vertices.push(new THREE.Vector3(alongVec.x+rightVec.x,0.001,alongVec.z+rightVec.z));
        floorGeom.vertices.push(new THREE.Vector3(alongVec.x-rightVec.x,0.001,alongVec.z-rightVec.z));
        floorGeom.vertices.push(new THREE.Vector3(-rightVec.x,0.001,-rightVec.z));
        floorGeom.faces.push(new THREE.Face3(0,1,2));
        floorGeom.faceVertexUvs[0].push([new THREE.Vector2(1,0),new THREE.Vector2(1,0),new THREE.Vector2(0,0)]);
        floorGeom.faces.push(new THREE.Face3(0,2,3));
        floorGeom.faceVertexUvs[0].push([new THREE.Vector2(1,0),new THREE.Vector2(0,0),new THREE.Vector2(0,0)]);
        floorGeom.computeFaceNormals();
        let floorBuffer=new THREE.BufferGeometry();
        floorBuffer.fromGeometry(floorGeom);
        let floorObj=new THREE.Mesh(floorBuffer,new THREE.MeshLambertMaterial({map: getTexture(3)}));
        floorObj.add(new THREE.Object3D());
        floorObj.children[0].position.set(0,1.8,0);
        floorObj.children[0].rotateY(new THREE.Vector2(alongVec.z,alongVec.x).angle());
        let rollGeom=new THREE.Geometry();
        let theta=0;
        for (let i=0; i<10; i++) {
            theta=i*Math.PI/5;
            rollGeom.vertices.push(new THREE.Vector3(-6,2*Math.sin(theta),2*Math.cos(theta)));
            rollGeom.vertices.push(new THREE.Vector3(6,2*Math.sin(theta),2*Math.cos(theta)));
            rollGeom.faces.push(new THREE.Face3(i*2,i*2+1,(i*2+3)%20));
            rollGeom.faceVertexUvs[0].push([new THREE.Vector2(0,0.25*theta),new THREE.Vector2(1,0.25*theta),new THREE.Vector2(1,0.25*(theta+Math.PI/5))]);
            rollGeom.faces.push(new THREE.Face3(i*2,(i*2+3)%20,(i*2+2)%20));
            rollGeom.faceVertexUvs[0].push([new THREE.Vector2(0,0.25*theta),new THREE.Vector2(1,0.25*(theta+Math.PI/5)),new THREE.Vector2(0,0.25*(theta+Math.PI/5))]);
            rollGeom.faces.push(new THREE.Face3(20,i*2,(i*2+2)%20));
            rollGeom.faces.push(new THREE.Face3(21,(i*2+3)%20,i*2+1));
            rollGeom.faceVertexUvs[0].push([new THREE.Vector2(0,0),new THREE.Vector2(0,0),new THREE.Vector2(0,0)]);
            rollGeom.faceVertexUvs[0].push([new THREE.Vector2(0,0),new THREE.Vector2(0,0),new THREE.Vector2(0,0)]);
        }
        rollGeom.vertices.push(new THREE.Vector3(-6,0,0));
        rollGeom.vertices.push(new THREE.Vector3(6,0,0));
        rollGeom.computeFaceNormals();
        let rollBuffer=new THREE.BufferGeometry();
        rollBuffer.fromGeometry(rollGeom);
        floorObj.children[0].add(new THREE.Mesh(rollBuffer,new THREE.MeshLambertMaterial({map: getTexture(3)})));
        super(floorObj,[new InvisiblePolygonFloor([p1.x+rightVec.x,p1.x+rightVec.x,p1.x-rightVec.x,p1.x-rightVec.x],[p1.y+rightVec.z,p1.y+rightVec.z,p1.y-rightVec.z,p1.y-rightVec.z],y)],[new InvisibleWall([new THREE.Vector2(p1.x+rightVec.x-unitAlong.x*1.8,p1.y+rightVec.z-unitAlong.z*1.8),new THREE.Vector2(p1.x+rightVec.x+unitAlong.x*1.8,p1.y+rightVec.z+unitAlong.z*1.8),new THREE.Vector2(p1.x-rightVec.x+unitAlong.x*1.8,p1.y-rightVec.z+unitAlong.z*1.8),new THREE.Vector2(p1.x-rightVec.x-unitAlong.x*1.8,p1.y-rightVec.z-unitAlong.z*1.8),new THREE.Vector2(p1.x+rightVec.x-unitAlong.x*1.8,p1.y+rightVec.z-unitAlong.z*1.8)],y,y+4)]);
        this.alongVec=alongVec;
        this.unitAlong=unitAlong;
        this.rightVec=rightVec;
        floorObj.position.set(p1.x,y,p1.y);
        this.p1=p1;
        this.length=this.alongVec.length();
        this.difficulty=0.1/this.length;
        this.workPlane=new WorkPlane(new THREE.Vector2(p1.x+rightVec.x*0.7-unitAlong.x*2,p1.y+rightVec.z*0.7-unitAlong.z*2),new THREE.Vector2(p1.x-rightVec.x*0.7-unitAlong.x*2,p1.y-rightVec.z*0.7-unitAlong.z*2),y,y+1);
        this.updateProgress();
    }
    
    update(deltaTime) {
        if (!this.finished) {
            if (this.pikmin.length>0) {
                this.geom.children[0].children[0].rotateX(this.difficulty*deltaTime*this.pikmin.length*this.length*0.5);
                this.progress+=this.difficulty*deltaTime*this.pikmin.length;
                this.updateProgress();
            }
        }
    }
    
    updateProgress() {
        if (this.progress>=1) {
            this.progress=1;
            this.finished=true;
            this.geom.children[0].children[0].visible=false;
            this.workable=false;
            while (this.pikmin.length>0) {
                this.pikmin[0].workDone();
            }
            this.walls[0].yMin=1000;
            this.walls[0].yMax=1000;
        }
        this.geom.children[0].position.set(this.alongVec.x*this.progress,1.8,this.alongVec.z*this.progress);
        this.geom.geometry.attributes.position.array[3]=this.alongVec.x*this.progress+this.rightVec.x;
        this.geom.geometry.attributes.position.array[5]=this.alongVec.z*this.progress+this.rightVec.z;
        this.geom.geometry.attributes.position.array[6]=this.alongVec.x*this.progress-this.rightVec.x;
        this.geom.geometry.attributes.position.array[8]=this.alongVec.z*this.progress-this.rightVec.z;
        this.geom.geometry.attributes.position.array[12]=this.geom.geometry.attributes.position.array[6];
        this.geom.geometry.attributes.position.array[14]=this.geom.geometry.attributes.position.array[8];
        this.geom.geometry.attributes.position.needsUpdate=true;
        this.geom.geometry.computeBoundingSphere();
        let progressV=this.progress*this.length/12;
        this.geom.geometry.attributes.uv.array[3]=progressV;
        this.geom.geometry.attributes.uv.array[5]=progressV;
        this.geom.geometry.attributes.uv.array[9]=progressV;
        this.geom.geometry.attributes.uv.needsUpdate=true;
        this.floors[0].shape.setPoint(1,this.p1.x+this.alongVec.x*this.progress+this.rightVec.x,this.p1.y+this.alongVec.z*this.progress+this.rightVec.z);
        this.floors[0].shape.setPoint(2,this.p1.x+this.alongVec.x*this.progress-this.rightVec.x,this.p1.y+this.alongVec.z*this.progress-this.rightVec.z);
        this.walls[0].setFirstVertex(this.p1.x-this.unitAlong.x*1.8+this.alongVec.x*this.progress+this.rightVec.x,this.p1.y-this.unitAlong.z*1.8+this.alongVec.z*this.progress+this.rightVec.z);
        this.workPlane.setFirstVertex(this.p1.x-this.unitAlong.x*2+this.alongVec.x*this.progress+this.rightVec.x*0.7,this.p1.y-this.unitAlong.z*2+this.alongVec.z*this.progress+this.rightVec.z*0.7);
    }
}