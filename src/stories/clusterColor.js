const COLORS = [
    '#e53935', '#8e24aa', '#1e88e5', '#00897b',
    '#fb8c00', '#6d4c41', '#e91e63', '#00acc1',
    '#7cb342', '#546e7a',
];

export const clusterColor = (clusterId) =>
    clusterId != null ? COLORS[Number(clusterId) % COLORS.length] : null;