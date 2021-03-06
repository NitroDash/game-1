class Carryable extends Entity {
    constructor(geom,x,y,z,h,r,weight,capacity) {
        super(x,y,z,new Cylinder(x,y,z,h,r),geom);
        this.carryable=true;
        this.weight=weight;
        this.capacity=capacity;
        this.numPikmin=0;
        this.pikminRadius=r+0.25;
        this.solid=true;
        for (let i=0; i<this.capacity; i++) {
            this.pikmin.push(null);
        }
        this.normal=new THREE.Vector3(0,1,0);
        this.plane=planeFromNormal(this.normal,this.geom.position);
        this.dest=null;
        this.testDest=-1;
        this.onionProgress=0;
        this.baseY=0;
        this.pikminValue=0;
    }
    
    update(deltaTime) {
        if (this.testDest<0) this.testDest=this.getFinalDest();
        if (this.onionProgress>0) {
            this.onionProgress+=deltaTime;
            if (this.onionProgress>=1) {
                this.onionProgress=1;
                this.despawn();
                graph.onion.spawnPikmin(this.pikminValue);
            }
            this.geom.position.y=this.baseY+this.onionProgress*5;
            this.geom.scale.set(1-this.onionProgress,1-this.onionProgress,1-this.onionProgress);
        }
        this.dy-=GRAVITY*deltaTime;
        let speed=1.5+(this.numPikmin-this.weight)/(this.capacity-this.weight);
        if (this.numPikmin>=this.weight) {
            if (this.dest) {
                if (Math.hypot(this.hitbox.x-this.dest.x,this.hitbox.z-this.dest.y)<speed*deltaTime) {
                    this.hitbox.x=this.dest.x;
                    this.hitbox.z=this.dest.y;
                    this.collideWithTerrain();
                    let next=graph.routeTo(this.dest.z,this.testDest);
                    if (next>=0) {
                        this.dest=new THREE.Vector3(graph.nodes[next].x,graph.nodes[next].z,next);
                    } else if (next==-1) {
                        this.onReachingDest();
                    }
                }
                let v=new THREE.Vector2(this.dest.x-this.hitbox.x,this.dest.y-this.hitbox.z);
                v.setLength(speed);
                this.dx=v.x;
                this.dz=v.y;
            } else {
                let next=graph.getClosestNode(this.hitbox.x,this.hitbox.y,this.hitbox.z);
                this.dest=new THREE.Vector3(graph.nodes[next].x,graph.nodes[next].z,next);
            }
        } else {
            this.dx=0;
            this.dz=0;
            this.dest=null;
            this.testDest=this.getFinalDest();
        }
        this.addD(deltaTime);
        this.collideWithTerrain();
        let v=this.geom.position.clone();
        this.geom.position.set(0,0,0);
        this.geom.lookAt(this.normal);
        let xzN=new THREE.Vector2(this.normal.z,this.normal.x).angle();
        this.geom.rotateZ(-xzN);
        this.geom.position.set(v.x,v.y,v.z);
        this.plane.fromNormal(this.normal,v);
    }
    
    suckToOnion() {
        this.onionProgress=0.001;
        this.baseY=this.geom.position.y;
    }
    
    collideWithTerrain() {
        let currentHeight=-Infinity;
        let aboveFloor=false;
        let floor=0;
        let b=this.hitbox.getBottom();
        for (let i=0; i<floors.length; i++) {
            let h=floors[i].getHeight(this.hitbox);
            if ((Math.abs(h-b)<0.3||(b>h!=b+this.dy*0.02>h))&&h>currentHeight) {
                currentHeight=h;
                floor=i;
            }
            if (isFinite(h)&&this.geom.position.y>h) aboveFloor=true;
        }
        if (isFinite(currentHeight)) {
            this.setBottomY(currentHeight+0.0000001);
            this.normal=floors[floor].getNormal(new THREE.Vector3(this.hitbox.x,this.hitbox.y,this.hitbox.z));
            if (this.normal.lengthSq()==0) {
                console.log(floors[floor]);
            }
            this.hitFloor();
        } else if (!aboveFloor) {
            this.translate(-0.05*this.dx,-0.05*this.dy,-0.05*this.dz);
            this.dx=0;
            this.dz=0;
        }
        for (let i=0; i<walls.length; i++) {
            let v=walls[i].ejectVector(this.hitbox);
            if (v) {
                this.translate(v.x,0,v.y);
            }
        }
    }
    
    getFinalDest() {return 0;}
    
    onReachingDest() {
        this.carryable=false;
        for (let i=0; i<this.pikmin.length; i++) {
            if (this.pikmin[i]) {
                this.pikmin[i].uncarry();
            }
        }
    }
    
    getPikminPosition(index) {
        let theta=Math.PI*2*index/this.capacity;
        let v=new THREE.Vector2(this.hitbox.z+this.pikminRadius*Math.cos(theta),this.hitbox.x+this.pikminRadius*Math.sin(theta));
        return new THREE.Vector3(v.y,this.plane.getY(v.y,v.x),v.x);
    }
    
    hasRoom() {
        return this.numPikmin<this.capacity;
    }
    
    assignPikminIndex(pikmin) {
        for (let i=0; i<this.capacity; i++) {
            if (!this.pikmin[i]) {
                this.pikmin[i]=pikmin;
                this.numPikmin++;
                return i;
            }
        }
        return -1;
    }
    
    removePikmin(pikmin) {
        this.pikmin[pikmin.index]=null;
        this.numPikmin--;
    }
}

