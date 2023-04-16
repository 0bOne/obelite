# Procedural Ships RFC

## Introduction

Good detail on a spaceship requires a huge number of polygons plus one or more textures for detail, shading and possible surface normals.  The compact yaml file format used in this project requires almost 300k of yaml + 1.6MB of textures to render a decent looking ship: Approximately 2MB: a large storage and bandwidth hit, for a a relatively small amount of data.

Yet when one uses blender, autocad, etc., to build a model, there are relatively few construction steps compared to the eventual number of polygons.

Ships are, by and large, constructed from symmetric and regular shapes, and therefore there is a potential savings to contruct them procedural from bare minimum data.

Also, in the real world, complex machinery is often constructed from reusable components: A radio, an engine, an antenna.  In fact, ships are constructed based on a number of hulls (and connecting booms) and those hulls generally start with a datum keel for one axis, a transom for the rear, and ribs/sections moving forward to the eventual prow.

This document attempts to lay out a standard data format for constructing a ship procedurally from minimal data such that quite complex meshes and models can be built. While this has yet to be 
tested, it is thought that .

## Definitions

Keel.  The physical or purely abstract axis around which a vessel is built.
Transom.  The datum "rearmost  secton" from which a ship's hull extrudes.
Section.  A shape that represents a cross sectional shape of a vessel at a particular distance from the transom
Face.  The face of a ship. Typically resolves to two triangles
Trusion.  An intrusion or extrusion on a face that adds detail
Catalog. The master list of materials, reusable trusions, and equipment that ships can be contructed from.
Vessel.  An entire definiton, comprised of one or more hulls connected by booms.
Hull. A set of data representing the keel, transom, faces, trusions, and materials.
Boom.  A set of data representing a structural "strut" that connects hulls together.  


## Theory

A ship can be thought of as a partially symmetrical, customized extrusion from a plane forward from a datum (the transom) each section of the extrusion can have its own shape, and connects to the previous section wiht a number of faces.  The simples face is usually contstructed of two triangles, but this is modified by "trusions" (intrusions or extrusions) that have their own shape, faces and materials.  From this pattern it should be seen that quite complex meshes can be constructed.  Because every face can have a material, and because of the diminishing recursive nature of the faces, very complex colored meshes can be built from repeated or recursive data with no need to include textures.  With the inclusion of a reusable components from a master calatog, ship definitions no longer need to specify everything they are constructed of: they can pull in information from the master equipment catalog.  The master equipment catalog is contructed the same way: a set of trusions and face materials.

A quick visualization shows that trusions, hulls, and booms can have the same structure: a set of sections from a datum.

Further, a vessel might be constructed from a handful of alloys and composites. Because a large image is typically used to texture-map details onto the faces, a great deal of wasted information exists in the image.  Instead, each face could have its own material reference: a relatively small amount of data that is expanded later.   While these textures often contain decals, imperfections and dirt representations, all of that can be generated later, using a random or pseudorandom dirt algorithm from a relatively tine amount of data.  

Caution: Because specifications can be resuable references, there is a chance of infinite recursion. A mesh building algorithm must enforce some maximum limt: recursion depth, number of polgygons, or similar.

While MVP is unlikely to implement this, procedurally generated meshes can have reducing levels of detail to keep polygon count low. This is especially beneficial in games or simulations that cover lage distances because, more of often than not, viewed vessels are far away and not much detail is necessary: There is no need to render an external cannon on a vessel that is a small dot in the distance, for example, and it can be optimized out of a low LOD mesh to keep polygon counts low.

## Proposed Specifications

Items marked with a * can ba specification, in-file reference, or master catalog reference

Note that all values are floating point numbers in the range 0.0 - 1.0 (normalized);
Angles are fractions of a circle (fractions of 2* PI or 360 deg)


Entity Specification
    Id:                 - FQ identifier
    Description:        - what this entity represents

    Scale:                   - Size relative to previous section
                                The first item, usually the transom, or datum.
                                Otional. Defaults to 1
    Spacing:            - default section spacing. 
                            Optional. Defaults to [1/section_count] (even spacing)
    Angle:              - default section parallel angle. 
                            Optional. Defaults to zero.
    Face:               - default face. Used where a section's faces are not defined.
                            See Section specification for face details.
    Sections:
        - Section [0]       - The datum section. 
                                Represents a ships transom section's shape or
                                a trusion's datum section's shape
        - Section [1-n]       - Each additional section. 
                                - at least two sections must be present (prow and transom; )
    Materials:          - Materials unique to this entity, not available in the master catalog (s)
    Entities:           - Equipment, hulls, trusions, etc., unique to this entity, not availablein the master catalog(s)


Section Specification:
    A section's shape is contructed from points on a circle.
    Where indices [1-r] are shown, indicates repetition of definition, across actual number of items specified

    dz                      - Distance modifier from previous section. 
                                Scales default section spacing.
                                Optional. Defaults to 1.
                                Should not be specified for datum/transom
                                Positive for extrusions, negative for intrusions
                                All sections in an entity WILL inherit the signum of section[0].
                                    This ensures they all go in the same direction [intrude or extrude]
    az                      - Parallelism angle from previous section 
                                Optional. defaults to 1.0 (parallel)
                                Cannot be 0.5 (perpendicular)
    tz                      - Twist from previous section. 
                                Allows section to rotate against the previous section. Not for MVP.
    ox, ox                  - Offset from x=0, y=0, circle center. 
    ex, ey                  - Ellipticality of circle on which points are distributed
    np                      - Number of points on circle that form the shape's path. 1 or more 
    oc[1-r]                   - Offset angle for zero or more of the points from their regular position 
                                Allows for irregular secteion shapes
                                Not planned for MVP: will assume points are regularly spaced
    cc[1-r]                   - Point number on next section to which this point will connect.
                                Not present in MVP. default is to connect to the nearest point 
                                (based on point's current angle, not x,y,z)                            
    face[0-r]:                  - one or more face specfications 
                                Must be at least one face, either here or the entity's default face.
                                Faces are drawn forward of the transom (or datum) face to the next section
                                Face definitions repeat:
                                    one face defintion would mean the same definition for all faces
                                    two face defintions would mean alternate face defintions for all faces
                                    if the defintion count is the same as the face count, all faces will be unique
                                A face is typically two triangles, depending on the number of points in the next section.
        m*                      material index for this face
        n                       Not for MVP. Surface normal modification angle.
        entity[0-n]               zero or more entities (trusions) that modify the face                  
        

Material specification:
    Because materials model a real world material, and are designed to be highly reusable, they never need to by represented by a texture.
    - id                          Unique identifier. Uses . notation for fully qualified naming.
    - description                 Information about the material to help with cataloging.
    - rgba                        Color. normalized rgba
    - la                          TBD: Lighting characteristics (specularity, reflectivity, refractivity (not MVP))
    - sa                          TBD: Shading algorthim number: flat, phong, gourad, etc. 
                                        (likely only flat for MVP) 




