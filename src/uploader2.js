/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import axios from 'axios';
import FormData from 'form-data';

export async function uploader2(buffer, expiry = '1d') {
    const { fileTypeFromBuffer } = await import('file-type');
    const type = await fileTypeFromBuffer(buffer);
    const ext = type?.ext || 'bin';

    const formData = new FormData();

    formData.append('file', buffer, {
        filename: `file.${ext}`,
        contentType: type?.mime || 'application/octet-stream'
    });
    formData.append('expiry', expiry);

    try {
        const { data } = await axios.post(
            'https://sylvatica.my.id/api/upload',
            formData,
            {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 60000
            }
        );

        if (!data?.status || !data?.url) {
            throw new Error(data?.error || 'API tidak mengembalikan URL');
        }

        return data.url;
    } catch (err) {
        if (err.response?.status === 429) {
            throw new Error('Terlalu banyak upload, tunggu 1 menit sebelum upload lagi');
        }

        if (err.response?.status === 413) {
            throw new Error('Ukuran file melebihi batas 100MB');
        }

        if (err.response?.data?.error) {
            throw new Error(err.response.data.error);
        }

        if (err.message?.includes('expiry')) {
            throw new Error('Format expiry tidak valid. Gunakan 1m sampai 30d atau lifetime');
        }

        throw new Error('Upload gagal');
    }
}