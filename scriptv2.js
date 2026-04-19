import { reactive } from "./chowk.js";
import { dom } from "./dom.js";

const frame = document.querySelector("iframe");
const codeEl = document.querySelector("#code");
const interfaceEl = document.querySelector("#interface");
export const round = (n, r) => Math.ceil(n / r) * r;

let code = `
	src(s0).linearBurn(src(s0)).out()
`;

// let codeData = [
// 	["src", "s0"],
//     ["linearBurn","s0"],
// 	["out", "o0"]
// ];

let currentO = 0;

let allO = [

    [
        ["src", "s0"],
        ["out", "o0"]
    ],

    [
        ["src","o0"],
        ["out","o1"]
    ],

    [
        ["src","o1"],
        ["out","o2"]
    ]

];

let codeData = allO[currentO];


let d = localStorage.getItem("save");

function setup_iframe(){
        frame.srcdoc = `
        <style>
    * {
        padding: 0;
        margin: 0;
        overflow: hidden;
    }

    html,
    body {
        height: 100vh;
        width: 100vw;
    }
    canvas{
    display:block;
    width: 100%;
    height: 100%;}
    
        </style>

        <body>
        <canvas id="canvas"></canvas>
        </body>
        <script src="./lib/hydra.js"></script>

        <script>
        const canvas = document.getElementById('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
            const h = new Hydra({
            canvas:document.getElementById('canvas'),
            autoLoop: true
            });

            Object.assign(window,h.synth);
            window.h = h;
            </script>

        <script src="./lib/hydra-blend.js"></script>
<script>
            window.executeCode = function(codeString){
            eval(codeString);
            }
            </script>
        `;

}



let compile_node = (node) => {
    if (!Array.isArray(node)) throw new Error("should be an array");
    if (node.length === 0) throw new Error("empty node");
    if (typeof node[0] !== "string"){
        throw new Error("needs to be type string");
    }

    let function_name = node[0];

    let textcode = node.slice(1).map(compile_param).join(",");

    return function_name + "(" + textcode + ")";

}

let compile_param = (param) => {
    if (typeof param == "number") {
        return String(param);
    } 

    if (typeof param == "string") return param;

    if (Array.isArray(param)) {
        if (Array.isArray(param[0])) return compile_chain(param);
        else return compile_node(param);
    };

    throw new Error("wrong param type" + typeof param);

}

let compile_chain = (chain) => {
    if (!Array.isArray(chain)) throw new Error("should be array");
    return chain.map(compile_node).join(".");
}



const src = new Set(["noise","osc","shape","gradient","voronoi", "solid", "s0", "o0",  "src"]);
const out = new Set(["out"]);
const color_effect = new Set(["colorama","hue","thresh","luma","saturate","contrast","brightness","scale","repeat","rotate", "scrollX", "scrollY", "kaleid"]);
const transform_effect = new Set(["scale","repeat","rotate", "scrollX", "scrollY", "kaleid"]);
const modulate = new Set(["modulate", "modulateScale", "modulateRepeat", "modulateRepeat", "modulateKaleid", "modulateScrollY", "modulateScrollX","diff", "blend", "mult", "add", "sub"])
const blend = new Set(["diff", "blend", "mult", "add", "sub"])
const number = new Set(["number"]);
const system = new Set(["system"]);

let itemtype = (item) => {
	if (typeof item === "number") return "number"; 
    if (out.has(item[0])) return "out";
	if (Array.isArray(item[0])) return "src";   // ← chained src
    if (src.has(item[0])) return "src";
    if (color_effect.has(item[0])) return "effect";
    if (transform_effect.has(item[0])) return "effect";
    if (modulate.has(item[0])) return "modulate";
    if (blend.has(item[0])) return "blend";
	if (number.has(item[0])) return "number"; 
	if (system.has(item[0])) return "system";
    return "modulate";
};



let hydra_code = compile_chain(codeData);