function getCircleTexCoord(theta) {
    return new THREE.Vector2(0.5+0.5*Math.cos(theta),0.5-0.5*Math.sin(theta));
}

class Pellet extends Carryable {
    constructor(x,y,z,tex, r, h, amount) {
        let geom=new THREE.Geometry();
        let sides=20;
        let angle=Math.PI*2/sides;
        for (let i=0; i<sides; i++) {
            let theta=i*angle;
            geom.vertices.push(new THREE.Vector3(r*Math.cos(theta),r*Math.sin(theta),h/2));
            geom.vertices.push(new THREE.Vector3(r*Math.cos(theta),r*Math.sin(theta),-h/2));
            if (i>1) {
                geom.faces.push(new THREE.Face3(0,i*2-2,i*2));
                geom.faceVertexUvs[0].push([getCircleTexCoord(0),getCircleTexCoord(angle-theta),getCircleTexCoord(-theta)]);
                geom.faces.push(new THREE.Face3(1,i*2+1,i*2-1));
                geom.faceVertexUvs[0].push([getCircleTexCoord(0),getCircleTexCoord(theta),getCircleTexCoord(theta-angle)]);
            }
            geom.faces.push(new THREE.Face3(i*2,i*2+1,(i*2+2)%(2*sides)));
            geom.faceVertexUvs[0].push([new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2()]);
            geom.faces.push(new THREE.Face3(i*2+1,(i*2+3)%(2*sides),(i*2+2)%(2*sides)));
            geom.faceVertexUvs[0].push([new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2()]);
        }
        geom.computeFaceNormals();
        let buffer=new THREE.BufferGeometry();
        buffer.fromGeometry(geom);
        super(new THREE.Mesh(buffer, new THREE.MeshLambertMaterial({map: tex})),x,y,z,h,r,amount,amount*2);
        this.pikminValue=amount;
    }
    
    getFinalDest() {return graph.onion.node;}
    
    onReachingDest() {
        super.onReachingDest();
        this.suckToOnion();
    }
}

class OnePellet extends Pellet {
    constructor(x,y,z) {
        super(x,y,z,getTexture(6),1,0.5,1);
    }
}

class FivePellet extends Pellet {
    constructor(x,y,z) {
        super(x,y,z,getTexture(7),1.5,0.7,5);
    }
}