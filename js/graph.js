class MapGraph {
    constructor() {
        this.nodes=[];
        this.searchNodes=[];
        this.minDists=[];
    }
    
    addNode(node) {
        this.nodes.push(node);
        this.minDists.push(0);
    }
    
    calculateDistances() {
        for (let i=0; i<this.nodes.length; i++) {
            for (let j=0; j<this.nodes[i].links.length; j++) {
                this.nodes[i].dists[j]=this.nodes[i].distTo(this.nodes[this.nodes[i].links[j]]);
            }
        }
    }
    
    routeTo(current, target) {
        for (let i=0; i<this.minDists.length; i++) {
            this.minDists[i]=Infinity;
        }
        this.searchNodes=[new SearchNode(target,-1)];
        this.searchNodes[0].set(this.nodes[current].distTo(this.nodes[target]),0);
        while (this.searchNodes[0]&&this.searchNodes[0].id!==current) {
            this.addSearchNodes(this.searchNodes[0].id,current,this.searchNodes[0].path);
        }
        return this.searchNodes[0]?this.searchNodes[0].last:-2;
    }
    
    addSearchNodes(current,target,pathLength) {
        for (let i=0; i<this.nodes[current].links.length; i++) {
            let newNode=new SearchNode(this.nodes[current].links[i],current);
            newNode.set(this.nodes[this.nodes[current].links[i]].distTo(this.nodes[target]),pathLength+this.nodes[current].distTo(this.nodes[this.nodes[current].links[i]]));
            if (newNode.path<this.minDists[newNode.id]) {
                for (let j=this.searchNodes.length-1; j>=0; j--) {
                    if (this.searchNodes[j].id==newNode.id) {
                        if (this.searchNodes[j].getWeight()>newNode.getWeight()) {
                            this.searchNodes.splice(j,1);
                        } else {
                            break;
                        }
                    } else if (this.searchNodes[j].getWeight()<=newNode.getWeight()) {
                        this.searchNodes.splice(j+1,0,newNode);
                        this.minDists[newNode.id]=newNode.path;
                        break;
                    }
                }
            }
        }
        this.searchNodes.splice(0,1);
    }
    
    getClosestNode(x,y,z) {
        let minDist=Infinity;
        let minNode=-1;
        for (let i=0; i<this.nodes.length; i++) {
            let d=Math.hypot(this.nodes[i].x-x,this.nodes[i].y-y,this.nodes[i].z-z);
            if (d<minDist) {
                minDist=d;
                minNode=i;
            }
        }
        return minNode;
    }
    
    clear() {
        this.nodes=[];
        this.minDists=[];
        this.searchNodes=[];
    }
}

class SearchNode {
    constructor(id,last) {
        this.id=id;
        this.path=Infinity;
        this.last=last;
    }
    
    getWeight() {
        return this.dist+this.path;
    }
    
    set(dist, path) {
        this.dist=dist;
        this.path=path;
    }
}

class MapGraphNode {
    constructor(x,y,z,links) {
        this.x=x;
        this.y=y;
        this.z=z;
        this.links=links;
        this.dists=[];
        for (let i=0; i<links.length; i++) {
            this.dists.push(-1);
        }
    }
    
    distTo(node) {
        return Math.hypot(this.x-node.x,this.z-node.z);
    }
}