function update_page() {
    let initCode = `
    s0.initCam(0);`
    let code0 = compile_chain(allO[0]);
    let code1 = compile_chain(allO[1]);
    let code2 = compile_chain(allO[2]);
    let codeString = initCode + "\n" + code0 + "\n" + code1 + "\n" + code2 + "\n" + "render(o2);"
    // console.log(code);
    frame.contentWindow.executeCode(codeString);
    updateUI(codeData);
    // console.log(code);
    localStorage.setItem("save", JSON.stringify(allO));
    codeEl.innerHTML = `<pre>${codeString}</pre>`;
}


setup_iframe();
setTimeout(() => { update_page(); },500)
// update_page();

function updateUI(data = codeData) {
    let d = [".dawg"];

    data.forEach((fn, fnI) => {
        d.push(defaultrenderer(fn, fnI, []));
    });

    interfaceEl.innerHTML = "";
    interfaceEl.appendChild(dom(d));
}

let defaultrenderer = (el, i, a, prefix = "") => {
    if (Array.isArray(el)) return arrayui(el, a.concat([i]));
    else if (typeof el == "string") return ["span.string", selected(a, i), prefix + el];
    else if (typeof el == "number") {
        return ["span.number", selected(a, i), (prefix + el + "")];
    } else console.error(el);
};

let selected = (address, i) => {
    let addy = [...address];
    if (i != undefined) addy.push(i);
    let addy_str = addy.join("-");
    return {
        address: addy_str,
        selected: addy_str == cursor.value().join("-"),
        onclick: (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            cursor.next([...addy]);
        },
    };
};

let arrayui = (item, addy) => {

    let stuff = [".fn", selected(addy)];

    stuff.push(["span.function", item[0]]);
    stuff.push(["span.funcopen", "("]);

    item.slice(1).forEach((param, i) => {
        // let isLast = i === item.length - 2;
        let prefix = (i > 0 ) ? ", " : "";
        // if (i>0) stuff.push(["span.comma",","]);
        stuff.push(defaultrenderer(param, i + 1, addy, prefix));
    });

    stuff.push(["span.paren",")"]);
    return stuff;
};


let cursor = reactive([0]);
// cursor.between = false;

cursor.subscribe((v) => {
    let selected = document.querySelector("*[selected='true']");
    if (selected) selected.setAttribute("selected", "false");

    
        selected = document.querySelector(`*[address='${v.join("-")}']`);
        if (selected) {
            selected.setAttribute("selected", "true");
            selected.scrollIntoView({ block: "center", behavior: "smooth" });
        }

});

let getcurrentref = () => {
    let curse = cursor.value();
    if (curse.length == 1) return [codeData, curse[0]];

    let refaddress = curse.slice(0, -1);
    let refindex = cursor.value()[cursor.value().length - 1];
    let ref = getref(refaddress, codeData);
    return [ref, refindex];
};

let getref = (address, arr) => {
    let copy = [...address];
    let index = copy.shift();
    if (copy.length == 0) return arr[index];
    return getref(copy, arr[index]);
};

cursor.goNext = (out = false) => {
    let [ref, refindex] = getcurrentref();
    if (refindex < ref.length - 1) {
        cursor.next((e) => (e[e.length - 1] += 1, e));
        let [ref, refindex] = getcurrentref();
        if (out && Array.isArray(ref[refindex])) {
            let notdone = true;
            while (notdone) {
                cursor.next((e) => (e.push(1), e));
                ref = getcurrentref()[0];
                refindex = getcurrentref()[1];

                if (!Array.isArray(ref[refindex])) notdone = false;
            }
        }
    } else if (out) (cursor.goUp(), cursor.goNext(true));
};
cursor.goPrev = (out = false) => {
    let [_, refindex] = getcurrentref();
    let isNested;
    if (cursor.value().length > 1){
        isNested = 1;
    }

    else  {
        isNested = 0;
    }

    if (refindex > isNested) {
        cursor.next((e) => (e[e.length - 1] -= 1, e));

        let [ref, refindex] = getcurrentref();
        if (out && Array.isArray(ref[refindex])) {
            let notdone = true;

            while (notdone) {
                cursor.next((e) => (e.push(ref[refindex].length - 1), e));
                ref = getcurrentref()[0];
                refindex = getcurrentref()[1];

                if (!Array.isArray(ref[refindex])) notdone = false;
            }
        }
    } else if (out) (cursor.goUp(), cursor.goPrev(true));
    else cursor.goUp();
};

