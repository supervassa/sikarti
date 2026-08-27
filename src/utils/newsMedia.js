// Media & tanggal berita dipakai bersama oleh NewsSection, NewsPage, dan NewsDetail.
export const getNewsImageSrc = (item) => {
  if (item?.tipeMedia !== "gambar") return null;
  return item.mediaType === "upload" ? item.mediaBase64 : item.mediaUrl;
};

const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : null;
};

export const getYoutubeEmbedUrl = (url) => {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

// Hanya URL kanonik yang memuat ID numerik yang bisa di-embed. Link pendek
// (vt.tiktok.com / vm.tiktok.com) adalah redirect dan tidak bisa diurai di client.
const getTiktokVideoId = (url) => {
  if (!url) return null;
  const m = url.match(
    /tiktok\.com\/(?:@[\w.-]+\/video|v|player\/v1|embed\/v2|embed)\/(\d{6,})/,
  );
  return m ? m[1] : null;
};

// Embed Player resmi TikTok: https://developers.tiktok.com/docs/en/embed-player
// Deskripsi & info musik dimatikan agar tampilan mendekati rasio 9:16 murni.
export const getTiktokEmbedUrl = (url) => {
  const id = getTiktokVideoId(url);
  if (!id) return null;
  const params = new URLSearchParams({
    rel: "0",
    description: "0",
    music_info: "0",
    native_context_menu: "1",
    closed_caption: "1",
    controls: "1",
    progress_bar: "1",
    play_button: "1",
    volume_control: "1",
    fullscreen_button: "1",
    autoplay: "0",
    loop: "0",
  });
  return `https://www.tiktok.com/player/v1/${id}?${params.toString()}`;
};

const DIRECT_VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

// Ringkas cara menyajikan URL video:
//  - kind 'iframe'  : YouTube / TikTok (portrait = true untuk TikTok)
//  - kind 'file'    : file video langsung (.mp4 dll) -> tag <video>
//  - kind 'link'    : platform lain / link pendek -> tautan keluar
export const getVideoEmbed = (url) => {
  if (!url) return { kind: "link", url: "" };
  const yt = getYoutubeEmbedUrl(url);
  if (yt) return { kind: "iframe", url: yt, portrait: false };
  const tt = getTiktokEmbedUrl(url);
  if (tt) return { kind: "iframe", url: tt, portrait: true };
  if (DIRECT_VIDEO_RE.test(url)) return { kind: "file", url };
  return { kind: "link", url };
};

export const getYoutubeThumbnail = (url) => {
  const id = getYoutubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

// Thumbnail untuk list berita: gambar untuk tipe gambar, thumbnail YouTube untuk video.
export const getNewsThumbnail = (item) => {
  if (item?.tipeMedia === "gambar") return getNewsImageSrc(item);
  if (item?.tipeMedia === "video") return getYoutubeThumbnail(item.mediaUrl);
  return null;
};

export const formatNewsDate = (timestamp) => {
  if (!timestamp?.toDate) return "";
  return timestamp
    .toDate()
    .toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
};
