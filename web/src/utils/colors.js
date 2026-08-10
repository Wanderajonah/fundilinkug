export const categoryColors = {
  electrical: '#FACC15',
  plumbing: '#3B82F6',
  mechanics: '#6B7280',
  mechanical: '#6B7280',
  welding: '#F97316',
  painting: '#A855F7',
  carpentry: '#92400E',
  cleaning: '#06B6D4',
};

export const fallbackPalette = ['#F5A623', '#3B82F6', '#22C55E', '#E11D48', '#8B5CF6', '#06B6D4', '#F97316'];

export const categoryColor = (name, index = 0) => categoryColors[name] || fallbackPalette[index % fallbackPalette.length];
