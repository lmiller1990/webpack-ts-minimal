import * as utils from './Util'
// import { item,itemFactory } from './Parser'
import { Parser } from 'webpack';

let fontFamily = "Open Sans";

let labelPaddingBottom = 8;
let labelPaddingRight = 10;

let DEBUG = false;

let textFilter = { label: 'Text Filter (regex)', type: 'text', val: "." }
let fontSize = { label: "Font size", model: "fontSize", min: 5, max: 50, val: 13 }
let connectorWidth = { label: 'Connector width', model: "connectorWidth", min: 20, max: 100, val: 65 }
let connectorSteepness = { label: 'Connector steepness', min: 0.1, max: 1, step: 0.01, val: 0.65 }
let connectorLineWidth = { label: 'Line width', min: 0.5, max: 10, step: 0.25, val: 4.5 }
let nodeMarginTop = { label: ' Top margin', min: 0, max: 50, val: 5 }
let nodeMarginBottom = { label: ' Bottom margin', min: 0, max: 50, val: 5 }
let useGrayscale = { label: 'Use grayscale', type: 'boolean', val: false }


let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D


export type item = {
    'label': string,
    'children': item[],
    'parent': item | null,
    'depth': number,
}


export class TreeNode {

    label: string
    labelLines: string[]
    isRoot: boolean
    parent: TreeNode | null
    children: TreeNode[]
    depth: number
    labelWidth: number
    anchorPoint: [x: number, y: number]

    // these are local to this TreeNode
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D


    constructor(label: string, isRoot = false, depth = 0) {
        this.label = label;
        this.labelLines = this.label.split("\n");
        this.isRoot = isRoot;
        this.parent = null;
        this.children = [];
        this.depth = depth
        this.labelWidth = 100
        this.anchorPoint = [0, 0]

        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d")!

    }

    get isLeaf() {
        return this.children.length == 0;
    }

    addChild(child: TreeNode) {
        child.parent = new TreeNode(this.label) //itemFactory(this.label,this.parent,this.children,0);  //TODO: not 0, but what?
        this.children.push(child);
        // console.log('addChild', child)
    }

    addChildren(...children: TreeNode[]) {
        for (let child of children) {
            this.addChild(child);
        }
    }

