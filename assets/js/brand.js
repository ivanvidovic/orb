// Client reskin: name, artwork, and theme colors.
// Edit this block to reskin the tool. SVG strokes remain editable.
// wordmark/emblem may also be image URLs or data URLs. Assets stay local to this HTML by default.
const svgAsset=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
window.BRAND = {
  name: 'ORB', title: 'ORB Garment Studio', exportPrefix: 'orb',
  wordmark: svgAsset(`<svg version="1.1" id="Layer_2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="2070px" height="1000px" viewBox="0 0 2070 1000" enable-background="new 0 0 2070 1000" xml:space="preserve">
<circle fill="none" stroke="#000000" stroke-width="80" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" cx="499.8461609" cy="500" r="460"/>
<g>
	
		<circle fill="none" stroke="#000000" stroke-width="80" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" cx="1799.8461914" cy="730" r="230"/>
	
		<circle fill="none" stroke="#000000" stroke-width="80" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" cx="1799.8461914" cy="270" r="230"/>
</g>
<g>
	<path fill="none" stroke="#000000" stroke-width="80" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="
		M1479.8461914,960V730c0-127.0255127-102.9744873-230-230-230s-230.000061,102.9744873-230.000061,230v230"/>
	
		<circle fill="none" stroke="#000000" stroke-width="80" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" cx="1249.8461914" cy="270" r="230"/>
</g>
</svg>
`),
  emblem: svgAsset(`<svg version="1.1" id="Layer_2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="1000px" height="1000px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">
<circle fill="none" stroke="#000000" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" cx="499.8461609" cy="500" r="460"/>
<g>
	<path fill="none" stroke="#000000" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="
		M674.6182861,925.295166V674.7720947C674.6182861,578.2481689,596.3701172,500,499.8461609,500
		s-174.7721252,78.2481689-174.7721252,174.7720947V925.295166"/>
	
		<circle fill="none" stroke="#000000" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" cx="499.8461609" cy="325.2278748" r="174.7721252"/>
</g>
<g>
	
		<circle fill="none" stroke="#000000" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" cx="499.8461609" cy="616.5148926" r="116.5148926"/>
	
		<circle fill="none" stroke="#000000" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" cx="499.8461609" cy="383.4851074" r="116.5148926"/>
</g>
</svg>
`),
  light: {"paper": "#DBD9D3", "wash": "#D2D0CA", "ink": "#2E2D29", "grid": "#C5C3BC", "accent": "#45443F"},
  dark: {"paper": "#1C1C1C", "ink": "#F2F2F2", "grid": "#2C2C2C", "accent": "#C6C6C6"}
};
