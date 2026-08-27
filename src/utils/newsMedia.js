// Media & tanggal berita dipakai bersama oleh NewsSection, NewsPage, dan NewsDetail.
export const getNewsImageSrc = (item) => {
    if (item?.tipeMedia !== 'gambar') return null;
    return item.mediaType === 'upload' ? item.mediaBase64 : item.mediaUrl;
};

const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
};

export const getYoutubeEmbedUrl = (url) => {
    const id = getYoutubeVideoId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
};

export const getYoutubeThumbnail = (url) => {
    const id = getYoutubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

// Thumbnail untuk list berita: gambar untuk tipe gambar, thumbnail YouTube untuk video.
export const getNewsThumbnail = (item) => {
    if (item?.tipeMedia === 'gambar') return getNewsImageSrc(item);
    if (item?.tipeMedia === 'video') return getYoutubeThumbnail(item.mediaUrl);
    return null;
};

export const formatNewsDate = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};
