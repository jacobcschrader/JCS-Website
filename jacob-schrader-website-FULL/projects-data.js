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
//       folder:      the folder name from step 1  (e.g. "420-toro-canyon")
//       photos:      how many numbered gallery photos (1.jpg..N.jpg)
//       horizontal:  true if there's a horizontal.mp4
//       vertical:    true if there's a vertical.mp4
//
//  Leave folder as "" for a project whose media isn't ready yet — it
//  will show elegant placeholders until you add it.
//
//  TIP: to add a project, duplicate a project folder, swap in the new
//  media (keep the same names: cover.jpg, 1.jpg, 2.jpg…), then copy one
//  entry below, rename its folder/slug, and update the text + counts.
//
//  Notes: photos must be .jpg and named 1.jpg, 2.jpg, …; the cover is
//  cover.jpg. The site builds every file path automatically.
// =====================================================================

var RAW_PROJECTS = [
  { slug: "9290-brae-road",  folder: "9290-brae-road", title: "9290 Brae Road", location: "Truckee, CA", year: "2026", headline: "Schaffers Mill Estate", summary: "", shot_for: "Eric Navarro", brokerage: "Compass", price: "$4,350,000", photos: 49, horizontal: false, vertical: false },
  { slug: "toro-canyon",     folder: "420-toro-canyon", title: "420 Toro Canyon Road", location: "Montecito, CA", year: "2026", headline: "Light above the canyon", summary: "A refined modern residence set into the Montecito hillside — photographed across golden hour and twilight to lead with the view. (Sample text — edit me.)", shot_for: "Sample Agent", brokerage: "Sample Brokerage", photos: 8, horizontal: false, vertical: false },
  { slug: "san-miguel",      folder: "1437-san-miguel", title: "1437 San Miguel Avenue", location: "Santa Barbara, CA", year: "2026", headline: "Sample headline", summary: "Sample text — edit me.", shot_for: "Sample Agent", brokerage: "Sample Brokerage", photos: 6, horizontal: false, vertical: false },
  { slug: "rincon-point",    folder: "rincon-point", title: "Rincon Point",           location: "Carpinteria, CA",   year: "2026", headline: "Sample headline", summary: "Sample text — edit me.", shot_for: "Sample Agent", brokerage: "Sample Brokerage", photos: 6, horizontal: false, vertical: false },
  { slug: "rockbridge",      folder: "850-rockbridge", title: "850 Rockbridge Road",    location: "Montecito, CA",     year: "2026", headline: "Sample headline", summary: "Sample text — edit me.", shot_for: "Sample Agent", brokerage: "Sample Brokerage", photos: 6, horizontal: false, vertical: false },
  { slug: "la-vista-grande", folder: "la-vista-grande", title: "La Vista Grande",        location: "Santa Barbara, CA", year: "2026", headline: "Sample headline", summary: "Sample text — edit me.", shot_for: "Sample Agent", brokerage: "Sample Brokerage", photos: 6, horizontal: false, vertical: false },
  { slug: "tiburon-bay",     folder: "184-tiburon-bay", title: "184 Tiburon Bay Lane",   location: "Montecito, CA",     year: "2026", headline: "Sample headline", summary: "Sample text — edit me.", shot_for: "Sample Agent", brokerage: "Sample Brokerage", photos: 6, horizontal: false, vertical: false }
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

// Carousel + grid only need a few fields; every project links to project.html?slug=…
window.PROJECTS = window.PROJECTS_DATA.map(function (p) {
  return {
    title: p.title,
    loc: p.location,
    file: "project.html?slug=" + encodeURIComponent(p.slug),
    img: p.cover_url || ""
  };
});
