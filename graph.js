class Node {
    constructor(x, y, name, color) {
        this.adj = []
        this.degree = this.adj.length
        this.name = name
        this.color = color
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.fx = 0;
        this.fy = 0;
    }
}

class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
    }
}

class Graph {
    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    addNode(node) {
        this.nodes.push(node);
    }

    addEdge(edge) {
        this.edges.push(edge);
        edge.node1.adj.push(edge.node2);
        edge.node1.degree += 1;
        edge.node2.adj.push(edge.node1);
        edge.node2.degree += 1;
    }

    getNodes() {
        return this.nodes;
    }

    getEdges() {
        return this.edges;
    }

    addNodesAndEdges(n, density, color) {
        this.addRandomNodes(n, color);
        this.addEdgesWithDensity(density);
    }

    addRandomNodes(n, color) {
        for (let i = 0; i < n; i++) {
            let x = Math.random();
            let y = Math.random();
            this.addNode(new Node(x, y, "Node " + i.toString(), color));
        }
    }

    addEdgesWithDensity(density) {
        let totalPossibleEdges = this.nodes.length * (this.nodes.length - 1) / 2;
        let numEdgesToAdd = Math.floor(density * totalPossibleEdges);

        for (let i = 0; i < numEdgesToAdd; i++) {
            let node1 = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            let node2 = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            if (node1 !== node2 && !node1.adj.includes(node2)) {
                this.addEdge(new Edge(node1, node2));
            } else {
                i--; 
            }
        }
    }

    addEdgeList(edgeList, color) {
        const lines = edgeList.split('\n');
        const nodeMap = new Map();

        for (let line of lines) {
            const [name1, name2] = line.split(',').map(s => s.trim());

            let node1 = nodeMap.get(name1);
            if (!node1) {
                node1 = new Node(Math.random(), Math.random(), name1, color);
                this.addNode(node1);
                nodeMap.set(name1, node1);
            }

            let node2 = nodeMap.get(name2);
            if (!node2) {
                node2 = new Node(Math.random(), Math.random(), name2, color);
                this.addNode(node2);
                nodeMap.set(name2, node2);
            }

            this.addEdge(new Edge(node1, node2));
        }
    }

    plot(context, canvasWidth, canvasHeight, nodeSize=7, edgeColor="black", edgeThickness=1) {
        
        context.strokeStyle = edgeColor;
        context.lineWidth = edgeThickness;
        context.beginPath();
        this.edges.forEach(edge => {
            let x1 = edge.node1.x * canvasWidth;
            let y1 = canvasHeight - edge.node1.y * canvasHeight;
            let x2 = edge.node2.x * canvasWidth;
            let y2 = canvasHeight - edge.node2.y * canvasHeight;
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
        });
        context.stroke();
        this.nodes.forEach(node => {
            context.fillStyle = node.color;
            let x = node.x * canvasWidth;
            let y = canvasHeight - node.y * canvasHeight;
            let radius = nodeSize;
            context.beginPath();
            context.arc(x, y, radius, 0, 2 * Math.PI, false);
            context.fill();
            context.strokeStyle = "black";
            context.lineWidth = 2;
            context.stroke();
        });
    }
}

function changeSettings(option){
    const randomControls = document.getElementById('randomControls');
    const edgeListControls = document.getElementById('edgeListControls');

    if (option === 'random') {
        randomControls.style.display = '';
        edgeListControls.style.display = 'none';
        mode = 1;
    } else if (option === 'edge') {
        randomControls.style.display = 'none';
        edgeListControls.style.display = 'flex';
        mode = 2;
    }
    updateGraph();
}

function forceCalc(nodes, canvasHeight, canvasWidth, k1, k2, k3){
    
    nodes.forEach(node => {
        node.fx = 0;
        node.fy = 0;

        // repulsive force
        nodes.forEach(other => {
            if (node !== other) {
                let dx = node.x - other.x;
                let dy = node.y - other.y;
                let d = Math.sqrt(dx * dx + dy * dy);
                let force = k1 / d;
                node.fx += force * dx / d;
                node.fy += force * dy / d;
            }
        });

        // attractive force
        node.adj.forEach(other => {
            let dx = node.x - other.x;
            let dy = node.y - other.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            let force = - (k2 ** 2) * d;
            node.fx += force * dx / d;
            node.fy += force * dy / d;
        });

        // gravitational force
        node.fx += k3 * (canvasWidth / 2 - node.x * canvasWidth);
        node.fy += k3 * (canvasHeight / 2 - node.y * canvasHeight);

    });

}

function updateVel(nodes, stepSize, damping) {

    nodes.forEach(node => {
        node.vx = (node.vx + stepSize * node.fx) * damping;
        node.vy = (node.vy + stepSize * node.fy) * damping;
    });
}

function updatePos(nodes, stepSize) {

    nodes.forEach(node => {
        node.x += stepSize * node.vx;
        node.y += stepSize * node.vy;
    });
}

let animationId;
let graph;
let canvas;
let context;
let canvasWidth;
let canvasHeight;
let mode = 1;

function verifyEdgeList(edgeList) {

    if (edgeList === "") {
        return true;
    }

    const lines = edgeList.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if(!/^[\w\s\d\-']+, [\w\s\d\-']+$/.test(lines[i])) {
            console.log(lines[i]);
            return false;
        }
    }
    return true;
}

function updateGraph() {
    cancelAnimationFrame(animationId);
    const color = document.getElementById("colorPicker").value;

    if (mode === 1) {
        const nodes = parseInt(document.getElementById("nodes").value);
        const density = parseFloat(document.getElementById("density").value);

        graph = new Graph();
        graph.addNodesAndEdges(nodes, density, color);

    } else if (mode === 2) {
        const edgeList = document.getElementById("edges").value.trim();

        if(!verifyEdgeList(edgeList)) {
            alert("Please enter edges in the format 'Node1, Node2'.");
        }
        else {
            graph = new Graph();
            if (edgeList !== ""){
                graph.addEdgeList(edgeList, color);
            }
        }
        console.log(graph.getNodes());
    }

    function animate() {
        let k1 = 10 ** document.getElementById("sliderR").value;
        let k2 = 10 ** document.getElementById("sliderA").value;
        let k3 = 10 ** document.getElementById("sliderG").value;
        let k4 = 1 - document.getElementById("sliderF").value;
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        graph.plot(context, canvasWidth, canvasHeight);
        forceCalc(graph.nodes, canvasHeight, canvasWidth, k1, k2, k3);
        updateVel(graph.nodes, 0.0001, k4);
        updatePos(graph.nodes, 0.0001);
        animationId = requestAnimationFrame(animate);
    }

    animate();
}

window.onload = function() {

    canvas = document.getElementById("graphCanvas");
    const boxSize = Math.min(window.innerHeight, window.innerWidth) * 0.8;
    canvas.width = boxSize;
    canvas.height = boxSize;
    context = canvas.getContext("2d");
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    
    updateGraph();
}
