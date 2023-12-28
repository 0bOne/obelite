import {Surface, FromCssColor} from "./mesh-generator.js";

const materials = {
    blue: {
        //color: [0,0,1]
        color: FromCssColor("#0000FF")
    },
    green: {
        color: FromCssColor("#00FF00")
    },
    yellow: {
        color: FromCssColor("#FFFF00")
    },
    red: {
        color: FromCssColor("#FF0000")
    },
    orange: {
        color: FromCssColor("#FFA500")
    }
};


let builder = new Surface(null, "transom")
        .setLod(0)                
        .setMaterials(materials.blue)
        .setCursor(0,0)                     // 
        .edgePolar(1.33, 90 + 6)            // #0: ridge descening to wingtip at 2 o'clock 
        .edgePolar(.635, 90 + 26)           // #1: wingtip rear upper at 3 o'clock
        .edgePolar(1.41, 270 - 7)           // #2: underwing to belly at 5 o'clock
        .closePath(true, false)             // #3,4,5,6: auto close with symmetrical edges/points about x=0
    .adjoinFace(3, "belly")                 // new surface with edge #0 taken from previous surface edge #3
        .setLod(0)
        .setMaterials(materials.green)
        .setFold(90)                               // TODO: mountain fold 90 degrees against prior face
        .edgePolar(1.91, 180 + 4.7)         // #1: starboard side of belly
        .closePath(true, false)             // #2,3: auto close with symmetrical edges/points about x=0
    .adjoinFace(1, "underWingR")            // new face from belly edge #1 (starboard)
        .setLod(0)
        .setMaterials(materials.yellow)
        .edgePolar(1.33, 90 + 20)           // #1: bottom edge between wing and wingtip
        .closePath(false, false)            // #2: wing leading edge
    .adjoinFace(1, "underWingR.tip")
        .setLod(0)
        .setMaterials(materials.red)
        .edgePolar(1.40, 90)                // #1: outer edge of wingtip
        .closePath(false, false)            // #3: rear edge of wingtip
    .mirrorClone("belly/underWingR", "belly/underWingL", 3)  //make a mirror of face on belly edge #1 onto (edge #3)
        //clones underWing + tip
    .getRootFace()   ;                       //select transom again
    
    
    //no sign of this... WHY??
    builder = builder.adjoinFace(0, "dorsalR", false)
        .setLod(0)   
        .setMaterials(materials.blue)
        .edgePolar(1.98, 80)
        .edgePolar(1.2, 20)
        .closePath(false, false);                     

        debugger;

//TODO: .buttonUp -> mountain folds all common edges so that raw edges are joined

//builder is fluent and will return the last face, need the original face to get the geometry
const root = builder.getRootFace();  

//const triangles = root.getTriangles();
//debugger;
const geometry = root.getGeometry()

export default {
	metadata: {
            name: "cobra mk III",
            description: "cobra III geometry",
            pipeline: "colored-mesh"
    },
    vertices: geometry.vertices,
    colors: geometry.colors
};