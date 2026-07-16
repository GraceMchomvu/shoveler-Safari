$base = "c:\Users\Grace Mchomvu\Downloads\tripix-tours-travels-html-template-2025-07-02-12-09-12-utc\tripix-html"

$pages = @(
  'index.html','index-3.html','about.html','contact.html','faq.html',
  'trips.html','destinations.html','destination-details.html','activities.html',
  'blog.html','blog-details.html','404.html'
)

$replacements = @(
  @('hanoi city', 'Arusha'),
  @('Hanoi City', 'Arusha'),
  @('vietnam', 'Tarangire'),
  @('Vietnam', 'Tarangire'),
  @('germany', 'Lake Manyara'),
  @('Germany', 'Lake Manyara'),
  @('cairo tour', 'Zanzibar'),
  @('Cairo tour', 'Zanzibar'),
  @('Maldives Travel Experience of the Lifetime', '7-Day Classic Serengeti & Ngorongoro Safari'),
  @('Maldives with our Fantastic Tour Package', 'Birdwatching Focus Safari'),
  @('Romantic Sri Lanka Honeymoon Package', 'Romantic Tanzania Honeymoon Safari'),
  @('Romantic Sri Lanka Honey moon Package', 'Romantic Tanzania Honeymoon Safari'),
  @('Serengeti, vietnam, Nepal', 'Serengeti · Ngorongoro · Tarangire'),
  @('Serengeti, Tarangire, Nepal', 'Serengeti · Ngorongoro · Tarangire'),
  @('Thailand, vietnam, Nepal', 'Serengeti · Ngorongoro · Tarangire'),
  @('Thailand, Tarangire, Nepal', 'Serengeti · Ngorongoro · Tarangire'),
  @('thailand trip', 'Serengeti National Park'),
  @('about tripik', 'About SHOVELER SAFARI'),
  @('Costa rica', 'Serengeti'),
  @('costa rica', 'Serengeti'),
  @('tanzania city', 'Ngorongoro'),
  @('combodia', 'Zanzibar'),
  @('Combodia', 'Zanzibar'),
  @('manila city', 'Serengeti'),
  @('Los Angeles', 'Tarangire'),
  @('china tours', 'Lake Manyara'),
  @('netherlands', 'Mount Meru'),
  @('Netherlands', 'Mount Meru'),
  @('span tour', 'Maasai Cultural Tour'),
  @('turkey', 'Manyara'),
  @('Turkey', 'Manyara'),
  @('barcelona beach hotels', '3-Day Tarangire, Manyara & Ngorongoro Safari'),
  @('Barcelona beach hotels', '3-Day Tarangire, Manyara & Ngorongoro Safari'),
  @('Spanish Wonder Barcelona', 'Family-Friendly Northern Circuit Safari'),
  @('Morocco Casablanca', 'Custom Private Safari'),
  @('Machu Picchu', 'Zanzibar Beach Add-on'),
  @('Help center', 'Contact Us'),
  @('Tripix - Tours & Travels HTML5 Template | Vecuro | Destination', 'SHOVELER SAFARI | Destinations'),
  @('30% descount', 'Northern Circuit'),
  @('3k happy review', 'Guests from around the world'),
  @('write a review', 'Share your safari story'),
  @('Blue Crew', 'Expert Guides'),
  @('daniella alonso', 'Safari Guide'),
  @('Alexandra Dadd', 'Safari Guide'),
  @('erica fernandes', 'Safari Guide'),
  @('daniel craig', 'Safari Guide'),
  @('Kathmandu', 'Arusha'),
  @('Pokhara', 'Serengeti'),
  @('Bus, Airlines', '4x4 Land Cruiser'),
  @('Pyramids of Giza', 'Ngorongoro Crater floor'),
  @('Gaudi Barcelona', 'Great Migration plains')
)

foreach ($page in $pages) {
  $path = Join-Path $base $page
  if (-not (Test-Path $path)) { continue }
  $c = Get-Content $path -Raw -Encoding UTF8

  foreach ($pair in $replacements) {
    $c = $c.Replace($pair[0], $pair[1])
  }

  $c = [regex]::Replace($c, '(?i)golden sand[^<]{0,60}', 'Photography Safari — Northern Circuit')
  $c = [regex]::Replace($c, '\$\d{2,5}', 'Request Quote')
  $c = $c.Replace('50% off', 'Private Safari')

  # Contact / enquiry forms -> mailto
  $c = $c.Replace(
    "action=`"index.html`"`r`n                class=`"form-style1 ajax-contact`"",
    "action=`"mailto:shovelersafari@gmail.com`" method=`"post`" enctype=`"text/plain`"`r`n                class=`"form-style1`""
  )
  $c = $c.Replace('action="index.html" method="post"', 'action="mailto:shovelersafari@gmail.com" method="post" enctype="text/plain"')
  $c = $c.Replace('action="index.html" class="w100"', 'action="mailto:shovelersafari@gmail.com" method="post" enctype="text/plain" class="w100"')
  # Also handle LF-only
  $c = $c.Replace(
    "action=`"index.html`"`n                class=`"form-style1 ajax-contact`"",
    "action=`"mailto:shovelersafari@gmail.com`" method=`"post`" enctype=`"text/plain`"`n                class=`"form-style1`""
  )

  Set-Content $path -Value $c -Encoding UTF8 -NoNewline
  Write-Host "Updated $page"
}

Write-Host "DONE"