cursor.goUp = () => {
    if (cursor.value().length > 1) cursor.next((e) => (e.pop(), e));
};

let randomize_param = (param) => {

    if (Array.isArray(param) && param.length === 2 &&
    typeof param[0] === 'number' && typeof param[1] === 'number'){
        return Math.random()*(param[1]-param[0] + param[0]);
    }
    
    return param
}

let keys = {

//srcs
"AH": ["modulate", ["src", "o0"], 0.1],
"AI": ["modulateScale", ["src", "o0"], 0.1],
"AG": ["modulateRepeat", ["src", "o0"],2,2],
"AF": ["modulateScrollX", ["src", "o0"],0.1,0.1],
"AE": ["modulateScrollY", ["src	", "o0"],0.1,0.1],
"AD": ["modulateKaleid", ["src", "o0"], 4],
"AC": ["modulatePixelate", ["src", "o0"], 99,99],

//to do: hyper hydra blend modes
//blends
"BI": ["blend", ["src", "o0"],0.9],
"BH": ["mult", ["src", "o0"], 1],
"BG": ["diff", ["src", "o0"],1],
"BF": ["sub", ["src", "o0"], 0.5],
"BE": ["add", ["src", "o0"], 0.5],

//to do: separate by transforms or color
//effects
"CI": ["colorama", -0.1],
"CH": ["scale", 1.1, 1.1],
"KG": ["repeat", 2, 2],
"KI": ["rotate", 3,0.1],
"CF": ["hue", 0.5],
"CE": ["thresh", 0.5],
"CD": ["luma", 0.5],
"CJ": ["saturate", 1.5],
"CK": ["contrast", 1.5],
"CL": ["brightness", 0.1],


//srcs
"LI":["noise", 4,0.1],
"LH": ["osc", 1, 0.1, 1],
"LG": ["shape", 4, 0.1, 0.01],
"LF": ["src", "o0"],
"LA": ["src", "s0"],
/*"LE": ["src(o1)"],
"LD": ["src(o2)"],
"LC": ["src(s0)"],
"LB": ["src(s1)"],
"LA": ["src(s2)"],*/

//numbers
"DI": ["number", 0.1],
"DG": ["number", -0.1],
"EI": ["number", 1],
"EG": ["number", -1],
"FI": ["number", 10],
"FG": ["number", -10],
"HI": ["number", -1],
"HG": ["number", 10],
"HK": ["number", -10],

"L": ["system", "deleteline"]

};
//to do:
// fix rules so i can add a modulate or something after an existing modulate

/*"DI": ["number" + 0.1
"DG - (number) - 0.1
"EI - (number) + 1
"EG - (number) - 0.1
"FI - (number) + 10
"FG - (number) -10
"HI - (number) * 10
"HG - (number) / 10
"HK - (number) zero*/


/*I - navigate up
G - navigate down
H - run code
D - exit (out?)
F - enter (in?)
E - delete
"F": [cursor.goPrev()],*/

//rambling 
    
// if selected is a modulate or blend function 
// sending cmd for blend/modulate function should replace the existing function

// if selected is a modulate or blend function, and we send cmd for src
// what should we do? either replace the first parameter with the new src
// or add src on next line (then we will need to send another cmd to blend/modulate it)

// what if we added the src wrapped around the selected function onto the next line? <- i think this is the way

// how to move / reorder functions? shuffle button (shuffle order)

// randomize numbers. knob to determine scale of randomization (lower scale means numbers remain closer to original,
// to add subtle variations to visuals / higher scale, more unpredictability and noticeable change from original)

