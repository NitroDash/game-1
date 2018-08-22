var GRAVITY=30;

var PIKMIN_RECTS=[[1,3],[3,2],[4,3],[5,4],[6,5],[7,6],[8,7],[9,8],[10,10],[15,15]];

class Entity {
    constructor(x,y,z,hitbox,geom) {
        this.geom=geom;
        if (this.geom) {
            this.geom.position.x=x;
            this.geom.position.y=y;
            this.geom.position.z=z;
            scene.add(this.geom);
        }
        this.hitbox=hitbox;
        this.dx=0;
        this.dy=0;
        this.dz=0;
        this.numPikmin=0;
        this.followable=false;
        this.pikmin=[];
        this.isPikmin=false;
    }
    
    update(deltaTime) {}
    
    translate(x,y,z) {
        if (this.geom) {
            this.geom.position.x+=x;
            this.geom.position.y+=y;
            this.geom.position.z+=z;
        }
        if (this.hitbox) {
            this.hitbox.translate(x,y,z);
        }
    }
    
    addD(deltaTime) {
        this.translate(this.dx*deltaTime,this.dy*deltaTime,this.dz*deltaTime);
    }
    
    setPosition(x,y,z) {
        this.setX(x);
        this.setY(y);
        this.setZ(z);
    }
    
    setX(x) {
        if (this.geom) {
            this.geom.position.x=x;
        }
        if (this.hitbox) {
            this.hitbox.setX(x);
        }
    }
    
    setY(y) {
        if (this.geom) {
            this.geom.position.y=y;
        }
        if (this.hitbox) {
            this.hitbox.setY(y);
        }
    }
    
    setBottomY(y) {
        this.setY(y+this.geom.position.y-this.hitbox.getBottom());
    }
    
    setZ(z) {
        if (this.geom) {
            this.geom.position.z=z;
        }
        if (this.hitbox) {
            this.hitbox.setZ(z);
        }
    }
    
    rotate(theta) {
        if (this.geom) {
            this.geom.rotateY(theta);
        }
        if (this.hitbox) {
            this.hitbox.rotate(theta);
        }
    }
    
    collideWithObjects() {
        for (let i=0; i<entities.length; i++) {
            if (entities[i].solid&&entities[i]!==this) {
                let v=entities[i].hitbox.ejectVector(this.hitbox);
                if (v) this.translate(v.x,v.y,v.z);
            }
        }
    }
    
