// =====================================================================
//  PROJECTS
//  ---------------------------------------------------------------------
//  HOW TO ADD / EDIT A PROJECT
//
//  1. Make ONE folder for everything (photos + videos):
//       projects/<folder-name>/
//         cover.jpg          <- the cover (shown on home + projects grid)
//         1.jpg, 2.jpg, …     <- gallery photos, numbered in order
//         horizontal.mp4      <- optional 16:9 film
//         vertical.mp4        <- optional 9:16 reel
//
//  2. In the list below, fill in the text and set:
//       slug:        the URL — lowercase address, no spaces/hyphens
//                    (e.g. "123mainst" -> jacobcschrader.com/project/123mainst)
//       folder:      the folder name from step 1  (e.g. "420-toro-canyon")
//       photos:      how many numbered gallery photos (1.jpg..N.jpg)
//       horizontal:  true if there's a horizontal.mp4
//       vertical:    true if there's a vertical.mp4
//
//  Leave folder as "" for a project whose media isn't ready yet — it
//  will show elegant placeholders until you add it.
//
//  draft: true  hides a project from the home carousel and the projects
//  grid (it stays reachable at its direct /project?slug=… URL). Remove
//  the flag when the real media + text are in.
//
//  TIP: to add a project, duplicate a project folder, swap in the new
//  media (keep the same names: cover.jpg, 1.jpg, 2.jpg…), then copy one
//  entry below, rename its folder/slug, and update the text + counts.
//
//  Notes: photos must be .jpg and named 1.jpg, 2.jpg, …; the cover is
//  cover.jpg. The site builds every file path automatically.
// =====================================================================

var RAW_PROJECTS = [
  { slug: "2350bigranchroad",  folder: "2350-big-ranch-road",  title: "2350 Big Ranch Road",  location: "Napa, CA",         year: "", headline: "", summary: "", shot_for: "", brokerage: "", photos: 45, horizontal: false, vertical: false },
  { slug: "3nlasendadrive",    folder: "3-n-la-senda-drive",   title: "3 N La Senda Drive",   location: "Laguna Beach, CA", year: "", headline: "", summary: "", shot_for: "", brokerage: "", photos: 24, horizontal: false, vertical: false },
  { slug: "465headwatersway",  folder: "465-headwaters-way",   title: "465 Headwaters Way",   location: "",                 year: "", headline: "", summary: "", shot_for: "", brokerage: "", photos: 12, horizontal: false, vertical: false },
  { slug: "5211pennockpoint",  folder: "5211-pennock-point",   title: "5211 Pennock Point",   location: "Jupiter, FL",      year: "", headline: "", summary: "", shot_for: "", brokerage: "", photos: 23, horizontal: false, vertical: false },
  { slug: "55delmontedrive",   folder: "55-del-monte-drive",   title: "55 Del Monte Drive",   location: "",                 year: "", headline: "", summary: "", shot_for: "", brokerage: "", photos: 13, horizontal: false, vertical: false },
  { slug: "8076villandrydrive", folder: "8076-villandry-drive", title: "8076 Villandry Drive", location: "Truckee, CA",     year: "", headline: "Martis Camp", summary: "", shot_for: "", brokerage: "", photos: 11, horizontal: false, vertical: false },
  { slug: "9233heartwooddrive", folder: "9233-heartwood-drive", title: "9233 Heartwood Drive", location: "Truckee, CA",     year: "", headline: "", summary: "", shot_for: "", brokerage: "", photos: 24, horizontal: false, vertical: false },
  { slug: "9290braeroad",      folder: "9290-brae-road",       title: "9290 Brae Road",       location: "Truckee, CA",      year: "2026", headline: "Schaffers Mill Estate", summary: "", shot_for: "Eric Navarro", brokerage: "Compass", price: "$4,350,000", photos: 49, horizontal: false, vertical: false },
  { slug: "9304ninebarkroad",  folder: "9304-ninebark-road",   title: "9304 Ninebark Road",   location: "Truckee, CA",      year: "", headline: "", summary: "", shot_for: "", brokerage: "", photos: 12, horizontal: false, vertical: false }
];

// Build the full project objects (file paths derived from the folder).
function buildProject(p) {
  var dir = "projects/" + p.folder + "/";   // photos + videos live together here
  var gallery = [];
  if (p.folder && p.photos > 0) {
    for (var i = 1; i <= p.photos; i++) gallery.push(dir + i + ".jpg");
  }
  return {
    slug: p.slug,
    draft: !!p.draft,
    title: p.title,
    location: p.location,
    year: p.year || "",
    headline: p.headline || "",
    summary: p.summary || "",
    shot_for: p.shot_for || "",
    brokerage: p.brokerage || "",
    price: p.price || "",
    cover_url: p.folder ? dir + "cover.jpg" : "",
    gallery: gallery,
    horizontal_video: (p.folder && p.horizontal) ? dir + "horizontal.mp4" : "",
    vertical_video:   (p.folder && p.vertical)   ? dir + "vertical.mp4"   : ""
  };
}

window.PROJECTS_DATA = RAW_PROJECTS.map(buildProject);

// Carousel + grid only need a few fields; published projects live at
// their static /project/<slug> pages (see tools/generate-share-pages.mjs).
// Drafts are excluded — clients only ever see finished work.
window.PROJECTS = window.PROJECTS_DATA.filter(function (p) { return !p.draft; }).map(function (p) {
  return {
    title: p.title,
    loc: p.location,
    file: "/project/" + p.slug,
    img: p.cover_url || ""
  };
});