//if selected is a src and we send modulate/blend cmd, it should replace the src 
//and put the src that we replaced as the first parameter of the modulate/blend function we just added

//if selected is a src and we send src cmd, it should replace the existing src with the new src
//---------------------------------------------------------------------------------------------------------//
    //blends: mult, diff, add, sub (and all the hyper-hydra blend modes, but we can do that later)
    //modulates: modulate, modulateScale, modulatePixelate, modulateRotate, modulateKaleid etc
    //effects (texture): rotate, shape, pixelate, kaleid
    //effects (color):  colorama, hue, brightness, contrast, luma, thresh
    //src: shape, noise, voronoi, osc, s0-s3, o0-o3

//rules:
//main function block -> once ((there are actually 4 of these possible, but just focusing on one for now))

//begins with a src. you can not delete this. but sending a src command will replace existing src
//sending a modulate/blend/effect when top src is highlightedshould add it to the next line. 
// same if a gap is highlighted

//inside the main function block (or main->modulate->src() -  src() has same rules as the src of  main function block)
// ie you can only add blends, modulates, and effects
// if you send a src with a src highlighted, replace the existing src
// if you send a modulate/blend a src highlighted, add it to this sub-hydra-code with that modulate/blend
//with that highlighted src as the first pararmeter

//if effect is added with src or modulate selected, add it to the next line
//effects can only have numbers as parameters. you can't add a src or effect or blend as a parameter, only numbers)

//if you add a blend/modulate function in the main (or to the src of a modulate/blend),
// the first parameter will always be a src.
//second (and third if exists) parameter will always be a number. 
//you can not remove any parameters. delete key with a parameter selected should reset it back to default values

//the blend/modulate function always has src as the first parameter.
//you can either highlighted the src, or right cmd should highlight gap 
// if this gap is highlighted, it behaves the same as if you are inside the main function block
//ie you can only add blends/modulates/effects to it, you can't add a src to it

//i just realized something wild

let buffer;
let port = undefined;
let cmd = "";
let port_connected = false;

let initialize_port = async () => {

    try{

    port = await navigator.serial.requestPort();
    // console.log(port);
    await port.open({ baudRate: 9600 });
    port_connected = true;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    // Listen to data coming from the serial device.
    while (port_connected) {

        try{
        const { value, done } = await reader.read();
        if (done) {
            // Allow the serial port to be closed later.
            reader.releaseLock();
            port_connected = false;
            break;
        }
        value.split("").forEach((e) => {
            if (e == "\n") {
                try {
                runCmd(cmd);
                } catch (error){
                    
                }
                cmd = "";
            } else cmd += e;
        });

        } catch (readError) {
            port_connected = false;
            break;
        }
    }

    }
    catch (error) {
        port_connected = false;
    }
    finally {
        if (port){
            try {
                await port.close();
            }
            catch (e) {
                
            }
        }
    }
};

let ensure_port_connected = async () => {
    if (!port_connected){
        await initialize_port();
    }
}