    collideWithTerrain() {
        let currentHeight=-Infinity;
        let aboveFloor=false;
        let b=this.hitbox.getBottom();
        for (let i=0; i<floors.length; i++) {
            let h=floors[i].getHeight(this.hitbox);
            if ((Math.abs(h-b)<0.3||(b>h!=b+this.dy*0.02>h))&&h>currentHeight) {
                currentHeight=h;
            }
            if (isFinite(h)&&this.geom.position.y>h) aboveFloor=true;
        }
        if (isFinite(currentHeight)) {
            this.setBottomY(currentHeight+0.0000001);
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
    
    moveWithCollisions(deltaTime,stepLength) {
        let numSteps=Math.max(1,deltaTime*Math.hypot(this.dx,this.dz)/stepLength);
        for (let i=0; i<numSteps; i++) {
            this.addD(deltaTime/numSteps);
            this.collideWithObjects();
            this.collideWithTerrain();
        }
    }
    
    hitFloor() {
        this.dy=0;
    }
    
    getPikminPosition(index) {
        return new THREE.Vector2(this.geom.position.x,this.geom.position.z);
    }
    
    assignPikminIndex(pikmin) {
        this.pikmin.push(pikmin);
        return this.numPikmin++;
    }
    
    removePikmin(pikmin) {
        if (pikmin.following==this&&this.pikmin.includes(pikmin)) {
            this.pikmin.splice(pikmin.index,1);
            for (let i=pikmin.index; i<this.pikmin.length; i++) {
                this.pikmin[i].index--;
            }
            this.numPikmin--;
        }
    }
}

class Player extends Entity {
    constructor(x,y,z) {
        let geom=new THREE.Mesh(new THREE.BoxBufferGeometry(1,2,1),new THREE.MeshLambertMaterial({color: 0x0000ff}));
        super(x,y,z,new Cylinder(x,y,z,2,0.5),geom);
        this.theta=Math.PI;
        this.speed=0;
        this.MAXSPEED=12;
        this.followable=true;
        this.whistleRadius=0;
    }
    
    update(deltaTime) {
        let addD=new THREE.Vector2(0,0);
        if (keys[0].isDown) {
            addD.x+=Math.cos(camera.theta);
            addD.y+=Math.sin(camera.theta);
        }
        if (keys[1].isDown) {
            addD.x-=Math.cos(camera.theta);
            addD.y-=Math.sin(camera.theta);
        }
        if (keys[2].isDown) {
            addD.x-=Math.sin(camera.theta);
            addD.y+=Math.cos(camera.theta);
        }
        if (keys[3].isDown) {
            addD.x+=Math.sin(camera.theta);
            addD.y-=Math.cos(camera.theta);
        }
        if (addD.lengthSq()>0) {
            this.speed+=deltaTime*30;
            if (this.speed>this.MAXSPEED) this.speed=this.MAXSPEED;
            let angle=addD.angle();
            while(angle-Math.PI>this.theta) {angle-=Math.PI*2;}
            while (angle+Math.PI<this.theta) {angle+=Math.PI*2;}
            this.theta=(angle>this.theta)?Math.min(angle,this.theta+3*deltaTime):Math.max(angle,this.theta-3*deltaTime);
            this.geom.rotation.y=this.theta;
        } else {
            this.speed-=deltaTime*30;
            if (this.speed<0) this.speed=0;
        }
        this.dx=Math.sin(this.theta)*this.speed;
        this.dz=Math.cos(this.theta)*this.speed;
        this.dy-=GRAVITY*deltaTime;
        this.addD(deltaTime);
        this.collideWithObjects();
        this.collideWithTerrain();
        if (camera.followPlayer) {
            if (keys[4].isDown) {
                camera.setDestTheta(this.theta);
            }
            if (keys[9].isPressed) {
                keys[9].isPressed=false;
                camera.setDestPhi(Math.sin(camera.destPhi)>=0.999?Math.PI/4:1.57);
            }
            camera.update(deltaTime);
            camera.position.x=this.geom.position.x-15*Math.sin(camera.theta)*Math.cos(camera.phi);
            camera.position.y=this.geom.position.y+15*Math.sin(camera.phi);
            camera.position.z=this.geom.position.z-15*Math.cos(camera.theta)*Math.cos(camera.phi);
            camera.lookAt(this.geom.position);
        }
        if (keys[5].isPressed) {
            keys[5].isPressed=false;
            if (this.numPikmin>0) {
                let objs=getMouseObjects();
                if (objs.length>0) {
                    this.pikmin[0].throw(new THREE.Vector3(objs[0].point.x,objs[0].point.y+0.5,objs[0].point.z));
                }
            }
        }
        if (keys[8].isPressed) {
            keys[8].isPressed=false;
            for (let i=0; i<entities.length; i++) {
                if (entities[i].isPikmin&&entities[i].following===this) {
                    entities[i].unfollow();
                }
            }
        }
        whistleSphere.geom.visible=false;
        if (keys[6].isDown) {
            this.whistleRadius=Math.min(this.whistleRadius+0.5,10);
            let objs=getMouseObjects();
            if (objs.length>0) {
                whistleSphere.setRadius(this.whistleRadius);
                whistleSphere.setPosition(objs[0].point.x,objs[0].point.y,objs[0].point.z);
                whistleSphere.geom.visible=true;
                for (let i=0; i<entities.length; i++) {
                    if (entities[i].isPikmin&&Math.hypot(entities[i].hitbox.x-objs[0].point.x,entities[i].hitbox.z-objs[0].point.z)<this.whistleRadius&&Math.abs(entities[i].hitbox.y-objs[0].point.y)<=1) {
                        entities[i].whistle(this);
                    }
                }
            }
        } else {
            this.whistleRadius=0;
        }
    }
    
    getPikminPosition(index) {
        let w=0;
        for (let i=0; i<PIKMIN_RECTS.length; i++) {
            if (PIKMIN_RECTS[i][0]*PIKMIN_RECTS[i][1]>=this.numPikmin) {
                w=PIKMIN_RECTS[i][0];
                break;
            }
        }
        let y=1+Math.floor(index/w);
        let x=(index%w+0.5-w/2)*(y%2==0?-1:1);
        let theta=this.theta;
        if (keys[7].isDown) {
            y*=1.5;
            y-=(index%3)/2;
            x/=3;
            theta=(new THREE.Vector2(this.hitbox.z-cursor.geom.position.z,this.hitbox.x-cursor.geom.position.x)).angle();
        }
        return new THREE.Vector2(this.hitbox.x-y*Math.sin(theta)-x*Math.cos(theta),this.hitbox.z-y*Math.cos(theta)+x*Math.sin(theta));
    }
}

class Pikmin extends Entity {
    constructor(x,y,z) {
        super(x,y,z,new Cylinder(x,y,z,1,0.25),new THREE.Mesh(new THREE.BoxBufferGeometry(0.5,1,0.5),new THREE.MeshLambertMaterial({color: 0xff0000})));
        this.following=null;
        this.index=-1;
        this.followPanicCounter=0;
        this.mode=0;
        this.followDist=0;
        this.isPikmin=true;
        this.MAXSPEED=12;
    }
    
    unfollow() {
        if (this.mode==1||this.mode==3) {
            this.following.removePikmin(this);
            this.following=null;
            this.dx=0;
            this.dz=0;
            this.mode=0;
        }
    }
    
    throw(dest) {
        if (this.mode!=1) return;
        this.mode=2;
        this.setPosition(this.following.geom.position.x,this.following.geom.position.y,this.following.geom.position.z);
        let dist=Math.min(Math.hypot(dest.x-this.hitbox.x,dest.z-this.hitbox.z),20);
        this.dy=19;
        let tToTop=this.dy/GRAVITY;
        let maxHeight=this.hitbox.y+tToTop*this.dy-(GRAVITY/2)*tToTop*tToTop;
        if (dest.y>maxHeight) dest.y=maxHeight;
        let tToDest=Math.sqrt((maxHeight-dest.y)*2/GRAVITY);
        let speed=Math.min(dist/(tToTop+tToDest),15);
        let d=new THREE.Vector2(dest.z-this.hitbox.z,dest.x-this.hitbox.x);
        d.setLength(speed);
        this.dx=d.y;
        this.dz=d.x;
        this.geom.rotation.y=d.angle();
        this.following.removePikmin(this);
        this.following=null;
    }
    
    whistle(whistler) {
        if (this.mode==0) {
            this.mode=3;
            this.following=whistler;
            this.updateFollowDist();
        } else if (this.mode==4) {
            this.mode=3;
            this.following.removePikmin(this);
            this.following=whistler;
            this.updateFollowDist();
        } else if (this.mode==7) {
            this.mode=3;
            this.following.removePikmin(this);
            this.following=whistler;
            this.updateFollowDist();
        } else if (this.mode==6) {
            this.mode=3;
            this.following=whistler;
            this.updateFollowDist();
        }
    }
    
    updateFollowDist() {
        if (this.following) this.followDist=Math.hypot(this.following.hitbox.x-this.hitbox.x,this.following.hitbox.y-this.hitbox.y,this.following.hitbox.z-this.hitbox.z);
    }
    
    update(deltaTime) {
        var target;
        var toTarget;
        var v;
        switch(this.mode) {
            case 0:
                for (let i=0; i<entities.length; i++) {
                    if (entities[i]!=this) {
                        if (entities[i].followable&&entities[i].hitbox.intersects(this.hitbox)) {
                            this.following=entities[i];
                            this.followPanicCounter=40;
                            this.index=this.following.assignPikminIndex(this);
                            this.mode=1;
                            break;
                        } else if (entities[i].carryable&&entities[i].hasRoom()&&entities[i].hitbox.intersects(this.hitbox)) {
                            this.following=entities[i];
                            this.index=entities[i].assignPikminIndex(this);
                            this.mode=4;
                            break;
                        } else if (entities[i].carryable&&entities[i].hasRoom()&&entities[i].hitbox.distTo(this.hitbox.x,this.hitbox.y,this.hitbox.z)<6) {
                            this.following=entities[i];
                            this.mode=5;
                            break;
                        } else if (entities[i].workable&&entities[i].workPlane.vectorTo(this.hitbox)&&entities[i].workPlane.vectorTo(this.hitbox).length()<5) {
                            this.following=entities[i];
                            this.mode=6;
                            break;
                        }
                    }
                }
                this.dy-=GRAVITY*deltaTime;
                this.moveWithCollisions(deltaTime,0.5);
                break;
            case 1:
                target=this.following.getPikminPosition(this.index);
                toTarget=new THREE.Vector2(target.y-this.hitbox.z,target.x-this.hitbox.x);
                if (toTarget.lengthSq()>0) {
                    this.geom.rotation.y=toTarget.angle();
                }
                this.dy-=GRAVITY*deltaTime;
                this.dx=Math.sin(this.geom.rotation.y)*this.MAXSPEED;
                this.dz=Math.cos(this.geom.rotation.y)*this.MAXSPEED;
                if (toTarget.length()<this.MAXSPEED*deltaTime) {
                    this.setX(target.x);
                    this.setZ(target.y);
                    this.dx=0;
                    this.dz=0;
                }
                this.moveWithCollisions(deltaTime,0.5);
                if (Math.hypot(toTarget.x,3*(this.hitbox.y-this.following.hitbox.y),toTarget.y)>25) {
                    this.followPanicCounter--;
                    if (this.followPanicCounter<=0) {
                        this.unfollow();
                    }
                } else {
                    this.followPanicCounter=40;
                }
                break;
            case 2:
                this.dy-=GRAVITY*deltaTime;
                this.moveWithCollisions(deltaTime,0.5)
                break;
            case 3:
                target=new THREE.Vector2(this.following.hitbox.x,this.following.hitbox.z);
                toTarget=new THREE.Vector2(target.y-this.hitbox.z,target.x-this.hitbox.x);
                if (toTarget.lengthSq()>0) {
                    this.geom.rotation.y=toTarget.angle();
                }
                this.dy-=GRAVITY*deltaTime;
                this.dx=Math.sin(this.geom.rotation.y)*this.MAXSPEED;
                this.dz=Math.cos(this.geom.rotation.y)*this.MAXSPEED;
                if (toTarget.length()<this.MAXSPEED*deltaTime) {
                    this.setX(target.x);
                    this.setZ(target.y);
                    this.dx=0;
                    this.dz=0;
                }
                this.moveWithCollisions(deltaTime,0.5);
                let oldDist=this.followDist;
                this.updateFollowDist();
                if (Math.hypot(toTarget.x,2*(this.hitbox.y-this.following.hitbox.y),toTarget.y)<=10) {
                    this.followPanicCounter=40;
                    this.index=this.following.assignPikminIndex(this);
                    this.mode=1;
                    break;
                } else if (oldDist<=this.followDist) {
                    this.followPanicCounter--;
                    if (this.followPanicCounter<=0) {
                        this.mode=0;
                        this.dx=0;
                        this.dz=0;
                        this.following=null;
                    }
                } else {
                    this.followPanicCounter=40;
                }
                break;
            case 4:
                v=this.following.getPikminPosition(this.index);
                this.setPosition(v.x,v.y,v.z);
                break;
            case 5:
                target=new THREE.Vector2(this.following.hitbox.x,this.following.hitbox.z);
                toTarget=new THREE.Vector2(target.y-this.hitbox.z,target.x-this.hitbox.x);
                if (toTarget.lengthSq()>0) {
                    this.geom.rotation.y=toTarget.angle();
                }
                this.dy-=GRAVITY*deltaTime;
                this.dx=Math.sin(this.geom.rotation.y)*this.MAXSPEED;
                this.dz=Math.cos(this.geom.rotation.y)*this.MAXSPEED;
                this.addD(deltaTime);
                this.collideWithTerrain();
                if (!this.following.hasRoom()) {
                    this.following=null;
                    this.dx=0;
                    this.dz=0;
                    this.mode=0;
                } else if (this.hitbox.intersects(this.following.hitbox)) {
                    this.index=this.following.assignPikminIndex(this);
                    this.mode=4;
                }
                this.collideWithObjects();
                break;
            case 6:
                v=this.following.workPlane.vectorTo(this.hitbox);
                if (!v) {
                    this.mode=0;
                    this.dx=0;
                    this.dz=0;
                    this.following=null;
                } else if (v.length()<this.MAXSPEED*deltaTime) {
                    this.translate(v.x,0,v.z);
                    this.following.addPikmin(this);
                    this.mode=7;
                } else {
                    v.setLength(this.MAXSPEED);
                    this.dx=v.x;
                    this.dz=v.z;
                    this.dy-=GRAVITY*deltaTime;
                    this.moveWithCollisions(deltaTime,0.5);
                    if (!this.following.workable) {
                        this.following=null;
                        this.dx=0;
                        this.dz=0;
                        this.mode=0;
                    }
                }
                break;
            case 7:
                v=this.following.workPlane.vectorTo(this.hitbox);
                if (!v) {
                    this.mode=0;
                    this.dx=0;
                    this.dz=0;
                    this.following.removePikmin(this);
                    this.following=null;
                    break;
                }
                this.translate(v.x,0,v.z);
                this.dx=0;
                this.dz=0;
                this.dy-=GRAVITY*deltaTime;
                this.moveWithCollisions(deltaTime,0.5);
                break;
        }
    }
    
    workDone() {
        if (this.mode==7) {
            this.following.removePikmin(this);
            this.following=null;
            this.mode=0;
        }
    }
    
    hitFloor() {
        super.hitFloor();
        if (this.mode==2) {
            this.dx=0;
            this.dz=0;
            this.mode=0;
        }
    }
}