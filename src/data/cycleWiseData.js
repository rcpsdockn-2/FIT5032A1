export const guideCategories = ['All', 'Bin guide', 'E-waste', 'Repair & reuse']

export const recyclingGuides = [
  {
    id: 'batteries',
    title: 'Batteries and power banks',
    category: 'E-waste',
    keywords: ['battery', 'batteries', 'power bank', 'charger'],
    summary: 'Small batteries should not go in household bins because they can start fires.',
    action: 'Keep them dry and take them to a dedicated battery drop-off point.',
    note: 'Local rules can vary by council.',
    updated: 'Updated this week',
  },
  {
    id: 'glass',
    title: 'Glass bottles and jars',
    category: 'Bin guide',
    keywords: ['glass', 'bottle', 'jar'],
    summary: 'Empty bottles and jars can usually be sorted through the glass recycling stream.',
    action: 'Rinse the container, remove loose lids and check your local council guidance.',
    note: 'Do not include drinking glasses or mirrors.',
    updated: 'Updated this week',
  },
  {
    id: 'small-appliances',
    title: 'Broken small appliances',
    category: 'Repair & reuse',
    keywords: ['appliance', 'toaster', 'repair', 'reuse', 'cable'],
    summary: 'Repairing an item can keep useful materials in circulation for longer.',
    action: 'Check a repair cafe before sending the appliance to disposal.',
    note: 'Remove personal data from smart devices first.',
    updated: 'Updated this week',
  },
]

export const eventItems = [
  {
    id: 'repair-cafe',
    type: 'Repair event',
    title: 'Repair cafe this Saturday',
    description: 'Bring a small appliance and learn how to give it another useful life.',
    location: 'Footscray Community Centre',
    date: 'Sat 10:00–14:00',
  },
  {
    id: 'swap-day',
    type: 'Community event',
    title: 'Neighbourhood swap day',
    description: 'Pass on books, household items and clothes instead of sending them to landfill.',
    location: 'Yarraville Village Hall',
    date: 'Sun 11:00–15:00',
  },
]

export const weeklyUpdates = [
  {
    id: 'council-rules',
    title: 'Check local guidance',
    description: 'Bin services and collection rules can differ between Melbourne councils.',
  },
  {
    id: 'four-bin-system',
    title: 'Four-bin transition',
    description: 'The rollout is happening over time, so confirm the latest local instructions.',
  },
  {
    id: 'source-date',
    title: 'Use current sources',
    description: 'This prototype will later show a source and updated date for each guide.',
  },
]
