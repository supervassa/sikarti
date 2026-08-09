// Media & tanggal berita dipakai bersama oleh NewsSection, NewsPage, dan NewsDetail.
export const getNewsImageSrc = (item) => {
    if (item?.tipeMedia !== 'gambar') return null;
    return item.mediaType === 'upload' ? item.mediaBase64 : item.mediaUrl;
};

export const formatNewsDate = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};