let runCmd = (keystroke) => {
    // console.log(keystroke);
    let cmd = JSON.parse(keystroke);
    let item = keys[cmd.KEY];
    // console.log(cmd);
    let [cur, curI] = getcurrentref();

    //if (cmd.KEY2){
    if (cmd.KEY == "H") {
    cursor.goNext();
    }

    if (cmd.KEY == "I"){
        cursor.goPrev();
    }

    if (cmd.KEY == "K"){
        cursor.goUp();
    }
    
    if (cmd.KEY == "J"){
        if (Array.isArray(cur[curI])) {
        const hasnest = cur[curI].slice(1).some(param => Array.isArray(param));
        if (hasnest){
        cursor.next((a) => (a.push(1), a));
        updateUI();
        }
    }
        // else console.log(cur[curI])
    }


    if (cmd.KEY == "D"){
            update_page();
    }
    
   else if (cmd.KEY == "C"){
        currentO = (currentO + 1) % 3;
        codeData = allO[currentO];
        cursor.next(()=>[0]);
        update_page();
    }

    else if (cmd.KEY == "G"){
        currentO = (currentO - 1 + 3) % 3;
        codeData = allO[currentO];
        cursor.next(()=>[0]);
        update_page();
    }

    else {
        updateUI();
    }

    


    function number_change(){

        if (typeof cur[curI] !== 'number') return;
        if (cmd.KEY == "DI"){

            cur[curI] += .1;
            updateUI();
        
    }

        if (cmd.KEY == "DG"){
            cur[curI] += -.1;
            updateUI();
        
    }

        if (cmd.KEY == "EI"){
    
            cur[curI] += 1;
            updateUI();
    
    }

        if (cmd.KEY == "EG"){

            cur[curI] += -1;
            updateUI();

    }

        if (cmd.KEY == "FI"){

            cur[curI] += 10;
            updateUI();
        
    }

        if (cmd.KEY == "FG"){

            cur[curI] += -10;
            updateUI();

    }

            if (cmd.KEY == "HI"){

            cur[curI] *= 0.1;
            updateUI();

    }

            if (cmd.KEY == "HG"){

            cur[curI] *= 10;
            updateUI();
    
    }

            if (cmd.KEY == "HK"){
        
            cur[curI] = 0;
            updateUI();
        
    }

    }


//to fix:
//nested functions
//if i have a nested function inside a modulate, and have the modulate highlighted and send a different modulate cmd...
//... then it replaces the nested function (first parameter) with the default
//instead, we want it to keep the parameters exactly as is, and just change the modulate with the one i sent in the command

//it is adding commas for some reason and messes up the hydra code format/law inside the nested functions


// let [cur, curI] = getcurrentref();

    if(item){
    // let function_structure = cursor.length();
    let sel_type = itemtype(cur[curI]);
    let cmd_type = itemtype(item);

    // if(cursor.value().length == 1){
        if (cmd_type === "system"){
            if (sel_type !== "src" && sel_type !=="number" && sel_type !== "out"){
            if (Array.isArray(cur)) {
                if (itemtype(item) !== "src" ){
                buffer = cur[curI];
                cur.splice(curI, 1);
                updateUI();
            }
        }
        }
        }

        if (sel_type === "src"){
            if (cmd_type === "src")
            {	
                cur[curI] = [...item];
                updateUI();

                //replace the existing src with this new one
            }
            else if (cmd_type === "modulate" || cmd_type === "effect" ){
                if (cursor.value().length === 1){
                    codeData.splice(curI + 1, 0, [...item]);
                    updateUI;
                }
              
                else {
                    if (Array.isArray(cur[curI][0])){
                        cur[curI].push([...item]);
                    }
                    else {
                        cur[curI] = [[...cur[curI]],[...item]];
                    }
                }
                updateUI();
                //add the modulate or effect function to the next line
            }
            else if (cmd_type === "number"){
                //go inside the src and highlight the first parameter (and apply that number change +.1 or whatever)
                if (cur[curI].length > 1) {
            cursor.next(a => [...a, 1]);       
            [cur, curI] = getcurrentref();   
            number_change();
                }

            }
            else {
            //do nothing i guess
            }
        }

        else if (sel_type === "modulate"){
            if (cmd_type === "src")
            {
                let cmd_mod = [...cur[curI]];
                cmd_mod[1] = [...item];
                codeData.splice(curI + 1, 0, cmd_mod);
                updateUI();
                //duplicate the sel_type modulate
                // replace sel_type src with cmd_type src as it's first parameter, add it to next line
            }

            else if (cmd_type === "modulate"){
                //replace the sel_type modulate with the cmd_type modulate
                cur[curI] = [...item];
                updateUI();
            }

            else if (cmd_type === "effect"){
                //add the default cmd_type effect to the next line

            codeData.splice(curI + 1, 0, [...item]);
            updateUI();
            }

            else if (cmd_type === "number"){

            cursor.next(a => [...a, 2]);       
            [cur, curI] = getcurrentref();   
            number_change();

                //go inside the src and highlight the 2nd parameter (and apply that number change +.1 or whatever)
                //2nd because the first parameter will always be a src
            }
            else {
            //do nothing i guess
            }
        }

        else if (sel_type === "effect"){
            if (cmd_type === "src")
            {	
                //ignore for now
                //later: select a random modulate function with the cmd_type src as the first parameter to the next line?
            }

            else if (cmd_type === "modulate"){
                //add default cmd_type modulate to the next line

            codeData.splice(curI + 1, 0, [...item]);
            updateUI();
            }

            else if (cmd_type === "effect"){
                //add the default cmd_type effect to the next line

            codeData.splice(curI + 1, 0, [...item]);
            updateUI();
            }

            else if (cmd_type === "number"){
                //go inside the sel_type effect and highlight first parameter, apply number change to it 
            cursor.next(a => [...a, 1]);       
            [cur, curI] = getcurrentref();   
            number_change();

            }
            else {
            //do nothing i guess
            }
        }	


        else if (sel_type === "number"){
            if (cmd_type === "src")
            {	
                //do nothing
            }

            else if (cmd_type === "modulate"){
                //do nothing
            }

            else if (cmd_type === "effect"){
                //do nothing
            }

            else if (cmd_type === "number"){
                //apply the number change to it
            [cur, curI] = getcurrentref();   
            number_change();
            }
            else {
            //do nothing i guess
            }
        }	

        else if (sel_type === "out"){
            if (cmd_type === "src"){

            }
            else {

            }
        }
    }

};

