import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getNewsImageSrc, formatNewsDate, getYoutubeEmbedUrl } from '../../utils/newsMedia';
import Navbar from '../../components/guest/Navbar';
import Footer from '../../components/guest/Footer';

const NewsDetail = () => {
    const { id } = useParams();
    const [news, setNews] = useState(null);
    const [loadedId, setLoadedId] = useState(null);
    const loading = loadedId !== id;

    useEffect(() => {
        let cancelled = false;
        getDoc(doc(db, 'news', id)).then((snap) => {
            if (cancelled) return;
            setNews(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            setLoadedId(id);
        });
        return () => { cancelled = true; };
    }, [id]);

    const imageSrc = news ? getNewsImageSrc(news) : null;
    const youtubeEmbedUrl = news?.tipeMedia === 'video' ? getYoutubeEmbedUrl(news.mediaUrl) : null;

    return (
        <div className="font-sans text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-950 min-h-screen flex flex-col transition-colors">
            <Navbar />

            <main className="container mx-auto px-4 py-10 flex-grow">
                <article className="max-w-3xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="mb-8 text-sm text-gray-500 dark:text-slate-400">
                        <Link to="/" className="hover:text-red-600 dark:hover:text-red-400">Beranda</Link>
                        <span className="mx-2">&gt;</span>
                        <Link to="/berita" className="hover:text-red-600 dark:hover:text-red-400">Berita</Link>
                        <span className="mx-2">&gt;</span>
                        <span className="text-gray-900 dark:text-slate-200">{news ? news.title : 'Detail'}</span>
                    </nav>

                    {loading ? (
                        <p className="text-center text-gray-400">Memuat berita...</p>
                    ) : !news ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500 dark:text-slate-400 mb-4">Berita tidak ditemukan.</p>
                            <Link to="/berita" className="text-red-600 dark:text-red-400 font-medium hover:underline">Kembali ke Berita</Link>
                        </div>
                    ) : (
                        <>
                            {/* Header Artikel */}
                            <header className="mb-10 text-center">
                                <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-full mb-4">
                                    {news.tipeMedia === 'video' ? 'VIDEO' : 'BERITA'}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                                    {news.title}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Dipublikasikan pada {formatNewsDate(news.createdAt)} &middot; {news.author}
                                </p>
                            </header>

                            {/* Media Artikel */}
                            {news.tipeMedia === 'video' ? (
                                <div className="w-full aspect-video bg-black rounded-2xl mb-10 overflow-hidden">
                                    {youtubeEmbedUrl ? (
                                        <iframe
                                            src={youtubeEmbedUrl}
                                            title={news.title}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <video controls src={news.mediaUrl} className="w-full h-full" />
                                    )}
                                </div>
                            ) : imageSrc ? (
                                <img src={imageSrc} alt={news.title} className="w-full max-h-[480px] object-cover rounded-2xl mb-10" />
                            ) : null}

                            {/* Isi Artikel */}
                            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-slate-300 space-y-4 whitespace-pre-line">
                                {news.deskripsi}
                            </div>
                        </>
                    )}
                </article>
            </main>

            <Footer />
        </div>
    );
};

export default NewsDetail;
