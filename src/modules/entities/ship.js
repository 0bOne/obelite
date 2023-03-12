// import jsYaml from "../utilities/js-yaml.js";
// import * as THREE from "../../modules/three/Three.js";
// //import cobra3Mesh from "../../data/models/ships/redux/cobra3/hull.mesh.json" assert {type: "json"};

// const cobraYamlUrl =  "./data/models/ships/redux/cobra3/geometry.yaml";
// const cobraImageUrl = "./data/models/ships/redux/cobra3/cobra3_redux_nums.png";

// export default class Ship {

//     shipData;

//     constructor(shipData) 
//     {
//         this.shipData = shipData;
//     }

//     async BuildFromYaml(name)
//     {
//         const modelData = await jsYaml.fetch(cobraYamlUrl);
//         const loader = new THREE.TextureLoader();
//         const texture = await loader.load(cobraImageUrl);
//         texture.userData = "cobra texture";

//         const positionNumComponents = 3;
//         const normalNumComponents = 3;
//         const uvNumComponents = 2;

//         const newPositions = [];
//         const newNormals = [];
        
//         const scaleFactor = modelData.scaleFactor || 1;

//         // for (let v = 0; v < modelData.positions.length; v++)
//         // {
//         //     modelData.positions[v] *= scaleFactor;
//         // }

//         const faceCount = modelData.indices.length /3;
//         for (let faceNum = 0; faceNum < faceCount; faceNum++)
//         {
//             for (let vertNum = 0; vertNum < 3; vertNum++)
//             {
//                 //debugger;
//                 const oldPosIndex = modelData.indices[faceNum * 3 + vertNum];
//                 const newPosIndex = faceNum * 3 + vertNum;
//                 newPositions.push(modelData.positions[oldPosIndex * 3]);
//                 newPositions.push(modelData.positions[oldPosIndex * 3+ 1]);
//                 newPositions.push(modelData.positions[oldPosIndex * 3+ 2]);
                
//                 newNormals.push(modelData.faceNormals[oldPosIndex * 3]);
//                 newNormals.push(modelData.faceNormals[oldPosIndex * 3 + 1]);
//                 newNormals.push(modelData.faceNormals[oldPosIndex * 3 + 2]);
//             }
//         }
 
//         //console.log("verts:", newPositions.join(";"));
//         //console.log("norms:", newNormals.join(";"));
//         //console.log("uvs:  ", modelData.textures[0].sts.join(";"));

//         const posBuffer = new Float32Array(newPositions);  //36     180
//         const normBuffer = new Float32Array(newNormals); //60   180
//         const uvBuffer = new Float32Array(modelData.textures[0].sts); //120   120
//         const geometry = new THREE.BufferGeometry();

//         posBuffer.$use = "positions";
//         normBuffer.$use = "normals";
//         uvBuffer.$use = "uvs";

//         geometry.setAttribute('position', new THREE.BufferAttribute(posBuffer, positionNumComponents));
//         geometry.setAttribute('normal', new THREE.BufferAttribute(normBuffer, normalNumComponents));
//         geometry.setAttribute('uv', new THREE.BufferAttribute(uvBuffer, uvNumComponents));

//         const material = new THREE.MeshBasicMaterial({
//             map: texture,
//             //color: 0x049ef4,
//             emissive: 0x049ef4,
//             opacity: 1.0,
//             transparent: false,
//         })

//         const mesh = new THREE.Mesh(geometry, material);
//         mesh.rotateX(10).rotateY(20).rotateZ(20);
//         this.Mesh = mesh;
//     }

//     async Build() 
//     {
//         const shipData = this.shipData;
//         const loader = new THREE.TextureLoader();
//         const texture = await loader.load(cobraImageUrl);
//         texture.userData = "cobra texture"

//         const indexMap = {};
//         const vertexArray = [];
//         const indexArray = [];

//         //scale the textures
//         shipData.textures.forEach(texture => {
//             texture.STs.forEach(ST => {
//                 ST[0] = ST[0] / texture.XYmax[0];
//                 ST[1] = ST[1] / texture.XYmax[1];
//             });
//         });

//         //expand faces to vertex array 
//         let faceNumber = 0;
//         shipData.faces.forEach(face => {
//             face.indices = [];
//             face.number = faceNumber;
//             let sourceUVIndex = 0;
//             face.vertices.forEach(sourceIndex => {
//                 const vertex = shipData.vertices[sourceIndex];
//                 let normal = shipData.normals[sourceIndex] || face.normal;

//                 const key = vertex.join(".") + "_" + normal.join(".");
//                 let targetIndex = indexMap[key];
//                 if (targetIndex === undefined)
//                 {
//                     //this vertex is new; create the data
//                     targetIndex = vertexArray.length;
//                     vertexArray[targetIndex] = {
//                         position: shipData.vertices[sourceIndex],
//                         normal: normal,
//                         index: targetIndex,
//                         face: faceNumber,
//                         //texture: shipData.textures[faceNumber],
//                         UV: shipData.textures[faceNumber].STs[sourceUVIndex]
//                     };
//                     indexMap[key] = targetIndex;
//                 }
//                 //add this face's vertex index to the face index array
//                 indexArray.push(targetIndex);
//                 sourceUVIndex++;
//             });

//             //TODO: color
//             faceNumber++;
//         });

//         //console.log("vertices", vertexArray);
//         //console.log("indices", indexArray)
//         //console.log("vertex count: ", indexArray.length);

//         const positionNumComponents = 3;
//         const normalNumComponents = 3;
//         const uvNumComponents = 2;

//         const posBuffer = new Float32Array(indexArray.length * positionNumComponents);
//         const normBuffer = new Float32Array(indexArray.length * normalNumComponents);
//         const uvBuffer = new Float32Array(indexArray.length * uvNumComponents);

//         //expand vertex array to attribute buffers
//         let i = 0;
//         vertexArray.forEach(vData => {
//             //console.log("vdata", vData);
//             posBuffer.set(vData.position, i * positionNumComponents);
//             normBuffer.set(vData.normal, i * normalNumComponents);
//             uvBuffer.set(vData.UV, i * uvNumComponents);
//             i++;
//         });

//         const geometry = new THREE.BufferGeometry();

//         geometry.setAttribute('position', new THREE.BufferAttribute(posBuffer, positionNumComponents));
//         geometry.setAttribute('normal', new THREE.BufferAttribute(normBuffer, normalNumComponents));
//         geometry.setAttribute('uv', new THREE.BufferAttribute(uvBuffer, uvNumComponents));
//         //console.log("uv", uvBuffer);        
//         geometry.setIndex(indexArray);

//         debugger;

//         const material = new THREE.MeshBasicMaterial({
//             //color: 0xf67104,
//             map: texture,
//             metalness: 0.1,
//             roughness: 0.1,
//             opacity: 1.0,
//             transparent: false,
//             transmission: 0.99,
//             clearcoat: 1.0,
//             clearcoatRoughness: 0.25
//         })

//         const mesh = new THREE.Mesh(geometry, material);
//         mesh.rotateX(10).rotateY(20).rotateZ(20);
//         this.Mesh = mesh;
//        // scene.add(mesh);
//     }
// };