document.onkeydown = async (e) => {
    if (e.key == "Q") {
        if (!port_connected) {
             initialize_port();
        }

    }
    if (e.key == "ArrowDown" && !e.shiftKey) {
        // have strategy functions for what next means in different contexts
        cursor.goNext();
    }
    if (e.key == "ArrowUp" && !e.shiftKey) {
        cursor.goPrev();
    }

    let [cur, curI] = getcurrentref();

    if (e.key == "Enter" && !(e.metaKey || e.ctrlKey)) {
        if (Array.isArray(cur[curI])) {
            cursor.next((e) => (e.push(0), e));
        }
    }

    if (e.key == "Escape") {
        cursor.goUp();
    }

    if (e.key == "ArrowUp" && e.shiftKey) {
        if (typeof cur[curI] == "number") {
            if (e.shiftKey) cur[curI] += .4;
            else cur[curI] += .1;
            updateUI();
        }
    }

    if (e.key == "ArrowDown" && e.shiftKey) {
        if (typeof cur[curI] == "number") {
            if (e.shiftKey) cur[curI] -= .4;
            else cur[curI] -= .1;
            updateUI();
        }
    }

    if (e.key == "N") {
        if (Array.isArray(cur)) {
            cur.splice(curI + 1, 0, 0);
            updateUI();
        }
    }

    if (Array.isArray(cur)) {
        Object.entries(keys).forEach(([key, item]) => {
            if (e.key == key) {
                cur.splice(curI + 1, 0, [...item]);
                updateUI();
            }
        });
    }

    if (e.key.toLowerCase() == "y") {
        buffer = cur[curI];
    }

    if (e.key.toLowerCase() == "p") {
        if (buffer && Array.isArray(cur)) {
            cur.splice(curI + 1, 0, Array.isArray(buffer) ? [...buffer] : buffer);
            updateUI();
        }
    }

    if (e.key == "Enter" && (e.metaKey || e.ctrlKey)) {
        update_page();
    }

    if (e.key == "x") {
        if (Array.isArray(cur)) {
            buffer = cur[curI];
            cur.splice(curI, 1);
            updateUI();
        }
    }

    if (e.key == "Backspace") {
        if (Array.isArray(cur)) {
            cur.splice(curI, 1);
            updateUI();
        }
    }
};


