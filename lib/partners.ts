export type Partner = {
  slug: string; name: string; label: string; headline: string; intro: string;
  detail: string; image: string; imageAlt: string; focus: string; vehicleHeading: string;
  supplier?: string; stockOnly?: boolean;
};
export const partners: Partner[] = [
  { slug: 'novitec', name: 'NOVITEC', label: 'Performance. In every detail.', headline: 'An unmistakable presence.',
    intro: 'Carbon, sound, stance. Bring every element of your car into one considered specification.',
    detail: 'Explore NOVITEC by marque, then find the aerodynamic components, exhausts, wheels and suspension options available for your car. Luxury Performance helps you bring the details together, from fitment to installation in Dubai.',
    image: '/images/ferrari.webp', imageAlt: 'Ferrari performance programme', focus: 'Aerodynamics / Exhaust / Wheels / Suspension', vehicleHeading: 'Start with your marque.', supplier: 'novitec' },
  { slug: 'techart', name: 'TECHART', label: 'Porsche. With personality.', headline: 'Precision meets individuality.',
    intro: 'A more personal Porsche, from the first detail to the complete expression.',
    detail: 'Explore the TECHART collection around your Porsche model. Choose a model first, then narrow the catalogue to the correct generation and fitment. Exterior, interior, wheels and performance: a specification that belongs together.',
    image: '/images/porsche.webp', imageAlt: 'Porsche performance programme', focus: 'Exterior / Wheels / Performance / Interior', vehicleHeading: 'Find your Porsche.', supplier: 'techart' },
  { slug: 'valvetronic', name: 'Valvetronic Designs', label: 'Give your drive a voice.', headline: 'Character you can hear.',
    intro: 'Find the exhaust that feels like your car. Only more expressive.',
    detail: 'Explore vehicle-specific valved exhaust systems, downpipes and supporting components. Compare the available configurations and hear the system on product pages with sound videos. Installation options are shown on eligible products.',
    image: '/images/lamborghini.webp', imageAlt: 'Valvetronic exhaust collection', focus: 'Valved systems / Downpipes / Exhaust components', vehicleHeading: 'Find your vehicle.', supplier: 'valvetronic' },
  { slug: 'fi-exhaust', name: 'FI Exhaust', label: 'A different kind of soundtrack.', headline: 'Make every arrival felt.',
    intro: 'Explore a more expressive sound, specified around the way you drive.',
    detail: 'Start with your vehicle and the sound you have in mind. Our team will help identify the FI Exhaust options for your model, discuss finishes and confirm compatibility before preparing your specification.',
    image: '/images/lamborghini.webp', imageAlt: 'Lamborghini exhaust programme', focus: 'Valved exhaust / Sound / Vehicle-specific fitment', vehicleHeading: 'Explore the programme.' },
  { slug: 'urban', name: 'URBAN Automotive', label: 'Distinctive by design.', headline: 'A different presence.',
    intro: 'Two URBAN kits from our own stock.',
    detail: 'A limited selection of URBAN kits from our own inventory, separate from our dealer partner ranges. Check each kit’s listing for condition, included components and vehicle compatibility, or ask our team for a closer look.',
    image: '/images/wheel.webp', imageAlt: 'Wheel detail', focus: 'Limited stock / 2 kits', vehicleHeading: 'Find your vehicle.', supplier: 'urban', stockOnly: true },
];
export const partnerForSupplier = (supplier: string) => partners.find(p => p.supplier === supplier);