    draw(currentBranchColor: string = 'blue') {


        // The width of the label will be the width of the widest line
        this.ctx.font = fontSize.val + "px " + fontFamily;

        // The height of the lines of text (only)
        let textHeight = fontSize.val * (this.labelLines.length);

        // The height of the text + the separation from the line + the line height + the label margin
        let composedHeight = textHeight + labelPaddingBottom + connectorLineWidth.val;

        // The composed height plus the margin
        let paddedHeight = composedHeight + nodeMarginTop.val;

        let labelHeight =
            nodeMarginTop.val +                           // top margin
            fontSize.val * (this.labelLines.length + 1) + // text lines' height
            nodeMarginBottom.val                          // bottom margin
            ;

        let labelWidth = Math.ceil(Math.max(...this.labelLines.map(c => this.ctx.measureText(c).width)));

        // The anchorPoint defines where the line should start

        if (this.isLeaf) {
            // Resize the canvas
            this.canvas.width = labelWidth + labelPaddingRight * 2;
            this.canvas.height = labelHeight;

            // Set the font
            this.ctx.font = fontSize.val + "px " + fontFamily;

            // Draw the text lines
            for (let i = 0; i < this.labelLines.length; i++) {
                this.ctx.fillText(this.labelLines[i], 0, fontSize.val * (i + 1) + nodeMarginTop.val);
            }

            // The anchorPoint defines where the line should start
            this.anchorPoint = [0, (this.labelLines.length * fontSize.val) + labelPaddingBottom + nodeMarginTop.val]
        }

        else {

            let canvases: HTMLCanvasElement[]
            let branchColors: string[] = []


            // If this is the root, we need to generate a random color for each branch
            if (this.isRoot) {
                branchColors = this.children.map(c => utils.generateRandomColor(useGrayscale.val));
                canvases = this.children.map((c, i) => c.draw(branchColors[i]));
            }

            // Otherwise, use the received branchColor
            else {
                canvases = this.children.map((c, i) => c.draw(currentBranchColor));
            }

            // Get the vertical positions for the children
            let childrenVerticalPositions = [0];

            // Each position is the sum of the acumulated heights of the previous elements
            for (let i = 0; i < canvases.length; i++) {
                childrenVerticalPositions[i + 1] = childrenVerticalPositions[i] + canvases[i].height;
            }

            let childrenHeight = childrenVerticalPositions[canvases.length];

            this.anchorPoint = [this.isRoot ? 10 : 0, 0];

            /*
             If the height of the children is smaller than the height of the node, take the height of the node and
             don't center it vertically.
             Otherwise, take the max between 2*height of the node and the children height, and center it vertically.
             */

            if (childrenHeight < composedHeight + nodeMarginTop.val * 2) {
                this.canvas.height = composedHeight + nodeMarginTop.val * 2;
                this.anchorPoint[1] = this.canvas.height / 2 + composedHeight / 2;
            }
            else {
                this.canvas.height = Math.max(childrenVerticalPositions[canvases.length], composedHeight * 2);
                this.anchorPoint[1] = this.canvas.height / 2;
            }

            // console.log(this.label, canvas.height, childrenVerticalPositions[canvases.length]);

            // Compute left margin (label width + separation)
            let leftMargin = 10 + labelWidth + connectorWidth.val;

            // Set the width to the leftMargin plus the width of the widest child branch
            this.canvas.width = leftMargin + Math.max(...canvases.map(c => c.width));
            this.ctx.font = fontSize.val + "px " + fontFamily;


            // Draw each child
            for (let i = 0; i < canvases.length; i++) {
                if (this.isRoot) {
                    currentBranchColor = branchColors[i]
                }

                this.ctx.drawImage(canvases[i], leftMargin, childrenVerticalPositions[i]);

                let connector_a = {
                    x: this.anchorPoint[0] + this.labelWidth + labelPaddingRight,
                    y: this.anchorPoint[1]
                };

                let connector_b = {
                    x: leftMargin,
                    y: childrenVerticalPositions[i] + this.children[i].anchorPoint[1]
                };

                this.ctx.beginPath();
                this.ctx.moveTo(connector_a.x, connector_a.y);

                this.ctx.bezierCurveTo(
                    connector_a.x + connectorSteepness.val * connectorWidth.val, connector_a.y,
                    connector_b.x - connectorSteepness.val * connectorWidth.val, connector_b.y,
                    connector_b.x, connector_b.y
                );

                this.ctx.lineTo(
                    connector_b.x + this.children[i].labelWidth + labelPaddingRight,
                    connector_b.y
                );
                this.ctx.lineWidth = connectorLineWidth.val;
                this.ctx.lineCap = "round";
                this.ctx.strokeStyle = currentBranchColor;
                this.ctx.stroke();
            }


            // For the root node, print a containing rectangle and always center the text
            if (this.isRoot) {
                this.ctx.fillStyle = "#ffffff";
                this.ctx.lineWidth = 3;
                utils.roundRect(this.ctx,
                    2, this.canvas.height / 2 - (this.labelLines.length) * fontSize.val,
                    this.labelWidth + 18, fontSize.val * (this.labelLines.length + 1.5),
                    5, true, true);

                this.ctx.fillStyle = "#000000";

                for (let i = 0; i < this.labelLines.length; i++) {
                    this.ctx.fillText(
                        this.labelLines[i],
                        10,                                             // Fixed margin from the left
                        this.canvas.height / 2                          // Vertical center
                        + fontSize.val / 2                                  // Middle of the line height
                        - fontSize.val * (this.labelLines.length - i - 1)   // Correctly account for multilines
                    );
                }
            }

            else {
                this.ctx.fillStyle = "#000000";

                for (let i = 0; i < this.labelLines.length; i++) {
                    this.ctx.fillText(
                        this.labelLines[i],
                        10,                                             // Fixed margin from the left
                        this.anchorPoint[1]     // From the anchor point
                        - labelPaddingBottom   // Move up the padding
                        - fontSize.val * (this.labelLines.length - i - 1)
                    );
                }
            }
        }


        return this.canvas;
    }
}



