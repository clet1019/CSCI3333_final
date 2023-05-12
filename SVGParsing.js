/* Written by Duncan Levear in Spring 2023 for CS3333 at Boston College */

export function svgToObject(t) {
    /*
    Convert t (text, an svg file) to a javascript object
    */
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = t;
    let theSVG = undefined;
    for (const c of tempDiv.childNodes) {
        if (c.nodeName === 'svg') {
            theSVG = c;
        }
    }
    if (theSVG === undefined) {
        console.error("No SVG found");
    }
    return nodeToObject(theSVG); 
}

function nodeToObject(node) {
    /*
    Convert node (a DOM node) to a javascript object
    */
    const ret = {};
    ret.type = node.nodeName;
    ret.children = [];

    for (const a of node.attributes) {
        ret[a.nodeName] = a.nodeValue;
    }
    for (const c of node.childNodes) {
        if (c.nodeType !== 1) {
            continue;
        }
        const childObject = nodeToObject(c);
        ret.children.push(childObject);
    }
    return ret;
}     
