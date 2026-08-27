import React from "react";

const InfoCards = () => {
  return (
    <section className="container mx-auto px-4 -mt-10 relative z-20 mb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">Visi & Misi</h3>
          <p className="text-gray-600 dark:text-slate-300 text-sm">
            Mewujudkan masyarakat yang cerdas, terampil, dan mandiri melalui
            pendidikan berkualitas.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">Program Kesetaraan</h3>
          <p className="text-gray-600 dark:text-slate-300 text-sm">
            Informasi lengkap mengenai pendaftaran Kejar Paket A, B, dan C.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">Fasilitas & Pengajar</h3>
          <p className="text-gray-600 dark:text-slate-300 text-sm">
            Didukung oleh tutor profesional dan fasilitas belajar yang memadai.
          </p>
        </div>
      </div>
    </section>
  );
};

export default InfoCards;
