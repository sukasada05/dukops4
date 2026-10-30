async function uploadToGoogleDrive(zipBlob, zipFileName, desaName, date) {
    try {
        if (!zipBlob || typeof zipBlob === 'undefined') {
            throw new Error('File ZIP tidak valid');
        }

        const base64Data = await blobToBase64(zipBlob);
        if (!base64Data || !base64Data.length) {
            throw new Error('Konten ZIP kosong setelah konversi ke base64');
        }

        const desaInfo = normalizeDesaName(desaName);
        const result = await sendToBackend('uploadDrive', {
            fileName: zipFileName,
            desaName: desaInfo.cleanName,
            fileData: base64Data,
            year: date.getFullYear().toString(),
            month: date.toLocaleDateString('id-ID', { month: 'long' }),
            desa: desaInfo.cleanName,
            mimeType: 'application/zip'
        });

        if (!result || result.success !== true) {
            const detail = result && (result.error || result.message || JSON.stringify(result));
            throw new Error(detail ? `Upload Drive gagal: ${detail}` : 'Upload Drive gagal');
        }

        return true;
    } catch (error) {
        console.error('Error upload ke Drive:', error);
        return false;
    }
}

async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        if (!blob || typeof blob === 'undefined') {
            reject(new Error('Blob ZIP tidak valid'));
            return;
        }

        if (typeof FileReader === 'undefined') {
            reject(new Error('FileReader tidak tersedia di browser ini'));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            try {
                const result = typeof reader.result === 'string' ? reader.result : '';
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                if (!base64) {
                    reject(new Error('Data ZIP ke base64 kosong'));
                    return;
                }
                resolve(base64);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file ZIP ke base64'));
        reader.readAsDataURL(blob);
    });
}
