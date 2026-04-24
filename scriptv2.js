import { reactive } from "./chowk.js";
import { dom } from "./dom.js";

const frame = document.querySelector("iframe");
const codeEl = document.querySelector("#code");
const interfaceEl = document.querySelector("#interface");
export const round = (n, r) => Math.ceil(n / r) * r;

let code = `
	src(s0).out()
`;

// let codeData = [
// 	["src", "s0"],
//     ["linearBurn","s0"],
// 	["out", "o0"]
// ];
//to do: randomness
let currentO = 0;

let allO = [

    [
        ["src", "s0"],
        ["blend", ["src","o0"], 0.5],
        ["out", "o0"]
    ],

    [
        ["src","o0"],
        ["blend", ["src","o1"], 0.5],
        ["out","o1"]
    ],

    [
        ["src","o1"],
        ["blend", ["src","o2"], 0.5],
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

        <script src="https://cdn.jsdelivr.net/gh/geikha/hyper-hydra@latest/hydra-blend.js"></script>

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
/*
"BI": ["blend", ["src", "o0"],[0.25,0.95]],
"BA": ["mult", ["src", "o0"], [0.1,0.9]],
"BJ": ["diff", ["src", "o0"],[0.1,0.9]],
"BL": ["sub", ["src", "o0"], [0.1,0.9]],
"BK": ["add", ["src", "o0"], [0.1,0.9]],
"BE": ["linearBurn", ["src","o0"],[0.1,0.9]],
"BC":["colorBurn", ["src","o0"],[0.1,0.9]],
"BD":["colorDodge", ["src","o0"],[0.1,0.9]],
"BF":["linearDodge", ["src","o0"],[0.1,0.9]],
"BG":["vividLight", ["src","o0"],[0.1,0.9]],
"BH":["difference", ["src","o0"],[0.1,0.9]],

"GA": ["softLight", ["src", "o0"], [0.1,0.9]],
"GB": ["hardLight", ["src", "o0"],[0.1,0.9]],
"GC": ["pinLight", ["src", "o0"], [0.1,0.9]],
"GD": ["hardMix", ["src", "o0"], [0.1,0.9]],
"GE": ["exclusion", ["src","o0"],[0.1,0.9]],
"GF":["difference", ["src","o0"],[0.1,0.9]],
"GH":["glow", ["src","o0"],[0.1,0.9]],
"GI":["linearLight", ["src","o0"],[0.1,0.9]],
"GJ":["reflect", ["src","o0"],[0.1,0.9]],
"GK":["screen", ["src","o0"],[0.1,0.9]],

"HA": ["darken", ["src", "o0"], [0.1,0.9]],
"HB": ["lighten", ["src", "o0"],[0.1,0.9]],
"HC": ["screen", ["src", "o0"], [0.1,0.9]],
"HD": ["overlay", ["src", "o0"], [0.1,0.9]],
*/

const src = new Set(["noise","osc","shape","gradient","voronoi", "solid", "s0", "o0", "o1","o2","s1" , "src"]);
const out = new Set(["out"]);
const color_effect = new Set(["colorama","invert","hue","thresh","luma","saturate","contrast","brightness","scale","repeat","rotate", "scrollX", "scrollY", "kaleid"]);
const transform_effect = new Set(["scale","repeat","rotate", "scrollX", "scrollY", "kaleid"]);
const modulate = new Set(["modulate", "modulateScale", "modulateRepeat", "modulateRepeat", "modulateKaleid", "modulateScrollY", "modulateScrollX"])
const blend = new Set(["diff", "blend", "mult", "add", "sub","linearBurn","colorBurn","colorDodge","linearDodge","vividLight","difference",
    "softLight","hardLight","pinLight","hardMix","exclusion","difference","glow","linearLight","reflect","screen",
"darken","lighten","screen","overlay"
])
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
    s0.initCam(0);
    s1.initCam(1);
    setResolution(1920,1080);`
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
document.body.classList.add(`out${currentO}`);
setTimeout(() => { update_page(); },500)
// update_page();

function updateUI(data = codeData) {
    let d = [".dawg"];

    data.forEach((fn, fnI) => {
        d.push(defaultrenderer(fn, fnI, []));
    });

    interfaceEl.innerHTML = "";
    interfaceEl.appendChild(dom(d));
    highlight();


}

let format_number = (n) => {
    if (Number.isInteger(n)) return String(n);
    return parseFloat(n.toPrecision(12)).toString();
}

let defaultrenderer = (el, i, a, prefix = "") => {
    // console.log("Rendering:", el);
    if (Array.isArray(el)){
        if (Array.isArray(el[0])){
            return renderchain(el, a.concat([i]));
        }

     else {
        return arrayui(el, a.concat([i]));
    }
}
    // return arrayui(el, a.concat([i]));
    else if (typeof el == "string") return ["span.string", selected(a, i), prefix + el];
    else if (typeof el == "number") {
        return ["span.number", selected(a, i), (prefix + format_number(el) + "")];
    } else console.error(el);
};

let selected = (address, i) => {
    let addy = [...address];
    if (i != undefined) addy.push(i);
    let addy_str = addy.join("-");
    return {
        address: addy_str,
        // selected: addy_str == cursor.value().join("-"),
        onclick: (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            cursor.next([...addy]);
        },
    };
};

let renderchain = (chain,addy) => {
    let stuff = [".chain", { address: addy.join("-")}];
    chain.forEach((fn, fnI) => {
        // if (fnI > 0 ) stuff.push(["span.dot]);
        stuff.push(arrayui(fn, addy.concat([fnI])));
    });
    return stuff;
}

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

let highlight = () => {
    let v = cursor.value();
    document.querySelectorAll("*[selected ='true']").forEach(el => 
        el.setAttribute("selected","false")
    );
           
    
    let selectedEl = document.querySelector(`*[address='${v.join("-")}']`);
    if (selectedEl){
                selectedEl.setAttribute("selected", "true");
            selectedEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
};

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

    if (cursor.value().length === 1){
        const out_index = codeData.findIndex(item => Array.isArray(item) && item[0] === "out");
        const max_index = out_index - 2;
        if (refindex >= max_index) return;
    }

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
/*
let random_param = (param) => {

    if (Array.isArray(param) && param.length === 2 &&
    typeof param[0] === 'number' && typeof param[1] === 'number'){
        return Math.random()*(param[1]-param[0] + param[0]);
    }
    
    return param
}
*/
let keys = {

//srcs
"AI": ["modulate", ["src", "o0"],[-.25,.25]],
"AH": ["modulateScale", ["src", "o0"], [-0.2,0.5]],
"AJ": ["modulateRepeat", ["src", "o0"],[-3,3]],
"AD": ["modulateScrollX", ["src", "o0"],[-.5,.5],[-.25,.25]],
"AE": ["modulateScrollY", ["src", "o0"],[-.5,.5],[-.25,.25]],
"AF": ["modulateKaleid", ["src", "o0"], [0,20]],
"AG": ["modulatePixelate", ["src", "o0"], [-100,100],[-100,100]],

//blends
"BI": ["blend", ["src", "o0"],[0.25,0.95]],
"BA": ["mult", ["src", "o0"], [0.1,0.9]],
"BJ": ["diff", ["src", "o0"],[0.1,0.9]],
"BL": ["sub", ["src", "o0"], [0.1,0.9]],
"BK": ["add", ["src", "o0"], [0.1,0.9]],
"BE": ["linearBurn", ["src","o0"],[0.1,0.9]],
"BC":["colorBurn", ["src","o0"],[0.1,0.9]],
"BD":["colorDodge", ["src","o0"],[0.1,0.9]],
"BF":["linearDodge", ["src","o0"],[0.1,0.9]],
"BG":["vividLight", ["src","o0"],[0.1,0.9]],
"BH":["difference", ["src","o0"],[0.1,0.9]],

"GA": ["softLight", ["src", "o0"], [0.1,0.9]],
"GB": ["hardLight", ["src", "o0"],[0.1,0.9]],
"GC": ["pinLight", ["src", "o0"], [0.1,0.9]],
"GD": ["hardMix", ["src", "o0"], [0.1,0.9]],
"GE": ["exclusion", ["src","o0"],[0.1,0.9]],
"GF":["difference", ["src","o0"],[0.1,0.9]],
"GH":["glow", ["src","o0"],[0.1,0.9]],
"GI":["linearLight", ["src","o0"],[0.1,0.9]],
"GJ":["reflect", ["src","o0"],[0.1,0.9]],
"GK":["screen", ["src","o0"],[0.1,0.9]],

"HA": ["darken", ["src", "o0"], [0.1,0.9]],
"HB": ["lighten", ["src", "o0"],[0.1,0.9]],
"HC": ["screen", ["src", "o0"], [0.1,0.9]],
"HD": ["overlay", ["src", "o0"], [0.1,0.9]],


// darken
// multiply
// colorBurn
// linearBurn
// lighten
// screen
// colorDodge
// linearDodge
// overlay
// softLight
// hardLight
// vividLight
// linearLight
// pinLight
// hardMix
// difference
// exclusion
// subtract
// divide
// negation / negate
// add2 (i didn't want to replace the regular Hydra add)
// glow
// reflect
// phoenix

//to do: separate by transforms or color
//effects
"CI": ["colorama", [-1,1]],
"CH": ["scale", [-1.5,1.5], [-1.5,1.5]],
"KG": ["repeat", [1,3],[1,3]],
"KI": ["rotate", [0,0.1],[-0.25,0.25]],
"CF": ["hue", [0,1]],
"CE": ["thresh", [0.4,0.6]],
"CD": ["luma", [0.4,0.6]],
"CJ": ["saturate", [1,1.25]],
"CK": ["contrast", [1,1.25]],
"CL": ["brightness", [0,0.1]],


//srcs
"LI":["noise", [0,7],[-0.1,0.1]],
"LH": ["osc", [0,2], [-0.25,0.25], [-10,10]],
"LG": ["shape", [0,20], [0.1,0.4], [0.01,0.1]],
"LF": ["src", "o2"],
"LA": ["src", "s0"],
"LE": ["src","o1"],
"LD": ["src","o0"],
"LC": ["src","s0"],
"LB": ["src","s1"],


//numbers
"DI": ["number", 0.1],
"DH": ["number", -0.1],
"EI": ["number", 1.],
"EH": ["number", -1.],
"FI": ["number", 10.],
"FH": ["number", -10.],
"DB": ["number", 0.],


"L": ["system", "deleteline"]

};

const random_range = (min,max) => Math.round((Math.random() * (max - min) + min)*100)/100;

const random_param = (item) => {
    if (item[0] === "number"){
        return [...item];
    }
    const randomized = [...item];
    for (let i=1; i<randomized.length; i++){
        const param = randomized[i];

        if (Array.isArray(param) && param.length === 2 && typeof param[0] === 'number' && typeof param[1] === 'number' &&
        !Array.isArray(param[0])){
            randomized[i] = random_range(param[0],param[1]);
        }
        else if (Array.isArray(param)){
            randomized[i] = random_param(param);
        }
    }
    return randomized;

}

const correct_src = (item, pageIndex) =>{
    if (!item) return item;
    const ismodorblend = modulate.has(item[0])|| blend.has(item[0]);
    if (ismodorblend && Array.isArray(item[1]) && item[1][0] === "src"){
        const curO = ["o0","o1","o2"];
        return [item[0], ["src", curO[pageIndex]], ...item.slice(2)];
    }
    return item;
}

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

    // const ismod_orblend = modulate.has(item[0]) 

    //if (cmd.KEY2){
    if (cmd.KEY == "H") {
    cursor.goNext();
    }

    if (cmd.KEY == "I"){
        cursor.goPrev();
    }

    if (cmd.KEY == "B"){
        cursor.goUp();
    }
    
    if (cmd.KEY == "J"){
        if (Array.isArray(cur[curI])) {
        // const hasnest = cur[curI].slice(1).some(param => Array.isArray(param));
        const hasparams = cur[curI].length > 1;
        const srcorout = cur[curI][0] === "src" || cur[curI][0]  === "out";
        if (hasparams && !srcorout){
        cursor.next((a) => (a.push(1), a));
        updateUI();
        }
    }


        // else console.log(cur[curI])
    }
    if (cmd.KEY == "K"){
        const blend_pot = (cmd.POT / 1023).toFixed(2);
        const out_index = allO[currentO].findIndex(item => Array.isArray(item) && item[0] === "out");
        const blend_index = out_index - 1;
        allO[currentO][blend_index][2] = parseFloat(blend_pot);
        update_page();
    }

    if (cmd.KEY == "D" || cmd.KEY == "C"){
            update_page();
    }
    
   else if (cmd.KEY == "A"){
            currentO = (currentO - 1 + 3) % 3;

        // document.documentElement.style.setProperty('--currentO', `'${currentO}'`);
        document.body.classList.remove('out0','out1','out2');
        document.body.classList.add(`out${currentO}`);
        codeData = allO[currentO];
        cursor.next(()=>[0]);
        updateUI();
        update_page();
    }

    else if (cmd.KEY == "G"){
                currentO = (currentO + 1) % 3;

        document.body.classList.remove('out0','out1','out2');
        document.body.classList.add(`out${currentO}`);
        codeData = allO[currentO];
        cursor.next(()=>[0]);
        updateUI();
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

        if (cmd.KEY == "DH"){
            cur[curI] += -.1;
            updateUI();
        
    }

        if (cmd.KEY == "EI"){
    
            cur[curI] += 1.;
            updateUI();
    
    }

        if (cmd.KEY == "EH"){

            cur[curI] += -1.;
            updateUI();

    }

        if (cmd.KEY == "FI"){

            cur[curI] *= 10;
            updateUI();
        
    }

        if (cmd.KEY == "FH"){

            cur[curI] *= 0.1;
            updateUI();

    }

    if (cmd.KEY == "DB"){

            cur[curI] = 0.;
            updateUI();

    }


    }

    if(item){

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
                
                if (cursor.value().length === 1){
                    const out_index = codeData.findIndex(item => Array.isArray(item) && item[0] === "out");
                    if (curI >= out_index -1){
                        cursor.next((a) => (a[a.length -1] -= 1, a));
                    }
                }

            }
        }
        }
        }

        


        if (sel_type === "src"){
            if (cmd_type === "src")
            {	
                const verify_src = (currentO === 1 || currentO === 2) && cursor.value().length === 1 && curI === 0
            
                    if (!verify_src){

                    cur[curI] = random_param(correct_src(item,currentO));
                    updateUI();
                    }
                //replace the existing src with this new one
            }
            else if (cmd_type === "modulate" || cmd_type === "effect" || cmd_type === "blend" ){
                if (cursor.value().length === 1){
                    codeData.splice(curI + 1, 0, random_param(correct_src(item,currentO)));
                    updateUI;
                }
              
                else {
                    if (Array.isArray(cur[curI][0])){
                        cur[curI].push(random_param(correct_src(item,currentO)));
                    }
                    else {
                        cur[curI] = [[...cur[curI]],random_param(correct_src(item,currentO))];
                    }
                                cursor.next(a => [...a, 0]);

                }

                updateUI();
                //add the modulate or effect function to the next line
            }
            else if (cmd_type === "number"){
                //go inside the src and highlight the first parameter (and apply that number change +.1 or whatever)

                if (cur[curI][0] !== "src" && cur[curI][0] !== "out"){

                if (cur[curI].length > 1) {
            cursor.next(a => [...a, 1]);       
            [cur, curI] = getcurrentref();   
            number_change();
                }

            }
            else {
            //do nothing i guess
            }}
            else {
                
            }
        }

        else if (sel_type === "modulate"){
            if (cmd_type === "src")
            {
                let cmd_mod = [...cur[curI]];
                cmd_mod[1] = random_param(correct_src(item,currentO));
                codeData.splice(curI + 1, 0, cmd_mod);
                updateUI();
                //duplicate the sel_type modulate
                // replace sel_type src with cmd_type src as it's first parameter, add it to next line
            }

            else if (cmd_type === "modulate"){
                //replace the sel_type modulate with the cmd_type modulate
                cur[curI] =random_param(correct_src(item,currentO));
                updateUI();
            }

            else if (cmd_type === "effect"){
                //add the default cmd_type effect to the next line

            codeData.splice(curI + 1, 0, random_param(correct_src(item,currentO)));
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

            codeData.splice(curI + 1, 0, random_param(correct_src(item,currentO)));
            updateUI();
            }

            else if (cmd_type === "effect"){
                //add the default cmd_type effect to the next line

            codeData.splice(curI + 1, 0, random_param(correct_src(item,currentO)));
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

    //    if (sel_type === "number"){
            number_change();
      //  }
           /* 
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
            }*/
        // else {
        // //do nothing i guess
        // }
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
                cur.splice(curI + 1, 0, (random_param(correct_src(item,currentO))));
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


