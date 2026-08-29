import React from "react";
import { CONTACT_INFO } from "../../config/contactInfo";

// Section Kontak: alamat + tombol Google Maps + peta embed.
// Dipakai di landing page dan halaman /kontak.
const ContactSection = () => {
  const { addressLines, googleMapsUrl, mapEmbedSrc, phone, email } =
    CONTACT_INFO;

  return (
    <section
      id="kontak"
      className="container mx-auto px-4 py-12 md:py-16 scroll-mt-24"
    >
      <div className="border-l-4 border-red-600 pl-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Lokasi &amp; Kontak
        </h2>
        <p className="text-gray-600 dark:text-slate-300 mt-1">
          Kunjungi sekretariat PKBM KARTINI atau hubungi kami.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Detail kontak */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-5">
          <div>
            <h3 className="font-bold text-lg text-[#0b1f3d] dark:text-white mb-1">
              Alamat
            </h3>
            <address className="not-italic text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
              {addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>

          {phone && (
            <div>
              <h3 className="font-bold text-lg text-[#0b1f3d] dark:text-white mb-1">
                Telepon
              </h3>
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                {phone}
              </a>
            </div>
          )}

          {email && (
            <div>
              <h3 className="font-bold text-lg text-[#0b1f3d] dark:text-white mb-1">
                Email
              </h3>
              <a
                href={`mailto:${email}`}
                className="text-sm text-red-600 dark:text-red-400 hover:underline break-all"
              >
                {email}
              </a>
            </div>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Buka di Google Maps &rarr;
          </a>
        </div>

        {/* Peta */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <iframe
            title="Peta lokasi PKBM KARTINI"
            src={mapEmbedSrc}
            className="w-full h-[320px] md:h-[420px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
