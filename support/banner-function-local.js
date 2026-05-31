// ================= FUNGSI UPDATE DESA HEADER DENGAN LOCAL FALLBACK =================
function updateDesaHeaderImage(desaName) {
    const headerImage = document.getElementById('desaHeaderImage');
    if (!headerImage) return;

    if (!desaName) {
        const localDefaultUrl = 'LOGO KOREM163 Wirasatya.png';

        headerImage.src = localDefaultUrl;
        headerImage.onerror = () => {
            headerImage.onerror = null;
            headerImage.src = localDefaultUrl;
        };
        return;
    }

    const desaInfo = normalizeDesaName(desaName);
    const imageName = desaInfo.normalized;
    const localUrl = `Profile/${imageName}.png`;

    headerImage.src = localUrl;
    headerImage.onerror = () => {
        headerImage.onerror = null;
        headerImage.src = 'LOGO KOREM163 Wirasatya.png';
    };
}