export class parseMethods {

    sourceCode: string

    constructor(sourceCode: string) {
        this.sourceCode = sourceCode

    }
    parseSource() {
        console.log("Parsing...");

        let parsed: item[]

        try {
            parsed = parseList(this.sourceCode);
        } catch (err) {
            console.log("Woops! Error parsing");

            return;
        }

        if (parsed.length == 0) return;
        let parsedRoot = parsed[0];


        // try {
        //     if (treeProperties["textFilter"].val != "") {
        //         vm.textFilter = new RegExp(treeProperties["textFilter"].val);
        //     } else {
        //         vm.textFilter = new RegExp(".+");
        //     }
        // } catch (err) {
        //     console.log(err);
        //     return;
        // }



        let currentTree = this.parseObjectBranch(parsed[0],true);
        currentTree = currentTree.children[0]
        currentTree.isRoot = true;
        console.log('currentTree', currentTree)
        this.regenerateDiagram(currentTree);
    }



    parseObjectBranch(branch: item, isRoot = false) {
        var node = new TreeNode(branch.label, isRoot);

        for (var child of branch.children) {
            // if (textFilter.test(child.label)) {
            node.addChild(this.parseObjectBranch(child, false));
            // }
        }

        return node;
    }

    regenerateDiagram(currentTree: TreeNode) {
        let canvas = document.getElementById("canvas") as HTMLCanvasElement
        if (canvas) {
            let ctx = canvas.getContext("2d");
            if (ctx == undefined || ctx == null) {
                console.error('no CTX')
            } else {

                // Draw the map
                let beautifulDrawing = currentTree.draw();

                // Resize canvas to the size of the map plus some margin
                canvas.width = beautifulDrawing.width + 25;
                canvas.height = beautifulDrawing.height + 25;

                console.log("Canvas", canvas.width, canvas.height);

                // Draw the map onto the existing canvas
                ctx.drawImage(beautifulDrawing, 25, 25);

            }
        }
        else
            console.error('no Canvas')
    }


    // watch: {
    //     'sourceCode': 'parseSource',
    //     'treeProperties': {
    //         handler: 'buildGlobalProperties',
    //         deep: true
    //     },
    // }
}





export function parseList(text: string): item[] {

    // set up the items list with a root
    let items: TreeNode[] = []

    items.push(new TreeNode('ROOT', true, -1))

    let currentParent = items[0] // | null = items[0];
    let currentParentDepth = -1;
    let currentItemLabel = "";
    let currentItemDepth = 0;

    let lines = text.split("\n");
    lines = lines.filter(c => !c.match(/^\s*$/)); // Remove blank lines

    // console.log('lines',lines)

    for (let line of lines) {
        let itemMatch = line.match(/^( *)-\s*(.*)$/);

        // console.log('itemMatch',itemMatch)

        // New item
        if (itemMatch) {
            // Store previous item (if any)
            // console.log('currentItemLabel',currentItemLabel)
            if (currentItemLabel != "") {

                // Build the node for the previously read node
                let node = new TreeNode(currentItemLabel, true, currentItemDepth)
                node.parent = currentParent

                // Store the node within its parent
                currentParent.children.push(node);

                // console.log('currentParent after push',currentParent)

                // Set the new "parent" to the previous item
                currentParent = node;
                currentParentDepth = node.depth
            }

            // Fetch the data from the newly-read item
            currentItemDepth = itemMatch[1].length;
            currentItemLabel = itemMatch[2];

            // If the parent is deeper than the new item, switch the parent
            // to one with lower depth than current item
            while (currentItemDepth <= currentParentDepth) {

                currentParent = currentParent.parent ?? currentParent  // up as high as we can
                currentParentDepth = currentParent.depth
            }

        }
        // Continued string from previous item
        else {
            currentItemLabel += "\n" + line;
        }
    }

    // Force insert last item
    if (currentItemLabel) {

        let newNode = new TreeNode(currentItemLabel, false, currentParentDepth + 1)
        newNode.parent = currentParent

        currentParent['children'].push(newNode)

    }

    console.log('parseList', items)
    return items;
}




