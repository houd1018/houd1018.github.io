// Professional work — shipped / in-development game titles, newest first. Each card opens a detail panel
// on the home page with the trailer and the contributions.
// cover:   key art in the media library (professional/<slug>/cover.jpg).
// trailer: video = self-hosted file on R2 (plays everywhere, preferred); youtube / bilibili = embed ids.
//          Without a video file, YouTube is used when reachable, otherwise Bilibili (e.g. in mainland China).
// contributions[].tags use the project filter ids (shaders, vfx, tools, procedural, environment, ...);
// contributions[].project = slug of a projects/<slug>.html page (that project also appears in the grid).
window.PROFESSIONAL = [
  {
    slug: "battlefield-6",
    title: "Battlefield 6",
    year: "2025",
    status: "Shipped",
    focus: "Tools · Procedural · Destruction pipeline",
    cover: "professional/battlefield-6/cover.jpg",
    trailer: { youtube: "wFGEMfyAQtI" },
    contributions: [
      {
        title: "FBBreak",
        tags: ["tools"],
        summary: "Destruction asset authoring tool connecting Maya, Houdini and Frostbite. I maintained it during development.",
      },
      {
        title: "Vegetation Houdini Tools",
        tags: ["tools", "procedural"],
        summary: "Maintenance of the Houdini tools used to author vegetation.",
      },
      {
        title: "Maya Curve Resample Tool",
        tags: ["tools"],
        summary: "A Maya tool for resampling curves.",
      },
    ],
  },
  {
    slug: "battlefield-2042",
    title: "Battlefield 2042",
    year: "2021",
    status: "Shipped",
    focus: "War Machine event · Cosmetic shaders · VFX · Tools",
    cover: "professional/battlefield-2042/cover.jpg",
    trailer: { youtube: "8UnuloqTboY" },
    contributions: [
      {
        title: "War Machine Cosmetics",
        tags: ["shaders", "vfx"],
        summary: "Shaders and visual effects for the War Machine event's cosmetic items.",
        project: "battlefield-2042-war-machine-cosmetics",
      },
      {
        title: "Maya Renaming Tool",
        tags: ["tools"],
        summary: "A Maya tool for renaming assets.",
      },
    ],
  },
];
