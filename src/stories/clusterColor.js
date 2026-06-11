const COLORS = [
    '#e53935', // Rot
    '#1e88e5', // Blau
    '#43a047', // Grün
    '#fb8c00', // Orange
    '#8e24aa', // Lila
    '#00acc1', // Cyan
    '#f4511e', // Terrakotta
    '#c0ca33', // Gelbgrün
    '#5e35b1', // Indigo
    '#00897b', // Teal
    '#e91e63', // Pink
    '#ffb300', // Gelb
    '#546e7a', // Blaugrau
    '#6d4c41', // Braun
    '#3949ab', // Dunkelblau
    '#7cb342', // Hellgrün
];

// Primzahl-Multiplikator sorgt dafür, dass aufeinanderfolgende IDs
// weit auseinanderliegende Farben bekommen (vollständiger Zyklus).
export const clusterColor = (clusterId) =>
    clusterId != null ? COLORS[(Number(clusterId) * 11) % COLORS.length] : null;