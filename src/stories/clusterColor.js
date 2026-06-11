const COLORS = [
    '#e53935', '#8e24aa', '#1e88e5', '#00897b',
    '#fb8c00', '#6d4c41', '#e91e63', '#00acc1',
    '#7cb342', '#546e7a', '#f4511e', '#3949ab',
    '#00838f', '#c0ca33', '#8d6e63', '#5e35b1',
    '#039be5', '#43a047', '#ffb300', '#d81b60',
];

// Primzahl-Multiplikator (13) sorgt dafür, dass aufeinanderfolgende IDs
// weit auseinanderliegende Farben bekommen (vollständiger Zyklus über 20).
export const clusterColor = (clusterId) =>
    clusterId != null ? COLORS[(Number(clusterId) * 13) % COLORS.length] : null;